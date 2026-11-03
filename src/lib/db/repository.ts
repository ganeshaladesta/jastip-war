import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createInitialSeedState, type DatabaseState } from "@/lib/db/seed-data";
import { publishRealtimeEvent } from "@/lib/realtime-bus";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  slugify,
} from "@/lib/utils";
import { buildOrderConfirmationWhatsAppUrl } from "@/lib/whatsapp";
import type {
  ActivityLog,
  Category,
  Customer,
  DashboardStats,
  GarageSaleSession,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductCondition,
  ProductStatus,
  ReservationResult,
  SessionStatus,
  StoreSettings,
} from "@/types/database";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "jastip-store.json");

// Global mutex queue to serialize all transactions in-process and prevent race conditions
const globalLockHolder = globalThis as unknown as {
  __jastipWriteMutex?: Promise<void>;
  __jastipMemoryCache?: DatabaseState;
};

async function withWriteLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const prev = globalLockHolder.__jastipWriteMutex ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalLockHolder.__jastipWriteMutex = prev.then(() => next);
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

function readLocalStore(): DatabaseState {
  if (globalLockHolder.__jastipMemoryCache) {
    return globalLockHolder.__jastipMemoryCache;
  }
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.sessions)) {
        globalLockHolder.__jastipMemoryCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const initial = createInitialSeedState();
  writeLocalStore(initial);
  return initial;
}

function writeLocalStore(state: DatabaseState): void {
  globalLockHolder.__jastipMemoryCache = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tmpPath, STORE_PATH);
  } catch {
    // Keep in-memory state if filesystem is read-only (e.g. serverless edge)
  }
}

function enrichProduct(product: Product, state: DatabaseState): Product {
  const category = state.categories.find((c) => c.id === product.category_id);
  const session = state.sessions.find((s) => s.id === product.session_id);
  return {
    ...product,
    category,
    session,
  };
}

function enrichOrder(order: Order, state: DatabaseState): Order {
  const customer = state.customers.find((c) => c.id === order.customer_id);
  const items = state.order_items
    .filter((item) => item.order_id === order.id)
    .map((item) => {
      const product = state.products.find((p) => p.id === item.product_id);
      return {
        ...item,
        product_slug: product?.slug,
        product_image: product?.image_urls?.[0] || "",
      };
    });
  return {
    ...order,
    customer,
    items,
  };
}

function recordActivityLocal(
  state: DatabaseState,
  params: {
    actor_id: string | null;
    action: string;
    entity_type: ActivityLog["entity_type"];
    entity_id: string | null;
    details: Record<string, unknown>;
  }
) {
  state.activity_logs.unshift({
    id: crypto.randomUUID(),
    actor_id: params.actor_id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    details: params.details,
    created_at: new Date().toISOString(),
  });
}

/**
 * Opportunistic & scheduled sweep that expires unpaid reservations past their deadline
 * and atomically restores reserved_stock back to available_stock.
 */
export async function expireOverdueReservations(): Promise<number> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("expire_overdue_reservations");
      if (!error && typeof data === "number") {
        if (data > 0) {
          publishRealtimeEvent("ORDER_UPDATED", undefined, { expiredCount: data });
        }
        return data;
      }
    } catch {
      // Fallback to local engine if RPC not yet migrated
    }
  }

  return withWriteLock(() => {
    const state = readLocalStore();
    const nowMs = Date.now();
    let expiredCount = 0;

    for (const order of state.orders) {
      if (
        (order.order_status === "PENDING" ||
          order.order_status === "RESERVED" ||
          order.order_status === "WAITING_PAYMENT") &&
        order.payment_status !== "PAID" &&
        new Date(order.reservation_expires_at).getTime() < nowMs
      ) {
        const items = state.order_items.filter((i) => i.order_id === order.id);
        for (const item of items) {
          const product = state.products.find((p) => p.id === item.product_id);
          if (product) {
            product.available_stock += item.quantity;
            product.reserved_stock = Math.max(0, product.reserved_stock - item.quantity);
            if (product.status === "SOLD_OUT" && product.available_stock > 0) {
              product.status = "PUBLISHED";
            }
            product.updated_at = new Date().toISOString();
          }
        }
        order.order_status = "EXPIRED";
        order.updated_at = new Date().toISOString();
        recordActivityLocal(state, {
          actor_id: null,
          action: "RESERVATION_EXPIRED",
          entity_type: "ORDER",
          entity_id: order.id,
          details: {
            order_reference: order.order_reference,
            reason: "Reservation window elapsed without payment confirmation",
          },
        });
        expiredCount += 1;
      }
    }

    if (expiredCount > 0) {
      writeLocalStore(state);
      publishRealtimeEvent("ORDER_UPDATED", undefined, { expiredCount });
      publishRealtimeEvent("PRODUCT_UPDATED", undefined, { expiredCount });
    }
    return expiredCount;
  });
}

// ============================================================================
// PUBLIC MARKETPLACE QUERIES
// ============================================================================

export interface ProductQueryFilters {
  categorySlug?: string;
  sessionSlug?: string;
  sessionId?: string;
  search?: string;
  sort?: "latest" | "price_asc" | "price_desc" | "most_available" | "low_stock";
  stockFilter?: "all" | "available" | "low_stock" | "sold_out";
  page?: number;
  pageSize?: number;
}

export async function getPublicCatalogProducts(filters: ProductQueryFilters = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await expireOverdueReservations();

  const state = readLocalStore();
  let items = state.products
    .filter((p) => p.status === "PUBLISHED" || p.status === "SOLD_OUT")
    .map((p) => enrichProduct(p, state))
    .filter((p) => p.session && p.session.status !== "ARCHIVED");

  if (filters.categorySlug && filters.categorySlug !== "all") {
    items = items.filter((p) => p.category?.slug === filters.categorySlug);
  }

  if (filters.sessionSlug && filters.sessionSlug !== "all") {
    items = items.filter((p) => p.session?.slug === filters.sessionSlug);
  }

  if (filters.sessionId && filters.sessionId !== "all") {
    items = items.filter((p) => p.session_id === filters.sessionId);
  }

  if (filters.stockFilter && filters.stockFilter !== "all") {
    if (filters.stockFilter === "available") {
      items = items.filter((p) => p.available_stock > 0 && p.status === "PUBLISHED");
    } else if (filters.stockFilter === "low_stock") {
      items = items.filter(
        (p) => p.available_stock > 0 && p.available_stock <= 2 && p.status === "PUBLISHED"
      );
    } else if (filters.stockFilter === "sold_out") {
      items = items.filter((p) => p.available_stock === 0 || p.status === "SOLD_OUT");
    }
  }

  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category?.name.toLowerCase().includes(q) ?? false) ||
        (p.session?.name.toLowerCase().includes(q) ?? false)
    );
  }

  const sort = filters.sort || "latest";
  items.sort((a, b) => {
    if (sort === "price_asc") return a.jastip_price - b.jastip_price;
    if (sort === "price_desc") return b.jastip_price - a.jastip_price;
    if (sort === "most_available") return b.available_stock - a.available_stock;
    if (sort === "low_stock") {
      const aStock = a.available_stock === 0 ? 9999 : a.available_stock;
      const bStock = b.available_stock === 0 ? 9999 : b.available_stock;
      return aStock - bStock;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, Math.min(48, filters.pageSize || 16));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = items.slice(start, start + pageSize);

  return {
    products: paginated,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getHomeMarketplaceData() {
  await expireOverdueReservations();
  const state = readLocalStore();

  const publicProducts = state.products
    .filter((p) => p.status === "PUBLISHED" || p.status === "SOLD_OUT")
    .map((p) => enrichProduct(p, state))
    .filter((p) => p.session && p.session.status !== "ARCHIVED");

  const activeSessions = state.sessions
    .filter((s) => s.status === "LIVE" || s.status === "UPCOMING")
    .map((session) => {
      const sessionProducts = publicProducts.filter((p) => p.session_id === session.id);
      const availableProducts = sessionProducts.filter(
        (p) => p.status === "PUBLISHED" && p.available_stock > 0
      );
      return {
        ...session,
        product_count: sessionProducts.length,
        available_product_count: availableProducts.length,
      };
    });

  const featuredProducts = publicProducts
    .filter((p) => p.is_featured && p.available_stock > 0)
    .slice(0, 4);

  const latestArrivals = [...publicProducts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const limitedStockProducts = publicProducts
    .filter((p) => p.status === "PUBLISHED" && p.available_stock > 0 && p.available_stock <= 2)
    .sort((a, b) => a.available_stock - b.available_stock)
    .slice(0, 4);

  const totalAvailableUnits = publicProducts.reduce(
    (sum, p) => sum + (p.status === "PUBLISHED" ? p.available_stock : 0),
    0
  );

  const categories = [...state.categories]
    .sort((a, b) => a.display_order - b.display_order)
    .map((cat) => ({
      ...cat,
      product_count: publicProducts.filter((p) => p.category_id === cat.id).length,
    }));

  return {
    activeSessions,
    featuredProducts,
    latestArrivals,
    limitedStockProducts,
    categories,
    totalAvailableProducts: publicProducts.filter((p) => p.available_stock > 0).length,
    totalAvailableUnits,
    settings: state.settings,
  };
}

export async function getProductBySlug(slug: string): Promise<{
  product: Product | null;
  relatedProducts: Product[];
  settings: StoreSettings;
}> {
  await expireOverdueReservations();
  const state = readLocalStore();
  const found = state.products.find(
    (p) => p.slug === slug && (p.status === "PUBLISHED" || p.status === "SOLD_OUT")
  );
  if (!found) {
    return { product: null, relatedProducts: [], settings: state.settings };
  }
  const product = enrichProduct(found, state);
  const relatedProducts = state.products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.status === "PUBLISHED" || p.status === "SOLD_OUT") &&
        (p.category_id === product.category_id || p.session_id === product.session_id)
    )
    .slice(0, 4)
    .map((p) => enrichProduct(p, state));

  return {
    product,
    relatedProducts,
    settings: state.settings,
  };
}

export async function getProductByIdAdmin(id: string): Promise<Product | null> {
  await expireOverdueReservations();
  const state = readLocalStore();
  const found = state.products.find((p) => p.id === id);
  return found ? enrichProduct(found, state) : null;
}

// ============================================================================
// ATOMIC FIRST-COME-FIRST-SERVED RESERVATION ENGINE
// ============================================================================

export interface ReserveProductInput {
  productId: string;
  quantity: number;
  customerName: string;
  whatsappNumber: string;
  customerNotes?: string;
  idempotencyKey?: string;
}

export async function reserveProductAtomic(
  input: ReserveProductInput
): Promise<ReservationResult> {
  const cleanName = (input.customerName || "").trim();
  const rawWa = (input.whatsappNumber || "").trim();
  const normalizedWa = normalizeWhatsAppNumber(rawWa);
  const quantity = Number(input.quantity);

  if (!cleanName || cleanName.length < 2) {
    throw new Error("INVALID_NAME: Nama lengkap wajib diisi (minimal 2 karakter).");
  }
  if (!isValidWhatsAppNumber(rawWa)) {
    throw new Error(
      "INVALID_WHATSAPP: Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx."
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("INVALID_QUANTITY: Jumlah barang minimal 1.");
  }

  const idempotencyKey =
    input.idempotencyKey && input.idempotencyKey.trim() !== ""
      ? input.idempotencyKey.trim()
      : crypto.randomUUID();

  // Execute inside exclusive write mutex so concurrent claims are strictly serialized
  return withWriteLock(async () => {
    const state = readLocalStore();
    const nowMs = Date.now();

    // 1. Opportunistic expiration sweep inside the same transaction
    for (const ord of state.orders) {
      if (
        (ord.order_status === "PENDING" ||
          ord.order_status === "RESERVED" ||
          ord.order_status === "WAITING_PAYMENT") &&
        ord.payment_status !== "PAID" &&
        new Date(ord.reservation_expires_at).getTime() < nowMs
      ) {
        const ordItems = state.order_items.filter((i) => i.order_id === ord.id);
        for (const item of ordItems) {
          const prod = state.products.find((p) => p.id === item.product_id);
          if (prod) {
            prod.available_stock += item.quantity;
            prod.reserved_stock = Math.max(0, prod.reserved_stock - item.quantity);
            if (prod.status === "SOLD_OUT" && prod.available_stock > 0) {
              prod.status = "PUBLISHED";
            }
          }
        }
        ord.order_status = "EXPIRED";
        ord.updated_at = new Date().toISOString();
      }
    }

    // 2. Idempotency check: prevent duplicate reservation submissions
    const existingOrder = state.orders.find((o) => o.idempotency_key === idempotencyKey);
    if (existingOrder) {
      const existingItem = state.order_items.find((i) => i.order_id === existingOrder.id);
      const existingProduct = state.products.find((p) => p.id === existingItem?.product_id);
      const whatsappUrl = buildOrderConfirmationWhatsAppUrl({
        adminWhatsApp: state.settings.whatsapp_number,
        orderReference: existingOrder.order_reference,
        productName: existingItem?.product_name_snapshot || "Produk Jastip",
        quantity: existingItem?.quantity || quantity,
        totalAmount: existingOrder.total_amount,
        customerName: cleanName,
        customerNotes: existingOrder.customer_notes,
      });

      return {
        success: true,
        idempotent_replay: true,
        order_id: existingOrder.id,
        order_reference: existingOrder.order_reference,
        product_id: existingProduct?.id || input.productId,
        product_name: existingItem?.product_name_snapshot || "",
        quantity: existingItem?.quantity || quantity,
        unit_price: existingItem?.unit_price || 0,
        total_amount: existingOrder.total_amount,
        remaining_stock: existingProduct?.available_stock ?? 0,
        order_status: existingOrder.order_status,
        payment_status: existingOrder.payment_status,
        reservation_expires_at: existingOrder.reservation_expires_at,
        whatsapp_url: whatsappUrl,
      };
    }

    // 3. Locate product & validate business rules
    const product = state.products.find((p) => p.id === input.productId);
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND: Produk tidak ditemukan.");
    }

    if (product.status !== "PUBLISHED" || product.available_stock <= 0) {
      throw new Error(
        "OUT_OF_STOCK: Yah, stok barang sudah habis atau berhasil direbut customer lain."
      );
    }

    const session = state.sessions.find((s) => s.id === product.session_id);
    if (!session || (session.status !== "LIVE" && session.status !== "UPCOMING")) {
      throw new Error(
        "SESSION_INACTIVE: Sesi garage sale untuk produk ini sudah selesai atau tidak aktif."
      );
    }

    if (product.available_stock < quantity) {
      throw new Error(
        `OUT_OF_STOCK: Yah, stok barang sudah habis atau berhasil direbut customer lain. (Sisa stok: ${product.available_stock})`
      );
    }

    // 4. Atomically deduct available_stock and increment reserved_stock
    product.available_stock -= quantity;
    product.reserved_stock += quantity;
    if (product.available_stock === 0) {
      product.status = "SOLD_OUT";
    }
    product.updated_at = new Date().toISOString();

    // 5. Find or create customer
    let customer = state.customers.find((c) => c.whatsapp_number === normalizedWa);
    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        full_name: cleanName,
        whatsapp_number: normalizedWa,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.customers.unshift(customer);
    } else {
      customer.full_name = cleanName;
      customer.updated_at = new Date().toISOString();
    }

    // 6. Generate unique order reference (e.g. JW-000126 or JW-8F29A1)
    let orderReference = "";
    do {
      const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
      orderReference = `JW-${randomHex}`;
    } while (state.orders.some((o) => o.order_reference === orderReference));

    const durationMinutes = Math.max(
      5,
      Number(state.settings.reservation_duration_minutes) || 30
    );
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const totalAmount = product.jastip_price * quantity;
    const orderId = crypto.randomUUID();

    const newOrder: Order = {
      id: orderId,
      order_reference: orderReference,
      customer_id: customer.id,
      customer_notes: (input.customerNotes || "").trim(),
      total_amount: totalAmount,
      order_status: "WAITING_PAYMENT",
      payment_status: "UNPAID",
      reservation_expires_at: expiresAt,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newOrderItem: OrderItem = {
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: product.id,
      product_name_snapshot: product.name,
      unit_price: product.jastip_price,
      quantity,
      subtotal: totalAmount,
      created_at: new Date().toISOString(),
    };

    state.orders.unshift(newOrder);
    state.order_items.unshift(newOrderItem);

    recordActivityLocal(state, {
      actor_id: null,
      action: "CUSTOMER_CLAIMED_PRODUCT",
      entity_type: "ORDER",
      entity_id: orderId,
      details: {
        order_reference: orderReference,
        customer_name: cleanName,
        product_id: product.id,
        product_name: product.name,
        quantity,
        total_amount: totalAmount,
        remaining_stock: product.available_stock,
      },
    });

    writeLocalStore(state);

    publishRealtimeEvent("PRODUCT_UPDATED", product.id, {
      id: product.id,
      available_stock: product.available_stock,
      reserved_stock: product.reserved_stock,
      sold_stock: product.sold_stock,
      status: product.status,
    });
    publishRealtimeEvent("ORDER_CREATED", orderId, {
      order_reference: orderReference,
    });

    const whatsappUrl = buildOrderConfirmationWhatsAppUrl({
      adminWhatsApp: state.settings.whatsapp_number,
      orderReference,
      productName: product.name,
      quantity,
      totalAmount,
      customerName: cleanName,
      customerNotes: newOrder.customer_notes,
    });

    return {
      success: true,
      idempotent_replay: false,
      order_id: orderId,
      order_reference: orderReference,
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.jastip_price,
      total_amount: totalAmount,
      remaining_stock: product.available_stock,
      order_status: newOrder.order_status,
      payment_status: newOrder.payment_status,
      reservation_expires_at: expiresAt,
      whatsapp_url: whatsappUrl,
    };
  });
}

// ============================================================================
// ORDER LOOKUP & ADMIN ORDER MANAGEMENT
// ============================================================================

export async function getOrderByReferencePublic(reference: string): Promise<{
  order: Order | null;
  settings: StoreSettings;
  whatsappUrl: string;
}> {
  await expireOverdueReservations();
  const state = readLocalStore();
  const cleanRef = reference.trim().toUpperCase();
  const found = state.orders.find((o) => o.order_reference.toUpperCase() === cleanRef);
  if (!found) {
    return { order: null, settings: state.settings, whatsappUrl: "" };
  }

  const enriched = enrichOrder(found, state);
  const firstItem = enriched.items?.[0];
  const whatsappUrl = buildOrderConfirmationWhatsAppUrl({
    adminWhatsApp: state.settings.whatsapp_number,
    orderReference: enriched.order_reference,
    productName: firstItem?.product_name_snapshot || "Produk JASTIP WAR",
    quantity: firstItem?.quantity || 1,
    totalAmount: enriched.total_amount,
    customerName: enriched.customer?.full_name,
    customerNotes: enriched.customer_notes,
  });

  // Mask part of WhatsApp number on public tracking page for privacy
  if (enriched.customer) {
    const wa = enriched.customer.whatsapp_number;
    enriched.customer = {
      ...enriched.customer,
      whatsapp_number:
        wa.length > 7 ? `${wa.slice(0, 4)}••••${wa.slice(-3)}` : wa,
    };
  }

  return {
    order: enriched,
    settings: state.settings,
    whatsappUrl,
  };
}

export async function getAllOrdersAdmin(params: {
  status?: string;
  search?: string;
} = {}): Promise<Order[]> {
  await expireOverdueReservations();
  const state = readLocalStore();
  let list = state.orders.map((o) => enrichOrder(o, state));

  if (params.status && params.status !== "ALL") {
    list = list.filter((o) => o.order_status === params.status);
  }

  if (params.search && params.search.trim() !== "") {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.order_reference.toLowerCase().includes(q) ||
        (o.customer?.full_name.toLowerCase().includes(q) ?? false) ||
        (o.customer?.whatsapp_number.toLowerCase().includes(q) ?? false) ||
        (o.items?.some((i) => i.product_name_snapshot.toLowerCase().includes(q)) ?? false)
    );
  }

  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getOrderByIdAdmin(orderId: string): Promise<Order | null> {
  await expireOverdueReservations();
  const state = readLocalStore();
  const found = state.orders.find((o) => o.id === orderId || o.order_reference === orderId);
  return found ? enrichOrder(found, state) : null;
}

export type AdminOrderTransitionAction =
  | "MARK_WAITING_PAYMENT"
  | "MARK_PAID"
  | "CONFIRM_ORDER"
  | "COMPLETE_ORDER"
  | "CANCEL_ORDER";

export async function updateOrderStatusAdmin(
  orderId: string,
  action: AdminOrderTransitionAction,
  actorId: string
): Promise<Order> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error("ORDER_NOT_FOUND: Pesanan tidak ditemukan.");
    }

    const items = state.order_items.filter((i) => i.order_id === order.id);

    if (action === "CANCEL_ORDER") {
      if (order.order_status !== "CANCELLED" && order.order_status !== "EXPIRED") {
        const wasPaidOrSold =
          order.payment_status === "PAID" ||
          order.order_status === "PAID" ||
          order.order_status === "CONFIRMED" ||
          order.order_status === "COMPLETED";

        for (const item of items) {
          const product = state.products.find((p) => p.id === item.product_id);
          if (product) {
            product.available_stock += item.quantity;
            if (wasPaidOrSold) {
              product.sold_stock = Math.max(0, product.sold_stock - item.quantity);
            } else {
              product.reserved_stock = Math.max(0, product.reserved_stock - item.quantity);
            }
            if (product.status === "SOLD_OUT" && product.available_stock > 0) {
              product.status = "PUBLISHED";
            }
            product.updated_at = new Date().toISOString();
            publishRealtimeEvent("PRODUCT_UPDATED", product.id, {
              id: product.id,
              available_stock: product.available_stock,
              status: product.status,
            });
          }
        }

        order.order_status = "CANCELLED";
        if (order.payment_status === "PAID") {
          order.payment_status = "REFUNDED";
        }
        order.updated_at = new Date().toISOString();

        recordActivityLocal(state, {
          actor_id: actorId,
          action: "ORDER_CANCELLED",
          entity_type: "ORDER",
          entity_id: order.id,
          details: {
            order_reference: order.order_reference,
            stock_released: true,
          },
        });
      }
    } else if (
      action === "MARK_PAID" ||
      action === "CONFIRM_ORDER" ||
      action === "COMPLETE_ORDER"
    ) {
      if (order.order_status === "CANCELLED" || order.order_status === "EXPIRED") {
        throw new Error(
          "INVALID_TRANSITION: Pesanan yang sudah dibatalkan/kedaluwarsa tidak dapat dikonfirmasi."
        );
      }

      const wasAlreadyPaid =
        order.payment_status === "PAID" ||
        order.order_status === "PAID" ||
        order.order_status === "CONFIRMED" ||
        order.order_status === "COMPLETED";

      if (!wasAlreadyPaid) {
        for (const item of items) {
          const product = state.products.find((p) => p.id === item.product_id);
          if (product) {
            product.reserved_stock = Math.max(0, product.reserved_stock - item.quantity);
            product.sold_stock += item.quantity;
            product.updated_at = new Date().toISOString();
            publishRealtimeEvent("PRODUCT_UPDATED", product.id, {
              id: product.id,
              available_stock: product.available_stock,
              reserved_stock: product.reserved_stock,
              sold_stock: product.sold_stock,
              status: product.status,
            });
          }
        }
      }

      const targetStatus: OrderStatus =
        action === "MARK_PAID"
          ? "PAID"
          : action === "CONFIRM_ORDER"
          ? "CONFIRMED"
          : "COMPLETED";

      order.order_status = targetStatus;
      order.payment_status = "PAID";
      order.updated_at = new Date().toISOString();

      recordActivityLocal(state, {
        actor_id: actorId,
        action: action === "MARK_PAID" ? "PAYMENT_CONFIRMED" : `ORDER_${targetStatus}`,
        entity_type: "ORDER",
        entity_id: order.id,
        details: {
          order_reference: order.order_reference,
          order_status: order.order_status,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
        },
      });
    } else if (action === "MARK_WAITING_PAYMENT") {
      order.order_status = "WAITING_PAYMENT";
      order.payment_status = "WAITING_VERIFICATION";
      order.updated_at = new Date().toISOString();
    }

    writeLocalStore(state);
    publishRealtimeEvent("ORDER_UPDATED", order.id, {
      order_reference: order.order_reference,
      order_status: order.order_status,
      payment_status: order.payment_status,
    });

    return enrichOrder(order, state);
  });
}

// ============================================================================
// ADMIN PRODUCT MANAGEMENT (FAST ENTRY, INLINE EDIT, DUPLICATE, DELETE)
// ============================================================================

export interface ProductUpsertInput {
  name: string;
  description?: string;
  category_id: string;
  session_id: string;
  condition: ProductCondition;
  original_price?: number | null;
  jastip_price: number;
  initial_stock: number;
  available_stock: number;
  image_urls: string[];
  status: ProductStatus;
  is_featured?: boolean;
}

export async function getAllProductsAdmin(params: {
  search?: string;
  sessionId?: string;
  categoryId?: string;
  status?: string;
} = {}): Promise<Product[]> {
  await expireOverdueReservations();
  const state = readLocalStore();
  let items = state.products.map((p) => enrichProduct(p, state));

  if (params.sessionId && params.sessionId !== "ALL") {
    items = items.filter((p) => p.session_id === params.sessionId);
  }
  if (params.categoryId && params.categoryId !== "ALL") {
    items = items.filter((p) => p.category_id === params.categoryId);
  }
  if (params.status && params.status !== "ALL") {
    items = items.filter((p) => p.status === params.status);
  }
  if (params.search && params.search.trim() !== "") {
    const q = params.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category?.name.toLowerCase().includes(q) ?? false)
    );
  }

  return items.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function createProductAdmin(
  input: ProductUpsertInput,
  actorId: string
): Promise<Product> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error("Nama produk wajib diisi.");
    }
    const jastipPrice = Math.round(Number(input.jastip_price));
    if (!Number.isFinite(jastipPrice) || jastipPrice <= 0) {
      throw new Error("Harga Jastip harus lebih dari Rp 0.");
    }

    const availableStock = Math.max(0, Math.round(Number(input.available_stock)));
    const initialStock = Math.max(
      availableStock,
      Math.round(Number(input.initial_stock ?? availableStock))
    );

    let baseSlug = slugify(cleanName);
    if (!baseSlug) baseSlug = `produk-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (state.products.some((p) => p.slug === slug)) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    let status: ProductStatus = input.status || "PUBLISHED";
    if (status === "PUBLISHED" && availableStock === 0) {
      status = "SOLD_OUT";
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: crypto.randomUUID(),
      session_id: input.session_id || state.sessions[0]?.id || "",
      category_id: input.category_id || state.categories[0]?.id || "",
      name: cleanName,
      slug,
      description: (input.description || "").trim(),
      condition: input.condition || "GOOD",
      original_price:
        input.original_price && Number(input.original_price) > 0
          ? Math.round(Number(input.original_price))
          : null,
      jastip_price: jastipPrice,
      initial_stock: initialStock,
      available_stock: availableStock,
      reserved_stock: 0,
      sold_stock: 0,
      image_urls:
        Array.isArray(input.image_urls) && input.image_urls.length > 0
          ? input.image_urls.filter(Boolean)
          : [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
            ],
      status,
      is_featured: Boolean(input.is_featured),
      created_at: now,
      updated_at: now,
    };

    state.products.unshift(newProduct);

    recordActivityLocal(state, {
      actor_id: actorId,
      action: "PRODUCT_CREATED",
      entity_type: "PRODUCT",
      entity_id: newProduct.id,
      details: {
        product_name: newProduct.name,
        jastip_price: newProduct.jastip_price,
        available_stock: newProduct.available_stock,
        status: newProduct.status,
      },
    });

    writeLocalStore(state);
    publishRealtimeEvent("PRODUCT_CREATED", newProduct.id, {
      id: newProduct.id,
      slug: newProduct.slug,
      name: newProduct.name,
    });

    return enrichProduct(newProduct, state);
  });
}

export async function updateProductAdmin(
  productId: string,
  input: Partial<ProductUpsertInput>,
  actorId: string
): Promise<Product> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const product = state.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    const changes: Record<string, unknown> = {};

    if (typeof input.name === "string" && input.name.trim() !== "") {
      if (input.name.trim() !== product.name) {
        changes.old_name = product.name;
        changes.new_name = input.name.trim();
        product.name = input.name.trim();
      }
    }

    if (typeof input.description === "string") {
      product.description = input.description.trim();
    }

    if (typeof input.category_id === "string" && input.category_id) {
      product.category_id = input.category_id;
    }

    if (typeof input.session_id === "string" && input.session_id) {
      product.session_id = input.session_id;
    }

    if (input.condition) {
      product.condition = input.condition;
    }

    if (input.original_price !== undefined) {
      product.original_price =
        input.original_price && Number(input.original_price) > 0
          ? Math.round(Number(input.original_price))
          : null;
    }

    if (input.jastip_price !== undefined) {
      const newPrice = Math.round(Number(input.jastip_price));
      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        throw new Error("Harga Jastip harus lebih dari Rp 0.");
      }
      if (newPrice !== product.jastip_price) {
        changes.old_price = product.jastip_price;
        changes.new_price = newPrice;
        product.jastip_price = newPrice;
      }
    }

    if (input.available_stock !== undefined) {
      const newAvail = Math.max(0, Math.round(Number(input.available_stock)));
      if (newAvail !== product.available_stock) {
        changes.old_stock = product.available_stock;
        changes.new_stock = newAvail;
        product.available_stock = newAvail;
        if (product.initial_stock < newAvail + product.sold_stock + product.reserved_stock) {
          product.initial_stock = newAvail + product.sold_stock + product.reserved_stock;
        }
      }
    }

    if (input.initial_stock !== undefined) {
      product.initial_stock = Math.max(
        product.available_stock,
        Math.round(Number(input.initial_stock))
      );
    }

    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      product.image_urls = input.image_urls.filter(Boolean);
    }

    if (typeof input.is_featured === "boolean") {
      product.is_featured = input.is_featured;
    }

    if (input.status) {
      product.status = input.status;
    }

    // Auto-sync PUBLISHED vs SOLD_OUT based on available_stock unless DRAFT or ARCHIVED
    if (product.status === "PUBLISHED" && product.available_stock === 0) {
      product.status = "SOLD_OUT";
    } else if (
      product.status === "SOLD_OUT" &&
      product.available_stock > 0 &&
      input.status !== "SOLD_OUT"
    ) {
      product.status = "PUBLISHED";
    }

    product.updated_at = new Date().toISOString();

    const actionType =
      changes.new_price !== undefined
        ? "PRICE_CHANGED"
        : changes.new_stock !== undefined
        ? "STOCK_ADJUSTED"
        : "PRODUCT_UPDATED";

    recordActivityLocal(state, {
      actor_id: actorId,
      action: actionType,
      entity_type: "PRODUCT",
      entity_id: product.id,
      details: {
        product_name: product.name,
        jastip_price: product.jastip_price,
        available_stock: product.available_stock,
        status: product.status,
        ...changes,
      },
    });

    writeLocalStore(state);
    publishRealtimeEvent("PRODUCT_UPDATED", product.id, {
      id: product.id,
      name: product.name,
      jastip_price: product.jastip_price,
      available_stock: product.available_stock,
      status: product.status,
      image_urls: product.image_urls,
    });

    return enrichProduct(product, state);
  });
}

export async function duplicateProductAdmin(
  productId: string,
  actorId: string
): Promise<Product> {
  const existing = await getProductByIdAdmin(productId);
  if (!existing) {
    throw new Error("Produk yang ingin diduplikasi tidak ditemukan.");
  }
  return createProductAdmin(
    {
      name: `${existing.name} (Copy)`,
      description: existing.description,
      category_id: existing.category_id,
      session_id: existing.session_id,
      condition: existing.condition,
      original_price: existing.original_price,
      jastip_price: existing.jastip_price,
      initial_stock: Math.max(1, existing.initial_stock),
      available_stock: Math.max(1, existing.available_stock),
      image_urls: [...existing.image_urls],
      status: "DRAFT",
      is_featured: false,
    },
    actorId
  );
}

export async function deleteProductAdmin(
  productId: string,
  actorId: string
): Promise<{ deleted: boolean; archivedInstead: boolean }> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const index = state.products.findIndex((p) => p.id === productId);
    if (index === -1) {
      throw new Error("Produk tidak ditemukan.");
    }
    const product = state.products[index];
    const hasOrders = state.order_items.some((i) => i.product_id === productId);

    if (hasOrders) {
      // Preserve referential integrity for historical orders by archiving
      product.status = "ARCHIVED";
      product.available_stock = 0;
      product.updated_at = new Date().toISOString();
      recordActivityLocal(state, {
        actor_id: actorId,
        action: "PRODUCT_ARCHIVED",
        entity_type: "PRODUCT",
        entity_id: product.id,
        details: { product_name: product.name, reason: "Has existing order history" },
      });
      writeLocalStore(state);
      publishRealtimeEvent("PRODUCT_UPDATED", product.id);
      return { deleted: false, archivedInstead: true };
    }

    state.products.splice(index, 1);
    recordActivityLocal(state, {
      actor_id: actorId,
      action: "PRODUCT_DELETED",
      entity_type: "PRODUCT",
      entity_id: productId,
      details: { product_name: product.name },
    });

    writeLocalStore(state);
    publishRealtimeEvent("PRODUCT_DELETED", productId);
    return { deleted: true, archivedInstead: false };
  });
}

// ============================================================================
// GARAGE SALE SESSIONS MANAGEMENT
// ============================================================================

export async function getSessions(includeArchived = false): Promise<GarageSaleSession[]> {
  await expireOverdueReservations();
  const state = readLocalStore();
  let sessions = [...state.sessions];
  if (!includeArchived) {
    sessions = sessions.filter((s) => s.status !== "ARCHIVED");
  }

  return sessions
    .map((s) => {
      const sessionProducts = state.products.filter(
        (p) => p.session_id === s.id && p.status !== "ARCHIVED"
      );
      const availableCount = sessionProducts.filter(
        (p) => p.status === "PUBLISHED" && p.available_stock > 0
      ).length;
      return {
        ...s,
        product_count: sessionProducts.length,
        available_product_count: availableCount,
      };
    })
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
}

export async function getSessionBySlug(slug: string): Promise<{
  session: GarageSaleSession | null;
  products: Product[];
}> {
  await expireOverdueReservations();
  const state = readLocalStore();
  const found = state.sessions.find((s) => s.slug === slug);
  if (!found) {
    return { session: null, products: [] };
  }
  const products = state.products
    .filter(
      (p) =>
        p.session_id === found.id &&
        (p.status === "PUBLISHED" || p.status === "SOLD_OUT")
    )
    .map((p) => enrichProduct(p, state));

  return {
    session: {
      ...found,
      product_count: products.length,
      available_product_count: products.filter((p) => p.available_stock > 0).length,
    },
    products,
  };
}

export interface SessionUpsertInput {
  name: string;
  description?: string;
  location: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  status: SessionStatus;
}

export async function createSessionAdmin(
  input: SessionUpsertInput,
  actorId: string
): Promise<GarageSaleSession> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const cleanName = input.name.trim();
    if (!cleanName) throw new Error("Nama sesi garage sale wajib diisi.");

    let slug = slugify(cleanName) || `session-${Date.now()}`;
    let counter = 1;
    while (state.sessions.some((s) => s.slug === slug)) {
      counter += 1;
      slug = `${slugify(cleanName)}-${counter}`;
    }

    const now = new Date().toISOString();
    const newSession: GarageSaleSession = {
      id: crypto.randomUUID(),
      name: cleanName,
      slug,
      description: (input.description || "").trim(),
      location: input.location.trim() || "Jakarta",
      image_url:
        input.image_url?.trim() ||
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
      start_date: input.start_date || now,
      end_date:
        input.end_date ||
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: input.status || "LIVE",
      created_at: now,
      updated_at: now,
    };

    state.sessions.unshift(newSession);
    recordActivityLocal(state, {
      actor_id: actorId,
      action: "SESSION_CREATED",
      entity_type: "SESSION",
      entity_id: newSession.id,
      details: { name: newSession.name, status: newSession.status },
    });

    writeLocalStore(state);
    publishRealtimeEvent("SESSION_UPDATED", newSession.id);
    return newSession;
  });
}

export async function updateSessionAdmin(
  sessionId: string,
  input: Partial<SessionUpsertInput>,
  actorId: string
): Promise<GarageSaleSession> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Sesi garage sale tidak ditemukan.");

    if (input.name && input.name.trim()) session.name = input.name.trim();
    if (typeof input.description === "string") session.description = input.description.trim();
    if (input.location && input.location.trim()) session.location = input.location.trim();
    if (typeof input.image_url === "string" && input.image_url.trim()) {
      session.image_url = input.image_url.trim();
    }
    if (input.start_date) session.start_date = input.start_date;
    if (input.end_date) session.end_date = input.end_date;
    if (input.status) session.status = input.status;

    session.updated_at = new Date().toISOString();

    recordActivityLocal(state, {
      actor_id: actorId,
      action: input.status === "LIVE" ? "SESSION_ACTIVATED" : "SESSION_UPDATED",
      entity_type: "SESSION",
      entity_id: session.id,
      details: { name: session.name, status: session.status },
    });

    writeLocalStore(state);
    publishRealtimeEvent("SESSION_UPDATED", session.id);
    return session;
  });
}

// ============================================================================
// CATEGORIES MANAGEMENT
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const state = readLocalStore();
  return [...state.categories]
    .sort((a, b) => a.display_order - b.display_order)
    .map((cat) => ({
      ...cat,
      product_count: state.products.filter(
        (p) => p.category_id === cat.id && p.status !== "ARCHIVED"
      ).length,
    }));
}

export async function createCategoryAdmin(
  input: { name: string; display_order?: number },
  actorId: string
): Promise<Category> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const cleanName = input.name.trim();
    if (!cleanName) throw new Error("Nama kategori wajib diisi.");
    const slug = slugify(cleanName);
    if (state.categories.some((c) => c.slug === slug)) {
      throw new Error("Kategori dengan nama tersebut sudah ada.");
    }

    const maxOrder = state.categories.reduce(
      (max, c) => Math.max(max, c.display_order),
      0
    );

    const newCat: Category = {
      id: crypto.randomUUID(),
      name: cleanName,
      slug,
      display_order: input.display_order ?? maxOrder + 1,
      created_at: new Date().toISOString(),
    };

    state.categories.push(newCat);
    recordActivityLocal(state, {
      actor_id: actorId,
      action: "CATEGORY_CREATED",
      entity_type: "CATEGORY",
      entity_id: newCat.id,
      details: { name: newCat.name },
    });

    writeLocalStore(state);
    return newCat;
  });
}

export async function updateCategoryAdmin(
  categoryId: string,
  input: { name?: string; display_order?: number },
  actorId: string
): Promise<Category> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const cat = state.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error("Kategori tidak ditemukan.");

    if (input.name && input.name.trim()) {
      cat.name = input.name.trim();
      cat.slug = slugify(cat.name);
    }
    if (typeof input.display_order === "number") {
      cat.display_order = input.display_order;
    }

    recordActivityLocal(state, {
      actor_id: actorId,
      action: "CATEGORY_UPDATED",
      entity_type: "CATEGORY",
      entity_id: cat.id,
      details: { name: cat.name, display_order: cat.display_order },
    });

    writeLocalStore(state);
    return cat;
  });
}

export async function deleteCategoryAdmin(
  categoryId: string,
  actorId: string
): Promise<void> {
  return withWriteLock(() => {
    const state = readLocalStore();
    const inUse = state.products.some((p) => p.category_id === categoryId);
    if (inUse) {
      throw new Error(
        "Kategori tidak dapat dihapus karena masih digunakan oleh produk."
      );
    }
    const idx = state.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) throw new Error("Kategori tidak ditemukan.");
    const removed = state.categories[idx];
    state.categories.splice(idx, 1);

    recordActivityLocal(state, {
      actor_id: actorId,
      action: "CATEGORY_DELETED",
      entity_type: "CATEGORY",
      entity_id: categoryId,
      details: { name: removed.name },
    });

    writeLocalStore(state);
  });
}

// ============================================================================
// CUSTOMERS, ACTIVITY LOGS, SETTINGS & DASHBOARD OVERVIEW
// ============================================================================

export async function getCustomersAdmin(): Promise<Customer[]> {
  const state = readLocalStore();
  return state.customers.map((customer) => {
    const custOrders = state.orders.filter((o) => o.customer_id === customer.id);
    const validOrders = custOrders.filter(
      (o) => o.order_status !== "CANCELLED" && o.order_status !== "EXPIRED"
    );
    const totalSpent = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      ...customer,
      total_orders: custOrders.length,
      total_spent: totalSpent,
    };
  });
}

export async function getActivityLogsAdmin(limit = 50): Promise<ActivityLog[]> {
  const state = readLocalStore();
  return state.activity_logs.slice(0, limit);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const state = readLocalStore();
  return state.settings;
}

export async function updateStoreSettingsAdmin(
  input: Partial<StoreSettings>,
  actorId: string
): Promise<StoreSettings> {
  return withWriteLock(() => {
    const state = readLocalStore();
    state.settings = {
      ...state.settings,
      ...input,
      whatsapp_number: input.whatsapp_number
        ? normalizeWhatsAppNumber(input.whatsapp_number)
        : state.settings.whatsapp_number,
      reservation_duration_minutes: Math.max(
        5,
        Number(
          input.reservation_duration_minutes ??
            state.settings.reservation_duration_minutes
        ) || 30
      ),
    };

    recordActivityLocal(state, {
      actor_id: actorId,
      action: "SETTINGS_UPDATED",
      entity_type: "SETTINGS",
      entity_id: null,
      details: { store_name: state.settings.store_name },
    });

    writeLocalStore(state);
    publishRealtimeEvent("SETTINGS_UPDATED");
    return state.settings;
  });
}

export async function getAdminDashboardOverview() {
  await expireOverdueReservations();
  const state = readLocalStore();

  const activeProducts = state.products.filter((p) => p.status !== "ARCHIVED");
  const totalProducts = activeProducts.length;
  const availableStock = activeProducts.reduce((sum, p) => sum + p.available_stock, 0);
  const productsSold = activeProducts.reduce((sum, p) => sum + p.sold_stock, 0);

  const pendingOrders = state.orders.filter(
    (o) =>
      o.order_status === "PENDING" ||
      o.order_status === "RESERVED" ||
      o.order_status === "WAITING_PAYMENT"
  ).length;

  const confirmedOrdersList = state.orders.filter(
    (o) =>
      o.order_status === "PAID" ||
      o.order_status === "CONFIRMED" ||
      o.order_status === "COMPLETED" ||
      o.payment_status === "PAID"
  );

  const confirmedOrders = confirmedOrdersList.length;
  const totalSales = confirmedOrdersList.reduce((sum, o) => sum + o.total_amount, 0);

  const stats: DashboardStats = {
    total_products: totalProducts,
    available_stock: availableStock,
    products_sold: productsSold,
    pending_orders: pendingOrders,
    confirmed_orders: confirmedOrders,
    total_sales: totalSales,
  };

  const activeSessions = state.sessions
    .filter((s) => s.status === "LIVE")
    .map((s) => ({
      ...s,
      product_count: activeProducts.filter((p) => p.session_id === s.id).length,
      available_product_count: activeProducts.filter(
        (p) => p.session_id === s.id && p.available_stock > 0
      ).length,
    }));

  const recentOrders = state.orders
    .slice(0, 6)
    .map((o) => enrichOrder(o, state));

  const recentlyAddedProducts = [...activeProducts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((p) => enrichProduct(p, state));

  const lowStockProducts = activeProducts
    .filter((p) => p.available_stock <= 2 && p.status !== "DRAFT")
    .sort((a, b) => a.available_stock - b.available_stock)
    .slice(0, 6)
    .map((p) => enrichProduct(p, state));

  const recentActivities = state.activity_logs.slice(0, 8);

  return {
    stats,
    activeSessions,
    recentOrders,
    recentlyAddedProducts,
    lowStockProducts,
    recentActivities,
    settings: state.settings,
  };
}


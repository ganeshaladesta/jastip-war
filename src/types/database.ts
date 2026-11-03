export type UserRole = "ADMIN" | "STAFF";

export type SessionStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "ARCHIVED";

export type ProductCondition = "NEW" | "LIKE_NEW" | "GOOD" | "USED";

export type ProductStatus = "DRAFT" | "PUBLISHED" | "SOLD_OUT" | "ARCHIVED";

export type StockBadgeStatus = "AVAILABLE" | "LOW_STOCK" | "LAST_ITEM" | "SOLD_OUT";

export type OrderStatus =
  | "PENDING"
  | "RESERVED"
  | "WAITING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus =
  | "UNPAID"
  | "WAITING_VERIFICATION"
  | "PAID"
  | "REFUNDED";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface GarageSaleSession {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  image_url: string;
  start_date: string;
  end_date: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  product_count?: number;
  available_product_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
  product_count?: number;
}

export interface Product {
  id: string;
  session_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  condition: ProductCondition;
  original_price: number | null;
  jastip_price: number;
  initial_stock: number;
  available_stock: number;
  reserved_stock: number;
  sold_stock: number;
  image_urls: string[];
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  session?: GarageSaleSession;
}

export interface Customer {
  id: string;
  full_name: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_spent?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  product_slug?: string;
  product_image?: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_id: string;
  customer_notes: string;
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  reservation_expires_at: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: "PRODUCT" | "ORDER" | "SESSION" | "CATEGORY" | "SETTINGS" | string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  store_description: string;
  whatsapp_number: string;
  store_logo: string;
  reservation_duration_minutes: number;
  currency: string;
  contact_email: string;
  contact_instagram: string;
  public_announcement: string;
  terms_and_conditions: string;
}

export interface DashboardStats {
  total_products: number;
  available_stock: number;
  products_sold: number;
  pending_orders: number;
  confirmed_orders: number;
  total_sales: number;
}

export interface ReservationResult {
  success: boolean;
  idempotent_replay?: boolean;
  order_id: string;
  order_reference: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  remaining_stock: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  reservation_expires_at: string;
  whatsapp_url: string;
}


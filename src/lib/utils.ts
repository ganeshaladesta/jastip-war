import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product, ProductCondition, StockBadgeStatus } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer Rupiah amount using Indonesian locale: e.g. Rp 250.000
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Rp 0";
  }
  const rounded = Math.round(amount);
  return `Rp ${rounded.toLocaleString("id-ID")}`;
}

/**
 * Compute stock badge label & status from product status and available stock.
 */
export function getStockBadge(product: Pick<Product, "available_stock" | "status">): {
  status: StockBadgeStatus;
  label: string;
  shortLabel: string;
} {
  if (product.status === "SOLD_OUT" || product.available_stock <= 0) {
    return {
      status: "SOLD_OUT",
      label: "SOLD OUT",
      shortLabel: "SOLD OUT",
    };
  }
  if (product.available_stock === 1) {
    return {
      status: "LAST_ITEM",
      label: "LAST ITEM",
      shortLabel: "LAST ITEM (1)",
    };
  }
  if (product.available_stock <= 2) {
    return {
      status: "LOW_STOCK",
      label: "LOW STOCK",
      shortLabel: `LOW STOCK (${product.available_stock})`,
    };
  }
  return {
    status: "AVAILABLE",
    label: "AVAILABLE",
    shortLabel: `AVAILABLE (${product.available_stock})`,
  };
}

export function getConditionLabel(condition: ProductCondition): string {
  switch (condition) {
    case "NEW":
      return "Brand New (BNIB/BNWT)";
    case "LIKE_NEW":
      return "Like New (95%+)";
    case "GOOD":
      return "Good Condition";
    case "USED":
      return "Pre-loved / Used";
    default:
      return condition;
  }
}

export function getConditionShortLabel(condition: ProductCondition): string {
  switch (condition) {
    case "NEW":
      return "NEW";
    case "LIKE_NEW":
      return "LIKE NEW";
    case "GOOD":
      return "GOOD";
    case "USED":
      return "USED";
    default:
      return condition;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("08")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export function isValidWhatsAppNumber(raw: string): boolean {
  const normalized = normalizeWhatsAppNumber(raw);
  return /^628\d{7,13}$/.test(normalized) || /^\d{9,15}$/.test(normalized);
}

export function formatDateTimeID(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}


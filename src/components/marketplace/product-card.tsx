"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Eye, MapPin } from "lucide-react";
import {
  formatRupiah,
  getConditionShortLabel,
  getStockBadge,
} from "@/lib/utils";
import { ClaimProductModal } from "@/components/marketplace/claim-product-modal";
import type { Product } from "@/types/database";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const [claimOpen, setClaimOpen] = useState(false);
  const stockBadge = getStockBadge(product);
  const isSoldOut = stockBadge.status === "SOLD_OUT";
  const imageUrl =
    product.image_urls?.[0] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

  const savingsPercent =
    product.original_price && product.original_price > product.jastip_price
      ? Math.round(
          ((product.original_price - product.jastip_price) /
            product.original_price) *
            100
        )
      : null;

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
        {/* Square Image Container */}
        <Link
          href={`/products/${product.slug}`}
          className="relative aspect-square w-full overflow-hidden bg-zinc-100 block"
        >
          <img
            src={imageUrl}
            alt={product.name}
            fetchPriority={priority ? "high" : undefined}
            loading={priority ? undefined : "lazy"}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isSoldOut ? "grayscale opacity-65" : ""
            }`}
          />

          {/* Top Left Badges: Stock Status */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
            {stockBadge.status === "AVAILABLE" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase text-emerald-700 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AVAILABLE
              </span>
            )}
            {stockBadge.status === "LOW_STOCK" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase text-white shadow-xs">
                LOW STOCK • {product.available_stock}
              </span>
            )}
            {stockBadge.status === "LAST_ITEM" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase text-white shadow-xs animate-pulse">
                LAST ITEM • SISA 1
              </span>
            )}
            {stockBadge.status === "SOLD_OUT" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase text-white shadow-xs">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Top Right Badge: Condition & Discount */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
            <span className="rounded-lg bg-zinc-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {getConditionShortLabel(product.condition)}
            </span>
            {savingsPercent && savingsPercent > 5 && !isSoldOut && (
              <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                Hemat {savingsPercent}%
              </span>
            )}
          </div>

          {/* Sold Out Center Stamp */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="rounded-full border-2 border-white bg-zinc-900/90 px-4 py-1.5 text-xs font-extrabold tracking-widest uppercase text-white shadow-lg">
                HABIS TERJUAL
              </span>
            </div>
          )}
        </Link>

        {/* Card Content */}
        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
          <div>
            {/* Category & Session Meta */}
            <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-zinc-500">
              <span className="truncate font-semibold text-zinc-600">
                {product.category?.name || "Uncategorized"}
              </span>
              {product.session && (
                <span className="inline-flex items-center gap-1 truncate text-zinc-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[110px]">
                    {product.session.name}
                  </span>
                </span>
              )}
            </div>

            {/* Product Name */}
            <Link
              href={`/products/${product.slug}`}
              className="mt-1 block text-sm sm:text-base font-bold text-zinc-900 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug"
            >
              {product.name}
            </Link>
          </div>

          {/* Pricing & Stock Bar */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 space-y-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                {product.original_price &&
                  product.original_price > product.jastip_price && (
                    <span className="block font-mono text-[11px] text-zinc-400 line-through">
                      {formatRupiah(product.original_price)}
                    </span>
                  )}
                <span className="font-mono text-base sm:text-lg font-extrabold text-zinc-900">
                  {formatRupiah(product.jastip_price)}
                </span>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block font-mono text-xs font-bold ${
                    isSoldOut
                      ? "text-zinc-400"
                      : product.available_stock <= 2
                      ? "text-orange-600"
                      : "text-emerald-700"
                  }`}
                >
                  {isSoldOut ? "Stok: 0" : `Stok: ${product.available_stock}`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {isSoldOut ? (
                <Link
                  href={`/products/${product.slug}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-200 transition-colors"
                >
                  SOLD OUT • Lihat Detail
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setClaimOpen(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 px-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 text-orange-400" />
                    Rebut Sekarang
                  </button>
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                    title="Detail Produk"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </article>

      {claimOpen && (
        <ClaimProductModal
          product={product}
          isOpen={claimOpen}
          onClose={() => setClaimOpen(false)}
        />
      )}
    </>
  );
}


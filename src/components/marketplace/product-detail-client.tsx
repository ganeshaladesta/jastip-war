"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Minus,
  Plus,
} from "lucide-react";
import {
  formatRupiah,
  formatRelativeTime,
  getConditionLabel,
  getStockBadge,
  normalizeWhatsAppNumber,
} from "@/lib/utils";
import { ClaimProductModal } from "@/components/marketplace/claim-product-modal";
import type { Product, StoreSettings } from "@/types/database";

export function ProductDetailClient({
  product,
  settings,
}: {
  product: Product;
  settings: StoreSettings;
}) {
  const images =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
        ];

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [claimOpen, setClaimOpen] = useState(false);

  const stockBadge = getStockBadge(product);
  const isSoldOut = stockBadge.status === "SOLD_OUT";
  const savingsAmount =
    product.original_price && product.original_price > product.jastip_price
      ? product.original_price - product.jastip_price
      : null;

  const adminWa = normalizeWhatsAppNumber(settings.whatsapp_number);
  const askAdminUrl = `https://wa.me/${adminWa}?text=${encodeURIComponent(
    `Halo Admin JASTIP WAR, saya ingin bertanya tentang produk: ${product.name} (${formatRupiah(
      product.jastip_price
    )}). Apakah masih tersedia?`
  )}`;

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Product Image Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xs">
            <img
              src={images[selectedImage] || images[0]}
              alt={product.name}
              fetchPriority="high"
              className={`h-full w-full object-cover ${
                isSoldOut ? "grayscale opacity-70" : ""
              }`}
            />

            {/* Floating Stock Status */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {stockBadge.status === "AVAILABLE" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  AVAILABLE ({product.available_stock} UNIT)
                </span>
              )}
              {stockBadge.status === "LOW_STOCK" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
                  LOW STOCK • SISA {product.available_stock} UNIT
                </span>
              )}
              {stockBadge.status === "LAST_ITEM" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md animate-pulse">
                  LAST ITEM • SISA 1 UNIT TERAKHIR!
                </span>
              )}
              {stockBadge.status === "SOLD_OUT" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
                  SOLD OUT • HABIS DIREBUT
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedImage === idx
                      ? "border-orange-600 ring-2 ring-orange-500/20"
                      : "border-zinc-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${product.name} foto ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Reservation CTA */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Category & Session Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {product.category && (
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 font-bold text-zinc-700 hover:border-zinc-900"
                >
                  <Tag className="h-3.5 w-3.5 text-orange-600" />
                  {product.category.name}
                </Link>
              )}
              {product.session && (
                <Link
                  href={`/sessions/${product.session.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-bold text-orange-800 hover:bg-orange-100"
                >
                  <MapPin className="h-3.5 w-3.5 text-orange-600" />
                  {product.session.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-zinc-500 font-medium">
                <Clock className="h-3.5 w-3.5" />
                Diperbarui {formatRelativeTime(product.updated_at)}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              {product.name}
            </h1>

            {/* Pricing Box */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Harga Jastip Tetap (Fixed Price)
                  </span>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-zinc-900">
                      {formatRupiah(product.jastip_price)}
                    </span>
                    {product.original_price &&
                      product.original_price > product.jastip_price && (
                        <span className="font-mono text-base text-zinc-400 line-through">
                          {formatRupiah(product.original_price)}
                        </span>
                      )}
                  </div>
                </div>

                {savingsAmount && (
                  <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                    Hemat {formatRupiah(savingsAmount)}
                  </span>
                )}
              </div>

              {/* Stock Meter */}
              <div className="border-t border-zinc-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {isSoldOut ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                      <AlertCircle className="h-4 w-4" />
                      Stok Habis Terjual (0 dari {product.initial_stock} unit)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Tersedia {product.available_stock} dari {product.initial_stock}{" "}
                      unit
                      {product.reserved_stock > 0 &&
                        ` (${product.reserved_stock} sedang diklaim)`}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-zinc-500">
                  Kondisi:{" "}
                  <strong className="text-zinc-900">
                    {getConditionLabel(product.condition)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Deskripsi & Kondisi Barang di Lokasi
              </h2>
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-line">
                {product.description ||
                  "Produk kurasi langsung dari event garage sale dengan kondisi terbaik."}
              </p>
            </div>

            {/* Quantity & Primary CTA */}
            {isSoldOut ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-100 p-5 space-y-3">
                <button
                  type="button"
                  disabled
                  className="w-full rounded-2xl bg-zinc-300 py-4 text-sm font-extrabold uppercase tracking-wider text-zinc-600 cursor-not-allowed"
                >
                  SOLD OUT — STOK BARANG SUDAH HABIS
                </button>
                <p className="text-center text-xs text-zinc-500">
                  Barang ini sudah berhasil direbut oleh customer lain. Yuk cek
                  produk lainnya yang masih available!
                </p>
                <Link
                  href="/products?stockFilter=available"
                  className="flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white py-3 text-xs font-bold text-zinc-900 hover:bg-zinc-50"
                >
                  Cari Produk Lain yang Masih Tersedia →
                </Link>
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Pilih Jumlah Klaim
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-9 text-center font-mono text-base font-extrabold text-zinc-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(product.available_stock, q + 1)
                        )
                      }
                      disabled={quantity >= product.available_stock}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setClaimOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 px-6 text-base font-extrabold uppercase tracking-wider text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all cursor-pointer"
                >
                  <Zap className="h-5 w-5" />
                  REBUT SEKARANG • {formatRupiah(product.jastip_price * quantity)}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Kunci stok otomatis {settings.reservation_duration_minutes}{" "}
                    menit
                  </span>
                  <a
                    href={askAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Tanya Admin via WA
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom CTA Bar */}
      {!isSoldOut && (
        <div className="fixed bottom-14 left-0 right-0 z-30 flex lg:hidden items-center justify-between gap-3 border-t border-zinc-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
          <div>
            <span className="block text-[10px] font-bold uppercase text-zinc-400">
              Harga Jastip ({product.available_stock} tersisa)
            </span>
            <span className="font-mono text-lg font-extrabold text-zinc-900">
              {formatRupiah(product.jastip_price * quantity)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setClaimOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm"
          >
            <Zap className="h-4 w-4" />
            REBUT SEKARANG
          </button>
        </div>
      )}

      {claimOpen && (
        <ClaimProductModal
          product={product}
          isOpen={claimOpen}
          onClose={() => setClaimOpen(false)}
          initialQuantity={quantity}
        />
      )}
    </>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Clock,
  Copy,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ArrowRight,
  Zap,
} from "lucide-react";
import { formatRupiah, formatDateTimeID } from "@/lib/utils";
import type { Product, ReservationResult } from "@/types/database";

export function ClaimProductModal({
  product,
  isOpen,
  onClose,
  initialQuantity = 1,
}: {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
}) {
  const router = useRouter();
  const maxStock = Math.max(1, product.available_stock);
  const [quantity, setQuantity] = useState(
    Math.min(Math.max(1, initialQuantity), maxStock)
  );
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outOfStockError, setOutOfStockError] = useState(false);
  const [result, setResult] = useState<ReservationResult | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [idempotencyKey] = useState(
    () => `claim-${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  if (!isOpen) return null;

  const totalAmount = product.jastip_price * quantity;

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage(null);
    setOutOfStockError(false);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerName,
          whatsappNumber,
          customerNotes,
          idempotencyKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 409 || data.code === "OUT_OF_STOCK") {
          setOutOfStockError(true);
          setErrorMessage(
            "Yah, stok barang sudah habis atau berhasil direbut customer lain."
          );
          router.refresh();
        } else {
          setErrorMessage(
            data.message || "Gagal memproses klaim. Silakan periksa data kamu."
          );
        }
        return;
      }

      setResult(data as ReservationResult);

      // Save order reference to localStorage for quick access in "My Order"
      try {
        const existingRaw = localStorage.getItem("jw_recent_orders");
        const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [
          data.order_reference,
          ...existing.filter((r) => r !== data.order_reference),
        ].slice(0, 8);
        localStorage.setItem("jw_recent_orders", JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }

      router.refresh();
    } catch {
      setErrorMessage("Gagal terhubung ke server. Periksa koneksi internet kamu.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyOrderRef = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.order_reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-2xl max-h-[92dvh] overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {result
                  ? "Reservasi Berhasil Dikunci"
                  : "Klaim & Kunci Stok Sekarang"}
              </h3>
              <p className="text-xs text-zinc-500">
                Harga Tetap (Fixed Price) • First-Come-First-Served
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {result ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-extrabold text-emerald-950">
                Yeay! Barang berhasil kamu claim.
              </h4>
              <p className="text-xs text-emerald-800">
                Stok sudah dikunci untuk kamu. Segera lanjutkan konfirmasi pembayaran
                via WhatsApp sebelum waktu reservasi berakhir.
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Order Reference
                  </span>
                  <div className="font-mono text-lg font-extrabold text-zinc-900">
                    {result.order_reference}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyOrderRef}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                >
                  {copiedRef ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin ID
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Produk</span>
                  <span className="font-semibold text-zinc-900 text-right">
                    {result.product_name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Jumlah (Qty)</span>
                  <span className="font-semibold text-zinc-900">
                    {result.quantity} item
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Harga Satuan</span>
                  <span className="font-mono font-medium text-zinc-800">
                    {formatRupiah(result.unit_price)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t border-zinc-200/80 pt-2">
                  <span className="font-bold text-zinc-900">Total Pembayaran</span>
                  <span className="font-mono text-base font-extrabold text-orange-600">
                    {formatRupiah(result.total_amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Batas waktu reservasi:{" "}
                  <strong>{formatDateTimeID(result.reservation_expires_at)}</strong>
                </span>
              </div>
            </div>

            {/* Primary WhatsApp CTA */}
            <div className="space-y-2.5">
              <a
                href={result.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Konfirmasi Pembayaran via WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href={`/order/${encodeURIComponent(result.order_reference)}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Pantau Status Order <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* RESERVATION FORM */
          <form onSubmit={handleClaimSubmit} className="mt-4 space-y-4">
            {/* Product Summary */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3">
              <img
                src={
                  product.image_urls?.[0] ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                }
                alt={product.name}
                className="h-16 w-16 rounded-xl object-cover border border-zinc-200 shrink-0 bg-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-500 truncate">
                  {product.session?.name || "Active Garage Sale"}
                </p>
                <h4 className="text-sm font-bold text-zinc-900 truncate">
                  {product.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-orange-600">
                    {formatRupiah(product.jastip_price)}
                  </span>
                  <span className="rounded-md bg-zinc-200/80 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                    Sisa Stok: {product.available_stock}
                  </span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                className={`rounded-2xl border p-3.5 text-xs font-medium flex items-start gap-2.5 ${
                  outOfStockError
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : "border-amber-300 bg-amber-50 text-amber-900"
                }`}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-2 flex-1">
                  <p className="font-bold text-sm">{errorMessage}</p>
                  {outOfStockError && (
                    <Link
                      href="/products?stockFilter=available"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Lihat Produk Lain yang Masih Tersedia
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Quantity Picker */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Jumlah Barang
                </label>
                <span className="text-xs text-zinc-500">
                  Maksimal {product.available_stock} item tersedia
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-mono text-base font-bold text-zinc-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.available_stock, q + 1))
                  }
                  disabled={quantity >= product.available_stock}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Nadya Putri"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Contoh: 081288990011"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Contoh: Tolong cek kondisi jahitan / kirim GoSend Instant"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Price Breakdown & Submit */}
            <div className="rounded-2xl bg-zinc-900 p-4 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">
                    Total Harga Jastip (Fixed Price)
                  </span>
                  <span className="font-mono text-xl font-extrabold text-white">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Kunci Stok 30 Menit
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || product.available_stock <= 0}
                className="w-full rounded-xl bg-orange-600 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm hover:bg-orange-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting
                  ? "Mengunci Stok Secara Atomik..."
                  : "KONFIRMASI & REBUT SEKARANG"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


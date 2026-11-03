import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  AlertTriangle,
  Package,
  ArrowLeft,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getOrderByReferencePublic } from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { formatDateTimeID, formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const decodedRef = decodeURIComponent(reference).toUpperCase();
  const { order, settings, whatsappUrl } =
    await getOrderByReferencePublic(decodedRef);

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-orange-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog Produk
        </Link>

        {!order ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center space-y-4 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-zinc-900">
              Order Reference &ldquo;{decodedRef}&rdquo; Tidak Ditemukan
            </h1>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Pastikan kode referensi pesanan yang kamu masukkan sudah benar
              (contoh: <span className="font-mono font-bold">JW-000123</span>).
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/order/JW-000123"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100"
              >
                Lihat Contoh Order JW-000123
              </Link>
              <Link
                href="/products"
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600"
              >
                Explore Produk
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Status Card */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Order Reference
                  </span>
                  <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-0.5">
                    {order.order_reference}
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1">
                    Dibuat pada {formatDateTimeID(order.created_at)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider ${
                      order.order_status === "CONFIRMED" ||
                      order.order_status === "COMPLETED" ||
                      order.order_status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.order_status === "CANCELLED" ||
                          order.order_status === "EXPIRED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {order.order_status === "CONFIRMED" ||
                    order.order_status === "COMPLETED" ||
                    order.order_status === "PAID" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : order.order_status === "CANCELLED" ||
                      order.order_status === "EXPIRED" ? (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                    {order.order_status.replace("_", " ")}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    Status Pembayaran:{" "}
                    <strong className="text-zinc-800">
                      {order.payment_status}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Expiration Banner if Unpaid */}
              {(order.order_status === "PENDING" ||
                order.order_status === "RESERVED" ||
                order.order_status === "WAITING_PAYMENT") && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-amber-950">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Stok sedang dikunci untuk pesanan ini!
                      </p>
                      <p className="mt-0.5 text-amber-800">
                        Selesaikan konfirmasi pembayaran sebelum{" "}
                        <strong>
                          {formatDateTimeID(order.reservation_expires_at)}
                        </strong>{" "}
                        agar reservasi tidak kedaluwarsa otomatis.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(order.order_status === "EXPIRED" ||
                order.order_status === "CANCELLED") && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                  <strong>Informasi:</strong> Pesanan ini telah berstatus{" "}
                  <strong>{order.order_status}</strong> dan stok yang sebelumnya
                  dikunci telah dilepas kembali ke katalog publik.
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Rincian Barang yang Diklaim
                </h2>
                <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-zinc-50/60">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name_snapshot}
                            className="h-14 w-14 rounded-xl object-cover border border-zinc-200 bg-white shrink-0"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-200 text-zinc-500 shrink-0">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">
                            {item.product_name_snapshot}
                          </p>
                          <p className="text-xs text-zinc-500 font-mono">
                            {item.quantity} x {formatRupiah(item.unit_price)}
                          </p>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-extrabold text-zinc-900 shrink-0">
                        {formatRupiah(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-zinc-50 p-4 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-400 font-semibold uppercase">
                    Data Pemesan
                  </span>
                  <p className="text-sm font-bold text-zinc-900">
                    {order.customer?.full_name || "Customer"}
                  </p>
                  <p className="font-mono text-zinc-600">
                    WhatsApp: {order.customer?.whatsapp_number}
                  </p>
                  {order.customer_notes && (
                    <p className="text-zinc-500 italic pt-1">
                      &ldquo;{order.customer_notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="sm:text-right flex flex-col justify-center">
                  <span className="text-zinc-400 font-semibold uppercase">
                    Total Pembayaran (Fixed Price)
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-orange-600 mt-0.5">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* WhatsApp Confirmation Action */}
              {order.order_status !== "CANCELLED" &&
                order.order_status !== "EXPIRED" && (
                  <div className="pt-2 space-y-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Konfirmasi / Hubungi Admin via WhatsApp
                    </a>
                    <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Pesan WhatsApp akan terisi otomatis dengan Order ID{" "}
                      <strong>{order.order_reference}</strong>
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


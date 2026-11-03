import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle, ExternalLink, Clock } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getOrderByIdAdmin } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOrderDetailActions } from "@/components/admin/order-detail-actions";
import { formatDateTimeID, formatRupiah } from "@/lib/utils";
import { buildAdminToCustomerWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const order = await getOrderByIdAdmin(id);
  if (!order) {
    notFound();
  }

  const firstItem = order.items?.[0];
  const waUrl = order.customer
    ? buildAdminToCustomerWhatsAppUrl({
        customerWhatsApp: order.customer.whatsapp_number,
        customerName: order.customer.full_name,
        orderReference: order.order_reference,
        productName: firstItem?.product_name_snapshot || "Produk JASTIP WAR",
        totalAmount: order.total_amount,
        orderStatus: order.order_status,
      })
    : "#";

  return (
    <AdminShell admin={admin}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar Pesanan
          </Link>

          <Link
            href={`/order/${order.order_reference}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
          >
            Halaman Tracking Customer <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
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
              <span className="rounded-full bg-zinc-900 px-3.5 py-1 text-xs font-extrabold uppercase text-white">
                Status: {order.order_status}
              </span>
              <span className="text-xs font-bold text-zinc-600">
                Payment Status: {order.payment_status}
              </span>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Tindakan Admin (Atomic Inventory & Order Transition)
            </h2>
            <AdminOrderDetailActions order={order} />
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">
                Informasi Pelanggan
              </span>
              <p className="text-base font-extrabold text-zinc-900">
                {order.customer?.full_name}
              </p>
              <p className="font-mono text-xs text-zinc-600">
                WhatsApp: +{order.customer?.whatsapp_number}
              </p>
              {order.customer_notes && (
                <p className="text-xs text-zinc-600 pt-1">
                  Catatan: &ldquo;{order.customer_notes}&rdquo;
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between sm:items-end gap-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  Batas Reservasi:{" "}
                  <strong>
                    {formatDateTimeID(order.reservation_expires_at)}
                  </strong>
                </span>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi Pelanggan via WhatsApp
              </a>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Daftar Barang
            </h2>
            <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name_snapshot}
                        className="h-14 w-14 rounded-xl object-cover border border-zinc-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-zinc-900 truncate">
                        {item.product_name_snapshot}
                      </p>
                      <p className="font-mono text-xs text-zinc-500">
                        {item.quantity} unit x {formatRupiah(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-extrabold text-zinc-900">
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-zinc-900 px-5 py-4 text-white">
              <span className="text-sm font-bold">Total Pembayaran</span>
              <span className="font-mono text-xl font-extrabold text-orange-400">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
} from "lucide-react";
import { formatDateTimeID, formatRupiah } from "@/lib/utils";
import { buildAdminToCustomerWhatsAppUrl } from "@/lib/whatsapp";
import type { Order } from "@/types/database";

const STATUS_TABS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "RESERVED", label: "Reserved" },
  { id: "WAITING_PAYMENT", label: "Waiting Payment" },
  { id: "PAID", label: "Paid" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "EXPIRED", label: "Expired" },
];

export function AdminOrdersManagerClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);

  const filtered = initialOrders.filter((o) => {
    if (statusFilter !== "ALL" && o.order_status !== statusFilter) return false;
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      const matchRef = o.order_reference.toLowerCase().includes(q);
      const matchName = o.customer?.full_name.toLowerCase().includes(q) ?? false;
      const matchWa =
        o.customer?.whatsapp_number.toLowerCase().includes(q) ?? false;
      const matchProduct =
        o.items?.some((i) =>
          i.product_name_snapshot.toLowerCase().includes(q)
        ) ?? false;
      if (!matchRef && !matchName && !matchWa && !matchProduct) return false;
    }
    return true;
  });

  const handleTransition = async (orderId: string, action: string) => {
    setBusyId(orderId);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleSweepExpired = async () => {
    setSweeping(true);
    try {
      await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXPIRE_OVERDUE" }),
      });
      router.refresh();
    } finally {
      setSweeping(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search + Expiration Sweep */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Order ID (JW-...), nama customer, nomor WA, atau nama produk..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSweepExpired}
            disabled={sweeping}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 cursor-pointer shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${sweeping ? "animate-spin" : ""}`}
            />
            Periksa & Rilis Reservasi Expired
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Tidak ada data pesanan untuk filter ini.
          </div>
        ) : (
          filtered.map((order) => {
            const isBusy = busyId === order.id;
            const firstItem = order.items?.[0];
            const waUrl = order.customer
              ? buildAdminToCustomerWhatsAppUrl({
                  customerWhatsApp: order.customer.whatsapp_number,
                  customerName: order.customer.full_name,
                  orderReference: order.order_reference,
                  productName:
                    firstItem?.product_name_snapshot || "Produk JASTIP WAR",
                  totalAmount: order.total_amount,
                  orderStatus: order.order_status,
                })
              : "#";

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4 transition-opacity"
                style={{ opacity: isBusy ? 0.6 : 1 }}
              >
                {/* Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-base font-extrabold text-zinc-900 hover:text-orange-600"
                    >
                      {order.order_reference}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                        order.order_status === "CONFIRMED" ||
                        order.order_status === "PAID" ||
                        order.order_status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.order_status === "CANCELLED" ||
                            order.order_status === "EXPIRED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {order.order_status}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                      Payment: {order.payment_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>Dibuat: {formatDateTimeID(order.created_at)}</span>
                  </div>
                </div>

                {/* Middle Content: Customer + Items + Total */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-center">
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Customer
                    </span>
                    <p className="text-sm font-extrabold text-zinc-900">
                      {order.customer?.full_name || "Customer"}
                    </p>
                    <p className="font-mono text-xs text-zinc-600">
                      +{order.customer?.whatsapp_number}
                    </p>
                    {order.customer_notes && (
                      <p className="text-xs text-zinc-500 italic">
                        &ldquo;{order.customer_notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Item yang Direbut
                    </span>
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs sm:text-sm"
                      >
                        <span className="font-semibold text-zinc-800 truncate pr-2">
                          {item.quantity}x {item.product_name_snapshot}
                        </span>
                        <span className="font-mono text-xs text-zinc-600 shrink-0">
                          {formatRupiah(item.unit_price)}
                        </span>
                      </div>
                    ))}
                    {(order.order_status === "PENDING" ||
                      order.order_status === "RESERVED" ||
                      order.order_status === "WAITING_PAYMENT") && (
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 pt-1">
                        <Clock className="h-3.5 w-3.5" />
                        Batas Reservasi:{" "}
                        {formatDateTimeID(order.reservation_expires_at)}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3 md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Total Amount
                    </span>
                    <span className="font-mono text-lg font-extrabold text-orange-600">
                      {formatRupiah(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.order_status !== "CANCELLED" &&
                      order.order_status !== "EXPIRED" && (
                        <>
                          {order.payment_status !== "PAID" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleTransition(order.id, "MARK_PAID")
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Konfirmasi Bayar (Paid)
                            </button>
                          )}
                          {order.order_status !== "CONFIRMED" &&
                            order.order_status !== "COMPLETED" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleTransition(order.id, "CONFIRM_ORDER")
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer"
                              >
                                Confirm Order
                              </button>
                            )}
                          {order.order_status !== "COMPLETED" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleTransition(order.id, "COMPLETE_ORDER")
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleTransition(order.id, "CANCEL_ORDER")
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel & Release Stok
                          </button>
                        </>
                      )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat Customer
                    </a>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


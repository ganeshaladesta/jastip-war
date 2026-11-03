"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Check } from "lucide-react";
import type { Order } from "@/types/database";

export function AdminOrderDetailActions({ order }: { order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const runAction = async (action: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (order.order_status === "CANCELLED" || order.order_status === "EXPIRED") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
        Pesanan ini sudah berstatus {order.order_status} dan stok yang
        sebelumnya dikunci telah dilepas kembali ke katalog.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {order.payment_status !== "PAID" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => runAction("MARK_PAID")}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          Konfirmasi Pembayaran (Mark Paid)
        </button>
      )}

      {order.order_status !== "CONFIRMED" &&
        order.order_status !== "COMPLETED" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("CONFIRM_ORDER")}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Confirm Order
          </button>
        )}

      {order.order_status !== "COMPLETED" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => runAction("COMPLETE_ORDER")}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
        >
          Tandai Selesai (Completed)
        </button>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => runAction("CANCEL_ORDER")}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
      >
        <XCircle className="h-4 w-4" />
        Batalkan & Rilis Stok
      </button>
    </div>
  );
}


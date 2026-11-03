import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAllOrdersAdmin } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOrdersManagerClient } from "@/components/admin/orders-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const orders = await getAllOrdersAdmin();

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Order & Reservation Lifecycle
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Manajemen Pesanan & Klaim ({orders.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Verifikasi pembayaran WhatsApp, konfirmasi pesanan, atau batalkan
            klaim untuk mengembalikan stok ke katalog publik secara atomik.
          </p>
        </div>

        <AdminOrdersManagerClient initialOrders={orders} />
      </div>
    </AdminShell>
  );
}


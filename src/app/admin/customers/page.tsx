import { redirect } from "next/navigation";
import { MessageCircle, Users } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getCustomersAdmin } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDateTimeID, formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const customers = await getCustomersAdmin();

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            CRM & WhatsApp Directory
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Data Pelanggan ({customers.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Daftar pelanggan yang pernah melakukan klaim/reservasi produk di
            JASTIP WAR.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 rounded-3xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          {customers.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-500">
              Belum ada data pelanggan.
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-900">
                      {customer.full_name}
                    </h2>
                    <p className="font-mono text-xs text-zinc-500">
                      WhatsApp: +{customer.whatsapp_number} • Bergabung{" "}
                      {formatDateTimeID(customer.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
                  <div className="sm:text-right">
                    <span className="text-xs text-zinc-400 block">
                      {customer.total_orders || 0} Total Klaim
                    </span>
                    <span className="font-mono text-sm font-extrabold text-zinc-900">
                      {formatRupiah(customer.total_spent || 0)}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${customer.whatsapp_number}?text=${encodeURIComponent(
                      `Halo Kak ${customer.full_name}, salam dari Admin JASTIP WAR!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Hubungi WA
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}


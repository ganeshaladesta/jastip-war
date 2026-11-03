import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getActivityLogsAdmin } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDateTimeID } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminActivityLogsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const logs = await getActivityLogsAdmin(100);

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Security & Audit Trail
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Admin & Inventory Activity Log
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Rekam jejak seluruh perubahan produk, harga, stok, klaim pelanggan,
            serta konfirmasi pembayaran.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 rounded-3xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0 mt-0.5">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                      {log.action}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-600">
                      {log.entity_type}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Actor: {log.actor_id ? "Admin" : "System / Public Claim"}
                    </span>
                  </div>
                  <pre className="text-xs text-zinc-600 font-mono whitespace-pre-wrap break-all bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                    {JSON.stringify(log.details)}
                  </pre>
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-mono shrink-0">
                {formatDateTimeID(log.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}


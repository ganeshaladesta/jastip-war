import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSettingsFormClient } from "@/components/admin/settings-form-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const settings = await getStoreSettings();

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Store Configuration
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Pengaturan Aplikasi JASTIP WAR
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Atur nomor WhatsApp Admin, durasi waktu kunci stok reservasi,
            pengumuman live, serta syarat & ketentuan.
          </p>
        </div>

        <AdminSettingsFormClient initialSettings={settings} />
      </div>
    </AdminShell>
  );
}


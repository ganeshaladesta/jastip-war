import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getSessions } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSessionsManagerClient } from "@/components/admin/sessions-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const sessions = await getSessions(true);

  return (
    <AdminShell admin={admin}>
      <AdminSessionsManagerClient initialSessions={sessions} />
    </AdminShell>
  );
}


import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCategoriesManagerClient } from "@/components/admin/categories-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const categories = await getCategories();

  return (
    <AdminShell admin={admin}>
      <AdminCategoriesManagerClient initialCategories={categories} />
    </AdminShell>
  );
}


import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getCategories, getSessions } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const [categories, sessions] = await Promise.all([
    getCategories(),
    getSessions(false),
  ]);

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar Produk
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold text-zinc-900">
              Fast Product Entry (&lt;30 Detik)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Unggah foto langsung dari lokasi garage sale dan tayangkan ke
              katalog publik secara real-time.
            </p>
          </div>
        </div>

        <AdminProductForm
          mode="create"
          categories={categories}
          sessions={sessions}
        />
      </div>
    </AdminShell>
  );
}


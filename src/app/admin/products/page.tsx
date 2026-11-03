import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getAllProductsAdmin,
  getCategories,
  getSessions,
} from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductsManagerClient } from "@/components/admin/products-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const [products, categories, sessions] = await Promise.all([
    getAllProductsAdmin(),
    getCategories(),
    getSessions(true),
  ]);

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Live Inventory Control
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
              Manajemen Produk & Stok ({products.length})
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Ubah harga, tambah/kurangi stok dengan 1 klik, atau unggah barang
              baru dari lokasi garage sale.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-sm hover:bg-orange-500"
          >
            <PlusCircle className="h-4 w-4" />
            + Fast Add Product (&lt;30s)
          </Link>
        </div>

        <AdminProductsManagerClient
          initialProducts={products}
          categories={categories}
          sessions={sessions}
        />
      </div>
    </AdminShell>
  );
}


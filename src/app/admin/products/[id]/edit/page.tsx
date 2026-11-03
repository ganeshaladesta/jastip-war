import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getCategories,
  getProductByIdAdmin,
  getSessions,
} from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [product, categories, sessions] = await Promise.all([
    getProductByIdAdmin(id),
    getCategories(),
    getSessions(true),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar Produk
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold text-zinc-900">
              Edit Produk: {product.name}
            </h1>
          </div>

          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50"
          >
            Lihat di Katalog Publik <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <AdminProductForm
          mode="edit"
          initialProduct={product}
          categories={categories}
          sessions={sessions}
        />
      </div>
    </AdminShell>
  );
}


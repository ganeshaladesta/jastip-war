import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug } from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { ProductDetailClient } from "@/components/marketplace/product-detail-client";
import { ProductCard } from "@/components/marketplace/product-card";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, relatedProducts, settings } = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 font-bold text-zinc-800 hover:text-orange-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-zinc-900"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="truncate text-zinc-900 font-semibold max-w-[200px] sm:max-w-md">
            {product.name}
          </span>
        </div>

        {/* Main Product Section */}
        <ProductDetailClient product={product} settings={settings} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-zinc-200/80 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
                  More From This Session
                </span>
                <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-zinc-900">
                  Produk Serupa yang Mungkin Kamu Suka
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs sm:text-sm font-bold text-zinc-800 hover:text-orange-600"
              >
                Lihat Semua →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-4">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


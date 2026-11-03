import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, ArrowLeft, ArrowRight } from "lucide-react";
import {
  getCategories,
  getPublicCatalogProducts,
  getSessions,
  getStoreSettings,
  type ProductQueryFilters,
} from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { ProductCard } from "@/components/marketplace/product-card";
import { CatalogFilterBar } from "@/components/marketplace/catalog-filters";

export const dynamic = "force-dynamic";

export default async function ProductsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const categorySlug =
    typeof resolvedParams.category === "string" ? resolvedParams.category : "all";
  const sessionSlug =
    typeof resolvedParams.session === "string" ? resolvedParams.session : "all";
  const search =
    typeof resolvedParams.search === "string" ? resolvedParams.search : "";
  const sort = (
    typeof resolvedParams.sort === "string" ? resolvedParams.sort : "latest"
  ) as ProductQueryFilters["sort"];
  const stockFilter = (
    typeof resolvedParams.stockFilter === "string"
      ? resolvedParams.stockFilter
      : "all"
  ) as ProductQueryFilters["stockFilter"];
  const page = Number(resolvedParams.page || 1) || 1;

  const [catalog, categories, sessions, settings] = await Promise.all([
    getPublicCatalogProducts({
      categorySlug,
      sessionSlug,
      search,
      sort,
      stockFilter,
      page,
      pageSize: 12,
    }),
    getCategories(),
    getSessions(false),
    getStoreSettings(),
  ]);

  const buildPageHref = (targetPage: number) => {
    const p = new URLSearchParams();
    if (categorySlug !== "all") p.set("category", categorySlug);
    if (sessionSlug !== "all") p.set("session", sessionSlug);
    if (search) p.set("search", search);
    if (sort && sort !== "latest") p.set("sort", sort);
    if (stockFilter && stockFilter !== "all") p.set("stockFilter", stockFilter);
    p.set("page", String(targetPage));
    return `/products?${p.toString()}`;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Live Jastip Catalog
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Explore Garage Sale Products
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Semua harga adalah harga tetap (Fixed Price). Stok diperbarui
              secara real-time saat barang diklaim.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Suspense
          fallback={
            <div className="h-32 rounded-3xl border border-zinc-200 bg-white animate-pulse" />
          }
        >
          <CatalogFilterBar
            categories={categories}
            sessions={sessions}
            totalFound={catalog.total}
          />
        </Suspense>

        {/* Product Grid */}
        {catalog.products.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <PackageSearch className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900">
              Produk Tidak Ditemukan
            </h2>
            <p className="mx-auto max-w-md text-sm text-zinc-500">
              Tidak ada produk yang cocok dengan filter atau kata kunci pencarian
              kamu saat ini. Coba reset filter untuk melihat semua barang yang
              sedang live.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-600"
              >
                Lihat Semua Produk
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {catalog.products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {catalog.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {catalog.page > 1 && (
              <Link
                href={buildPageHref(catalog.page - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:border-zinc-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Sebelumnya
              </Link>
            )}
            <span className="px-3 text-xs font-semibold text-zinc-600">
              Halaman <strong>{catalog.page}</strong> dari{" "}
              <strong>{catalog.totalPages}</strong>
            </span>
            {catalog.page < catalog.totalPages && (
              <Link
                href={buildPageHref(catalog.page + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:border-zinc-900"
              >
                Selanjutnya <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


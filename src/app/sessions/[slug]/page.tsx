import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Package } from "lucide-react";
import { getSessionBySlug, getStoreSettings } from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { ProductCard } from "@/components/marketplace/product-card";
import { formatDateTimeID } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ session, products }, settings] = await Promise.all([
    getSessionBySlug(slug),
    getStoreSettings(),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-orange-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Semua Sesi Garage Sale
        </Link>

        {/* Session Banner Card */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="relative aspect-16/9 lg:aspect-auto lg:col-span-5 bg-zinc-100">
              <img
                src={session.image_url}
                alt={session.name}
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {session.status === "LIVE" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      LIVE SESSION
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                      {session.status}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600">
                    <MapPin className="h-3.5 w-3.5 text-orange-600" />
                    {session.location}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                  {session.name}
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  {session.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4 text-xs text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {formatDateTimeID(session.start_date)} —{" "}
                  {formatDateTimeID(session.end_date)}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono font-bold text-zinc-900">
                  <Package className="h-4 w-4 text-orange-600" />
                  {session.available_product_count || 0} Produk Masih Tersedia
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Products Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-zinc-900">
            Katalog Produk Sesi Ini ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
              Belum ada produk yang dipublikasikan untuk sesi ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 4}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


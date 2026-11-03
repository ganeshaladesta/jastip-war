import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Sparkles,
  Clock,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Search,
  Zap,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { getHomeMarketplaceData } from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { ProductCard } from "@/components/marketplace/product-card";
import { formatRupiah, formatDateTimeID } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const {
    activeSessions,
    featuredProducts,
    latestArrivals,
    limitedStockProducts,
    categories,
    totalAvailableProducts,
    totalAvailableUnits,
    settings,
  } = await getHomeMarketplaceData();

  const primarySession = activeSessions[0];
  const heroHighlightProduct = featuredProducts[0] || latestArrivals[0];

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              {/* Left Copy */}
              <div className="lg:col-span-7 space-y-6">
                {/* Live Session Pill */}
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-3.5 py-1.5 text-xs font-bold text-orange-800">
                  <span className="inline-flex h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                  <span>
                    {primarySession
                      ? `LIVE EVENT: ${primarySession.name}`
                      : "LIVE GARAGE SALE CURATION"}
                  </span>
                  <span className="text-orange-400">•</span>
                  <span className="font-mono text-orange-900">
                    {totalAvailableProducts} Produk Siap Rebut
                  </span>
                </div>

                <h1 className="text-[clamp(2.15rem,4.2vw,3.75rem)] font-extrabold tracking-tight text-zinc-900 leading-[1.06]">
                  Garage Sale Finds.{" "}
                  <span className="text-orange-600">
                    Your Next Favorite Deal.
                  </span>
                </h1>

                <p className="max-w-xl text-base sm:text-lg text-zinc-600 leading-relaxed">
                  Discover exclusive finds, limited-stock products, and special
                  jastip deals. Find your favorites before they&apos;re gone.
                </p>

                {/* Fixed-Price Rule Callout */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-700">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Harga Pasti (Fixed Price)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5">
                    <Zap className="h-4 w-4 text-orange-600" />
                    Tanpa Lelang / Tanpa Bidding
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5">
                    <Clock className="h-4 w-4 text-zinc-700" />
                    Siapa Cepat Dia Dapat
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-md hover:bg-orange-600 transition-colors"
                  >
                    Explore Products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/products?stockFilter=available"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-6 py-4 text-sm font-bold text-zinc-900 hover:border-zinc-900 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    View Live Products ({totalAvailableUnits} Unit)
                  </Link>
                </div>

                {/* Live Metrics Bar */}
                <div className="grid grid-cols-3 gap-4 border-t border-zinc-200/80 pt-6 max-w-lg">
                  <div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-zinc-900">
                      {activeSessions.length}
                    </div>
                    <div className="text-xs font-medium text-zinc-500">
                      Active Sessions
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-700">
                      {totalAvailableUnits}
                    </div>
                    <div className="text-xs font-medium text-zinc-500">
                      Stok Tersedia Live
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-orange-600">
                      {settings.reservation_duration_minutes}m
                    </div>
                    <div className="text-xs font-medium text-zinc-500">
                      Kunci Stok Otomatis
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Hero Composition */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl border border-zinc-200 bg-[#FAF9F6] p-4 sm:p-5 shadow-xl">
                  {/* Live Indicator Header */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        LIVE FEED
                      </span>
                      <span className="text-xs font-semibold text-zinc-600 truncate">
                        {primarySession?.location || "Jakarta Selatan"}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      FIXED PRICE
                    </span>
                  </div>

                  {heroHighlightProduct && (
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                      <Link
                        href={`/products/${heroHighlightProduct.slug}`}
                        className="block relative aspect-4/3 w-full overflow-hidden bg-zinc-100"
                      >
                        <img
                          src={heroHighlightProduct.image_urls[0]}
                          alt={heroHighlightProduct.name}
                          fetchPriority="high"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                            {heroHighlightProduct.category?.name || "Featured Find"}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1.5 backdrop-blur-xs shadow-md">
                          <span className="block text-[10px] font-bold uppercase text-zinc-400">
                            Jastip Price
                          </span>
                          <span className="font-mono text-base font-extrabold text-orange-600">
                            {formatRupiah(heroHighlightProduct.jastip_price)}
                          </span>
                        </div>
                      </Link>

                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${heroHighlightProduct.slug}`}
                            className="block text-base font-bold text-zinc-900 truncate hover:text-orange-600"
                          >
                            {heroHighlightProduct.name}
                          </Link>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Sisa stok:{" "}
                            <strong className="text-emerald-700 font-mono">
                              {heroHighlightProduct.available_stock} unit tersedia
                            </strong>
                          </p>
                        </div>
                        <Link
                          href={`/products/${heroHighlightProduct.slug}`}
                          className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600 transition-colors"
                        >
                          Rebut
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Active Session Mini Strip */}
                  {primarySession && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-zinc-900 block truncate">
                            {primarySession.name}
                          </span>
                          <span className="text-zinc-500">
                            {primarySession.available_product_count} produk masih
                            available
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/sessions/${primarySession.slug}`}
                        className="shrink-0 font-bold text-orange-600 hover:text-orange-700"
                      >
                        Lihat Sesi →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY QUICK BAR */}
        <section className="border-b border-zinc-200/80 bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <Link
                href="/products"
                className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white"
              >
                Semua Produk ({totalAvailableProducts})
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                >
                  {cat.name}{" "}
                  <span className="ml-1 font-mono text-[11px] text-zinc-400">
                    ({cat.product_count || 0})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                Curated Highlights
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                Featured Garage Sale Finds
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-orange-600"
            >
              Lihat Semua Produk <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={idx < 2}
              />
            ))}
          </div>
        </section>

        {/* LIMITED STOCK ("REBUT SEBELUM HABIS") */}
        {limitedStockProducts.length > 0 && (
          <section className="border-y border-zinc-200/80 bg-zinc-900 text-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                    Low Stock Alert
                  </span>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Limited Stock — Sisa 1 atau 2 Item!
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Barang di bawah ini tinggal tersisa sedikit di lokasi event.
                    Klaim sekarang sebelum direbut customer lain.
                  </p>
                </div>
                <Link
                  href="/products?stockFilter=low_stock"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20"
                >
                  Semua Low Stock <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-4">
                {limitedStockProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* LATEST ARRIVALS */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Real-Time Feed
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                Latest Arrivals dari Lokasi Event
              </h2>
            </div>
            <Link
              href="/products?sort=latest"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-orange-600"
            >
              Jelajahi Katalog Lengkap <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {latestArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* ACTIVE GARAGE SALE SESSIONS */}
        <section className="border-t border-zinc-200/80 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Shopping Events
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                  Active Garage Sale Sessions
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Pilih sesi event belanja yang sedang berlangsung untuk melihat
                  katalog khususnya.
                </p>
              </div>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-orange-600"
              >
                Lihat Semua Sesi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {activeSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-[#FAF9F6] transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-16/9 w-full overflow-hidden bg-zinc-200">
                    <img
                      src={session.image_url}
                      alt={session.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      {session.status === "LIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                          UPCOMING
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </div>
                      <h3 className="mt-1.5 text-lg font-extrabold text-zinc-900 group-hover:text-orange-600 transition-colors">
                        {session.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-zinc-800">
                        {session.available_product_count || 0} /{" "}
                        {session.product_count || 0} Produk Tersedia
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-orange-600">
                        Buka Katalog <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Simple & Transparent
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Cara Belanja di JASTIP WAR
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Tanpa perlu bikin akun dan tanpa drama lelang. Cukup 3 langkah
              mudah untuk mengamankan barang incaranmu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <Search className="h-6 w-6 text-orange-400" />
                </div>
                <span className="font-mono text-2xl font-extrabold text-zinc-200">
                  01
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900">
                1. Explore Products
              </h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Pantau katalog live yang diunggah langsung dari lokasi garage
                sale. Semua harga sudah bersih (Fixed Price) dan sisa stok
                tampil secara real-time.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <span className="font-mono text-2xl font-extrabold text-zinc-200">
                  02
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900">
                2. Claim Your Favorite Items
              </h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Klik tombol <strong>REBUT SEKARANG</strong>, isi nama dan nomor
                WhatsApp kamu. Sistem mengunci stok secara atomik selama{" "}
                {settings.reservation_duration_minutes} menit khusus untukmu.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <span className="font-mono text-2xl font-extrabold text-zinc-200">
                  03
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900">
                3. Confirm Order via WhatsApp
              </h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Dapatkan kode unik <strong>Order Reference (JW-XXXXXX)</strong>{" "}
                dan lanjutkan konfirmasi pembayaran dengan sekali klik ke
                WhatsApp Admin.
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


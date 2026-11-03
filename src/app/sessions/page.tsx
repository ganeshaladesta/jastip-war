import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Package } from "lucide-react";
import { getSessions, getStoreSettings } from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { formatDateTimeID } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SessionsListPage() {
  const [sessions, settings] = await Promise.all([
    getSessions(false),
    getStoreSettings(),
  ]);

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Garage Sale & Pop-Up Events
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Garage Sale Sessions
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Setiap sesi memiliki stok terpisah langsung dari lokasi event. Pilih
            sesi untuk menelusuri produk yang sedang dikurasi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-16/9 w-full overflow-hidden bg-zinc-100">
                <img
                  src={session.image_url}
                  alt={session.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  {session.status === "LIVE" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      LIVE NOW
                    </span>
                  ) : session.status === "UPCOMING" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                      UPCOMING
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                      {session.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{session.location}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    {session.name}
                  </h2>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {session.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDateTimeID(session.start_date)} —{" "}
                      {formatDateTimeID(session.end_date)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-zinc-100 pt-4 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold text-zinc-800">
                    <Package className="h-4 w-4 text-zinc-400" />
                    {session.available_product_count || 0} Tersedia /{" "}
                    {session.product_count || 0} Total
                  </span>
                  <span className="inline-flex items-center gap-1 font-extrabold text-orange-600">
                    Lihat Produk <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


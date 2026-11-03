import Link from "next/link";
import { Flame, MessageCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { normalizeWhatsAppNumber } from "@/lib/utils";
import type { StoreSettings } from "@/types/database";

export function MarketplaceFooter({ settings }: { settings?: StoreSettings }) {
  const storeName = settings?.store_name || "JASTIP WAR";
  const tagline = settings?.tagline || "Find It. Claim It. Get It.";
  const waNumber = normalizeWhatsAppNumber(
    settings?.whatsapp_number || "6281299887766"
  );
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo Admin JASTIP WAR, saya ingin bertanya mengenai produk garage sale yang sedang live."
  )}`;

  return (
    <footer className="border-t border-zinc-200/80 bg-white pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-zinc-900">
                {storeName}
              </span>
            </Link>
            <p className="text-sm font-semibold text-orange-600">{tagline}</p>
            <p className="max-w-sm text-sm text-zinc-600 leading-relaxed">
              {settings?.store_description ||
                "Marketplace jastip real-time khusus event garage sale, pop-up sale, dan clearance sale. Semua produk menggunakan harga tetap (Fixed Price) — tanpa lelang, siapa cepat dia dapat."}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                100% Fixed-Price Jastip
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Real-Time Inventory Lock
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm text-zinc-600">
              <li>
                <Link href="/products" className="hover:text-zinc-900">
                  Explore Semua Produk
                </Link>
              </li>
              <li>
                <Link
                  href="/products?stockFilter=low_stock"
                  className="hover:text-zinc-900"
                >
                  Stok Terbatas (Low Stock)
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-zinc-900">
                  Sesi Garage Sale
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-zinc-900">
                  Cara Kerja Jastip War
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
              Layanan Pelanggan
            </h4>
            <ul className="space-y-2.5 text-sm text-zinc-600">
              <li>
                <Link href="/order/JW-000123" className="hover:text-zinc-900">
                  Lacak Status Order
                </Link>
              </li>
              <li>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-700 font-medium hover:text-emerald-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Admin Live
                </a>
              </li>
              <li>
                <Link href="/how-it-works#terms" className="hover:text-zinc-900">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#privacy" className="hover:text-zinc-900">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
              Kontak & Operasional
            </h4>
            <div className="space-y-2.5 text-sm text-zinc-600">
              <p>WhatsApp: +{waNumber}</p>
              <p>Email: {settings?.contact_email || "hello@jastipwar.id"}</p>
              <p>Instagram: {settings?.contact_instagram || "@jastipwar.id"}</p>
              <div className="pt-2">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Dashboard Admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} {storeName}. Fixed-Price Real-Time Jastip
            Marketplace. Tanpa Bidding, Tanpa Lelang.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works#terms" className="hover:text-zinc-800">
              Terms & Conditions
            </Link>
            <Link href="/how-it-works#privacy" className="hover:text-zinc-800">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


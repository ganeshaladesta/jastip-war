"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  Search,
  ShoppingBag,
  Sparkles,
  Calendar,
  HelpCircle,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { RealtimeSyncListener } from "@/components/realtime/realtime-listener";

export function MarketplaceNavbar({
  announcement,
}: {
  announcement?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderLookupOpen, setOrderLookupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderRefInput, setOrderRefInput] = useState("");
  const [recentRefs, setRecentRefs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jw_recent_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentRefs(parsed.slice(0, 5));
      }
    } catch {
      // Ignore localStorage error
    }
  }, [orderLookupOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setMobileMenuOpen(false);
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/products");
    }
  };

  const handleOrderLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = orderRefInput.trim().toUpperCase();
    if (!ref) return;
    setOrderLookupOpen(false);
    setMobileMenuOpen(false);
    router.push(`/order/${encodeURIComponent(ref)}`);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Explore Products" },
    { href: "/sessions", label: "Garage Sale Sessions" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <>
      {announcement && (
        <div className="bg-zinc-900 text-zinc-100 text-xs py-2 px-4 border-b border-zinc-800">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 truncate">
              <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-ping shrink-0" />
              <span className="font-medium tracking-wide truncate">
                {announcement}
              </span>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 font-semibold text-orange-400 hover:text-orange-300 shrink-0"
            >
              Lihat Katalog Live <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm group-hover:bg-orange-600 transition-colors">
                <Flame className="h-5 w-5 text-orange-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-zinc-900 leading-none">
                  JASTIP WAR
                </span>
                <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 mt-0.5">
                  FIXED-PRICE FINDS
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search + Actions */}
          <div className="flex items-center gap-2.5">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-56 xl:w-68"
            >
              <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nike, Tas, Uniqlo..."
                className="w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </form>

            <div className="hidden sm:block">
              <RealtimeSyncListener showIndicator />
            </div>

            <button
              type="button"
              onClick={() => setOrderLookupOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-zinc-800 hover:border-zinc-900 hover:bg-zinc-50 transition-all shadow-2xs"
            >
              <ShoppingBag className="h-4 w-4 text-orange-600" />
              <span>My Order</span>
              {recentRefs.length > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[11px] font-bold text-white">
                  {recentRefs.length}
                </span>
              )}
            </button>

            <Link
              href="/admin/dashboard"
              className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100/80 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors"
              title="Portal Admin"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barang jastip, brand, kategori..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
              />
            </form>

            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                </Link>
              ))}
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Admin Portal
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Order Lookup Modal ("My Order") */}
      {orderLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Cek Status Pesanan
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Masukkan Order Reference kamu (contoh: JW-000123)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderLookupOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOrderLookup} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Nomor Referensi Order
                </label>
                <input
                  type="text"
                  value={orderRefInput}
                  onChange={(e) => setOrderRefInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: JW-000123"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 font-mono text-sm uppercase text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Lacak Pesanan Sekarang
              </button>
            </form>

            {recentRefs.length > 0 && (
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <p className="text-xs font-semibold text-zinc-500 mb-2">
                  Klaim Terakhir di Perangkat Ini:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentRefs.map((ref) => (
                    <Link
                      key={ref}
                      href={`/order/${encodeURIComponent(ref)}`}
                      onClick={() => setOrderLookupOpen(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-800 hover:border-orange-500 hover:bg-orange-50/50"
                    >
                      {ref}
                      <ArrowRight className="h-3 w-3 text-orange-600" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
              Coba contoh order demo:{" "}
              <button
                type="button"
                onClick={() => setOrderRefInput("JW-000123")}
                className="font-mono font-semibold text-zinc-800 underline hover:text-orange-600"
              >
                JW-000123
              </button>{" "}
              atau{" "}
              <button
                type="button"
                onClick={() => setOrderRefInput("JW-000125")}
                className="font-mono font-semibold text-zinc-800 underline hover:text-orange-600"
              >
                JW-000125
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex lg:hidden items-center justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-md py-2 px-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
            pathname === "/" ? "text-orange-600 font-bold" : "text-zinc-500"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/products"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
            pathname.startsWith("/products")
              ? "text-orange-600 font-bold"
              : "text-zinc-500"
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Explore</span>
        </Link>
        <Link
          href="/sessions"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
            pathname.startsWith("/sessions")
              ? "text-orange-600 font-bold"
              : "text-zinc-500"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Sessions</span>
        </Link>
        <button
          type="button"
          onClick={() => setOrderLookupOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium text-zinc-500"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>My Order</span>
        </button>
        <Link
          href="/how-it-works"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
            pathname.startsWith("/how-it-works")
              ? "text-orange-600 font-bold"
              : "text-zinc-500"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Cara Kerja</span>
        </Link>
      </nav>
    </>
  );
}


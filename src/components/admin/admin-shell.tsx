"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Calendar,
  Tags,
  Users,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { RealtimeSyncListener } from "@/components/realtime/realtime-listener";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/new", label: "Fast Add Product", icon: PlusCircle },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/sessions", label: "Garage Sessions", icon: Calendar },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/activity", label: "Activity Log", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-dvh flex bg-[#F4F3EF] text-zinc-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white p-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <span className="block text-sm font-extrabold tracking-tight text-zinc-900 leading-none">
                  JASTIP WAR
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                  ADMIN CONSOLE
                </span>
              </div>
            </Link>
          </div>

          {/* Primary Fast Add CTA */}
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm hover:bg-orange-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            + Tambah Produk Cepat
          </Link>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin/products"
                  ? pathname === "/admin/products" ||
                    (pathname.startsWith("/admin/products/") &&
                      pathname !== "/admin/products/new")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-200 pt-4 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <span>Buka Public Store</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">
                {admin.full_name}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">{admin.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800"
              aria-label="Open Admin Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-zinc-900">
                JASTIP WAR
              </span>
              <span className="hidden sm:inline-block text-xs text-zinc-400">
                /
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold text-zinc-600">
                On-Site Garage Sale Manager
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <RealtimeSyncListener showIndicator />
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-xs hover:bg-orange-500"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Barang</span>
              <span className="sm:hidden">+ Produk</span>
            </Link>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              Storefront <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Mobile Drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative z-10 flex w-72 max-w-[85vw] flex-col justify-between bg-white p-4 shadow-2xl">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white">
                      <Flame className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="font-extrabold text-sm">
                      JASTIP WAR ADMIN
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                          isActive
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-zinc-200 pt-3 space-y-2">
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-zinc-100 px-3.5 py-2.5 text-xs font-bold text-zinc-800"
                >
                  <span>Lihat Public Marketplace</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700"
                >
                  <LogOut className="h-4 w-4" /> Logout Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation for Fast On-Site Operations */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex lg:hidden items-center justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-md py-2 px-1">
          <Link
            href="/admin/dashboard"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${
              pathname === "/admin/dashboard"
                ? "text-orange-600 font-extrabold"
                : "text-zinc-500"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/products"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${
              pathname === "/admin/products"
                ? "text-orange-600 font-extrabold"
                : "text-zinc-500"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Produk</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex flex-col items-center justify-center -mt-4 rounded-2xl bg-orange-600 px-3.5 py-2 text-[11px] font-extrabold text-white shadow-md"
          >
            <PlusCircle className="h-5 w-5" />
            <span>+ Upload</span>
          </Link>
          <Link
            href="/admin/orders"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${
              pathname.startsWith("/admin/orders")
                ? "text-orange-600 font-extrabold"
                : "text-zinc-500"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders</span>
          </Link>
          <Link
            href="/admin/sessions"
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${
              pathname.startsWith("/admin/sessions")
                ? "text-orange-600 font-extrabold"
                : "text-zinc-500"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Sesi</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}


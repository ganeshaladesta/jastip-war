import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  Boxes,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Banknote,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Activity,
  Edit3,
} from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAdminDashboardOverview } from "@/lib/db/repository";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  formatRupiah,
  formatRelativeTime,
  getStockBadge,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const {
    stats,
    activeSessions,
    recentOrders,
    recentlyAddedProducts,
    lowStockProducts,
    recentActivities,
  } = await getAdminDashboardOverview();

  const statCards = [
    {
      label: "Total Products",
      value: String(stats.total_products),
      sub: "Produk katalog aktif",
      icon: Package,
      color: "bg-zinc-900 text-white",
    },
    {
      label: "Available Stock",
      value: `${stats.available_stock} unit`,
      sub: "Stok siap direbut",
      icon: Boxes,
      color: "bg-emerald-600 text-white",
    },
    {
      label: "Products Sold",
      value: `${stats.products_sold} unit`,
      sub: "Barang terjual lunas",
      icon: CheckCircle2,
      color: "bg-blue-600 text-white",
    },
    {
      label: "Pending Orders",
      value: String(stats.pending_orders),
      sub: "Menunggu konfirmasi bayar",
      icon: Clock,
      color: "bg-amber-500 text-white",
    },
    {
      label: "Confirmed Orders",
      value: String(stats.confirmed_orders),
      sub: "Order terverifikasi",
      icon: ShoppingBag,
      color: "bg-indigo-600 text-white",
    },
    {
      label: "Total Sales",
      value: formatRupiah(stats.total_sales),
      sub: "Akumulasi penjualan lunas",
      icon: Banknote,
      color: "bg-orange-600 text-white",
    },
  ];

  return (
    <AdminShell admin={admin}>
      <div className="space-y-6">
        {/* Top Welcome & Fast Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-orange-600">
              Live Garage Sale Operations
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
              Dashboard Operasional JASTIP WAR
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Pantau stok real-time, unggah temuan barang baru dalam &lt;30
              detik, dan konfirmasi pesanan pelanggan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-sm hover:bg-orange-500"
            >
              <PlusCircle className="h-4 w-4" />
              + Tambah Produk Baru
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-xs sm:text-sm font-bold text-zinc-800 hover:bg-zinc-100"
            >
              Kelola Orders ({stats.pending_orders} Pending)
            </Link>
          </div>
        </div>

        {/* 6 KPI Cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-500">
                    {card.label}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-lg sm:text-xl font-extrabold text-zinc-900 truncate">
                    {card.value}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    {card.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Garage Sale Sessions Bar */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <h2 className="text-base font-extrabold text-zinc-900">
                Active Garage Sale Sessions ({activeSessions.length})
              </h2>
            </div>
            <Link
              href="/admin/sessions"
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              Kelola Semua Sesi →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={session.image_url}
                    alt={session.name}
                    className="h-12 w-12 rounded-xl object-cover shrink-0 border border-zinc-200"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        LIVE
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 truncate">
                        {session.name}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {session.location} • {session.available_product_count}{" "}
                      tersedia dari {session.product_count} produk
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/products?sessionId=${session.id}`}
                  className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100"
                >
                  Produk
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Main 2-Column Operational Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Recent Orders */}
          <div className="lg:col-span-7 rounded-3xl border border-zinc-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-600" />
                <h2 className="text-base font-extrabold text-zinc-900">
                  Pesanan & Klaim Terbaru
                </h2>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
              >
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-sm font-extrabold text-zinc-900 hover:text-orange-600"
                      >
                        {order.order_reference}
                      </Link>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          order.order_status === "CONFIRMED" ||
                          order.order_status === "PAID" ||
                          order.order_status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.order_status === "CANCELLED" ||
                              order.order_status === "EXPIRED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 truncate">
                      {order.customer?.full_name} ({order.customer?.whatsapp_number})
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {order.items
                        ?.map(
                          (i) => `${i.quantity}x ${i.product_name_snapshot}`
                        )
                        .join(", ")}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className="font-mono text-sm font-extrabold text-zinc-900">
                      {formatRupiah(order.total_amount)}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-800 hover:bg-zinc-900 hover:text-white transition-colors"
                    >
                      Kelola Order →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="lg:col-span-5 rounded-3xl border border-zinc-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-extrabold text-zinc-900">
                  Low Stock & Sold Out Alert
                </h2>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Semua Produk →
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {lowStockProducts.map((product) => {
                const badge = getStockBadge(product);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="h-11 w-11 rounded-xl object-cover border border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-bold text-zinc-600">
                            {formatRupiah(product.jastip_price)}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                              badge.status === "SOLD_OUT"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {badge.shortLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 shrink-0"
                      title="Edit Stok / Harga"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom 2-Column Grid: Recently Added Products & Recent Admin Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-3xl border border-zinc-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-900">
                Produk Baru Ditambahkan
              </h2>
              <Link
                href="/admin/products/new"
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                + Tambah Lagi
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentlyAddedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.image_urls[0]}
                      alt={product.name}
                      className="h-11 w-11 rounded-xl object-cover border border-zinc-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {product.category?.name} • Stok:{" "}
                        <strong>{product.available_stock}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-extrabold text-zinc-900 block">
                      {formatRupiah(product.jastip_price)}
                    </span>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-[11px] font-bold text-orange-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-6 rounded-3xl border border-zinc-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <h2 className="text-base font-extrabold text-zinc-900">
                  Recent Admin & Inventory Activity
                </h2>
              </div>
              <Link
                href="/admin/activity"
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Log Lengkap →
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-800">
                      {act.action}
                    </span>
                    <p className="text-zinc-600">
                      {String(
                        act.details?.product_name ||
                          act.details?.order_reference ||
                          act.details?.name ||
                          act.entity_type
                      )}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-400 shrink-0">
                    {formatRelativeTime(act.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}


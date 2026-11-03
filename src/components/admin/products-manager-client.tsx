"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  Check,
  PlusCircle,
} from "lucide-react";
import { formatRupiah, getStockBadge } from "@/lib/utils";
import type {
  Category,
  GarageSaleSession,
  Product,
  ProductStatus,
} from "@/types/database";

export function AdminProductsManagerClient({
  initialProducts,
  categories,
  sessions,
}: {
  initialProducts: Product[];
  categories: Category[];
  sessions: GarageSaleSession[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = initialProducts.filter((p) => {
    if (sessionFilter !== "ALL" && p.session_id !== sessionFilter) return false;
    if (categoryFilter !== "ALL" && p.category_id !== categoryFilter)
      return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !(p.category?.name.toLowerCase().includes(q) ?? false)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleAdjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.available_stock + delta);
    if (nextStock === product.available_stock) return;

    setBusyId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available_stock: nextStock }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleSavePrice = async (product: Product) => {
    const nextPrice = Number(priceDraft);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) return;

    setBusyId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jastip_price: nextPrice }),
      });
      setEditingPriceId(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (
    product: Product,
    nextStatus: ProductStatus
  ) => {
    setBusyId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "SOLD_OUT" ? { available_stock: 0 } : {}),
        }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (productId: string) => {
    setBusyId(productId);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DUPLICATE" }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    setBusyId(productId);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      setDeleteConfirmId(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-800"
            >
              <option value="ALL">Semua Sesi</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-800"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="SOLD_OUT">SOLD_OUT</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Cards / Rows */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center space-y-3">
            <p className="text-sm font-bold text-zinc-700">
              Tidak ada produk yang sesuai filter.
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-extrabold uppercase text-white"
            >
              <PlusCircle className="h-4 w-4" /> Tambah Produk Baru
            </Link>
          </div>
        ) : (
          filtered.map((product) => {
            const badge = getStockBadge(product);
            const isBusy = busyId === product.id;

            return (
              <div
                key={product.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-2xs transition-opacity"
                style={{ opacity: isBusy ? 0.6 : 1 }}
              >
                {/* Left Product Info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover border border-zinc-200 shrink-0 bg-zinc-100"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          product.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : product.status === "SOLD_OUT"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {product.status}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        {product.category?.name}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs text-zinc-500 truncate">
                        {product.session?.name}
                      </span>
                    </div>

                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="block text-sm sm:text-base font-extrabold text-zinc-900 hover:text-orange-600 truncate"
                    >
                      {product.name}
                    </Link>

                    {/* Quick Price Edit */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {editingPriceId === product.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={priceDraft}
                            onChange={(e) => setPriceDraft(e.target.value)}
                            className="w-32 rounded-lg border border-zinc-300 px-2.5 py-1 font-mono text-xs font-bold text-zinc-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePrice(product)}
                            className="rounded-lg bg-emerald-600 p-1.5 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceId(null)}
                            className="rounded-lg bg-zinc-200 px-2 py-1 text-[11px] font-bold text-zinc-700"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceId(product.id);
                            setPriceDraft(String(product.jastip_price));
                          }}
                          className="inline-flex items-center gap-1.5 font-mono text-sm font-extrabold text-orange-600 hover:underline cursor-pointer"
                          title="Klik untuk ubah harga cepat"
                        >
                          {formatRupiah(product.jastip_price)}
                          <Edit3 className="h-3 w-3 text-zinc-400" />
                        </button>
                      )}

                      <span className="text-[11px] text-zinc-400 font-mono">
                        (Terjual: {product.sold_stock} | Reserved:{" "}
                        {product.reserved_stock})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Controls: Live Stock Stepper + Status + Actions */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-zinc-100 pt-3 lg:pt-0">
                  {/* Live Stock Stepper */}
                  <div className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5">
                    <button
                      type="button"
                      disabled={isBusy || product.available_stock <= 0}
                      onClick={() => handleAdjustStock(product, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
                      title="Kurangi Stok (-1)"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <div className="px-2 text-center min-w-[68px]">
                      <span className="block font-mono text-sm font-extrabold text-zinc-900">
                        {product.available_stock}
                      </span>
                      <span className="block text-[9px] font-bold uppercase text-zinc-500">
                        {badge.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAdjustStock(product, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
                      title="Tambah Stok (+1)"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Quick Status Selector */}
                  <select
                    value={product.status}
                    disabled={isBusy}
                    onChange={(e) =>
                      handleStatusChange(
                        product,
                        e.target.value as ProductStatus
                      )
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-xs font-bold text-zinc-800"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="SOLD_OUT">SOLD_OUT</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-100"
                      title="Edit Lengkap"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(product.id)}
                      className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                      title="Duplikat Produk"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-100"
                      title="Buka di Storefront"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    {deleteConfirmId === product.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white"
                        >
                          Hapus!
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-lg bg-zinc-200 px-2 py-1.5 text-[11px] font-bold text-zinc-700"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(product.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


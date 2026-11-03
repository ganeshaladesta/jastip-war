"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import type { Category, GarageSaleSession } from "@/types/database";

export function CatalogFilterBar({
  categories,
  sessions,
  totalFound,
}: {
  categories: Category[];
  sessions: GarageSaleSession[];
  totalFound: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "all";
  const currentSession = searchParams.get("session") || "all";
  const currentSort = searchParams.get("sort") || "latest";
  const currentStock = searchParams.get("stockFilter") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(initialSearch);

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParam = searchParams.get("search") || "";
      if (searchInput.trim() !== currentParam) {
        updateParams({ search: searchInput.trim() || null });
      }
    }, 320);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasActiveFilters =
    currentCategory !== "all" ||
    currentSession !== "all" ||
    currentStock !== "all" ||
    Boolean(initialSearch);

  return (
    <div className="space-y-4 rounded-3xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-2xs">
      {/* Row 1: Search + Session + Sort */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama produk, deskripsi, atau kategori..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-10 pr-9 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null });
              }}
              className="absolute right-2.5 top-2.5 rounded-lg p-1 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Session Selector */}
        <div className="md:col-span-4">
          <select
            value={currentSession}
            onChange={(e) => updateParams({ session: e.target.value })}
            aria-label="Filter Sesi Garage Sale"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 text-sm font-medium text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Sesi Garage Sale</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.status === "LIVE" ? "🟢 " : "🗓️ "}
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="md:col-span-3">
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            aria-label="Urutkan Produk"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 text-sm font-medium text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none"
          >
            <option value="latest">Urutkan: Terbaru</option>
            <option value="price_asc">Harga: Terendah ke Tertinggi</option>
            <option value="price_desc">Harga: Tertinggi ke Terendah</option>
            <option value="most_available">Stok: Paling Banyak</option>
            <option value="low_stock">Stok: Hampir Habis (Low Stock)</option>
          </select>
        </div>
      </div>

      {/* Row 2: Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => updateParams({ category: "all" })}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
            currentCategory === "all"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-900"
          }`}
        >
          Semua Kategori
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => updateParams({ category: cat.slug })}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              currentCategory === cat.slug
                ? "bg-orange-600 text-white font-bold"
                : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-900"
            }`}
          >
            {cat.name}
            {typeof cat.product_count === "number" && (
              <span className="ml-1 opacity-75">({cat.product_count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Row 3: Stock Filter & Status Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Status Stok:
          </span>
          {[
            { id: "all", label: "Semua" },
            { id: "available", label: "Masih Tersedia" },
            { id: "low_stock", label: "Low Stock / Last Item" },
            { id: "sold_out", label: "Sold Out" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => updateParams({ stockFilter: tab.id })}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                currentStock === tab.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            Menampilkan <strong className="text-zinc-900">{totalFound}</strong>{" "}
            produk {isPending && "(Memuat...)"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


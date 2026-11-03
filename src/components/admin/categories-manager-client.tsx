"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  AlertCircle,
} from "lucide-react";
import type { Category } from "@/types/database";

export function AdminCategoriesManagerClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Gagal menambahkan kategori.");
        return;
      }
      setNewName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (catId: string) => {
    if (!editName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Gagal mengubah kategori.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async (cat: Category, delta: number) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_order: Math.max(1, cat.display_order + delta),
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (catId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Gagal menghapus kategori.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
          Catalog Taxonomy
        </span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
          Manajemen Kategori Produk
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          Tambah kategori kustom baru, ubah urutan tampilan, atau hapus kategori
          yang belum digunakan.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Category Form */}
      <form
        onSubmit={handleCreate}
        className="flex flex-col sm:flex-row gap-3 rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xs"
      >
        <input
          type="text"
          required
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama kategori baru (contoh: Sneakers, Luxury Watches, Toys)..."
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-500 cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          Tambah Kategori
        </button>
      </form>

      {/* Categories List */}
      <div className="divide-y divide-zinc-100 rounded-3xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        {initialCategories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between gap-4 p-4 sm:px-6"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 font-mono text-xs font-bold text-zinc-600">
                #{cat.display_order}
              </span>

              {editingId === cat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1 text-sm font-bold text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(cat.id)}
                    className="rounded-lg bg-emerald-600 p-1.5 text-white"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-extrabold text-zinc-900">
                    {cat.name}
                  </p>
                  <p className="font-mono text-[11px] text-zinc-400">
                    slug: /{cat.slug} • {cat.product_count || 0} produk
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleReorder(cat, -1)}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                title="Naikkan Urutan"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReorder(cat, 1)}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                title="Turunkan Urutan"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(cat.id);
                  setEditName(cat.name);
                }}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                title="Ubah Nama"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={(cat.product_count || 0) > 0}
                onClick={() => handleDelete(cat.id)}
                className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 disabled:opacity-30 cursor-pointer"
                title={
                  (cat.product_count || 0) > 0
                    ? "Kategori sedang digunakan oleh produk"
                    : "Hapus Kategori"
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


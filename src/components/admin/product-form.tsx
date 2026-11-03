"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  FileText,
  Copy,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type {
  Category,
  GarageSaleSession,
  Product,
  ProductCondition,
  ProductStatus,
} from "@/types/database";

const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "NEW", label: "NEW (Baru / BNIB)" },
  { value: "LIKE_NEW", label: "LIKE NEW (95%+)" },
  { value: "GOOD", label: "GOOD (Layak Pakai)" },
  { value: "USED", label: "USED (Pre-loved)" },
];

export function AdminProductForm({
  mode,
  initialProduct,
  categories,
  sessions,
}: {
  mode: "create" | "edit";
  initialProduct?: Product;
  categories: Category[];
  sessions: GarageSaleSession[];
}) {
  const router = useRouter();
  const liveSession = sessions.find((s) => s.status === "LIVE") || sessions[0];

  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id || categories[0]?.id || ""
  );
  const [sessionId, setSessionId] = useState(
    initialProduct?.session_id || liveSession?.id || ""
  );
  const [condition, setCondition] = useState<ProductCondition>(
    initialProduct?.condition || "LIKE_NEW"
  );
  const [originalPrice, setOriginalPrice] = useState<string>(
    initialProduct?.original_price ? String(initialProduct.original_price) : ""
  );
  const [jastipPrice, setJastipPrice] = useState<string>(
    initialProduct?.jastip_price ? String(initialProduct.jastip_price) : "250000"
  );
  const [availableStock, setAvailableStock] = useState<number>(
    initialProduct?.available_stock ?? 1
  );
  const [initialStock, setInitialStock] = useState<number>(
    initialProduct?.initial_stock ?? 1
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialProduct?.image_urls?.length ? initialProduct.image_urls : []
  );
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState<boolean>(
    initialProduct?.is_featured ?? false
  );
  const [status, setStatus] = useState<ProductStatus>(
    initialProduct?.status || "PUBLISHED"
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Gagal mengunggah foto.");
        }
        setImageUrls((prev) => [...prev, data.url]);
      }
      setToast("Foto berhasil diunggah!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addImageUrlManual = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    setImageUrls((prev) => [...prev, trimmed]);
    setCustomImageUrl("");
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (targetStatus: ProductStatus) => {
    if (!name.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    const parsedPrice = Number(jastipPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Harga Jastip harus lebih dari Rp 0.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category_id: categoryId,
        session_id: sessionId,
        condition,
        original_price: originalPrice ? Number(originalPrice) : null,
        jastip_price: parsedPrice,
        available_stock: availableStock,
        initial_stock: Math.max(availableStock, initialStock),
        image_urls:
          imageUrls.length > 0
            ? imageUrls
            : [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
              ],
        status: targetStatus,
        is_featured: isFeatured,
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initialProduct?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan produk.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!initialProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${initialProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DUPLICATE" }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        router.push(`/admin/products/${data.product.id}/edit`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${initialProduct.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. MOBILE CAMERA & GALLERY UPLOAD */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900">
              1. Foto Produk (Kamera / Galeri)
            </h2>
            <p className="text-xs text-zinc-500">
              Ambil foto langsung dari lokasi garage sale atau pilih dari galeri
              HP.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
            <Sparkles className="h-3 w-3" /> Fast Entry &lt;30s
          </span>
        </div>

        {/* Big Mobile Touch Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 p-4 text-center cursor-pointer hover:bg-orange-50 transition-colors">
            <Camera className="h-6 w-6 text-orange-600" />
            <span className="text-xs font-extrabold text-orange-900">
              {uploading ? "Mengunggah..." : "Ambil Foto Kamera"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 text-center cursor-pointer hover:bg-zinc-100 transition-colors">
            <Upload className="h-6 w-6 text-zinc-700" />
            <span className="text-xs font-extrabold text-zinc-800">
              {uploading ? "Mengunggah..." : "Pilih dari Galeri"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Optional Image URL Input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={customImageUrl}
            onChange={(e) => setCustomImageUrl(e.target.value)}
            placeholder="Atau tempel URL gambar (https://...)"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            onClick={addImageUrlManual}
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100"
          >
            + URL
          </button>
        </div>

        {/* Image Preview Strip */}
        {imageUrls.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pt-2">
            {imageUrls.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
              >
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/75 p-1 text-white hover:bg-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    UTAMA
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. PRODUCT NAME, CATEGORY & SESSION */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
        <h2 className="text-base font-extrabold text-zinc-900">
          2. Detail Barang & Kategori Cepat
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Nama Barang *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Nike Air Force 1 '07 Size 42"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        {/* One-Tap Quick Category Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
            Pilih Kategori (Tap Cepat)
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  categoryId === cat.id
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Condition Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
            Kondisi Barang
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONDITIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCondition(item.value)}
                className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                  condition === item.value
                    ? "bg-orange-600 text-white"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Garage Sale Session */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Sesi Garage Sale *
          </label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.status}] {s.name} — {s.location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Deskripsi / Catatan Ukuran & Kondisi
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tulis ukuran, kelengkapan box/tag, atau detail minus jika ada..."
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. FIXED JASTIP PRICING & LIVE STOCK */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
        <h2 className="text-base font-extrabold text-zinc-900">
          3. Harga Jastip Tetap (IDR) & Jumlah Stok
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Harga Jastip Jual (Rp) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1000}
              step={1000}
              required
              value={jastipPrice}
              onChange={(e) => setJastipPrice(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 font-mono text-lg font-extrabold text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
            <p className="mt-1 text-xs font-bold text-orange-600">
              Preview: {formatRupiah(Number(jastipPrice) || 0)}
            </p>
            {/* Quick Price Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[150000, 250000, 350000, 500000, 750000, 1000000].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setJastipPrice(String(preset))}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                  >
                    {preset / 1000}k
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Harga Asli / Retail (Opsional - Coret)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Contoh: 1299000"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 font-mono text-lg font-semibold text-zinc-700 focus:border-zinc-900 focus:outline-none"
            />
            {originalPrice && Number(originalPrice) > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Harga coret: {formatRupiah(Number(originalPrice))}
              </p>
            )}
          </div>
        </div>

        {/* Stock Controls */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800">
                Stok Tersedia (Available)
              </label>
              <span className="text-xs text-zinc-500">
                Bisa langsung direbut customer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAvailableStock((s) => Math.max(0, s - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={availableStock}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setAvailableStock(val);
                  if (val > initialStock) setInitialStock(val);
                }}
                className="w-16 rounded-xl border border-zinc-300 bg-white py-2 text-center font-mono text-lg font-extrabold text-zinc-900"
              />
              <button
                type="button"
                onClick={() => {
                  setAvailableStock((s) => {
                    const next = s + 1;
                    if (next > initialStock) setInitialStock(next);
                    return next;
                  });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col justify-between gap-2">
            <label className="flex items-center justify-between text-xs font-bold text-zinc-800 cursor-pointer">
              <span>Tampilkan di Featured Homepage</span>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-orange-600 rounded"
              />
            </label>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600">Status Produk:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-900"
              >
                <option value="PUBLISHED">PUBLISHED (Tayang)</option>
                <option value="DRAFT">DRAFT (Simpan Dulu)</option>
                <option value="SOLD_OUT">SOLD OUT (Habis)</option>
                <option value="ARCHIVED">ARCHIVED (Arsip)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SUBMIT ACTIONS */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("PUBLISHED")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 px-5 text-sm font-extrabold uppercase tracking-wider text-white shadow-md hover:bg-orange-500 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="h-5 w-5" />
            {saving
              ? "Menyimpan..."
              : mode === "create"
              ? "Save & Publish Sekarang"
              : "Simpan & Tayangkan"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("DRAFT")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 py-4 px-5 text-sm font-bold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Simpan Sebagai Draft
          </button>
        </div>

        {mode === "edit" && initialProduct && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" /> Duplikat Produk
              </button>
              <button
                type="button"
                onClick={() => handleSave("SOLD_OUT")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                Tandai SOLD OUT
              </button>
            </div>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus Produk
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700">
                  Yakin hapus?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


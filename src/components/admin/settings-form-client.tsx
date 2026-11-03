"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Save } from "lucide-react";
import type { StoreSettings } from "@/types/database";

export function AdminSettingsFormClient({
  initialSettings,
}: {
  initialSettings: StoreSettings;
}) {
  const router = useRouter();
  const [form, setForm] = useState<StoreSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedToast(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSavedToast(true);
        router.refresh();
        setTimeout(() => setSavedToast(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xs"
    >
      {savedToast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Pengaturan toko berhasil diperbarui!
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Nama Toko (Store Name)
          </label>
          <input
            type="text"
            required
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-bold text-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Tagline Brand
          </label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
          Deskripsi Toko
        </label>
        <textarea
          rows={2}
          value={form.store_description}
          onChange={(e) =>
            setForm({ ...form, store_description: e.target.value })
          }
          className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Nomor WhatsApp Bisnis *
          </label>
          <input
            type="tel"
            required
            value={form.whatsapp_number}
            onChange={(e) =>
              setForm({ ...form, whatsapp_number: e.target.value })
            }
            placeholder="6281299887766"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 font-mono text-sm font-bold text-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Durasi Reservasi (Menit)
          </label>
          <input
            type="number"
            min={5}
            max={1440}
            value={form.reservation_duration_minutes}
            onChange={(e) =>
              setForm({
                ...form,
                reservation_duration_minutes: Number(e.target.value) || 30,
              })
            }
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 font-mono text-sm font-bold text-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Mata Uang Default
          </label>
          <input
            type="text"
            value={form.currency}
            disabled
            className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 font-mono text-sm font-bold text-zinc-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Email Kontak
          </label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) =>
              setForm({ ...form, contact_email: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
            Instagram
          </label>
          <input
            type="text"
            value={form.contact_instagram}
            onChange={(e) =>
              setForm({ ...form, contact_instagram: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
          Banner Pengumuman Publik (Public Announcement)
        </label>
        <input
          type="text"
          value={form.public_announcement}
          onChange={(e) =>
            setForm({ ...form, public_announcement: e.target.value })
          }
          className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
          Syarat & Ketentuan (Terms & Conditions)
        </label>
        <textarea
          rows={5}
          value={form.terms_and_conditions}
          onChange={(e) =>
            setForm({ ...form, terms_and_conditions: e.target.value })
          }
          className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-sm font-extrabold uppercase tracking-wider text-white hover:bg-orange-600 transition-colors cursor-pointer"
      >
        <Save className="h-4 w-4" />
        {saving ? "Menyimpan Pengaturan..." : "Simpan Pengaturan Aplikasi"}
      </button>
    </form>
  );
}


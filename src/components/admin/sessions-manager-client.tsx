"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  MapPin,
  Calendar,
  Play,
  CheckCircle2,
  Archive,
  Edit3,
  X,
} from "lucide-react";
import { formatDateTimeID } from "@/lib/utils";
import type { GarageSaleSession, SessionStatus } from "@/types/database";

export function AdminSessionsManagerClient({
  initialSessions,
}: {
  initialSessions: GarageSaleSession[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] =
    useState<GarageSaleSession | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<SessionStatus>("LIVE");
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingSession(null);
    setName("");
    setLocation("");
    setDescription("");
    setImageUrl(
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85"
    );
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    setStartDate(now.toISOString().slice(0, 16));
    setEndDate(threeDays.toISOString().slice(0, 16));
    setStatus("LIVE");
    setModalOpen(true);
  };

  const openEditModal = (s: GarageSaleSession) => {
    setEditingSession(s);
    setName(s.name);
    setLocation(s.location);
    setDescription(s.description);
    setImageUrl(s.image_url);
    setStartDate(new Date(s.start_date).toISOString().slice(0, 16));
    setEndDate(new Date(s.end_date).toISOString().slice(0, 16));
    setStatus(s.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        location,
        description,
        image_url: imageUrl,
        start_date: new Date(startDate || Date.now()).toISOString(),
        end_date: new Date(endDate || Date.now()).toISOString(),
        status,
      };

      const url = editingSession
        ? `/api/admin/sessions/${editingSession.id}`
        : "/api/admin/sessions";
      const method = editingSession ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusQuickUpdate = async (
    sessionId: string,
    nextStatus: SessionStatus
  ) => {
    await fetch(`/api/admin/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Garage Sale Event Manager
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Garage Sale Sessions ({initialSessions.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Kelola jadwal lokasi event. Setiap produk terikat pada sesi agar
            stok tidak tercampur antar acara.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-sm hover:bg-orange-500 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          + Buat Sesi Baru
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {initialSessions.map((session) => (
          <div
            key={session.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xs"
          >
            <div>
              <div className="relative aspect-16/9 w-full bg-zinc-100">
                <img
                  src={session.image_url}
                  alt={session.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white ${
                      session.status === "LIVE"
                        ? "bg-emerald-600"
                        : session.status === "UPCOMING"
                        ? "bg-amber-500"
                        : session.status === "COMPLETED"
                        ? "bg-blue-600"
                        : "bg-zinc-700"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{session.location}</span>
                </div>
                <h2 className="text-lg font-extrabold text-zinc-900">
                  {session.name}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
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
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50/70 p-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {session.status !== "LIVE" && (
                  <button
                    type="button"
                    onClick={() => handleStatusQuickUpdate(session.id, "LIVE")}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" /> Activate (LIVE)
                  </button>
                )}
                {session.status === "LIVE" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusQuickUpdate(session.id, "COMPLETED")
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </button>
                )}
                {session.status !== "ARCHIVED" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusQuickUpdate(session.id, "ARCHIVED")
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/products?sessionId=${session.id}`}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100"
                >
                  Produk ({session.product_count || 0})
                </Link>
                <button
                  type="button"
                  onClick={() => openEditModal(session)}
                  className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                  title="Edit Sesi"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-base font-extrabold text-zinc-900">
                {editingSession
                  ? "Edit Sesi Garage Sale"
                  : "Buat Sesi Garage Sale Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                  Nama Sesi *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Garage Sale Jakarta Weekend"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                  Lokasi Event *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Kemang Village, Jakarta Selatan"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                  Deskripsi Sesi
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Waktu Selesai
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    URL Banner Gambar
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Status Sesi
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SessionStatus)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-extrabold uppercase text-white hover:bg-orange-500 cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan Sesi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


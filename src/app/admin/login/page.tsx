"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Flame,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin/dashboard";

  const [email, setEmail] = useState("admin@jastipwar.id");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Email atau password salah.");
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@jastipwar.id");
    setPassword("JastipWarAdmin2026!");
    setError(null);
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-[#FAF9F6] px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Public Marketplace
        </Link>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <Flame className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">
                JASTIP WAR ADMIN
              </h1>
              <p className="text-xs text-zinc-500">
                Mobile-First Garage Sale Control Center
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Email Administrator
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jastipwar.id"
                  className="w-full rounded-xl border border-zinc-300 pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full rounded-xl border border-zinc-300 pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Memverifikasi Akses..." : "Masuk ke Dashboard Admin"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                Akses Cepat Admin
              </span>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-orange-600 cursor-pointer"
              >
                Isi Kredensial Admin
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Email: admin@jastipwar.id | Pass: JastipWarAdmin2026!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#FAF9F6]" />}>
      <AdminLoginForm />
    </Suspense>
  );
}


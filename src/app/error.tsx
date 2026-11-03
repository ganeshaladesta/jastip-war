"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("JASTIP WAR Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#FAF9F6] px-4 text-center">
      <div className="max-w-md space-y-4 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900">
          Terjadi Kendala Saat Memuat Halaman
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500">
          Jangan khawatir, data stok dan pesanan kamu tetap aman. Silakan muat
          ulang halaman.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-600 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}


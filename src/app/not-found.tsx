import Link from "next/link";
import { Flame, ArrowLeft, Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#FAF9F6] px-4 text-center">
      <div className="max-w-md space-y-5 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          <Flame className="h-7 w-7 text-orange-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">
          Halaman atau Produk Tidak Ditemukan
        </h1>
        <p className="text-sm text-zinc-500">
          Barang atau halaman yang kamu cari mungkin sudah diarsipkan atau
          alamat URL tidak sesuai.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Homepage
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-extrabold uppercase text-white hover:bg-orange-500"
          >
            <Compass className="h-3.5 w-3.5" /> Explore Katalog Live
          </Link>
        </div>
      </div>
    </div>
  );
}


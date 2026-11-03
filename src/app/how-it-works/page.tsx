import Link from "next/link";
import {
  Search,
  Zap,
  MessageCircle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Ban,
  ArrowRight,
} from "lucide-react";
import { getStoreSettings } from "@/lib/db/repository";
import { MarketplaceNavbar } from "@/components/marketplace/navbar";
import { MarketplaceFooter } from "@/components/marketplace/footer";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const settings = await getStoreSettings();

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F6]">
      <MarketplaceNavbar announcement={settings.public_announcement} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-orange-700">
            Find It. Claim It. Get It.
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            Cara Kerja JASTIP WAR
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Platform belanja jastip real-time untuk garage sale, pop-up sale, dan
            clearance event dengan harga tetap (Fixed Price) dan sistem penguncian
            stok otomatis.
          </p>
        </div>

        {/* 3 Core Steps */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
              <Search className="h-6 w-6 text-orange-400" />
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900">
              1. Explore Products
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Admin kami hadir langsung di lokasi garage sale dan mengunggah foto,
              kondisi barang, harga jastip tetap, serta jumlah stok secara
              real-time.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900">
              2. Claim Your Favorite Items
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Tanpa perlu registrasi akun! Klik tombol{" "}
              <strong>REBUT SEKARANG</strong>, isi nama dan nomor WhatsApp. Stok
              langsung dikunci secara atomik selama{" "}
              {settings.reservation_duration_minutes} menit.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900">
              3. Confirm via WhatsApp
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Kamu akan mendapatkan kode unik{" "}
              <strong>Order Reference (JW-XXXXXX)</strong>. Klik tombol
              konfirmasi WhatsApp untuk menyelesaikan pembayaran bersama Admin.
            </p>
          </div>
        </div>

        {/* Fixed-Price Rule Callout */}
        <section className="rounded-3xl border border-zinc-200 bg-zinc-900 p-6 sm:p-8 text-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                Aturan Utama JASTIP WAR
              </span>
              <h2 className="mt-1 text-2xl font-extrabold">
                100% Fixed-Price Jastip • First-Come, First-Served
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-500 shrink-0"
            >
              Mulai Rebut Barang <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-zinc-800/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Yang Berlaku di JASTIP WAR
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                <li>• Harga ditentukan transparan oleh Admin (sudah termasuk fee jastip).</li>
                <li>• Siapa cepat klaim, stok langsung dikunci untuknya.</li>
                <li>• Jika tidak dibayar dalam {settings.reservation_duration_minutes} menit, stok otomatis rilis kembali.</li>
                <li>• Status order dapat dipantau kapan saja dengan Order ID.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-zinc-800/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                <Ban className="h-4 w-4" /> Tidak Ada Sistem Lelang
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                <li>• TIDAK ADA bidding atau adu harga tertinggi.</li>
                <li>• TIDAK ADA tawar-menawar / negosiasi harga.</li>
                <li>• TIDAK ADA pemenang lelang (auction winner).</li>
                <li>• TIDAK ADA overselling karena transaksi dikunci di database.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Terms & Privacy */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2" id="terms">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
              Syarat & Ketentuan (Terms & Conditions)
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
              {settings.terms_and_conditions}
            </p>
          </div>

          <div
            className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-3"
            id="privacy"
          >
            <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
              <Clock className="h-5 w-5 text-emerald-600" />
              Kebijakan Privasi & Keamanan Data
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Kami hanya mengumpulkan Nama Lengkap dan Nomor WhatsApp untuk
              keperluan penguncian stok reservasi dan konfirmasi pengiriman
              pesanan JASTIP WAR. Data pelanggan tidak pernah ditampilkan secara
              publik dan dilindungi menggunakan Row Level Security (RLS).
            </p>
          </div>
        </div>
      </main>

      <MarketplaceFooter settings={settings} />
    </div>
  );
}


import { NextResponse } from "next/server";
import { z } from "zod";
import { reserveProductAtomic } from "@/lib/db/repository";

// Simple in-memory IP rate limiter for reservation requests
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 25;
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

const reservationSchema = z.object({
  productId: z.string().min(1, "Product ID wajib diisi."),
  quantity: z.number().int().min(1, "Minimal 1 item.").max(50, "Maksimal 50 item."),
  customerName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter.").max(100),
  whatsappNumber: z.string().trim().min(9, "Nomor WhatsApp tidak valid.").max(20),
  customerNotes: z.string().max(400).optional().default(""),
  idempotencyKey: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local-client";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMITED",
          message: "Terlalu banyak permintaan klaim. Silakan tunggu beberapa detik.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = reservationSchema.safeParse({
      ...body,
      quantity: Number(body?.quantity),
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: firstIssue?.message || "Data klaim tidak lengkap.",
        },
        { status: 400 }
      );
    }

    const result = await reserveProductAtomic(parsed.data);

    return NextResponse.json({
      ...result,
      headline: "Yeay! Barang berhasil kamu claim.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    if (message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json(
        {
          success: false,
          code: "OUT_OF_STOCK",
          message: "Yah, stok barang sudah habis atau berhasil direbut customer lain.",
        },
        { status: 409 }
      );
    }

    const cleanMessage = message.replace(/^[A-Z_]+:\s*/, "");
    return NextResponse.json(
      {
        success: false,
        code: "RESERVATION_FAILED",
        message: cleanMessage,
      },
      { status: 400 }
    );
  }
}


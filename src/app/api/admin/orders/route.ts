import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  expireOverdueReservations,
  getAllOrdersAdmin,
} from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const { searchParams } = new URL(request.url);
    const orders = await getAllOrdersAdmin({
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });
    return NextResponse.json({ success: true, orders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, message: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    if (body?.action === "EXPIRE_OVERDUE") {
      const expiredCount = await expireOverdueReservations();
      return NextResponse.json({ success: true, expiredCount });
    }
    return NextResponse.json(
      { success: false, message: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses pesanan.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


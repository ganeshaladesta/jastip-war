import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  createProductAdmin,
  getAllProductsAdmin,
  type ProductUpsertInput,
} from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const { searchParams } = new URL(request.url);
    const products = await getAllProductsAdmin({
      search: searchParams.get("search") || undefined,
      sessionId: searchParams.get("sessionId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      status: searchParams.get("status") || undefined,
    });
    return NextResponse.json({ success: true, products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, message: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAuth();
    const body = (await request.json()) as ProductUpsertInput;
    const product = await createProductAdmin(body, admin.id);
    return NextResponse.json({ success: true, product });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat produk.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


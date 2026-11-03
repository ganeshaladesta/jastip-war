import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createCategoryAdmin, getCategories } from "@/lib/db/repository";

export async function GET() {
  try {
    await requireAdminAuth();
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, message: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const category = await createCategoryAdmin(body, admin.id);
    return NextResponse.json({ success: true, category });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat kategori.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


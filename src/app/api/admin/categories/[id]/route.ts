import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { deleteCategoryAdmin, updateCategoryAdmin } from "@/lib/db/repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await context.params;
    const body = await request.json();
    const category = await updateCategoryAdmin(id, body, admin.id);
    return NextResponse.json({ success: true, category });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui kategori.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await context.params;
    await deleteCategoryAdmin(id, admin.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus kategori.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


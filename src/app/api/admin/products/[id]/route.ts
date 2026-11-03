import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  deleteProductAdmin,
  duplicateProductAdmin,
  getProductByIdAdmin,
  updateProductAdmin,
} from "@/lib/db/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await context.params;
    const product = await getProductByIdAdmin(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, product });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, message: msg }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await context.params;
    const body = await request.json();

    if (body?.action === "DUPLICATE") {
      const duplicated = await duplicateProductAdmin(id, admin.id);
      return NextResponse.json({ success: true, product: duplicated });
    }

    const updated = await updateProductAdmin(id, body, admin.id);
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui produk.";
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
    const result = await deleteProductAdmin(id, admin.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus produk.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


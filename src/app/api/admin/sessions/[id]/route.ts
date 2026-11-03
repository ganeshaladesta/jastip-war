import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { updateSessionAdmin } from "@/lib/db/repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await context.params;
    const body = await request.json();
    const session = await updateSessionAdmin(id, body, admin.id);
    return NextResponse.json({ success: true, session });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui sesi.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getStoreSettings,
  updateStoreSettingsAdmin,
} from "@/lib/db/repository";

export async function GET() {
  try {
    await requireAdminAuth();
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, message: msg }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const settings = await updateStoreSettingsAdmin(body, admin.id);
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui pengaturan.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


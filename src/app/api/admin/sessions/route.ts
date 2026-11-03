import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  createSessionAdmin,
  getSessions,
  type SessionUpsertInput,
} from "@/lib/db/repository";

export async function GET() {
  try {
    await requireAdminAuth();
    const sessions = await getSessions(true);
    return NextResponse.json({ success: true, sessions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, message: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAuth();
    const body = (await request.json()) as SessionUpsertInput;
    const session = await createSessionAdmin(body, admin.id);
    return NextResponse.json({ success: true, session });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat sesi.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


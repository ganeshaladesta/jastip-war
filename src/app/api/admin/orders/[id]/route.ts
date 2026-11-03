import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  type AdminOrderTransitionAction,
} from "@/lib/db/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await context.params;
    const order = await getOrderByIdAdmin(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, order });
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
    const action = body?.action as AdminOrderTransitionAction;

    if (
      ![
        "MARK_WAITING_PAYMENT",
        "MARK_PAID",
        "CONFIRM_ORDER",
        "COMPLETE_ORDER",
        "CANCEL_ORDER",
      ].includes(action)
    ) {
      return NextResponse.json(
        { success: false, message: "Status transisi pesanan tidak valid." },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatusAdmin(id, action, admin.id);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui pesanan.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg.replace(/^[A-Z_]+:\s*/, "") }, { status });
  }
}


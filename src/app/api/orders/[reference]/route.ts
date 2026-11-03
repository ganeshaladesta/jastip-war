import { NextResponse } from "next/server";
import { getOrderByReferencePublic } from "@/lib/db/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const result = await getOrderByReferencePublic(reference);

  if (!result.order) {
    return NextResponse.json(
      {
        success: false,
        message: "Nomor referensi pesanan tidak ditemukan.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    order: result.order,
    whatsappUrl: result.whatsappUrl,
  });
}


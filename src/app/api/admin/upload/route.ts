import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format gambar harus JPG, PNG, WebP, atau AVIF.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: "Ukuran foto maksimal 5 MB.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `product-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

    // 1. Upload to Supabase Storage if configured
    const supabase = getSupabaseServiceClient();
    if (supabase) {
      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!error) {
        const { data: pub } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        if (pub?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: pub.publicUrl,
            storage: "supabase",
          });
        }
      }
    }

    // 2. Fallback: write to /public/uploads/products for local server or return base64 data URI
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fullPath = path.join(uploadDir, fileName);
      fs.writeFileSync(fullPath, buffer);
      return NextResponse.json({
        success: true,
        url: `/uploads/products/${fileName}`,
        storage: "local",
      });
    } catch {
      const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        storage: "inline",
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengunggah foto.";
    const status = msg.startsWith("UNAUTHORIZED") ? 401 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}


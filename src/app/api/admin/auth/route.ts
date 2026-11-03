import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createSignedAdminToken,
  getAuthenticatedAdmin,
  getDefaultAdminCredentials,
} from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, admin });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    let authenticatedProfile: Profile | null = null;

    // 1. Try Supabase Auth if configured
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        authenticatedProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || "Admin JASTIP WAR",
          role: "ADMIN",
          created_at: data.user.created_at,
          updated_at: new Date().toISOString(),
        };
      }
    }

    // 2. Fallback / Local Admin verification
    if (!authenticatedProfile) {
      const defaultCreds = getDefaultAdminCredentials();
      if (
        email.toLowerCase() === defaultCreds.email.toLowerCase() &&
        password === defaultCreds.password
      ) {
        authenticatedProfile = {
          id: "00000000-0000-4000-8000-000000000001",
          email: defaultCreds.email,
          full_name: "Owner JASTIP WAR",
          role: "ADMIN",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }

    if (!authenticatedProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Email atau password salah. Pastikan akun memiliki akses Admin.",
        },
        { status: 401 }
      );
    }

    const token = createSignedAdminToken(authenticatedProfile);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      admin: authenticatedProfile,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses autentikasi." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ success: true });
}


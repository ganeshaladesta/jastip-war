import crypto from "crypto";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const ADMIN_COOKIE_NAME = "jw_admin_session";

const DEFAULT_ADMIN_ID = "00000000-0000-4000-8000-000000000001";

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "jastip-war-hmac-session-secret-2026-default"
  );
}

export function getDefaultAdminCredentials() {
  return {
    email: process.env.ADMIN_DEFAULT_EMAIL || "admin@jastipwar.id",
    password: process.env.ADMIN_DEFAULT_PASSWORD || "JastipWarAdmin2026!",
  };
}

export function createSignedAdminToken(profile: Profile): string {
  const payload = JSON.stringify({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const encoded = Buffer.from(payload, "utf-8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySignedAdminToken(token: string | undefined): Profile | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  if (sig !== expectedSig) return null;

  try {
    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    if (!decoded.exp || Date.now() > decoded.exp) {
      return null;
    }
    return {
      id: decoded.id || DEFAULT_ADMIN_ID,
      email: decoded.email,
      full_name: decoded.full_name || "Admin JASTIP WAR",
      role: decoded.role === "STAFF" ? "STAFF" : "ADMIN",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Verifies current admin session via Supabase Auth (if configured) or signed HTTP-only session cookie.
 */
export async function getAuthenticatedAdmin(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const signedToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const verifiedCookie = verifySignedAdminToken(signedToken);
  if (verifiedCookie) {
    return verifiedCookie;
  }

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && (profile.role === "ADMIN" || profile.role === "STAFF")) {
        return profile as Profile;
      }

      // If authenticated in Supabase and matches configured admin email
      const defaultCreds = getDefaultAdminCredentials();
      if (user.email?.toLowerCase() === defaultCreds.email.toLowerCase()) {
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "Admin JASTIP WAR",
          role: "ADMIN",
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  return null;
}

export async function requireAdminAuth(): Promise<Profile> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED: Admin authentication required.");
  }
  return admin;
}


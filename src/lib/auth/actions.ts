"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * OTP auth actions (M05/M06). Phone OTP via Supabase Auth — server-side only. The
 * login UI (Aman) calls requestOtp → verifyOtp. First successful verify auto-creates a
 * `public.users` row (default role driver_rep); the owner reassigns roles in M08.
 *
 * NOTE: real SMS needs an OTP provider enabled in the Supabase dashboard
 * (MISSING_INPUTS #12). Until then verify will fail to send — the flow is ready.
 */
export type AuthResult = { ok: true } | { ok: false; error: string };

export async function requestOtp(phone: string): Promise<AuthResult> {
  const p = phone?.trim();
  if (!p) return { ok: false, error: "Enter a phone number." };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: p });
    if (error) {
      console.error("requestOtp: error —", error.message);
      return { ok: false, error: "Could not send the OTP. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("requestOtp: unexpected error —", err);
    return { ok: false, error: "Unexpected error sending the OTP." };
  }
}

export async function verifyOtp(phone: string, token: string): Promise<AuthResult> {
  const p = phone?.trim();
  const t = token?.trim();
  if (!p || !t) return { ok: false, error: "Enter the OTP." };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ phone: p, token: t, type: "sms" });
    if (error || !data.user) {
      console.error("verifyOtp: error —", error?.message);
      return { ok: false, error: "Invalid or expired OTP." };
    }
    await ensureUserRow(data.user.id, p);
    return { ok: true };
  } catch (err) {
    console.error("verifyOtp: unexpected error —", err);
    return { ok: false, error: "Unexpected error verifying the OTP." };
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("signOut: unexpected error —", err);
  }
}

/** Create a public.users row on first login (idempotent). Default role driver_rep. */
async function ensureUserRow(id: string, phone: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("id").eq("id", id).maybeSingle();
    if (!data) {
      await admin.from("users").insert({ id, name: phone, phone, role: "driver_rep" });
    }
  } catch (err) {
    // Non-fatal: the session still works; profile can be created/edited later (M08).
    console.error("ensureUserRow: error (non-fatal) —", err);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { ROLES, type AppRole } from "@/lib/auth/rbac";

type Result = { ok: true } | { ok: false; error: string };

// NOTE: these run server-side via the service-role client (no user gate yet).
// TODO(auth): once AUTH_ENABLED, restrict to owner via requireRole("owner").
// Lane note: user mutations were slated for Hardik's auth lane — kept here (new
// src/lib/users/**) so the M08 screen works end-to-end now; safe for him to relocate
// into src/lib/auth and add requireRole. Audit is best-effort (never blocks — CLAUDE.md #4).

/** Change a staff member's role (owner / warehouse / driver_rep). */
export async function updateUserRole(id: string, role: AppRole): Promise<Result> {
  if (!id) return { ok: false, error: "Missing user id." };
  if (!ROLES.includes(role)) return { ok: false, error: "Invalid role." };
  try {
    const supabase = createAdminClient();
    const { data: before } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .single();
    const { error } = await supabase.from("users").update({ role }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAudit({
      action: "user.role_update",
      entityTable: "users",
      entityId: id,
      before: before ?? null,
      after: { role },
    });
    revalidatePath("/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

/** Activate / deactivate a staff member (soft — blocks login once auth is on). */
export async function setUserActive(id: string, active: boolean): Promise<Result> {
  if (!id) return { ok: false, error: "Missing user id." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("users")
      .update({ is_active: active })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAudit({
      action: active ? "user.activate" : "user.deactivate",
      entityTable: "users",
      entityId: id,
      after: { is_active: active },
    });
    revalidatePath("/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "./rbac";

/**
 * Session helper (M06/M07). `getSessionUser` resolves the signed-in user and joins
 * their `public.users` row for name + role. `requireRole` is the guard server actions
 * call before a mutation. The login UI (Aman) builds against this contract.
 */
export type SessionUser = {
  id: string;
  name: string;
  phone: string | null;
  role: AppRole;
  isActive: boolean;
};

/** The signed-in user (with role), or null if not authenticated / no profile. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("id,name,phone,role,is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      role: data.role as AppRole,
      isActive: data.is_active,
    };
  } catch (err) {
    console.error("getSessionUser: unexpected error —", err);
    return null;
  }
}

/** Throw if the user is missing or not in one of the allowed roles. */
export function requireRole(user: SessionUser | null, roles: AppRole[]): asserts user is SessionUser {
  if (!user || !user.isActive || !roles.includes(user.role)) {
    throw new Error("Not authorized.");
  }
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/auth/rbac";

/** A staff user row for the admin user-management screen (M08). */
export type AppUser = {
  id: string;
  name: string;
  phone: string | null;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
};

type Row = {
  id: string;
  name: string;
  phone: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
};

function map(r: Row): AppUser {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    role: r.role,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

/**
 * All staff users, newest first — for the owner-only `/users` screen. Reads via the
 * server admin client (CLAUDE.md: no browser Supabase). Returns [] on error so the
 * page still renders (accessor pattern used across the app).
 */
export async function getUsers(): Promise<AppUser[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id,name,phone,role,is_active,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getUsers: Supabase error —", error.message);
      return [];
    }
    return (data ?? []).map((r) => map(r as Row));
  } catch (err) {
    console.error("getUsers: unexpected error —", err);
    return [];
  }
}

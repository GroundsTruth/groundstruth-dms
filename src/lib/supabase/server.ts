import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * User-session Supabase client (SSR) — SERVER-ONLY. Carries the signed-in user's
 * session via cookies, so RLS enforces as that user (unlike the service-role admin
 * client). Use in Server Components / Server Actions / Route Handlers for anything
 * that should run *as the user*. The browser never talks to Supabase directly
 * (CLAUDE.md rule 1) — this runs on our server.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars (URL / ANON_KEY).");
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options }));
        } catch {
          // setAll called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}

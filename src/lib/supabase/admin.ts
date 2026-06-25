import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER-ONLY. Bypasses RLS, full DB access.
 * Never import this into a client component. Use for privileged / cross-scope
 * reads and writes that run on our server (Route Handlers, Server Actions,
 * Server Components). The browser never touches Supabase directly.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin env vars (URL / SERVICE_ROLE_KEY).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

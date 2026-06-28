import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { canAccess, type AppRole } from "@/lib/auth/rbac";

/**
 * Auth middleware (M07). Always refreshes the Supabase session cookie. Route
 * protection (redirect unauthenticated → /login, wrong-role → /dashboard) is GATED on
 * AUTH_ENABLED so this can merge while dormant — it only starts gating once Aman's
 * login screen + the SMS provider (MISSING_INPUTS #12) are live. Flip the flag then.
 */
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return res; // misconfigured — don't block

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet: { name: string; value: string; options?: CookieOptions }[]) {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        toSet.forEach(({ name, value, options }) => res.cookies.set({ name, value, ...options }));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!AUTH_ENABLED) return res; // dormant: refresh only, never redirect

  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  // Not signed in → login (except public paths).
  if (!user) {
    if (isPublic) return res;
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    return NextResponse.redirect(to);
  }

  // Signed in: resolve role + active flag, then gate.
  const { data: profile } = await supabase
    .from("users")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.is_active === false) {
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    return NextResponse.redirect(to);
  }

  if (isPublic) {
    const to = req.nextUrl.clone();
    to.pathname = "/dashboard";
    return NextResponse.redirect(to);
  }

  if (!canAccess(profile.role as AppRole, path)) {
    const to = req.nextUrl.clone();
    to.pathname = "/dashboard";
    return NextResponse.redirect(to);
  }

  return res;
}

export const config = {
  // Run on app routes; skip static assets + files with an extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)"],
};

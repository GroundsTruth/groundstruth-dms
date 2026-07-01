import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth/session";

/**
 * App shell layout. Resolves the signed-in user (server-side) so the shell can role-filter
 * the nav + show identity + wire sign-out. When auth is dormant (`NEXT_PUBLIC_AUTH_ENABLED`
 * unset) `getSessionUser` returns null and the shell shows everything — the app stays open
 * for pre-login-lockdown testing. Middleware is the real route gate once auth is on.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const shellUser = user ? { name: user.name, role: user.role } : null;
  return <AppShell user={shellUser}>{children}</AppShell>;
}

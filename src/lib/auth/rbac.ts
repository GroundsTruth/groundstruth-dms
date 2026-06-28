/**
 * RBAC route map (M07) — pure, unit-tested. Single source of truth for which role may
 * reach which route. Enforced in middleware (redirect) + server actions (requireRole).
 * Three fixed roles → a code map, not DB rows. Proposed matrix in docs/AUTH_PLAN.md
 * (Aman to confirm the screens in his lane). Unlisted routes are allowed for any
 * signed-in user (e.g. /kit, /), so new pages aren't accidentally locked out.
 */

export type AppRole = "owner" | "warehouse" | "driver_rep";

export const ROLES: AppRole[] = ["owner", "warehouse", "driver_rep"];

// Route prefix → roles allowed. Longest matching prefix wins.
const ROUTE_ACCESS: { prefix: string; roles: AppRole[] }[] = [
  { prefix: "/dashboard", roles: ["owner", "warehouse", "driver_rep"] },
  { prefix: "/catalog", roles: ["owner", "warehouse", "driver_rep"] },
  { prefix: "/inventory", roles: ["owner", "warehouse"] },
  { prefix: "/orders", roles: ["owner", "driver_rep"] },
  { prefix: "/vans", roles: ["owner", "warehouse", "driver_rep"] },
  { prefix: "/invoices", roles: ["owner", "warehouse", "driver_rep"] },
  { prefix: "/collections", roles: ["owner", "driver_rep"] },
  { prefix: "/retailers", roles: ["owner", "driver_rep"] },
  { prefix: "/users", roles: ["owner"] },
];

/** Can this role reach this path? Unlisted paths → allowed for any signed-in role. */
export function canAccess(role: AppRole, pathname: string): boolean {
  const matches = ROUTE_ACCESS.filter(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"),
  );
  if (matches.length === 0) return true; // not gated
  // longest prefix wins
  const rule = matches.reduce((a, b) => (b.prefix.length > a.prefix.length ? b : a));
  return rule.roles.includes(role);
}

/** Nav routes (the gated prefixes) this role may see — for role-aware nav (Aman). */
export function allowedRoutesFor(role: AppRole): string[] {
  return ROUTE_ACCESS.filter((r) => r.roles.includes(role)).map((r) => r.prefix);
}

# Auth & RBAC plan (M05–M09) — proposal for Aman to review

_Owned by Hardik (drafted 2026-06-28). Shared module — **review + adjust before the UI
half is built.** Backend half is being built on `feat/auth-backend`; the login UI half
is Aman's._

## Approach
- **Supabase Auth, phone OTP** (per the Delivery Tracker M05). Server-side only — the
  browser never calls `*.supabase.co` (CLAUDE.md rule 1). `@supabase/ssr` session client
  + Next middleware carry the session in cookies.
- **Roles:** `app_role` enum already exists on `public.users` — `owner | warehouse |
  driver_rep`. Identity = `auth.users.id` = `public.users.id` (set at first login).
- **RBAC = route-prefix map in code** (not DB rows) — 3 fixed roles. Enforced in two
  places: **middleware** (redirect) + **server actions** (`requireRole`).

## File-ownership split (so we don't collide)
| Area | File(s) | Owner |
|------|---------|-------|
| SSR session client | `src/lib/supabase/server.ts` | **Hardik** (shared-seam — Aman review) |
| Middleware (refresh + protect) | `middleware.ts` | **Hardik** (shared-seam — Aman review) |
| Session helper | `src/lib/auth/session.ts` (`getSessionUser`) | **Hardik** |
| RBAC map + guards | `src/lib/auth/rbac.ts`, `requireRole` | **Hardik** |
| OTP server actions | `src/lib/auth/actions.ts` (`requestOtp`/`verifyOtp`/`signOut`) | **Hardik** |
| **Login / OTP screens** | `src/app/login/**`, `src/components/auth/**` | **Aman** (UI lane) |
| Sidebar: hide nav items by role | `src/lib/nav.ts`, app-shell | **Aman** (UI lane) |
| User-management screen (M08) | `src/app/(app)/users/**` | Aman UI + Hardik actions |

## The contract Aman's UI builds against
```ts
// src/lib/auth/actions.ts
requestOtp(phone: string): Promise<{ ok: true } | { ok: false; error: string }>
verifyOtp(phone: string, token: string): Promise<{ ok: true } | { ok: false; error: string }>
signOut(): Promise<void>

// src/lib/auth/session.ts
type SessionUser = { id: string; name: string; phone: string | null; role: AppRole; isActive: boolean };
getSessionUser(): Promise<SessionUser | null>   // null = not signed in
```
Login screen: phone input → `requestOtp` → OTP input → `verifyOtp` → redirect to `/dashboard`.

## Proposed role → screen matrix (NEEDS AMAN — covers his screens too)
| Route | owner | warehouse | driver_rep |
|-------|:----:|:---------:|:----------:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/catalog` | ✅ | ✅ | view |
| `/inventory` | ✅ | ✅ | — |
| `/orders` | ✅ | — | ✅ |
| `/vans` | ✅ | ✅ | ✅ |
| `/invoices` | ✅ | view | view |
| `/collections` | ✅ | — | ✅ |
| `/retailers` | ✅ | — | ✅ |
| `/users` (M08) | ✅ | — | — |

_This is a starting point — Aman, adjust what warehouse/driver-rep see on **your** screens
(dashboard/catalog). The code map (`rbac.ts`) is the single source; changing it is a one-liner._

### ✅ Aman confirmed the matrix (2026-07-01)
The proposed matrix is **accepted as-is** for the MVP. Login UI + role-aware nav built against it
(`navItemsForRole` mirrors `canAccess`). **Two routes shipped after this plan are not yet in the
`rbac.ts` map**, so they're currently "unlisted → visible to any signed-in user":
- **`/capture`** — should be **owner + driver_rep** (the field-sales screen; warehouse doesn't sell).
- **`/schemes`** — should be **owner only** (admin config; Campa pushes offers).

Nav visibility degrades safely (both stay visible for now), but middleware won't *enforce* them until
they're in the map. → **Cross-lane ask to Hardik** (rbac.ts is his file): add those two prefixes. One-liner each.

## Enforcement
- **Middleware:** no session + not on `/login` → redirect `/login`. Signed in but role not
  allowed for the path → redirect `/dashboard` (or a 403 page).
- **Server actions:** `requireRole(user, [...])` at the top of each mutating action; the
  existing `TODO(auth)` stamps (`created_by`/actor) get the session user id.
- **RLS** stays server-only-writes as today; RBAC is enforced in the server layer (MVP).

## External blockers (MISSING_INPUTS)
- **#12 OTP channel** — Supabase phone OTP needs an SMS provider (Twilio/MSG91) enabled in
  the Supabase dashboard. Until then OTP won't actually send (code is ready; flag for go-live).
- **#11 staff list + roles** — to seed real `users` rows (driver PII, from Drive).

## Build order
1. (Hardik) server client + middleware + session + rbac + OTP actions ← `feat/auth-backend`.
2. (Aman) login screen + OTP form to the contract above; role-hide nav.
3. (Both) wire `requireRole` into actions; seed users; M09 acceptance — each role sees only its screens.

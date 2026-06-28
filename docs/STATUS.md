# Status — GroundsTruth DMS

_Last updated: 2026-06-25 (Aman + Claude) — Supabase live; SKU Catalog now persisted + read from the DB._
Sequencing source of truth is `dev/11_Delivery_Tracker.xlsx`; this is the live,
agent-readable mirror — update it at the end of every session.

**Legend:** ✅ done · 🟡 in progress · ⬜ todo · 🔒 blocked (on client answer)

## Pre-build (P)
- ✅ **P15** — Repo + branch strategy (`feat/* → dev → main`). Private repo
  `GroundsTruth/groundstruth-dms`, clean history, **zero client data committed**.
- 🟡 **P16** — Envs / DB / secrets:
  - ✅ Supabase project **`lmhhxjtvsbjgjdvcifso`** in **Mumbai (`ap-south-1`)** —
    Data API on, **auto-expose-new-tables OFF**, **auto-RLS on**. `.env.local`
    wired (git-ignored), connectivity verified.
  - ✅ Vercel connected (GroundsTruth account) — auto-deploy + PR previews.
  - ⬜ **Add the 3 Supabase vars to Vercel** (Settings → Environment Variables)
    so the *deployed* app reaches the DB (until then, deployed Catalog uses the
    seed fallback).
- ✅ **P17** — Scaffold app (Next 15 + Tailwind v3 + shadcn) — build green
- 🟡 **P18** — Design system / UI kit — base shipped; grows with each module
- 🔒 **P10/P11** — Invoice format CA sign-off + acceptance criteria — client
- 🔒 **Requirements** — the 3 open client questions (invoicing, retailers-vs-route,
  batch/expiry)

## MVP modules (M)

### Aman's lane
- 🟡 **UI Kit** (M04 / P18) — responsive `AppShell`, `StatusBadge`, `KpiCard`,
  `QtyStepper`, `PageHeader`, 14 shadcn primitives (+chart), showcase at `/kit`.
  ⬜ remaining: form patterns, empty / loading / no-network states.
- ✅ **SKU Catalog** (M10) — 46 canonical SKUs (cleaned from 52), **canonical name
  resolver** (`resolveSku`, 10 vitest tests green), responsive screen at `/catalog`.
  ✅ **DB persistence** — Supabase `skus` table (migration `0001`: RLS + grants +
  `updated_at` trigger), seeded with all 46; `/catalog` reads it live
  (`getSkus()` → DB, seed fallback).
  ⬜ remaining: add/edit UI; MRP/HSN/tax/cess/units-per-case (from client/CA).
- ✅ **Owner Dashboard** (M30–31) — `/dashboard`: KPI row + Sales-by-route chart +
  Top SKUs + reconciliation placeholder. Read-only, from seed.
  ⬜ remaining: live aggregates (after more tables) + real reconciliation (Hardik).

### Hardik's lane — transactional spine
- 🟡 **P13 / M01** — Phase-1 ER schema + core migrations on `feat/core-schema` (PR open
  → `dev`). 15 tables in 6 timestamped migrations (`20260628070450`–`455`): core/auth
  (`users`,`config`,`audit_log`), inventory (`stock_batches`,`stock_movements`),
  `retailers`, sales (`price_list`,`orders`,`order_lines`,`invoices`,`invoice_lines`),
  van (`van_loads`,`van_load_lines`,`reconciliations`), `collections`. Tables +
  constraints only; all on the `skus`/0001 RLS+grant pattern.
  ⬜ remaining: **apply in SQL Editor** (not yet run) + Aman PR review.
- ⬜ M02 audit · M03 config · M11–M15 inventory (FIFO, low-stock) ·
  M18–M23 order → invoice → **atomic** stock deduct · M24–M28 van load + challan +
  **reconciliation** · M29 collections.
- ⬜ M05–M09 Auth & RBAC (shared foundation — coordinate; Supabase Auth + server
  session client + middleware. `src/lib/supabase/admin.ts` already in place.)
- **Every new table:** RLS on + explicit `grant` to `service_role` (+ read role)
  in the migration — see `CLAUDE.md` rule 5. Apply via Supabase SQL Editor.

## Running now
`npm run dev` → `/` · `/dashboard` (KPIs + route chart) · `/catalog` (46 SKUs from
Supabase, search + filter) · `/kit`. Responsive on phone + laptop.
`npm test` → 10 passing (catalog resolver). `npm run build` → green
(`/catalog` is dynamic / server-rendered; the rest static).
`node scripts/check-supabase.mjs` → connectivity check ·
`npx --yes tsx scripts/seed-skus.ts` → re-seed SKUs (idempotent).

## Next up
1. **Add Supabase env vars to Vercel**, then open the PR → Vercel **preview** →
   review → merge to `dev`.
2. **Auth & RBAC** (shared foundation, coordinate with Hardik): Supabase Auth +
   server session client (`server.ts`) + session middleware + login via server routes.
3. Then: finish UI Kit states; first transactional tables (Hardik) follow the same
   migration + grant pattern.

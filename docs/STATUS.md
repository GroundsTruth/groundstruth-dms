# Status — GroundsTruth DMS

_Last updated: 2026-06-24 (Aman + Claude) — foundation, UI Kit, SKU Catalog, Owner Dashboard._
Sequencing source of truth is `dev/11_Delivery_Tracker.xlsx`; this is the live,
agent-readable mirror — update it at the end of every session.

**Legend:** ✅ done · 🟡 in progress · ⬜ todo · 🔒 blocked (on client answer)

## Pre-build (P)
- ✅ **P15** — Repo + branch strategy (`feat/* → dev → main`)
- 🟡 **P16** — Envs / DB / secrets (Supabase + Vercel) — _deferred on purpose_:
  built against seed data first. **Vercel connects at the first PR (now)**;
  Supabase (Mumbai) the cycle after.
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
  ⬜ remaining: DB persistence + add/edit (Supabase cycle); MRP/HSN/tax/cess fields.
- ✅ **Owner Dashboard** (M30–31) — `/dashboard`: KPI row + Sales-by-route bar
  chart (shadcn / recharts) + Top SKUs + reconciliation placeholder. Read-only,
  from seed. ⬜ remaining: wire to live aggregates (after Supabase) + the real
  reconciliation feed (Hardik's engine).

### Hardik's lane — transactional spine
- ⬜ M02 audit · M03 config · M11–M15 inventory (FIFO, low-stock) ·
  M18–M23 order → invoice → **atomic** stock deduct · M24–M28 van load + challan +
  **reconciliation** · M29 collections.
- ⬜ M05–M09 Auth & RBAC (coordinate — shared foundation).

## Running now
`npm run dev` → `/` · `/dashboard` (KPIs + route chart) · `/catalog` (46 SKUs,
search + filter) · `/kit` (component showcase). Responsive on phone + laptop.
`npm test` → 10 passing (catalog resolver). `npm run build` → green (7 routes).

## Next up
1. **Connect Vercel + open the PR** → Vercel **preview** → review → merge to `dev`.
2. Then: finish UI Kit states; wire **Supabase (Mumbai)** for real persistence + auth.

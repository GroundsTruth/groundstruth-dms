# Status — GroundsTruth DMS

_Last updated: 2026-07-01 (Aman + Claude) — full refresh after the spine + build-audit +
Round-2/3 work. The prior copy was stuck at 2026-06-25 (pre-spine); this mirror had drifted
~6 sessions. `docs/WORKLOG.md` is the running log (newest first); this is the point-in-time
snapshot + MVP checklist. Update both at session end._

**Legend:** ✅ done · 🟡 in progress · ⬜ todo · 🔒 blocked (on client answer)

## TL;DR — where we are
- **Transactional spine: COMPLETE + merged.** receive → order → confirm+invoice+FIFO-deduct
  (atomic) → collect → van load-out → returns → reconcile. All stock/cash moves atomic + audited.
- **Build-audit (24 gaps vs client's WhatsApp answers): ALL fixed** (GST now **inclusive**, exact;
  credit ledger; two price lists; below-list approval; dynamic low-stock; wastage/count).
- **Round-2/3 net-new (2026-07-01): built** — dual seller by brand, brand credit, delivery
  challan view, schemes/freebies engine, catalogue ingest (tax/HSN/MRP/units live), tiered recon.
- **Sales-Capture field MVP (#7): UI shipped** (`/capture`) on `feat/aman-mvp-e2e`.
- **Tests: 120 green** · typecheck 0 · `next build` clean (14 routes).
- **Not yet live-testable end-to-end** — two gates: (1) **migration backlog not applied** to the
  DB (Batch 1–4 + the two 2026-07-01 migrations); (2) **`.env.local` keys** needed in the run
  environment. Auth is dormant (fine for testing; a go-live gate for real driver use). Details ↓.

## E2E readiness (driver + retailer journeys)
| Gate | State | Owner |
|------|-------|-------|
| App builds / typechecks / unit tests | ✅ green (120 tests) | — |
| Capture UI (`/capture`) on latest dev | ✅ built + compiles | Aman |
| **DB migrations applied** (Batch 1–4 GST-inclusive/pricing/credit/adjust + `recon_tiers` + `schemes`) | 🔒 **pending** — code expects columns/fns not yet in DB → runtime errors until applied via SQL Editor | Hardik (SQL Editor) |
| **`.env.local` keys** in run env | 🔒 **absent** in this worktree — no Supabase reachability | Aman (vault) |
| Seed data (46 SKUs · base prices 37/46 · opening stock · demo flow) | 🟡 partial — SKUs live; verify prices/stock after migrations | Both |
| Auth login UI (drivers sign in) | ✅ built (`/login`, dormant until `AUTH_ENABLED` + SMS provider) | Aman |
| SMS/OTP provider + staff phone numbers | 🔒 client | Client |

## Pre-build (P)
- ✅ **P15** — Repo + branch strategy (`feat/* → dev → main`). Private repo, clean history, zero client data committed.
- 🟡 **P16** — Envs / DB / secrets: ✅ Supabase Mumbai live + connectivity verified · ✅ Vercel connected ·
  ⬜ **Add the 3 Supabase vars to Vercel** (deployed app still on seed fallback) · ⬜ **apply migration backlog**.
- ✅ **P17** — Scaffold (Next 15 + Tailwind v3 + shadcn) — build green.
- 🟡 **P18** — Design system / UI kit — base shipped; grows per module.
- ✅ **P10** — Invoice format: client sent a real tax invoice → reverse-engineered (`docs/INVOICE_SPEC.md`).
  Tax/HSN/seller **client-confirmed** (CA gate dropped). 🔒 **M25 challan** still needs a challan-format sample.
- 🟡 **P11** — Acceptance criteria per feature — still an open client ask (`docs/CLIENT_QUESTIONS_ROUND3.md`).

## MVP modules (M)

### Aman's lane
- 🟡 **UI Kit** (M04 / P18) — `AppShell`, `StatusBadge`, `KpiCard`, `QtyStepper`, `PageHeader`,
  `FormField`, empty/loading/error/offline states, shadcn primitives; showcase `/kit`. ⬜ remaining: minor form patterns.
- ✅ **SKU Catalog** (M10) — 46 canonical SKUs + `resolveSku` resolver (10 tests), Supabase-persisted,
  add/edit/deactivate UI. ✅ **Tax/commercial fields** (`hsn`/`taxSlabPct`/`cessPct`/`mrp`/`unitsPerCase`)
  wired end-to-end + **client Catalogue ingested live** (2026-07-01). ⬜ remaining: add ~14 new products;
  reclassify **Gluco Energy → Juice** (tax already 5% live, category enum still 'Energy'); identify "Mix"/"Power UP".
- ✅ **Sales-Capture UI** (#7 — client's 6/29 priority) — `/capture` mobile-first field flow on
  `captureSale` backend (route + price-list → shop pick/inline-onboard+GPS → items/qty/rate + live
  GST-inclusive totals + below-list flag → payment cash/UPI/credit → review → invoice). On `feat/aman-mvp-e2e`.
- ✅ **Owner Dashboard live tiles + role-scope (#24)** (M30–31) — `/dashboard` composes live accessors
  (invoices/collections → revenue/collected/pending, low-stock list, vans active, orders-to-approve) with a
  seed fallback (`source` flag); owner sees financials, warehouse/driver_rep get the operational view.
  ⬜ remaining: per-SKU sales aggregate (topSkus/unitsSold still illustrative).
- ✅ **Auth login UI** (M05 UI half) — `/login` phone→OTP→verify to Hardik's contract; app shell role-hides nav
  via `navItemsForRole`; real sign-out; matrix confirmed. ⬜ remaining: **M08 user-management screen**;
  go-live (SMS provider + `AUTH_ENABLED` flip). ⬜ Hardik: gate `/capture`+`/schemes` in rbac.ts + `requireRole`.
- ⬜ **Dual-branding logo** on invoice header + app shell (from client `PPT_1.pptx`).
- ✅ **Nav** — `/schemes` added (2026-07-01); all module links live.

### Hardik's lane — transactional spine (all DONE + merged unless noted)
- ✅ **M01** core schema (16 tables + RPCs, live) · ✅ **M02** audit · ✅ **M03** config.
- ✅ **M11–M15** inventory: atomic receive + FIFO deduct + stock view + **dynamic low-stock (days-of-cover)** +
  **wastage/adjust + count** + acceptance. `/inventory`.
- ✅ **M18–M23** sales: price-list resolver (**two lists: retail/wholesale**), order punch (`/orders`),
  atomic `next_invoice_no`, **`confirm_and_invoice` — invoice + FIFO deduct in ONE txn, GST-INCLUSIVE + exact** +
  **below-list → pending_approval** + **HSN on invoice** + CGST/SGST split. `/invoices/[id]`.
- ✅ **M24–M28** van: atomic `load_van`, `record_returns`, `reconcileVanLoad` (+ **tiered tolerances**). `/vans`, `/vans/[id]`.
- ✅ **M29** collections + Payments panel. ✅ **M16/M17** retailers: CRUD + onboarding + **cash/credit type +
  credit ledger + owner + GPS + role-gated approval**.
- ✅ **Net-new (Round-2/3):** **dual seller by brand** (Falcon=Sure / Jaypee=Cola) · **brand credit guard** ·
  **delivery challan view** · **schemes/freebies engine** (`/schemes`, buy-X-get-Y auto ₹0 lines) ·
  **catalogue ingest** (tax/HSN/MRP/units).
- ✅ **Auth backend (M05–M07):** SSR session client + `middleware.ts` (dormant via `NEXT_PUBLIC_AUTH_ENABLED`) +
  `getSessionUser`/`requireRole` + `rbac.ts` + OTP actions.
- 🔒 **M25 challan PDF** — needs a client challan-format sample (challan *view* built).

### Shared / joint
- ⬜ **M08/M09** user-management screen + role-gated acceptance (Aman UI + Hardik `updateUserRole` action).
- ⬜ **Go-live for auth:** SMS OTP provider (client) + staff list (client) + flip `NEXT_PUBLIC_AUTH_ENABLED`.

## Migration backlog — APPLY before live E2E (see `docs/MIGRATIONS.md`)
Marked `_pending_` in the ledger (Supabase SQL Editor, in order):
1. `20260630134832_invoice_inclusive_tax_hsn.sql` — GST-inclusive money path + `invoice_lines.hsn` + Soda→18%.
2. `20260630140020_pricing_approval.sql` — `order_lines.list_price/discount_pct` · `order_status +pending_approval` · `price_list.list_type` · `retailers.customer_category`.
3. `20260630141226_retailer_credit_onboarding.sql` — `retailers.customer_type/credit_limit/owner_name/shop_photo_path`.
4. `20260630142741_adjust_stock_fn.sql` — `adjust_stock()` (wastage/count).
5. `20260701124019_recon_tiers.sql` — tiered reconciliation tolerances. *(not yet in the ledger)*
6. `20260701130612_schemes.sql` — schemes table. *(not yet in the ledger)*

> `supabase/_apply_30thJune.sql` consolidates items 1–4 (paste once). Items 5–6 apply separately.
> **Until applied, `/capture`, approval, credit, adjust, and `/schemes` will error at runtime.**

## Running now (needs `.env.local` + migrations for live data)
`npm run dev` → `/dashboard /capture /catalog /inventory /orders /vans /invoices /retailers /schemes /kit`.
`npm test` → **120 passing** · `npm run build` → green (14 routes) · `node scripts/check-supabase.mjs` → connectivity.
`npm run seed:demo` fills a demo flow · `npx tsx scripts/seed-opening-stock.ts` loads June-1 stock.

## Next up
1. **Apply the migration backlog** (Hardik / SQL Editor) + **put `.env.local` keys** in the run env → unblock live E2E.
2. **Walk the driver + retailer journeys** step-by-step (`docs/WORKLOG.md` test plan) against a seeded DB.
3. **Auth login UI** (so drivers actually sign in) → **dashboard live tiles + role-scope**.

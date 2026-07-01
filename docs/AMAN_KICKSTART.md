# Aman — kickstart for your Claude Code agent

**You're picking up the build now. Hardik's lane (the whole transactional spine + auth
backend) is built, merged to `dev`, and live on Supabase. Your lane is the UI half +
the Owner Dashboard + finishing shared Auth. This doc tells you exactly what's done,
what's assumed, what's missing, and what to build — start here.**

## Read order
1. This file → 2. `CLAUDE.md` → 3. `AGENTS.md` → 4. `docs/COORDINATION.md` (lane ownership)
→ 5. `docs/WORKLOG.md` (latest state + the "📌 cross-lane asks" block — your TODOs are there)
→ 6. `docs/AUTH_PLAN.md` (the auth contract + role matrix you must confirm)
→ 7. `docs/MISSING_INPUTS.md` (every assumption + open client question)
→ 8. `docs/MODULE_OWNERSHIP.md` (who built what, status).

## Stack (built, don't swap)
Next 15 (App Router, `src/`) · React 19 · TS · Tailwind v3 · shadcn/ui · Supabase
(`@supabase/ssr`) · Vercel · npm · vitest. **Server-only Supabase** — browser never hits
`*.supabase.co` (Indian ISPs block it). Mumbai region. Auto-expose OFF, auto-RLS on.

## See it running in 60 seconds
```bash
npm install
node scripts/check-supabase.mjs       # expect CONNECTION OK
npm run dev                           # then visit the pages below
npm run seed:demo                     # fills a demo flow (order→invoice→van) if empty
npx --yes tsx scripts/seed-opening-stock.ts   # real June-1 warehouse stock
```
Live screens (all reachable from the sidebar): `/dashboard /catalog /inventory /orders
/vans /invoices /retailers /kit`.

---

## What Hardik built — DONE + merged + live (don't rebuild)
The **anti-leakage transactional spine**, all atomic (Postgres RPCs) + audited:
- **Schema (M01):** 16 tables + 6 RPCs, live on Supabase. `docs/SCHEMA.md`.
- **Platform (M02/M03):** `logAudit` (every mutation), config layer (`getConfig`/`getAllConfig`).
- **Inventory (M11–M15):** atomic `receive_stock` + FIFO `deduct_stock` + stock view + low-stock + acceptance. `/inventory`.
- **Sales (M18–M23):** price-list resolver, order punch (`/orders`), atomic `next_invoice_no`, **`confirm_and_invoice` (invoice + FIFO deduct in ONE txn)**, GST tax engine, `/invoices/[id]` GST invoice. Acceptance tests pass.
- **Van (M24–M28):** atomic `load_van` (FIFO van_out), `record_returns`, `reconcileVanLoad` (out−sold−returned + cash variance → flag). `/vans`, `/vans/[id]`.
- **Collection (M29):** `recordCollection` + Payments panel on the invoice.
- **Retailers (M16/M17):** CRUD + onboarding + approval. `/retailers`.
- **Auth BACKEND (M05–M07):** SSR session client (`src/lib/supabase/server.ts`), `middleware.ts`
  (session refresh + route/role gate — **dormant until `NEXT_PUBLIC_AUTH_ENABLED=true`**),
  `getSessionUser`/`requireRole` (`src/lib/auth/session.ts`), OTP actions
  (`requestOtp`/`verifyOtp`/`signOut` in `src/lib/auth/actions.ts`), RBAC map (`src/lib/auth/rbac.ts`).

Lane rule: **don't edit Hardik's folders** (`src/lib/{inventory,sales,van,collections,retailers,auth,config}/**`,
`src/app/(app)/{inventory,orders,vans,invoices,retailers}/**`, `supabase/migrations/**`,
`middleware.ts`). Touch them only by a PR Hardik reviews.

---

## YOUR lane — build these (priority order)

> ⭐ **Updated 2026-07-01 after the client's Round-2/3 answers.** Hardik built a lot more since
> the first kickstart: **dual seller by brand, brand credit, delivery challan, schemes engine,
> catalogue ingest (tax/HSN/MRP/units live)**. Your NEW items are #0 below; the rest still stand.

### 0. NEW from client Round-2/3 (2026-07-01) 🔴
- **Sales-Capture UI (#7 — the client's stated priority).** One screen: driver/van → shop
  (pick or **inline-onboard**) → SKU/qty/**rate/discount** → **payment mode** → preview → invoice.
  **Backend is ready** — call `captureSale()` in `src/lib/sales/capture.ts` (it already runs the
  order → below-list approval → invoice → payment, plus the **brand-credit guard** and **auto-freebies**).
  You build the screen + preview.
- **Dual-branding logo.** Add the distributor logo (from the client's `PPT_1.pptx`) to the invoice
  header (`src/components/invoices/invoice-view.tsx`) + the app shell. The invoice already prints the
  right **entity name/GSTIN** (Falcon vs Jaypee) per product — just add the logo image.
- **Nav:** add **`/schemes`** to `src/lib/nav.ts` (admin buy-X-get-Y screen shipped by Hardik).
- **Catalog:** add the **~14 new products** from the updated Catalogue (extra cans/variants) as SKUs +
  `seed-data.ts`; and **reclassify Gluco Energy → Juice** (its tax is already 5% live, but the category
  enum still says 'Energy'). Client-confirmed. See `docs/CLIENT_QUESTIONS_ROUND3.md`.

### 1. Auth UI (unblocks M05–M09 — highest leverage) 🔴
Hardik's backend is waiting on your screen. Build to the contract in `docs/AUTH_PLAN.md`:
- **`src/app/login/**`** — phone input → `requestOtp(phone)` → OTP input → `verifyOtp(phone, token)` → redirect `/dashboard`.
- **Confirm the role→screen matrix** in `docs/AUTH_PLAN.md` (it covers YOUR dashboard/catalog — adjust what warehouse/driver-rep see). The map is `src/lib/auth/rbac.ts` (Hardik's file — propose changes by PR, or tell Hardik).
- **Role-hide the nav:** use `allowedRoutesFor(role)` (from `rbac.ts`) to filter `NAV_ITEMS` in the app shell.
- **M08 user-management screen** (`src/app/(app)/users/**`): list `users`, assign roles. Hardik adds the `updateUserRole` action — coordinate.
- **Go-live:** once the screen works + the SMS OTP provider is enabled in Supabase (MISSING_INPUTS #12) + staff seeded (#11) → set `NEXT_PUBLIC_AUTH_ENABLED=true`. Then M09 acceptance: each role sees only its screens.

Contract you call:
```ts
requestOtp(phone): Promise<{ok:true}|{ok:false;error}>
verifyOtp(phone, token): Promise<{ok:true}|{ok:false;error}>
signOut(): Promise<void>
getSessionUser(): Promise<{id,name,phone,role,isActive}|null>   // server-side
allowedRoutesFor(role): string[]                                // for nav filtering
```

### 2. Owner Dashboard live tiles (M30/M31) 🟠
Your `/dashboard` is read-only from seed today. Wire it to Hardik's accessors (all server-side, seed-safe):
- `getLowStockSkus()` — `src/lib/inventory/data.ts` → low-stock tile.
- `getStockBySku()` — on-hand totals.
- `getRecentOrders()` / `getRecentInvoices()` / `getVanLoads()` — daily sales, invoices, van activity.
- reconciliation flags via `getReconciliation(vanLoadId)`.
- collections via `getCollections(invoiceId)`.
Don't add new DB tables — the data's there.

### 3. UI Kit remainder (M04, P18) 🟡
Finish whatever's pending in your kit (you own `src/components/{ui,kit,layout}/**`, `/kit`,
`globals.css` tokens). Hardik's pages already reuse `PageHeader`, `KpiCard`, `StatusBadge`,
`FormField`, `EmptyState`, etc. — keep them stable (their props are a contract now).

### 4. Catalog tax/MRP columns (M10 remainder) 🟡
**MRP/HSN/GST/units-per-case are now ingested live** (from the client Catalogue, 2026-07-01). Just
make sure `/catalog` surfaces them (columns on `skus`). Add the 14 new products (see #0).

### 5. Dashboard role-scope (#24) 🟡
Reps must see only their own route + no whole-business revenue. `rbac.ts` grants `/dashboard` to
`driver_rep`; scope the dashboard's data by the session user's role/route before wiring live aggregates.

---

## Assumptions we took (so you know what's provisional)
1. **GST = 40% aerated / 5% water-juice** (cess 0), from the proposal deck — **PROVISIONAL, pending CA**. 'Other' category = 18%. Invoices are immutable snapshots, so changing rates only affects new invoices.
2. **Seller GSTIN / name / address = placeholders** (`config.seller`) — invoice shows "[GSTIN pending]". A `tax_provisional` banner is on every invoice.
3. **3 roles** in the enum (`owner` / `warehouse` / `driver_rep`). The proposal lists **5** (adds Sales-Rep vs Driver split, + optional Retailer portal) — refine in M07/M08 if the client wants the finer split.
4. **Route-centric, no retailer master** — the system works route-only; `retailers` table is built + empty, fills when the client sends the shop list.
5. **Sales model = WhatsApp-driven van pre-sell** (assumed; confirm replace-vs-feed).
6. **Invoice/challan = standard GST Rule-46 layout** (no client sample yet) — M25 challan PDF is **blocked** on the format.
7. **Auth is dormant** (`NEXT_PUBLIC_AUTH_ENABLED` unset) so the app isn't locked before your login screen exists.
8. **Config defaults** (provisional): low-stock 10 cases, discount ceiling 5%, recon tolerance, invoice series `INV#####`.
9. **Opening stock loaded** from the June workbook (26/28 SKUs via the name resolver). 2 unmatched need an alias: "Energy Berry Kick 150 PET", "Raskik Gluco Energy 250ml".

## Missing client values (don't guess — flagged in `docs/MISSING_INPUTS.md`)
Ask the client for: **invoice/challan format sample · GST%+cess+HSN per SKU + GSTIN (CA sign-off) ·
MRP per SKU (likely in the Beverages Catalogue PDF — needs OCR) · the 9 unpriced SKUs ·
retailer master list · SMS/OTP gateway · per-feature acceptance criteria · config numbers ·
confirm WhatsApp replace-vs-feed**. Each has a working default in place — none blocks your build,
only go-live of invoicing + the auth lockdown.

## Conventions (non-negotiable — see CLAUDE.md/AGENTS.md)
- All Supabase access server-side. No nested joins (separate queries + JS merge). Check `.error` everywhere.
- Branch `feat/<module>` off `dev` → PR into `dev` → Vercel preview → merge. Never commit to `dev`/`main`.
- Claim your module in `docs/WORKLOG.md` "In flight" before you start; add a log entry + update cross-lane asks at session end.
- Don't edit Hardik's lane folders; raise a cross-lane ask in WORKLOG instead.

## First move
1. Read the order above. `npm run dev` + `npm run seed:demo` to see the working app.
2. Claim **Auth UI** in WORKLOG "In flight".
3. Build `/login` to the `requestOtp`/`verifyOtp` contract, confirm the role matrix in `AUTH_PLAN.md`, role-hide the nav. That unblocks M05–M09.
4. Then wire the Owner Dashboard tiles to Hardik's accessors (M30/M31).

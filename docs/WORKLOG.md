# Work Log — GroundsTruth DMS

One running log so **both agents always know the latest state + what to pick up next**,
without passing kickstart prompts back and forth.

- **Session start:** read the top log entry + the "In flight" table + `docs/STATUS.md`, then `git switch <your branch>`.
- **Session end:** add a dated entry at the TOP (newest first) and update "In flight".
- **One source of truth:** the build-reference material (tracker, wireframes, briefs,
  proposals, requirements, seed) lives in this private repo under `dev/`, `wireframes/`,
  `client/`, `artefacts/`. The **signed MSA/NDA, client financials, and driver PII are
  NOT in git** — get those from Aman's private Drive. ⚠️ Repo stays **private**.

## 🚧 In flight — claim before you start (this is how we avoid collisions)
| Who | Branch | Module / task | Lane folders | Since |
|-----|--------|---------------|--------------|-------|
| Aman | `feat/catalog-tax-invoice-spec` | Catalog tax/commercial fields + GST research + INVOICE_SPEC (M10) — from the client sample invoice | `src/lib/catalog/` · `src/components/catalog/` · `scripts/seed-skus.ts` · `docs/INVOICE_SPEC.md` · `/catalog` | 2026-06-30 |
| Hardik | — | **Lane complete & merged** (spine M01–M29 + retailers M16/M17 + auth-backend M05–M07). Paused. Remaining = Aman UI / client data — see `docs/MISSING_INPUTS.md` §B. | transactional spine · retailers · auth backend | — |

> **Aman — starting fresh? Read `docs/AMAN_KICKSTART.md` first.** It has everything Hardik
> built (done + merged), your lane (Auth UI → Dashboard tiles → UI kit), the assumptions we
> took, the contracts you build against, and the open client questions.

## 📌 Pending cross-lane asks — read before you start a session (clear the line when done)
| For | Ask | Raised by | Status |
|-----|-----|-----------|--------|
| **Aman** | Add **`/inventory`** to the sidebar nav (`src/lib/nav.ts` — your lane). Hardik shipped the page on `feat/inventory-receive` but didn't touch your file. Label "Inventory", after Catalog. | Hardik · 2026-06-28 | ⬜ open |
| **Aman** | Wire **low-stock tile** on Owner Dashboard (M30). Accessor ready: `getLowStockSkus()` in `src/lib/inventory/data.ts` (returns `SkuStock[]` at/below threshold). Just render the count/list — Hardik won't touch `src/app/(app)/dashboard/**`. | Hardik · 2026-06-28 | ⬜ open |
| **Aman** | Add **`/orders`** to the sidebar nav (`src/lib/nav.ts` — your lane). Page shipped on `feat/sales-orders`. Label "Orders", after Inventory. | Hardik · 2026-06-28 | ⬜ open |
| **Aman** | Add **`/vans`** to the sidebar nav (`src/lib/nav.ts` — your lane). Page shipped on `feat/van-load`. Label "Van loads", after Orders. | Hardik · 2026-06-28 | ⬜ open |
| **Aman** | ~~Nav missing `/orders` + `/retailers`; `/collections` dead link~~ → **DONE by Hardik with owner's OK** (`feat/seed-and-nav`): added Orders + Retailers, removed dead Collections link (collections live on the invoice Payments panel). Heads-up: I touched `src/lib/nav.ts` (your file) — revert/adjust freely. | Hardik · 2026-06-28 | ✅ done |
| **Aman** | **Retailer lane (M16/M17) was "Both" — Hardik built it** (merged). Reusable for per-retailer pricing + named-shop invoices later. | Hardik · 2026-06-28 | ✅ done (FYI) |
| **Aman** | **AUTH/RBAC — review `docs/AUTH_PLAN.md`.** Hardik built the backend (`feat/auth-backend`): `getSessionUser`, `requireRole`, OTP actions (`requestOtp`/`verifyOtp`/`signOut`), middleware. **You build:** `/login` + OTP screen to that contract, and role-hide nav (`allowedRoutesFor(role)`). **Confirm the role→screen matrix** (covers your dashboard/catalog). | Hardik · 2026-06-28 | ⬜ open |
| **Both** | **Go-live for auth:** flip `NEXT_PUBLIC_AUTH_ENABLED=true` (middleware is dormant till then) once login UI + SMS OTP provider (MISSING_INPUTS #12) are live + users seeded (#11). | Hardik · 2026-06-28 | ⬜ open |
| **Hardik** | **Tax reconcile (provisional):** my GST research refines your category-level live rates — plain **Soda = 18%** (you set 40%), **Jeera RTD = 40%** (you left 'Other'=18%), and I added per-SKU **HSN codes** (your migration set rates only). Table + sources: `docs/INVOICE_SPEC.md` §3a. Agree, then apply to live (re-seed or a migration). | Aman · 2026-06-30 | ⬜ open |
| **Hardik** | **Seller = Falcon Enterprises**, GSTIN `06AIMPB2225L2ZE` (confirmed by Aman, from the sample invoice). Please set `config.seller` to replace the "[GSTIN pending]" placeholder. | Aman · 2026-06-30 | ⬜ open |
| **Hardik** | **Invoice format unblocked** — client sent a real tax invoice → reverse-engineered in `docs/INVOICE_SPEC.md` (layout, GST-inclusive math, CGST/SGST-vs-IGST, numbering). Use for M21 invoice + M25 challan (was format-blocked). | Aman · 2026-06-30 | ⬜ open |
| **Both** | **Re-seed HELD:** `scripts/seed-skus.ts` now carries per-SKU tax + is two-pass (non-destructive) but is **not run** — it would overwrite Hardik's live category rates. Run only after the tax reconcile above is agreed. | Aman · 2026-06-30 | ⬜ open |
| **Hardik** | 🔴 **BUILD AUDIT (2026-06-30) → `docs/BUILD_AUDIT_2026-06-30.md`** — 24 confirmed gaps vs the client's WhatsApp answers/Catalogue (file:line + fixes). Spine items before real billing: **GST math is EXCLUSIVE, must be INCLUSIVE** in BOTH `invoice-tax.ts` AND the `confirm_and_invoice` RPC (the tests assert the wrong math) (#1,#2); below-list **admin-approval** (#5); **credit ledger** (#6); two **price lists** + remove dead `discount_ceiling` (#9,#10); retailer **cash/credit + photo + GPS-capture + owner-name + role-gated approval** (#11,#12,#13,#22,#23); **dynamic low-stock + wastage/adjustment + count screen** (#14,#15,#16); **seller-by-brand + HSN on invoice** (#8,#17); **Soda→18% corrective migration + NULL-guard** (#3,#19). **Plus net-new scope S1–S5** (admin panel · schemes/freebies engine · B2B+walk-in wholesale channel · edit-lock at challan dispatch · rep daily targets). | Aman · 2026-06-30 | ⬜ open |
| **Both** | 🟠 **Phase-1 "Sales Capture" flow (client's 6/29 priority)** — one driver→shop(+inline onboard)→SKU/qty/**rate/discount**→**payment mode**→preview→invoice journey. Needs Hardik: line-level rate/discount + payment + inline-onboard in schema/actions (#4,#7); Aman: the capture UI. | Aman · 2026-06-30 | ⬜ open |

**Rules that keep us conflict-free:**
- Edit only the folders your lane owns (`COORDINATION.md`). No overlap → no conflicts.
- Shared seams (`supabase/migrations/**` core tables, `src/lib/supabase/**`,
  `src/lib/database.types.ts`, `tailwind.config.ts`, the `globals.css` token block, docs)
  change **only by a PR the other reviews**.
- Migrations use **timestamped** filenames (`docs/MIGRATIONS.md`) — never collide.
- Always branch `feat/<module>` off `dev`; PR into `dev`; never commit to `dev`/`main`.

---

## Log (newest first)

### 2026-06-30 · Aman + Claude · Catalog tax fields + GST research + Invoice spec (`feat/catalog-tax-invoice-spec`)
- **Client sample invoice arrived** (`Invoice-7210376259.pdf`) — the artefact MISSING_INPUTS #1 needed.
  Reverse-engineered into **`docs/INVOICE_SPEC.md`**: exact layout, **GST-inclusive** tax math (worked
  example), CGST/SGST-vs-IGST place-of-supply rule, numbering note. Unblocks M21 invoice + M25 challan.
- **Catalog tax fields surfaced end-to-end (M10):** `hsn`/`taxSlabPct`/`cessPct`/`mrp`/`unitsPerCase` now in
  the `Sku` type, accessor (`SKU_COLUMNS`), server-action validate/`toRow`, the add/edit Sheet, a Tax column
  + a "Tax set" KPI on `/catalog`. (Columns already existed on `skus` — no migration.)
- **Per-SKU GST/HSN researched & seeded (42/46):** multi-agent web research of the post-22-Sep-2025
  "GST 2.0" rates, adversarially verified with citations (`INVOICE_SPEC.md` §3a). Carbonated + energy = 40%,
  juice + water = 5%, plain soda = 18%, **cess 0**. "Mix"/"Power UP" left null (unidentifiable). **PROVISIONAL —
  pending CA.** `seed-data.ts` now the seed-of-record for tax; `scripts/seed-skus.ts` made two-pass (non-destructive).
- **Client decisions:** billing entity = **Falcon Enterprises** (GSTIN `06AIMPB2225L2ZE`); invoice numbering **deferred** to go-live.
- **⚠️ Reconcile with Hardik** (cross-lane asks above): research refines his category-level live rates
  (Soda 18 vs 40, Jeera 40 vs 18) + adds HSN. **Re-seed HELD** until agreed. Falcon → `config.seller` (his lane).
- Branch cut **fresh off `dev`** (the earlier session ran on a 51-commit-stale branch; only additive work carried
  over, stale doc edits dropped). **101 tests green**, typecheck + build clean.
- Also added **`docs/CLIENT_QUESTIONNAIRE_2026-06-30.md`** (focused client follow-up).
- **Client WhatsApp export analysed (2026-06-30):** the client answered the full Gap Checklist + sent the
  product **Catalogue** (MRP/units/GST/HSN per SKU) + dev invoice (legal name **Jaypee Advertisers**, GSTIN
  `06AIMPB2225L2ZE`). Key reveals: billing is **two trade-names by brand** (Falcon=Campa Sure, Jaypee=Campa
  Cola); **rates strictly GST-inclusive**; **track individual shops** + GPS/photo onboarding; **batch/expiry +
  strict FIFO**; low-stock = **<5 days of avg sales**; and a **6/29 scope pivot** to a "Ground-Level Sales
  Capture" MVP first. Questionnaire updated to Round-2 (only open items).
- **Build audit vs that context → `docs/BUILD_AUDIT_2026-06-30.md`:** 24 confirmed gaps (7 critical). Headline:
  **GST computed EXCLUSIVE, must be INCLUSIVE** (engine + RPC + tests). Most are Hardik's spine (queued in
  cross-lane asks). **Aman fixes applied:** Gluco Energy → Juice/5% (#20); Soda=18% already correct in seed (#3 data).
- **Next (Aman):** await client's open items (questionnaire) + Hardik's spine fixes; then the joint **Phase-1
  Sales-Capture UI**. (Auth UI / dashboard tiles still on the list per `AMAN_KICKSTART.md`.)

### 2026-06-28 · Hardik + Claude · Auth/RBAC backend (M05–M07) + plan (`feat/auth-backend`)
- **Plan first:** `docs/AUTH_PLAN.md` — Supabase phone-OTP, file-ownership split (Hardik backend /
  Aman login UI), the `getSessionUser`/OTP contract, and a proposed **role→screen matrix** for Aman to confirm.
- **Backend built (my half):** `src/lib/supabase/server.ts` (SSR session client, RLS-as-user) ·
  `middleware.ts` (session refresh always; route-protect + role-gate **only when `NEXT_PUBLIC_AUTH_ENABLED`**
  — dormant so merging can't brick the app pre-login-UI) · `src/lib/auth/rbac.ts` (`canAccess`/`allowedRoutesFor`,
  6 tests) · `session.ts` (`getSessionUser` + `requireRole`) · `actions.ts` (`requestOtp`/`verifyOtp`/`signOut`,
  first-login auto-creates a `users` row, default role driver_rep).
- **101 tests green**, typecheck + build clean (middleware compiles, dormant).
- 🤝 **Aman's half:** login/OTP screen + role-hide nav + confirm the matrix (see cross-lane asks + AUTH_PLAN).
- 🔒 **Go-live gated:** SMS OTP provider (MISSING_INPUTS #12) + staff list (#11) + flip `AUTH_ENABLED`.
- **Next (me):** wire `requireRole` into my mutating actions once the matrix is confirmed; otherwise my lane is at a natural pause (remaining: M25 challan = format-blocked, M08/M09 = with Aman).

### 2026-06-28 · Hardik + Claude · retailer onboarding (M16/M17) (`feat/retailers`)
- Took the shared **"Both" retailer lane** (flagged for Aman). `src/lib/retailers/`: pure
  `validateRetailer`/`normalizePhone` (name required, light phone/GSTIN checks; 6 tests) +
  `getRetailers` + actions `createRetailer`/`updateRetailer`/`setRetailerApproval`/`setRetailerActive` (audited).
- **`/retailers` page**: KPIs + onboard/edit form (name·shop·phone·GSTIN·route·address) + table with
  **approval rule** (pending → Approve) + soft activate/deactivate. Route kept so it works shop- or route-centric.
- Uses the empty `retailers` table (M01) — **no migration**. Slots in the client master list when it arrives (MISSING_INPUTS #9).
- **92 tests green** (rebased on collections), typecheck + build clean. Photo/geo capture deferred (optional; geo fields exist).
- ⚠️ **Nav flag** — `/retailers` needs `src/lib/nav.ts` (Aman).
- **Next (me):** lane is essentially complete; remaining is blocked (M25 challan format, M05–M09 auth + staff list).

### 2026-06-28 · Hardik + Claude · collection (M29) + acceptance (M23/M28) — SPINE COMPLETE (`feat/sales-collections`)
- **M29 collection:** `src/lib/collections/` — pure `outstanding`/`validateCollection` (can't over-collect;
  6 tests) + `recordCollection` action (validates vs outstanding, audited) + `getCollections` accessor.
  `/invoices/[id]` gets a **Payments** panel (invoice/collected/outstanding, cash/UPI form, history,
  settled badge). This also feeds the **cash-collected** side of reconciliation (M27) — now live.
- **M23 acceptance:** pure money-path sim (price → GST → FIFO deduct) proving invoice totals AND stock
  ledger both balance + a deduct recorded per allocation (audited). 1 test.
- **M28 acceptance:** reconciliation flags unaccounted stock beyond tolerance; ok within. 2 tests.
- **89 tests green**, typecheck + build clean. No migration (`collections` table from M01).
- **🏁 Transactional spine DONE:** receive → order → confirm+invoice+deduct (atomic) → collect →
  van load-out → returns → reconcile (variance flag). All stock/cash moves atomic + audited.

### 2026-06-28 · Hardik + Claude · van — reconciliation (M27) (`feat/van-reconcile`)
- **The reason the system exists.** `reconcileVanLoad()` — compares stock that left the van
  (out − returned) against **invoiced** sales, and cash owed (invoice totals) against cash
  collected. Either gap beyond `config.recon_tolerance` → **flagged** to the owner. Sales/cash
  matched to the load by route + date (best linkage until van↔invoice is explicit — documented).
- **`src/lib/van/`:** pure `computeReconciliation` (variance + cash variance + flag, 4 tests) +
  `reconcileVanLoad` action (upserts `reconciliations`, flips load → `reconciled`, audited) +
  `getReconciliation` accessor.
- **UI:** `/vans/[id]` gets a **Reconcile** panel — out/returned/invoiced, stock variance, cash
  expected/collected/variance, ok/flagged badge. No migration (`reconciliations` table from M01).
- **80 tests green**, typecheck + build clean.
- ⚠️ Cash-collected side reads `collections` — fills in once **M29** lands. Variance math already wired.
- **Next (me):** M29 collection (cash/UPI vs invoice) → M23/M28 acceptance tests. Then transactional spine done.

### 2026-06-28 · Hardik + Claude · sales — invoice gen + atomic confirmAndInvoice (M21+M22) (`feat/sales-invoicing`)
- **THE money path.** `confirm_and_invoice()` RPC (`20260628110659_*.sql`): in ONE txn it reserves
  an invoice no (`next_invoice_no`), creates the invoice + a line per FIFO batch allocation
  (`deduct_stock`), computes GST+cess per line, totals, and flips the order to `invoiced`. Reuses
  the tested numbering + deduct RPCs (same txn) → shortfall raises and **everything rolls back**
  (no invoice, no burned number, no partial deduct). The headline atomicity acceptance (M22/M23).
- **Provisional GST (per Hardik's call, not P10-blocked):** `20260628110658` seeds statutory
  rates by category (aerated 28%+12% cess, water 18%, juice 12%) into `skus`, fills nulls only +
  a placeholder `seller`/GSTIN + `tax_provisional` flag. See `docs/MISSING_INPUTS.md`.
- **`src/lib/sales/`:** pure `invoice-tax.computeInvoiceTotals` (per-line GST/cess + rounding, 3 tests)
  + `confirmAndInvoice` action + `getRecentInvoices`/`getInvoice` accessors.
- **UI:** `/orders` gets a **Confirm & invoice** button per draft (→ navigates to invoice) ·
  `/invoices` list · `/invoices/[id]` printable **GST tax invoice** with a clear *provisional* banner.
- **76 tests green**, typecheck + build clean (`/invoices`, `/invoices/[id]`).
- ⏳ **Apply 2 migrations** (`110658` then `110659`) in SQL Editor, then date MIGRATIONS.
- ⚠️ **Nav flag** — `/invoices` needs `src/lib/nav.ts` (Aman). | 🔒 Issuing real invoices still gated on GST values + GSTIN + CA (MISSING_INPUTS P1).
- **Next (me):** M27 reconciliation (out−sold−returned variance) → M29 collection → M23/M28 acceptance tests.

### 2026-06-28 · Hardik + Claude · van — return capture (M26) + missing-inputs writeup (`feat/van-returns`)
- **Decision:** don't block on P10/CA — build the lane through, invoice tax **provisional**
  (Hardik's call). Wrote **`docs/MISSING_INPUTS.md`** — every file/data input still needed
  (invoice format, per-SKU GST/cess/HSN, distributor GSTIN, retailer list, staff list…),
  who it's from, the workaround in place, and which are **go-live gates** vs build gates.
- **Atomic returns:** `record_returns()` RPC (`20260628104700_*.sql`) — qty back to the source
  batch + `van_return` movement + `qty_returned` bump per line; guards `returned+qty <= qty_out`;
  all-or-nothing. Closes the out→return loop; warehouse on-hand restored for unsold cases.
- **`src/lib/van/`:** pure `returns-logic` (`validateReturnLine`/`returnableRemaining`, 5 tests) +
  `recordReturns` action + `getVanLoad(id)` detail accessor.
- **`/vans/[id]` load detail page** + returns form (per-line, bounded by still-out); loads table links to it.
- **73 tests green**, typecheck + build clean.
- ⏳ **Apply** `20260628104700_record_returns_fn.sql` in SQL Editor, then date MIGRATIONS.
- **Next (me):** M21 invoice gen + M22 `confirmAndInvoice()` (provisional GST engine; calls `deductStock`)
  → M27 reconciliation (out−sold−returned) → M29 collection → M23/M28 acceptance. Finishing the spine.

### 2026-06-28 · Hardik + Claude · van — load-out (M24) (`feat/van-load`)
- **Atomic load-out:** `load_van()` RPC (`20260628101459_*.sql`) — creates the van_load, then
  FIFO-pulls `qty_out` per line from warehouse batches (oldest-expiry, row-locked), writing a
  `van_out` movement + `van_load_line` per allocation. All-or-nothing: short on any SKU → whole
  load rolls back. Warehouse on-hand drops by what's loaded (anti-leakage truth).
- **`src/lib/van/`:** pure `load-logic` (`validateLoad` incl. duplicate-SKU guard + `formatLoadNo`,
  5 tests) + `loadVan` action (`VL0001` numbering, audited) + `getVanLoads` accessor (out/returned aggregates).
- **`/vans` page** (dynamic): KPIs + load form (route/vehicle, multi-line, shows on-hand, over-load block)
  + recent-loads table. Reuses kit + inventory `getStockBySku`; none of Aman's files touched.
- **68 tests green**, typecheck + build clean.
- ⏳ **Apply** `20260628101459_load_van_fn.sql` in SQL Editor, then date MIGRATIONS.
- ⚠️ **Nav flag** — `/vans` needs adding to `src/lib/nav.ts` (Aman); see cross-lane asks.
- **Next (me):** M26 return-stock capture (`recordReturns`, van_return → batch). Then M27 reconciliation
  (needs M22 — money path, P10-blocked). M25 challan = P10-blocked.

### 2026-06-28 · Hardik + Claude · sales — invoice-number service (M20) (`feat/sales-invoice-no`)
- **Atomic numbering:** `next_invoice_no()` RPC (`20260628100608_*.sql`) — reads + increments
  `config.invoice_series` ({prefix,next,padding}) under `for update` lock so concurrent invoices
  never collide/skip; self-heals a missing config row. `execute` to `service_role`.
- **`src/lib/sales/`:** pure `invoice-format.formatInvoiceNo` (3 tests) + `invoice-number.nextInvoiceNo`
  (atomic server call; returns null on failure so M22 can abort cleanly). Split pure↔DB so the
  formatter unit-tests without the `@/` alias (lesson: keep `@/` imports out of unit-tested files).
- **63 tests green**, typecheck + build clean. No UI (service for M22).
- ⏳ **Apply** `20260628100608_next_invoice_no_fn.sql` in SQL Editor, then date MIGRATIONS.
- 🚧 **NEXT IS BLOCKED:** M21 invoice generation (tax compute + PDF) needs **P10 — CA sign-off on the
  invoice/challan format** (client). M22 `confirmAndInvoice()` depends on M21. → I'll pivot to the
  **unblocked van lane (M24 load-out → M26 returns)** instead, and park M21/M22 until P10 lands.

### 2026-06-28 · Hardik + Claude · sales — order punch + base-price seed (M19) (`feat/sales-orders`)
- **Prices found in the old-zip workbook:** the per-case **selling rate** is already in
  `skus.rate_per_case` (37/46 SKUs; CSD Cola 200ML=₹240 etc., uniform across routes →
  base pricing confirmed). Seeded `price_list` base rows from it (`20260628095313_seed_base_prices.sql`,
  idempotent). 9 nulls = client to confirm.
- **`src/lib/sales/`:** pure `order-logic` (`validateOrderLines` missing-price guard +
  `computeOrderTotals`, tax 0 until CA slabs; 5 tests) + `orders-data` (`getOrderableSkus`,
  `getRecentOrders`, `ROUTES`) + `createOrder` action (resolves price per line via `priceFor`,
  order+lines write with header-rollback on line failure, audited; `ORD0001` numbering).
- **`/orders` page** (dynamic): KPIs + punch form (route + multi-line, live subtotal, unpriced-SKU
  block) + recent-orders table. Reuses Aman's kit; none of his files touched.
- **60 tests green**, typecheck + build clean. Order is a **draft** — no stock/money impact (that's M22).
- ⏳ **Apply** `20260628095313_seed_base_prices.sql` in SQL Editor (base prices), then date MIGRATIONS.
- ⚠️ **Nav flag** — `/orders` needs adding to `src/lib/nav.ts` (Aman's lane); see cross-lane asks.
- **Next (me):** M20 invoice-number service (config `invoice_series`). Then **M21 invoice gen is BLOCKED on P10** (CA format); M22 `confirmAndInvoice()` will call `deductStock()`.

### 2026-06-28 · Hardik + Claude · sales — price-list rule + resolver (M18) (`feat/sales-pricelist`)
- **`src/lib/sales/`:** pure `resolvePrice` (precedence **retailer > route > base**, latest
  `effective_from` wins, ignores inactive/not-yet-effective; 7 tests) + `validateSetPrice`
  (one scope only; 4 tests) + `getPriceRules`/`priceFor()` accessors + `setPrice` server action
  (insert-only, keeps price history; non-blocking audit).
- `priceFor()` is the `priceLine()` the order punch (M19) will call per line. Returns **null when
  no rule** — caller must handle (don't guess a price).
- Uses existing `price_list` table (M01) — **no migration**. 55 tests green, typecheck + build clean.
- ⚠️ **No prices seeded yet** — `setPrice` exists but the list is empty until prices are entered
  (client rate sheet, or seed from `skus.rate_per_case` later). M19 order lines need rules present.
- **Next (me):** M19 order punch (order + order_lines model + punch UI, uses `priceFor`) → M20 invoice-number service.

### 2026-06-28 · Hardik + Claude · inventory — low-stock accessor (M14) + acceptance (M15) (`feat/inventory-alerts`)
- **M14 low-stock:** `getLowStockSkus()` in `src/lib/inventory/data.ts` — SKUs in stock and
  at/below `low_stock_threshold` (config). Dashboard tile = Aman's lane → flagged in cross-lane asks.
- **M15 acceptance:** `ledger.ts` pure `netFromMovements` (on-hand = signed sum of movements;
  foundation for recon M27) + `acceptance.test.ts` proving the inventory invariant: receive →
  FIFO deduct → **physical on-hand === ledger net**, every op audited, over-deduct rejected (no partial).
- **44 tests green** (3 ledger + 2 acceptance new), typecheck + build clean. No migration, no UI.
- **Inventory module (M10–M15) now complete** end-to-end: catalog → receive (atomic) → FIFO deduct
  (atomic) → low-stock → acceptance.
- **Next (me):** money path — M18 price-list → M19 order punch → M20 invoice-number service.
  ⚠️ M21 invoice gen is **client-blocked (P10 CA format)**; M22 `confirmAndInvoice()` reuses `deductStock()`.

### 2026-06-28 · Hardik + Claude · inventory — FIFO deduct service (M13) (`feat/inventory-fifo`)
- **Atomic FIFO deduct:** `deduct_stock()` RPC (`20260628090247_deduct_stock_fn.sql`) —
  oldest-expiry batch first (nulls last, then oldest received), `for update` row locks
  (no oversell), per-batch `sale_deduct` movement, **raises on shortfall → full rollback**
  (never partial/negative). Returns allocations `(batch_id, qty)` for `invoice_lines.batch_id` (M22).
- **`src/lib/inventory/`:** pure `fifo-logic` (`validateDeduct` + `planFifo` mirroring the SQL
  ordering, 7 tests) + `deductStock()` server fn (rpc + non-blocking audit, friendly insufficient-stock msg).
- **39 tests green**, typecheck + build clean. No UI (service called by invoicing/M22).
- ✅ **deduct_stock RPC applied 2026-06-28** (SQL Editor).
- **Next (me):** M14 low-stock alerts (wire `lowStockFlag` to dashboard) OR M18 price-list → M19 order punch.
  Heads-up Aman: M22 `confirmAndInvoice()` will call this `deductStock()` — invoice + deduct in one txn.

### 2026-06-28 · Hardik + Claude · inventory — receive stock (atomic) + stock view + `/inventory` (M11/M12) (`feat/inventory-receive`)
- **Atomic receive:** `receive_stock()` RPC (`20260628082112_receive_stock_fn.sql`) — batch
  upsert + inward `stock_movements` in ONE txn; `execute` to `service_role` only. Sets the
  txn pattern for FIFO deduct (M13) + confirmAndInvoice (M22).
- **`src/lib/inventory/`:** pure `logic` (validateReceive/lowStockFlag/sumOnHand, 10 tests) +
  `receiveStock()` (rpc + non-blocking `logAudit`) + `getStockBySku`/`getBatches`/`getSkuOptions`
  (separate queries + JS merge — no nested joins) + `receiveStockAction` server action.
- **`/inventory` page** (dynamic): KPIs + receive form (reuses kit FormField/Input/Button) +
  by-SKU table (low-stock `StatusBadge`) + batches table. Reuses Aman's kit, none of his files edited.
- **32 tests green**, typecheck + build clean (`/inventory` = ƒ dynamic).
- ✅ **receive_stock RPC applied 2026-06-28** (SQL Editor). Receive form is now live end-to-end.
- ⚠️ **Nav link pending** — `/inventory` needs adding to `src/lib/nav.ts` (Aman's lane); flagged for him.
- **Next (me):** M13 FIFO deduct (reuses this RPC pattern) or M14 low-stock dashboard wiring.

### 2026-06-28 · Hardik + Claude · platform — AuditService (M02) + config layer (M03) (`feat/audit-config`)
- **M02 audit:** `src/lib/audit/` — pure `buildAuditRow` (camel→snake, normalize, validate;
  5 tests) + `logAudit()` side-effect writer to `audit_log` (try/catch, **never throws/blocks**,
  CLAUDE.md rule 4). Call after the primary mutation.
- **M03 config:** `src/lib/config/` — pure `CONFIG_DEFAULTS` + `getDefault`/`coerceConfigValue`
  (7 tests) + `getConfig`/`getAllConfig` accessors (DB read, default fallback — `getSkus` pattern)
  + `20260628080405_config_seed.sql` (5 default rows, `on conflict do nothing`). `tax_slabs` empty (CA-gated).
- **22 tests green** (10 catalog + 12 new), typecheck + `next build` clean. PR open → `dev`.
- ⏳ **config_seed NOT applied yet** — run `20260628080405_config_seed.sql` in SQL Editor, then date MIGRATIONS.
- **Next (me):** inventory M11 (stock receive) → M12 (stock view). Auth M05–M09 = sync with Aman first.

### 2026-06-28 · Hardik + Claude · transactional spine — P13 ER schema + M01 core migrations (`feat/core-schema`)
- **Merge hygiene:** `feat/ui-kit-states` → `dev` (PR #1). `feat/supabase-catalog` stale
  (already in `dev`) — delete it. Cut `feat/core-schema` off updated `dev`.
- **P13/M01 schema:** filled `docs/SCHEMA.md` (template → real ER) + **six timestamped
  migrations** (`20260628070450`–`455`): `users/config/audit_log`,
  `stock_batches/stock_movements`, `retailers`, `price_list/orders/order_lines/invoices/invoice_lines`,
  `van_loads/van_load_lines/reconciliations`, `collections`. **15 tables**, all on the
  `skus`/0001 pattern (RLS + read policy + server-only writes + grants + trigger).
- **Tables + constraints only** — FIFO/`confirmAndInvoice()`/`reconcile()`/AuditService
  deferred to their module branches. Auth M05–M09 = only `users` table created here.
- 4 decisions flagged for Aman: role-as-enum (no `roles` table), returns-as-column,
  added `stock_movements` ledger, server-only writes. See `docs/handoffs/2026-06-28-hardik.md`.
- **Applied to Supabase 2026-06-28** — all 6 run via SQL Editor; 16 tables live (verified).
  `docs/MIGRATIONS.md` dated. PR #2 merged → `dev`.
- Added `docs/MODULE_OWNERSHIP.md` (status table). Hardened `.gitignore` (`*env.local`, `/*.txt`).
- **Now (me):** `feat/audit-config` — M02 audit hook + M03 config. Then inventory M11–M12.

### 2026-06-25 · Aman + Claude · Aman's lane — UI Kit + Catalog CRUD (`feat/ui-kit-states`, one PR)
- **UI Kit:** `EmptyState`, `ErrorState` (error + retryable offline), `LoadingState` + `Spinner`,
  `FormField` + `FormActions`, and `ConfirmDialog` + `useConfirm()` (on a new `ui/dialog.tsx`
  primitive). `Input` shows a red border on `aria-invalid`. All demoed on `/kit`.
- **Catalog (M10):** server actions `createSku` / `updateSku` / `setSkuActive`
  (`src/lib/catalog/actions.ts` — service-role, auto-assigns next `SKUNNN`, revalidates) +
  `SkuFormSheet` (slide-over reusing `FormField`) + per-row Edit + Add SKU + soft
  deactivate/reactivate (confirmed via `useConfirm`) + a Show-inactive toggle on `/catalog`.
  Reads fall back to the seed. `TODO(auth)`: gate the actions to owner/warehouse once M05–M09 land.
- One consolidated PR by choice (Hardik reviews the lane in one pass). Independent of Hardik;
  shared seams touched = `src/components/ui/input.tsx` + new `src/components/ui/dialog.tsx` (additive).

### 2026-06-25 · Aman + Claude · handover prep · Supabase + Catalog · repo as shared source
- `feat/supabase-catalog` → merged to `dev` + `main`.
- **Supabase live** (Mumbai); `skus` table (migration `0001`) + 46 seeded; **Catalog reads
  live** at `/catalog`; server admin client (`src/lib/supabase/admin.ts`).
- Docs added/refreshed: STATUS · CLAUDE (grant rule + Supabase workflow) · COORDINATION ·
  MIGRATIONS · SCHEMA (ER template) · 2026-06-25 handoff · HARDIK_KICKSTART · README · this WORKLOG.
- **Build-reference committed** to the private repo (tracker, wireframes, briefs,
  proposals, requirements, seed). Signed MSA/NDA + client financials + driver PII stay
  in the private Drive (not git).
- Delivery Tracker updated: P-statuses + Aman/Hardik owner split.
- **Next:** Auth/RBAC (M05–M09, shared) — agree the approach before either starts.

### 2026-06-24 · Aman + Claude · foundation + 3 modules
- Scaffold (Next 15 + Tailwind v3 + shadcn). UI Kit base (`/kit`). SKU Catalog + canonical
  resolver (`/catalog`, 10 tests). Owner Dashboard from seed (`/dashboard`).
- Repo secured: clean history, **private** `GroundsTruth/groundstruth-dms`, Vercel connected.

---

## Hardik — start here (one time)
1. Read `docs/HARDIK_KICKSTART.md`, then the read-order it lists.
2. Get the 3 Supabase keys from Aman (vault) → `.env.local`; `node scripts/check-supabase.mjs` → "CONNECTION OK".
3. Claim your first module in **In flight** above.
4. First task: propose the ER schema in `docs/SCHEMA.md` (PR for Aman to review).
5. Delete the old **public** `hardik-goel/groundstruth-dms` (last external exposure).

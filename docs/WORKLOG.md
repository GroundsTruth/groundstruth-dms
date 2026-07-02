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
| Aman | `feat/aman-mvp-e2e` | Capture (#7) + `/schemes` nav + AUTH LOGIN UI + role-nav + DASHBOARD live tiles/role-scope (#24). **NEW 7/02:** dual-branding logo slot · catalog MRP/units columns · **M08 user-mgmt `/users`** (list/role/active) · consolidated client-questions + MVP-remaining docs · E2E doc. **Next (needs client/DB):** migrations applied → walk `docs/E2E.md`. **Blocked:** 14 new SKUs (client Q9). | `src/app/(app)/{capture,dashboard,login,users}/` · `src/components/{capture,auth,layout,catalog,users}/` · `src/lib/{nav,dashboard,users}` · docs | 2026-07-02 |
| Hardik | `30thJunechanges` (merged → dev, PR #27) | Build-audit (24 gaps) + Round-2/3 done — dual seller, brand credit, challan, schemes, catalogue ingest, tiered recon. ⚠️ **Apply the pending migrations** (Batch 1–4 + recon_tiers + schemes) in the SQL Editor — they gate live E2E. | `src/lib/{sales,retailers,inventory,van,schemes,config}/**` · UI · migrations | 2026-07-01 |

> **Aman — starting fresh? Read `docs/AMAN_KICKSTART.md` first.** It has everything Hardik
> built (done + merged), your lane (Auth UI → Dashboard tiles → UI kit), the assumptions we
> took, the contracts you build against, and the open client questions.

## 📌 Pending cross-lane asks — read before you start a session (clear the line when done)
| For | Ask | Raised by | Status |
|-----|-----|-----------|--------|
| **Hardik** | 🔴 **Confirm the live Soda GST rate** — `docs/CLIENT_QUESTIONS_OPEN.md` A4 flags a conflict: Round-3 notes say **Soda = 5%**, the audit/INVOICE_SPEC set **18%**. Your tax lane. Resolve before we trust demo invoice tax (client Q4 asks them too). | Aman · 2026-07-02 | ⬜ open |
| **Hardik** | **M08 user mutations** — I built working `updateUserRole`/`setUserActive` in **`src/lib/users/**`** (new folder, so I didn't touch your `auth/` lane) to make `/users` work now. Relocate into `src/lib/auth` + add `requireRole("owner")` when auth flips. | Aman · 2026-07-02 | ⬜ FYI |
| **Hardik** | **RBAC gate `/capture` + `/schemes`** in `src/lib/auth/rbac.ts` — both are currently unlisted (visible to every role). Suggest `/capture` → owner+driver_rep, `/schemes` → owner. Your file. | Aman · 2026-07-02 | ⬜ open |
| **Aman** | Add **`/inventory`** to the sidebar nav (`src/lib/nav.ts` — your lane). Hardik shipped the page on `feat/inventory-receive` but didn't touch your file. Label "Inventory". | Hardik · 2026-06-28 | ✅ done (all nav links live via seed-and-nav) |
| **Aman** | Wire **low-stock tile** on Owner Dashboard (M30). Accessor ready: `getLowStockSkus()` in `src/lib/inventory/data.ts` (returns `SkuStock[]` at/below threshold). Render the count/list (low-stock is now DYNAMIC days-of-cover). Hardik won't touch dashboard. | Hardik · 2026-06-28 | ⬜ open |
| **Aman** | Add **`/orders`** to the sidebar nav (`src/lib/nav.ts` — your lane). Page shipped on `feat/sales-orders`. Label "Orders". | Hardik · 2026-06-28 | ✅ done (seed-and-nav) |
| **Aman** | Add **`/vans`** to the sidebar nav (`src/lib/nav.ts` — your lane). Page shipped on `feat/van-load`. Label "Van loads". | Hardik · 2026-06-28 | ✅ done (seed-and-nav) |
| **Aman** | ~~Nav missing `/orders` + `/retailers`; `/collections` dead link~~ → **DONE by Hardik with owner's OK** (`feat/seed-and-nav`): added Orders + Retailers, removed dead Collections link (collections live on the invoice Payments panel). Heads-up: I touched `src/lib/nav.ts` (your file) — revert/adjust freely. | Hardik · 2026-06-28 | ✅ done |
| **Aman** | **Retailer lane (M16/M17) was "Both" — Hardik built it** (merged). Reusable for per-retailer pricing + named-shop invoices later. | Hardik · 2026-06-28 | ✅ done (FYI) |
| **Aman** | **AUTH/RBAC — review `docs/AUTH_PLAN.md`.** Hardik built the backend (`feat/auth-backend`): `getSessionUser`, `requireRole`, OTP actions (`requestOtp`/`verifyOtp`/`signOut`), middleware. **You build:** `/login` + OTP screen to that contract, and role-hide nav (`allowedRoutesFor(role)`). **Confirm the role→screen matrix** (covers your dashboard/catalog). | Hardik · 2026-06-28 | ⬜ open |
| **Both** | **Go-live for auth:** flip `NEXT_PUBLIC_AUTH_ENABLED=true` (middleware is dormant till then) once login UI + SMS OTP provider (MISSING_INPUTS #12) are live + users seeded (#11). | Hardik · 2026-06-28 | ⬜ open |
| **Hardik** | **Tax reconcile (provisional):** my GST research refines your category-level live rates — plain **Soda = 18%** (you set 40%), **Jeera RTD = 40%** (you left 'Other'=18%), and I added per-SKU **HSN codes** (your migration set rates only). Table + sources: `docs/INVOICE_SPEC.md` §3a. Agree, then apply to live. | Aman · 2026-06-30 | ✅ DONE (Hardik 6/30): Soda→18, Jeera→40, per-SKU HSN applied live via seed-skus |
| **Hardik** | **Seller = Falcon Enterprises**, GSTIN `06AIMPB2225L2ZE` (confirmed by Aman, from the sample invoice). Set in config.seller live. | Aman · 2026-06-30 | ✅ DONE (Hardik 6/30) |
| **Hardik** | **Invoice format unblocked** — client sent a real tax invoice → reverse-engineered in `docs/INVOICE_SPEC.md` (layout, GST-inclusive math, CGST/SGST-vs-IGST, numbering). Used for M21 inclusive invoice (Batch 1). M25 challan still needs a challan sample. | Aman · 2026-06-30 | ✅ DONE (Hardik 6/30) |
| **Both** | **Re-seed HELD:** `scripts/seed-skus.ts` now carries per-SKU tax + is two-pass (non-destructive) but is **not run** — it would overwrite Hardik's live category rates. Run 6/30 (client confirmed correct) — per-SKU tax+HSN live. | Aman · 2026-06-30 | ✅ DONE (Hardik 6/30) |
| **Hardik** | 🔴 **BUILD AUDIT (2026-06-30) → `docs/BUILD_AUDIT_2026-06-30.md`** — 24 confirmed gaps vs the client's WhatsApp answers/Catalogue (file:line + fixes). Spine items before real billing: **GST math is EXCLUSIVE, must be INCLUSIVE** in BOTH `invoice-tax.ts` AND the `confirm_and_invoice` RPC (the tests assert the wrong math) (#1,#2); below-list **admin-approval** (#5); **credit ledger** (#6); two **price lists** + remove dead `discount_ceiling` (#9,#10); retailer **cash/credit + photo + GPS-capture + owner-name + role-gated approval** (#11,#12,#13,#22,#23); **dynamic low-stock + wastage/adjustment + count screen** (#14,#15,#16); **seller-by-brand + HSN on invoice** (#8,#17); **Soda→18% corrective migration + NULL-guard** (#3,#19). **Plus net-new scope S1–S5** (admin panel · schemes · wholesale channel · dispatch edit-lock · rep targets). | Aman · 2026-06-30 | 🟡 24 gaps DONE (Batches 1–5, this PR); S1–S5 net-new = later |
| **Both** | 🟠 **Phase-1 "Sales Capture" flow (client's 6/29 priority)** — one driver→shop(+inline onboard)→SKU/qty/**rate/discount**→**payment mode**→preview→invoice journey. Needs Hardik: line-level rate/discount + payment + inline-onboard in schema/actions (#4,#7); Aman: the capture UI. | Aman · 2026-06-30 | ✅ DONE — Hardik `captureSale` + Aman `/capture` mobile flow (`feat/aman-mvp-e2e`) |
| **Hardik** | **Add `/capture` + `/schemes` to `rbac.ts` route map** (your file). They shipped after AUTH_PLAN so they're "unlisted → any signed-in user" — nav degrades safely but middleware won't enforce. Proposed: `/capture` → owner+driver_rep · `/schemes` → owner. One-liner each. Aman **confirmed the rest of the matrix** (AUTH_PLAN §matrix). | Aman · 2026-07-01 | ⬜ open |
| **Hardik** | **Wire `requireRole` into mutating actions** + stamp `created_by` = session user id (AUTH_PLAN build-order 3). Aman's login UI + role-nav are live; enforcement is your half. Needs the OTP provider + `AUTH_ENABLED` flip to fully go-live. | Aman · 2026-07-01 | ⬜ open |

**Rules that keep us conflict-free:**
- Edit only the folders your lane owns (`COORDINATION.md`). No overlap → no conflicts.
- Shared seams (`supabase/migrations/**` core tables, `src/lib/supabase/**`,
  `src/lib/database.types.ts`, `tailwind.config.ts`, the `globals.css` token block, docs)
  change **only by a PR the other reviews**.
- Migrations use **timestamped** filenames (`docs/MIGRATIONS.md`) — never collide.
- Always branch `feat/<module>` off `dev`; PR into `dev`; never commit to `dev`/`main`.

---

## Log (newest first)

### 2026-07-02 · Aman + Claude · readiness report + logo/catalog/user-mgmt (`feat/aman-mvp-e2e`)
- **Docs:** `docs/E2E.md` (chronological setup→journeys), `docs/CLIENT_QUESTIONS_OPEN.md`
  (single consolidated client ask-list — archived the two older questionnaires under `docs/archive/`),
  `docs/MVP_REMAINING.md` (built-vs-remaining by owner + dependency graph).
- **Readiness verdict:** branch clean-merges to dev (0 conflicts), typecheck 0, **120 tests**, build clean.
  Doc-hygiene QC: STATUS.md + MODULE_OWNERSHIP.md were stale (refreshed on branch); `.xlsx` tracker frozen at 6/25.
- **Built (3):** (1) **dual-branding logo slot** — `BrandLogo` in app shell + invoice header, renders
  `public/brand/logo.png` with a text fallback (drop the PNG in — no code change; asset not yet in repo);
  (2) **catalog MRP + units/case columns** on `/catalog` (desktop + mobile); (3) **M08 user-management**
  `/users` (owner-gated) — list staff, change role, activate/deactivate, audited; accessor+actions in new
  `src/lib/users/**` (didn't touch Hardik's `auth/` lane).
- **Corrected earlier over-claim:** the 14 new SKUs are NOT added (still 46) — correctly blocked on client Q9;
  only Gluco→Juice landed.
- **Next (Aman):** run the E2E runbook once you're on the branch; fold shop-photo into capture later.

### 2026-07-01 · Aman + Claude · pull dev + capture rebase + tracker QC + E2E assessment (`feat/aman-mvp-e2e`)
- **Pulled dev** (Hardik's Round-2/3 merged: dual seller, brand credit, challan view, schemes engine,
  catalogue ingest, tiered recon). **Rebased the Sales-Capture UI** (`/capture`) onto latest dev — the
  `captureSale` contract is unchanged, so the screen recompiled clean. Added **`/schemes`** to the nav
  (Aman todo #0). **typecheck 0 · 120 tests · build green (14 routes).**
- **Tracker QC** (asked: is everyone keeping docs current?):
  - ✅ **WORKLOG** + **AMAN_KICKSTART** — current, well-maintained by both.
  - ❌ **STATUS.md** — was stuck at **2026-06-25 (pre-spine)**, claimed "10 passing tests"; the session-start
    ritual points at it. **Rewrote it fully** to current reality + an E2E-readiness table.
  - ⚠️ **MODULE_OWNERSHIP.md** — stale (missing capture #7 + all Round-2/3 net-new). **Refreshed.**
  - ⚠️ **MIGRATIONS.md** — the two 2026-07-01 migrations (`recon_tiers`, `schemes`) were **unlogged**. **Added them.**
  - ❌ **`dev/11_Delivery_Tracker.xlsx`** — untouched since **2026-06-25**; effectively abandoned. The markdown
    WORKLOG is the de-facto tracker. (Decide: retire the xlsx, or regenerate it from the markdown.)
- **E2E readiness (driver + retailer journeys):** code is green, but **live E2E is gated by two things** —
  (1) **migration backlog NOT applied** to the DB (Batch 1–4 + recon_tiers + schemes) → `/capture`, approval,
  credit, adjust, `/schemes` will error at runtime until applied (Hardik / SQL Editor); (2) **`.env.local`
  keys absent** in the run env (Aman / vault). Auth is dormant (fine for testing; a real go-live gate).
  Full gate table + the step-by-step journey test script live in `docs/STATUS.md`.
- **Then built (Aman lane, all green — typecheck 0 · 120 tests · build):**
  - **Auth login UI** — `/login` phone→OTP→verify to Hardik's contract (E164 normalize, resend/change-number);
    app shell now **role-aware** ((app)/layout resolves `getSessionUser` → `navItemsForRole` filters nav +
    real **sign-out**; null user shows all so dormant-auth dev stays open). **Confirmed the role→screen matrix**
    (AUTH_PLAN). Raised 2 asks to Hardik: gate `/capture`+`/schemes` in rbac.ts, wire `requireRole` into actions.
  - **Dashboard live tiles + role-scope (#24)** — `getDashboardSummary` composes invoices/collections/low-stock/
    vans/orders accessors (seed-safe, whole-summary SEED fallback, `source` flag); owner sees financials +
    route/top-SKU, warehouse/driver_rep get the operational view; live low-stock reorder list for all.
  - **`supabase/_apply_pending.sql`** — the paste-once for the whole migration backlog (was referenced in docs
    but never created). Hand to whoever runs the SQL Editor.
- **Blocked:** the **14 new catalogue SKUs** need the source file (`Catalogue Cola.xlsx`/`scratch_catalogue.json`,
  not in repo) — won't fabricate HSN/MRP/prices. Gluco→Juice already done in seed (SKU039).
- **Next:** apply migrations + keys (Hardik/Aman) → **walk the driver+retailer journeys** (`docs/E2E.md`).

### 2026-07-01 · Hardik + Claude · client Round-2/3 build (`30thJunechanges`)
Client answered Round-2 + sent updated Catalogue, redesigned challan, dual driver dir, logo, 2 invoices.
Assessment + 6 small open items → `docs/CLIENT_QUESTIONS_ROUND3.md`. Built (my lane):
- **Catalogue ingest** — GST/HSN/MRP/units/prices from the client Catalogue applied live (37 SKUs);
  **corrects Soda 18→5%, Gluco 40→5% (Juice)**. 14 catalogue rows are NEW products (for Aman).
- **Tiered reconciliation** — client thresholds (cash <0.1/0.1–0.3/>0.3, stock <0.2/0.2–0.6/>0.6) → ok/warn/critical.
- **Dual seller by brand** — invoice picks Jaypee (CSD/Soda) vs Falcon (Water/Juice/Energy) by category;
  both entities in config (Jaypee `06AIMPB2225L2ZE` / Falcon `06FVEPS8609PIZN`). Energy/Juice/Soda split = DEFAULT (Q1).
- **Brand credit** — Campa Cola (Jaypee) no-credit; Campa Sure (Falcon) ₹1500 cap, gated in createOrder.
- **Delivery challan (M25)** — printable on `/vans/[id]` to the redesigned layout.
- **Schemes engine (S2)** — schemes table + `applySchemes` (buy-X-get-Y, cross-SKU) + `/schemes` admin +
  ₹0 freebie lines auto-added on orders. **captureSale** already wired (inline onboard→order→invoice→pay).
- **120 tests green.** Apply `supabase/_apply_01July.sql` (recon tiers + schemes) in SQL Editor.

**→ AMAN handoff (your remaining work):**
- **#7 Sales-Capture UI** — single screen; backend `captureSale()` ready (now includes credit guard + freebies).
- **`/schemes` nav link** in `src/lib/nav.ts` (page shipped). Also the earlier nav is fine.
- **Dual-branding LOGO** — add the distributor logo (PPT_1) to the invoice header (`invoice-view.tsx`) + app shell.
- **14 new catalogue products** — add as SKUs + `seed-data.ts` (cans/variants); reclassify **Gluco category → Juice**
  (tax already 5% live; enum still 'Energy').
- **Dashboard live tiles** (M30/M31) + **#24 role-scope dashboard** (reps see own route only) + **Auth login UI** (dormant `AUTH_ENABLED`).
- Test OTP `1234` — wire into your login screen (verify path; auth is dormant till go-live).

### 2026-06-30 · Hardik + Claude · build-audit Batches 2–5 + CA confirmed (`30thJunechanges`)
**Client confirmed the tax/HSN/seller data is correct → CA sign-off is NO LONGER a gate.**
Set `config.seller = Falcon Enterprises` (GSTIN `06AIMPB2225L2ZE`) + `tax_provisional=false` live;
removed the invoice "provisional" banner; "pending CA / provisional" wording dropped across docs.
- **Batch 2 — pricing/approval:** order_lines `list_price`+`discount_pct`; punch form Rate input;
  below-list → `pending_approval` + approve/reject; `confirm_and_invoice` gated; `price_list.list_type`
  (retail/wholesale) + `retailers.customer_category`; removed dead `discount_ceiling`. (`20260630140020`)
- **Batch 3 — retailer:** cash/credit `customer_type` (cash auto-approves), `credit_limit`, derived
  `getRetailerCredit` (#6), `owner_name`, GPS capture on save, `shop_photo_path` (field-app upload later),
  **role-gated approval** (#23). (`20260630141226`)
- **Batch 4 — inventory:** dynamic low-stock (days-of-cover < `low_stock_days`), `adjust_stock` RPC
  (wastage/expiry/count) + `/inventory` count panel. (`20260630142741`)
- **Batch 5 — sales capture:** `captureSale` backend (inline-onboard → order(rate/discount) → invoice →
  payment, one call) for Aman's capture screen. #17 two-sellers **dropped** (Falcon is the single confirmed entity).
- **109 tests green**, typecheck + build clean. **4 migrations to apply** — consolidated SQL handed to Hardik.

**→ AMAN, pick up next (build-audit items in your lane):**
- **#7 Sales-Capture UI** — single screen (driver→shop/inline-onboard→SKU/qty/rate/discount→payment→preview).
  Backend ready: `captureSale()` in `src/lib/sales/capture.ts`. **Client's stated priority.**
- **#18 `brand` column on SKUs** (Campa Sure / Campa Cola) + seed; **#20 reclassify Gluco Energy → Juice 5%**
  in `seed-data.ts`; **#24 dashboard role-scoping** (reps see only own route — `rbac.ts` already grants `/dashboard`).
- Owner Dashboard live tiles (M30/M31) + Auth login UI still open (see `docs/AMAN_KICKSTART.md`).

### 2026-06-30 · Hardik + Claude · build-audit Batch 1 — tax correctness (`30thJunechanges`)
Working `docs/BUILD_AUDIT_2026-06-30.md` (Hardik-lane) + `docs/INVOICE_SPEC.md`. **Batch 1 = money correctness:**
- **#1 GST is INCLUSIVE (TS engine):** `invoice-tax.ts` now extracts tax (`taxable = gross/(1+rate)`),
  not adds it. Rewrote `invoice-tax.test.ts` to the client sample (70×₹120 incl 5% → taxable 8000, GST 400, total 8400).
- **#2 Same fix in the money path (RPC):** migration `20260630134832` rewrites `confirm_and_invoice` to
  mirror the inclusive math; `money-path.acceptance.test.ts` updated. UI ↔ DB agree.
- **#3 Soda → 18%** (was 40%): corrective `update` in the migration + **applied live** (SKU018).
- **#8 HSN on invoice:** `invoice_lines.hsn` column (migration) + RPC snapshots it + `/invoices/[id]` shows
  the HSN column. Plus **CGST/SGST split** (intra-state; IGST once buyer state captured — §4).
- **103 tests green**, typecheck + build clean.
- ⏳ **Apply `20260630134832_invoice_inclusive_tax_hsn.sql`** in SQL Editor (alter + function; Soda already live).
- ⚠️ Existing demo invoices (INV00001/2) keep their old exclusive snapshots — re-run `seed:demo` after applying for an inclusive one.
- **Replies to Aman's asks:** #34 tax-reconcile → **Soda now 18% live**; per-SKU HSN/Jeera reconcile still pending your `seed-data.ts` source-of-truth (don't re-seed over my rates without agreeing). #38 audit → Batch 1 done; Batches 2–5 next.
- **Next (me):** Batch 2 pricing/approval (#4 rate+discount on lines, #5 below-list approval, #9 two price lists, #10 kill discount_ceiling).

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

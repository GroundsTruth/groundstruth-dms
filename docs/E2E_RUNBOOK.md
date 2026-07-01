# E2E Runbook — chronological walkthrough (driver + retailer + owner)

_2026-07-01. Migrations applied. Do these **in order** — each phase leaves the data the next
one needs. Every step = **do → expect**. Tick as you go. Companion to `docs/E2E_TEST_PLAN.md`
(same journeys, this one is time-ordered with the setup phase up front)._

Legend: 🟩 must pass · 🟦 cross-check · ⏭️ optional

---

## Phase 0 — Get on the branch + seed data (once)
0.1 🟩 On your machine (has `.env.local`): `git fetch origin && git switch feat/aman-mvp-e2e`
    → **expect** the branch with `/capture`, `/login`, live dashboard.
0.2 🟩 `npm install` → then `node scripts/check-supabase.mjs` → **expect** `CONNECTION OK`.
0.3 🟩 `npm run seed:demo` → **expect** the log ends with row counts and
    `DONE — refresh /inventory /orders /invoices /vans /retailers`. This creates: stock for 3 SKUs,
    **"Demo Kirana Store"** (approved, ROUTE-3), one **invoiced** order, a **60% collection**, one **van load**.
    _(Re-runnable — each run adds a fresh order/invoice/load.)_
0.4 ⏭️ `npx tsx scripts/seed-opening-stock.ts` → loads real June-1 warehouse stock (more SKUs = richer low-stock).
0.5 🟩 `npm run dev` → open `http://localhost:3000`.

## Phase 1 — Verify-DB sanity (before any journey)
1.1 🟩 `/catalog` → 46 SKUs; **Tax column populated** (HSN + GST%) → catalogue ingest is live.
1.2 🟩 `/inventory` → the 3 demo SKUs show on-hand (100 received − 20 to van − invoice deduct) → migrations live.
1.3 🟩 `/orders` → the demo order shows **invoiced**; the punch form lists priced SKUs (no "unpriced" block).
1.4 🟩 `/invoices` → open the demo invoice → **GST-inclusive** totals, **HSN per line**, **seller entity by brand**
     (Jaypee for CSD/Soda, Falcon for Water/Juice/Energy), CGST/SGST split. Taxable + GST reconciles to the gross.
1.5 🟩 `/dashboard` → subtitle now says **"live figures"**; Revenue > 0, **Collected ≈ 60%**, Vans active = 1,
     Low-stock count real. → dashboard live wiring works.
1.6 🟦 `/retailers` → **Demo Kirana Store** present, approved, ROUTE-3.
> If `/capture` or any submit throws a column/function error here → a migration didn't apply; recheck Phase 0.

## Phase 2 — 🚗 Driver Journey A: capture a retail sale, existing shop, cash (the headline)
2.1 🟩 `/capture` → pick **Route = ROUTE-3**, list = **Retail**.
2.2 🟩 **Shop = Existing** → search "Demo" → pick **Demo Kirana Store**.
2.3 🟩 **Items** → add a SKU → **Qty = 5** (stepper) → **expect** a live line total; the summary shows
     **GST-inclusive** tax (extracted from price, not added).
2.4 🟩 Add a 2nd SKU line → **expect** the running total updates.
2.5 🟩 **Payment = Cash**, amount = total → **Review order** → **expect** the preview with the inclusive tax breakdown.
2.6 🟩 **Confirm** → **expect** `invoiced` + a **link to the invoice**.
2.7 🟦 Open the invoice → seller entity/HSN/inclusive totals match the preview.
2.8 🟦 `/inventory` → on-hand for those 2 SKUs **dropped by the qty sold** (atomic FIFO).
2.9 🟦 Invoice **Payments** panel → cash recorded, outstanding = 0.

## Phase 3 — 🚗 Driver Journey B: new shop, inline onboard + GPS, cash
3.1 🟩 `/capture` → Route → **Shop = New** → fill name/owner/phone (GSTIN optional).
3.2 🟩 Tap **capture GPS** → **expect** lat/lng fill (allow the browser prompt); type is forced **cash**.
3.3 🟩 Add items → **Payment = Cash** → Review → Confirm → **expect** `invoiced` (cash shop auto-approves).
3.4 🟦 `/retailers` → the new shop is listed with owner + phone + GPS + **customer_type = cash**.

## Phase 4 — 🚗 Driver Journey C: below-list price → admin approval
4.1 🟩 `/capture` → existing shop → add a SKU → **override the rate BELOW list** → **expect** a "below list" flag.
4.2 🟩 Review → Confirm → **expect** `pending_approval` (amber) — **no invoice yet**.
4.3 🟩 `/orders` → find the **pending-approval** order → **Approve** → **expect** it can now be confirmed & invoiced.
4.4 🟦 Try **Reject** on another below-list order → **expect** it stays un-invoiced.

## Phase 5 — 🏪 Retailer Journey D: credit onboarding, approval & brand-credit guard
5.1 🟩 `/retailers` → onboard a shop with **customer_type = credit** + a **credit_limit** → **expect** saved as **pending**.
5.2 🟩 As owner → **Approve** → active + approved.
5.3 🟩 `/capture` → sell a **Campa Sure / Falcon** SKU on **Payment = Credit** **within** the ₹1500 cap →
     **expect** invoice raised, **no collection**, outstanding = amount.
5.4 🟩 Sell again to push **over ₹1500** → **expect** the **brand-credit guard** blocks it (error surfaced in capture).
5.5 🟩 Try a **Campa Cola / Jaypee** SKU on credit → **expect** blocked (Cola brand = no credit).
5.6 🟦 `/invoices/[id]` Payments → record a part payment → outstanding reduces; can't over-collect.

## Phase 6 — 👔 Owner Journey E: reconcile, schemes, dashboard, audit
6.1 🟩 `/vans/[id]` (the demo load) → record some **returns** → **Reconcile** → **expect** stock variance
     (out − sold − returned) + cash variance, flagged **ok / warn / critical** by the tiered tolerances.
6.2 🟩 On `/vans/[id]` → open the **delivery challan** (printable).
6.3 🟩 `/schemes` → toggle a **buy-X-get-Y** scheme on → capture a qualifying order → **expect** the freebie
     auto-applies as a **₹0 line** on the invoice.
6.4 🟦 `/dashboard` → Revenue/Collected/low-stock/vans reflect everything above; owner sees the route + top-SKU split.
6.5 🟦 Audit: every mutation above (order, invoice, deduct, collection, approval, adjust, return) wrote an `audit_log` row.

## Phase 7 — 🔐 Auth screen (⏭️ dormant — visual check only)
7.1 ⏭️ `/login` → phone step → "Send OTP". With no SMS provider yet it won't deliver a code — the **screen + flow**
     are verifiable; real sign-in waits on the provider + `NEXT_PUBLIC_AUTH_ENABLED=true`.
7.2 ⏭️ Role-nav: once a user row has a role, the sidebar hides what that role can't reach (owner=all,
     warehouse=no orders/retailers, driver_rep=no inventory). Full lockdown = go-live, not this pass.

---

## If something fails
- **Submit throws `column ... does not exist` / `function ... does not exist`** → a migration didn't apply → re-run `supabase/_apply_pending.sql`.
- **`/capture` "no priced SKUs" / unpriced block** → base prices missing → the catalogue ingest / `seed_base_prices` didn't run.
- **Dashboard still says "seed workbook"** → no live rows yet → run `npm run seed:demo`.
- **Note anything off** and I'll trace it to the file/line.

## After a clean pass
Merge `feat/aman-mvp-e2e → dev` (PR), then build **M08 user-management** + arrange the **SMS provider + staff numbers**
(client) to flip auth on for the pilot.

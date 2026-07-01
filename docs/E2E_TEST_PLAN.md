# E2E Test Plan — driver + retailer + owner journeys

_2026-07-01 (Aman + Claude). Step-by-step scripts to walk the MVP end-to-end once the
preconditions below are met. Each step = **action → expected result**. Tick as you go._

## Preconditions (must be true before Journey A)
1. **`.env.local`** present in the run env (3 Supabase vars) → `node scripts/check-supabase.mjs` prints **CONNECTION OK**.
2. **Migration backlog applied** (Supabase SQL Editor, in ledger order — `docs/MIGRATIONS.md`):
   `20260630134832` → `140020` → `141226` → `142741` (or the consolidated `supabase/_apply_30thJune.sql`),
   then `20260701124019_recon_tiers` + `20260701130612_schemes`. **Mark them Applied in the ledger.**
   > ⚠️ The ledger marks these `_pending_`. Hardik applies things live (the catalogue ingest was), so some
   > may already be applied and just unmarked — **confirm against the live DB first** (see Verify-DB below).
3. **Seed present:** `npm run seed:demo` (demo order→invoice→van if empty) + `npx tsx scripts/seed-opening-stock.ts`
   (June-1 warehouse stock) + base prices seeded (37/46 SKUs). Catalogue tax/HSN/MRP already live.
4. `npm run dev` running. Auth is **dormant** (`NEXT_PUBLIC_AUTH_ENABLED` unset) — no login needed to test the screens.

### Verify-DB (quick sanity before the journeys)
- `/catalog` shows 46 SKUs with a Tax column populated (HSN/GST) → catalogue ingest live.
- `/inventory` shows on-hand > 0 for several SKUs → opening stock loaded.
- `/orders` punch form lists SKUs with prices (no "unpriced" block on common SKUs) → base prices seeded.
- If `/capture` submit throws a column/function error → a migration is unapplied (go back to precondition 2).

---

## Journey A — Driver: capture a retail sale to an existing shop, paid cash (happy path)
The client's 6/29 priority. `/capture`.
1. Open **`/capture`** → **expect** the mobile flow: Route select + Retail/Wholesale toggle.
2. Pick a **Route** (e.g. ROUTE-1) + leave **Retail** selected → **expect** price list = retail.
3. **Shop = Existing** → search + pick an approved shop → **expect** the shop name shows selected.
4. **Items:** pick a SKU → set **Qty** with the stepper (e.g. 5) → **expect** a live line total; the total
   row shows **GST-inclusive** amounts (taxable + GST extracted from the price, not added on top).
5. Add a second SKU line → **expect** running order total updates.
6. **Payment = Cash**, amount = order total → **Review order** → **expect** the preview stage with line
   breakdown + inclusive tax summary.
7. **Confirm** → **expect** `stage: invoiced` → a **Link to the invoice** (`/invoices/[id]`).
8. Open the invoice → **expect** correct **seller entity by brand** (Jaypee for CSD/Soda, Falcon for
   Water/Juice/Energy), **HSN per line**, CGST/SGST split, inclusive totals matching the capture preview.
9. **Cross-check** `/inventory` → on-hand for those SKUs **dropped by the qty sold** (atomic FIFO deduct).
10. **Cross-check** `/invoices/[id]` Payments panel → cash collection recorded; outstanding = 0.

## Journey B — Driver: new shop, inline onboard with GPS, sell on the door
1. `/capture` → Route → **Shop = New** → **expect** inline onboarding fields (name/owner/phone/GSTIN).
2. Tap **capture GPS** → **expect** lat/lng filled (`navigator.geolocation`); customerType forced **cash**.
3. Add items + **Payment = Cash** → Review → Confirm → **expect** `invoiced` (cash shop auto-approves, so
   no admin gate) + the new shop now exists in `/retailers` as **cash / pending-or-approved** per the rule.
4. **Cross-check** `/retailers` → the new shop row shows owner, phone, GPS, customer_type = cash.

## Journey C — Driver: below-list price → admin approval (guard rail)
1. `/capture` → pick a SKU → **override the rate BELOW the list price** → **expect** a "below list" flag on the line.
2. Review → Confirm → **expect** `stage: pending_approval` (amber) — **no invoice yet**, order parked.
3. As owner/admin, open `/orders` → find the pending-approval order → **Approve** → **expect** it can now be
   confirmed & invoiced; **Reject** → **expect** it stays un-invoiced. (Role-gated — see Journey E.)

## Journey D — Retailer/Admin: onboarding, approval & credit
`/retailers`.
1. **Onboard** a shop with **customer_type = credit** + a **credit_limit** → **expect** it saves as **pending**.
2. As a non-owner role it should **not** be approvable; as owner → **Approve** → **expect** active + approved.
3. In `/capture`, sell to this credit shop with **Payment = Credit (pay later)** for an amount **within** the
   limit → **expect** invoice raised, outstanding = amount, **no cash collection**.
4. Sell again to push **over the credit limit** → **expect** the **brand-credit guard** blocks/flags it
   (Campa Cola/Jaypee = no credit; Campa Sure/Falcon = ₹1500 cap).
5. Record a part payment on `/invoices/[id]` Payments → **expect** outstanding reduces; can't over-collect.

## Journey E — Owner: van reconciliation, schemes, dashboard, roles
1. **Van:** `/vans` load a van (FIFO van_out) → `/vans/[id]` record returns → **Reconcile** → **expect**
   stock variance (out−sold−returned) + cash variance vs collections, flagged **ok/warn/critical** by the
   **tiered tolerances**. Print the **delivery challan** on `/vans/[id]`.
2. **Schemes:** `/schemes` → toggle a buy-X-get-Y scheme on → capture an order that qualifies → **expect**
   the freebie auto-applies as a **₹0 line** on the invoice.
3. **Dashboard:** `/dashboard` → (after live tiles are wired) low-stock tile, day's sales/invoices, van
   activity, recon flags. **Role-scope (#24):** a driver_rep must see only their route, no whole-business revenue.
4. **Audit:** spot-check that every mutation above wrote an `audit_log` row (order, invoice, deduct,
   collection, approval, adjust).

---

## What's NOT testable yet (and why)
- **Real driver login** — auth login UI not built + SMS/OTP provider & staff numbers are client-gated.
  Test with auth dormant for now; add the login gate before the pilot.
- **M25 challan PDF export** — challan *view* is built; the print/PDF format needs a client sample.
- **Deployed (Vercel) live data** — the 3 Supabase vars aren't in Vercel yet (deployed app uses seed fallback).

## Sign-off checklist
- [ ] Preconditions 1–4 green (keys + migrations + seed + dev)
- [ ] Journey A invoiced + stock deducted + cash recorded + inclusive GST correct
- [ ] Journey B inline onboard + GPS + cash auto-approve
- [ ] Journey C below-list → pending_approval → approve/reject
- [ ] Journey D credit onboarding + approval + brand-credit guard + collections
- [ ] Journey E van reconcile (tiered) + challan + schemes freebie + audit rows

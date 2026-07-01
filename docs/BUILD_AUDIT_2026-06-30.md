# Build Audit — built app vs client requirements (2026-06-30)

The transactional spine + catalog were built **before** the client's WhatsApp answers + Catalogue
arrived. This audits the actual code against those now-known requirements. **24 issues confirmed**
(each verified against the code with file:line): **7 critical · 11 high · 6 medium** — plus
**5 net-new scope items (S1–S5)** the chat surfaced that have no code to be "wrong" yet.

> **Reassurance / blast radius:** nothing has been issued to real customers yet — auth is **dormant**
> (`NEXT_PUBLIC_AUTH_ENABLED` unset), invoices carry a `tax_provisional` banner, and no real invoice
> series is live. So these are **pre-go-live fixes**, not a production incident. Most are *missing-context*
> (we built sensible defaults; the client's actual rules differ), not careless errors.

**Three buckets:** **[D]efect** (built wrong) · **[A]ssumption** mismatch (built one valid way, client
wants another) · **[S]cope** newly revealed (client wants it; wasn't in MVP). Owner = lane per `COORDINATION.md`.

---

## 🔴 CRITICAL (7) — block real invoicing

1. **[D] GST math is EXCLUSIVE, must be INCLUSIVE — TypeScript engine.** *(Hardik)*
   `src/lib/sales/invoice-tax.ts:46-58` does `taxable = qty*unitPrice` then adds tax on top.
   Client is **strictly inclusive** (sample: ₹120 incl 5% → taxable 114.29 + 5.71 = 120). Current code
   yields 120 + 6 = **126** → every invoice over-bills + the GST split is wrong. `invoice-tax.test.ts:7-28`
   locks the wrong math. **Fix:** `taxable = gross/(1+(gst+cess)/100)`, tax/cess = remainder, `lineTotal = gross`; rewrite tests.
2. **[D] Same EXCLUSIVE error in the real money path — SQL RPC.** *(Hardik)*
   `supabase/migrations/20260628110659_confirm_and_invoice_fn.sql:60-79` writes `line_total = taxable+tax+cess`
   on an exclusive base — this is what persists to `invoices`/`invoice_lines`. `money-path.acceptance.test.ts:39-44`
   locks it. **Fix must mirror #1** so UI and DB agree.
3. **[D] Soda set to 40% live (should be 18%).** *(Hardik migration / Aman seed)*
   `20260629150401_fix_provisional_tax_40_5.sql:8-9` lumps `Soda` into the 40% group (no NULL guard); Catalogue +
   `seed-data.ts:58` say **18%**. **Fix:** corrective migration `… set tax_slab_pct=18 where category='Soda'` + drop Soda from the 40% list.
4. **[S] No rate/discount field on order lines.** *(Hardik + Aman UI)*
   `order-logic.ts:8-12`, `punch-form.tsx:13`, `order_lines` schema (`20260628070453_sales.sql:67-78`) have **no discount** and
   no rep-entered rate (price is auto-resolved, read-only). Phase-1 capture needs **SKU/qty/rate/discount**. **Fix:** add discount col + editable rate/discount.
5. **[S] No admin-approval/override for below-list pricing.** *(Hardik)*
   No `pending_approval` order state, no list-vs-charged compare (`order_status` enum `20260628070453_sales.sql:9`). Client wants
   any below-list price to auto-route to **admin approval**. **Fix:** capture charged vs list, add approval state + gate `confirm_and_invoice`.
6. **[S] No retailer credit ledger / limit / outstanding.** *(Hardik)*
   `retailers` + `collections` have no per-shop credit account; `outstanding()` (`collections/logic.ts:16-18`) is per-invoice only.
   Client wants **credit-ledger shops** (and credit needs sign-off). **Fix:** `retailer_ledger` (or derived view) + credit_limit + over-limit guard.
7. **[S] The Phase-1 "Ground-Level Sales Capture" flow doesn't exist as one journey.** *(Aman UI + Hardik actions)*
   Pieces exist (order punch, `confirm_and_invoice`, collections) but no single screen does driver/van → shop select+**inline onboard** →
   SKU/qty/rate/discount → **payment mode** → preview → invoice. `createOrder` input is only `{retailerId?, route?, lines:{skuId,qty}}`
   (`orders-actions.ts:21-25`); payment is captured only *post*-invoice. **This is the client's stated immediate priority (6/29).**

## 🟠 HIGH (11)

8. **[D] HSN never reaches the invoice.** *(Hardik)* No migration writes `skus.hsn`; `invoice_lines` has no `hsn`; render shows none
   (`invoice-data.ts:92,104`, `confirm_and_invoice_fn.sql:52`). A GST invoice must show HSN. **Fix:** snapshot `hsn` onto `invoice_lines` + render.
9. **[A] Single price list (retailer/route scope) — no Retailer-vs-Wholesale list.** *(Hardik)* `pricing.ts:9-16`, `price_list` schema have no
   list-type. Client wants **two lists** (retail + negotiable wholesale). **Fix:** add `list_type` + customer category.
10. **[A] Fixed `discount_ceiling {pct:5}` contradicts the approval model — and is dead code.** *(Hardik)* `config/defaults.ts:13` — unused; client wants a workflow, not a %. **Fix:** remove/repurpose, replace with below-list detection.
11. **[S] No cash-vs-credit shop type; approval is blanket.** *(Hardik)* `retailers` has no `customer_type`; every shop goes `pending`. **Fix:** add cash/credit, auto-approve cash, sign-off credit.
12. **[S] Shop-photo capture (anti-fraud) absent.** *(Hardik)* No photo column/upload (`WORKLOG.md:90` "photo deferred"). Client requires it. **Fix:** `shop_photo_path` + camera upload via storage proxy.
13. **[D] GPS columns exist but the form never captures them.** *(Hardik)* `lat/lng` in schema + type, but `retailers-client.tsx` has no geolocation call → always null. **Fix:** `navigator.geolocation` on save.
14. **[A] Low-stock = fixed 10-case threshold, not dynamic "< 5 days of avg sales."** *(Hardik logic + Aman tile)* `inventory/logic.ts:31-33`, `defaults.ts:36`. **Fix:** compute avg daily sales from `stock_movements`, flag days-of-cover < 5.
15. **[S] Wastage/Adjustment never written** (enum exists, no RPC/service). *(Hardik)* damaged/expired can't be removed. **Fix:** `adjust_stock` RPC (reconcile the `qty>=0` constraint) + service.
16. **[S] No stock-adjustment / weekly physical-count screen** for the Warehouse Manager. *(Hardik)* **Fix:** count screen (variance vs system) posting adjustments.
17. **[A] Invoice seller block is single — doesn't switch by brand (Falcon=Sure / Jaypee=Cola).** *(Hardik)* `invoice-data.ts:43-48,97` one `seller` config. Placeholder also says "Jaypee Advertisers" (entity is "Jaypee Enterprises"). **Fix:** two seller profiles keyed by brand.
18. **[S] No `brand` attribute on SKUs** to drive #17 (brand only in free-text name). *(Aman)* **Fix:** add `brand` col + type + seed (Campa Sure / Campa Cola).

## 🟡 MEDIUM (6)
19. **[D] Tax migration overwrites by category with no NULL-guard** → re-running clobbers per-SKU rates (Soda drift). *(Hardik)* Add the `and tax_slab_pct is null` guard; make `seed-data.ts` the source of truth.
20. **[A] Gluco Energy taxed 40% but client classes it as Juice (5%).** *(Aman)* `seed-data.ts:55` category `Energy` → reclassify to `Juice`.
21. **[S] Retailer master has no customer-type to pick the price list.** *(Hardik)* (pairs with #9/#11.)
22. **[S] No distinct owner-name field** (conflated with contact name). *(Hardik)* add `owner_name`.
23. **[D] Approval action not role-gated — anyone can approve.** *(Hardik)* `retailers/actions.ts:72-88` uses service role, no `requireRole`. RBAC already exists (`auth/session.ts:47`) → gate to owner/warehouse now.
24. **[A] Owner dashboard (whole-business revenue + all routes) reachable by reps.** *(Aman + rbac)* `rbac.ts:15` grants `/dashboard` to `driver_rep`; `dashboard/page.tsx` ignores role. Reps must see only own route + targets. Fix before wiring live aggregates.

---

## Additional scope surfaced by the chat (tracked build items, not code-defects)
These are client requirements with **no existing code to be "wrong"** — they're net-new scope to plan
(mostly Hardik's sales/inventory lane; some joint). Logged here so they're actioned, not just noted.

- **S1 [Admin panel] (Aman + Hardik).** Admin-only screen to add **seasonal SKUs + schemes/freebies**,
  hidden from reps. Catalog CRUD exists (`/catalog`, my lane) but is **not role-gated** (TODO-auth) and has
  no scheme/freebie management. Gate to Owner/Admin once auth lands; scheme mgmt pairs with S2.
- **S2 [Schemes/freebies engine] (Hardik).** buy-X-get-Y + free goods (zero-value stock deduct **with GST**).
  Currently only in `MISSING_INPUTS.md:21` as "Phase 2"; client wants it. Needs scheme model + apply-at-order + free-line on invoice.
- **S3 [B2B order-then-deliver + walk-in wholesale] (Hardik).** A wholesale/corporate channel with
  **negotiable** pricing alongside van pre-sell. Pairs with the two-price-lists gap (#9) + below-list approval (#5).
- **S4 [Edit-lock at challan dispatch] (Hardik).** Order edits allowed **only before the delivery challan is
  printed/dispatched**; after, returns only. Today the lock point is `confirm_and_invoice` (no challan stage — M25 unbuilt).
- **S5 [Rep daily targets] (Aman + Hardik).** Reps see **own route + own daily targets** (complements #24's
  margin-hiding). No target field/metric exists in `dashboard/data.ts` — add per-rep target + scoped view.

## What aligned (don't re-fix)
3 roles (owner/warehouse/driver_rep) ✓ · **strict FIFO + batch/expiry on receive/deduct** ✓ (matches "strict FIFO") ·
individual-retailer tracking exists ✓ · cola/energy = 40%, water/juice = 5%, cess 0 ✓ (only Soda + Gluco wrong) ·
returns-after-dispatch (`record_returns`) ✓ · atomic invoice+deduct+numbering ✓.

## Suggested remediation order
1. **Tax correctness pass (Hardik, with Aman on seed):** inclusive math in TS + RPC + tests (#1,#2), Soda 18% (#3),
   Gluco→Juice (#20), HSN onto invoice (#8), migration guard (#19). *Highest priority — money correctness.*
2. **Phase-1 Sales Capture (joint):** rate/discount on lines (#4), payment-mode at sale, inline shop onboarding, preview, the single screen (#7).
3. **Pricing/approval (Hardik):** two price lists (#9,#21), below-list approval (#5,#10).
4. **Retailer onboarding (Hardik):** credit ledger (#6), cash/credit (#11), photo (#12), GPS (#13), owner-name (#22), role-gate approval (#23).
5. **Inventory (Hardik):** dynamic low-stock (#14), wastage/adjustment + count screen (#15,#16).
6. **Seller-by-brand (Hardik + Aman SKU brand) (#17,#18) · dashboard role-scoping (Aman) (#24).**

Most of this is **Hardik's transactional-spine lane** — needs his review/build, coordinated via PR. Aman's direct items:
seed category fixes (#3 data, #20), SKU `brand` (#18), dashboard role-scoping (#24), and the Sales-Capture UI (#7, joint).

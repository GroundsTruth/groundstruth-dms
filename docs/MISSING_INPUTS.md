# Missing inputs — what's left to unblock (client / CA / Drive / Aman)

_For Hardik + Aman. Owned by Hardik. Update Status as items arrive._ The build is **not**
halted on these — modules ship with safe defaults; these slot in as **data / config**, not
code rewrites. Anything marked **GO-LIVE GATE** = don't issue real documents to the client's
customers until confirmed. _Last refreshed: 2026-06-28 — Hardik's lane is built; what's left
below is mostly **client data** + **Aman's UI half**._

## A. Ask the CLIENT now (data / docs)

### A1 — gates real invoicing (M21/M22 go-live)
| # | Input | Needed for | Build workaround in place | Status |
|---|-------|-----------|---------------------------|--------|
| 1 | **Invoice + challan format/sample** (a real Jaypee tax invoice & challan, PDF/image) | M21 invoice layout, M25 challan | Built to a **standard GST Rule-46 layout**; swap to client's | ⬜ needed |
| 2 | **Per-SKU GST % + cess % + HSN code** | Correct tax on M21/M22 | **Provisional statutory rates seeded** (aerated 28%+12%, water 18%, juice 12%); `tax_provisional` flag shown on invoice | ⬜ needed · **GO-LIVE GATE** |
| 3 | **Distributor GSTIN** (+ legal name, address, state code) | Mandatory seller block on every GST invoice | `config.seller` placeholder; invoice prints "[GSTIN pending]" | ⬜ needed · **GO-LIVE GATE** |
| 4 | **CA sign-off** that #1–#3 are GST-compliant (P10) | Compliance before real issuance | n/a — the formal gate, not a code dependency | ⬜ needed · **GO-LIVE GATE** |
| 5 | **Rounding + place-of-supply rule** (per-line vs total; intra/inter-state CGST+SGST vs IGST) | Tax math correctness | Defaulting to intra-state, round at invoice total; parameterised | ⬜ confirm |

### A2 — completeness / accuracy
| # | Input | Needed for | Workaround | Status |
|---|-------|-----------|-----------|--------|
| 6 | **9 missing SKU selling prices** (`skus.rate_per_case` null) | Ordering those 9 SKUs | 37/46 seeded from workbook; punch form blocks unpriced SKUs | ⬜ needed |
| 7 | **MRP per SKU** | MRP column on invoice; price ceiling | `skus.mrp` null; omitted for now | ⬜ optional |
| 8 | **units_per_case per SKU** | Case ⇄ unit display, loose units | everything in **cases** for now | ⬜ optional |
| 9 | **Retailer master list** (name, shop, address, phone, GSTIN, beat) | Populate the built `/retailers` + per-retailer pricing + named-shop invoices | Onboarding UI live; route-only until the list lands | ⬜ needed |
| 10 | **Sales model confirmation** (pre-sell / deliver / hybrid) (P08) | Order→invoice→delivery nuance | Schema supports both; assuming **hybrid** | ⬜ confirm |
| 14 | **Opening stock snapshot** (on-hand per SKU/batch at go-live) | Seed `stock_batches` so inventory isn't empty at pilot (M35) | Receive flow works; needs real opening balances | ⬜ needed for pilot |
| 15 | **Route / beat list confirmation** (ROUTE-1…7?) | Order/van/retailer route fields | Assumed `ROUTE-1..7` from the workbook | ⬜ confirm |
| 16 | **Config thresholds** — low-stock (default 10 cases), discount ceiling (5%), recon tolerance | Alerts + reconciliation flagging | Sensible defaults seeded in `config`; client to confirm | ⬜ confirm |

### A3 — auth & go-live
| # | Input | Needed for | Workaround | Status |
|---|-------|-----------|-----------|--------|
| 11 | **Staff / driver list + roles** (owner / warehouse / driver-rep) | Seed real `users`; `van_loads.driver_user_id` | Auth **backend built**; first login auto-creates a row (default driver-rep) | ⬜ needed for auth |
| 12 | **SMS / OTP provider** (gateway + sender ID) enabled in Supabase | M05 OTP actually sends | OTP flow **built**; provider not yet enabled → won't send | ⬜ needed · **GO-LIVE GATE** |
| 13 | **Per-feature acceptance criteria** (P11 → MSA Schedule C) | M33 QA + M9/M15/M23/M28 sign-off | Module acceptance tests written to best understanding | ⬜ needed for sign-off |

## B. Blocked on AMAN (in-team — not client). His half unblocks our shared modules.
| Module | Aman builds | Then Hardik does | Status |
|--------|-------------|------------------|--------|
| **M05/M06** | `/login` + OTP screen (to the `requestOtp`/`verifyOtp` contract in `docs/AUTH_PLAN.md`) | nothing — backend done | ⬜ Aman |
| **M07** | **Confirm the role→screen matrix** (covers his dashboard/catalog) + role-hide nav (`allowedRoutesFor`) | wire `requireRole(...)` into my mutating actions; flip `AUTH_ENABLED` | ⬜ Aman + Hardik |
| **M08** | User-management screen (list users, assign roles) | actions (`updateUserRole`) — small, my lane, quick once UI agreed | ⬜ Aman + Hardik |
| **M09** | — | acceptance: each role sees only its screens (after AUTH_ENABLED) | ⬜ joint |
| **M30/M31** | Owner dashboard live tiles (consumes my `getLowStockSkus`, recon, collections) | nothing — accessors ready | ⬜ Aman |
| **nav** | Add `/orders` + `/retailers`; fix `/collections` link | nothing | ⬜ Aman |

> **Net:** to *complete the shared lanes (M05–M09)*, the one real dependency is **Aman's login/OTP UI + matrix confirmation + flipping `AUTH_ENABLED`**. Everything Hardik owns is built and merged.

## Summary — the 3 that most unblock go-live
1. **Invoice/challan format + GST values + GSTIN** (#1–#3) — turns provisional invoices into real ones. The true go-live gate.
2. **Aman's login/OTP UI + role matrix** (§B) — completes M05–M09 so the app can be locked down.
3. **Retailer list + opening stock** (#9, #14) — to run a real pilot (M35) on live data.

Nothing here blocks the *build* — only *go-live* of invoicing and the *auth* lockdown.

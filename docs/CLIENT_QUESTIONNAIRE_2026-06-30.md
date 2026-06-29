# Campa DMS — quick follow-up questionnaire (2026-06-30)

Thank you for the **sample invoice** and confirming **Falcon Enterprises** as the billing
entity — both unblocked a big chunk of the build. This is a short list of the **few things
still open**. Most have a working default already in the system, so nothing here blocks us
building — these mainly unblock **real invoicing** and **go-live**.

> Wherever something doesn't apply, just write *"we don't do this"* — that's a real answer and
> usually makes the system simpler. _(Internal cross-ref: `docs/MISSING_INPUTS.md`.)_

## ⭐ If you only answer five things
1. **CA sign-off on the tax table** (Section A1) — confirm GST%/HSN/cess per product.
2. **What are "Mix" and "Power UP"?** (A2) — we can't tell from the name.
3. **Do you bill individual shops, or by route?** (Section C).
4. **MRP per product** (A4) — for the bill.
5. **Delivery challan sample** (A5) — we have your invoice; we still need the challan.

---

## A. Invoicing & tax

**A1 — Confirm the tax table (needs your CA).** We researched the current (post-Sept-2025)
GST for each product and pre-filled the system **provisionally**. Please have your CA confirm
**HSN code, GST %, and cess** per product. Our researched starting point:

| Product group | GST | Cess | HSN |
|---|---|---|---|
| Cola / Lemon / Orange (carbonated, incl. "Zero") | 40% | 0 | 2202 10 10 |
| Energy drinks (Gold Boost, Berry Kick, Gluco) | 40% | 0 | 2202 99 91/90 |
| Club Soda (plain) | 18% | 0 | 2201 10 20 |
| Fruit-juice drinks (Rasiki, Suncrush, Nimbu Pani) | 5% | 0 | 2202 99 29 |
| Packaged water (incl. "Water Gold") | 5% | 0 | 2201 10 10 |
| Jeera (jaljeera drink) | 40% | 0 | 2202 99 90 |

*(The big change from earlier: aerated & energy drinks are now a single ~40% slab with no
separate cess — your CA will confirm whether this is right for your exact products.)*

**A2 — Identify two products.** "**Mix - 500 ML**" and "**Power UP**" (1L/200/500) — what
are they exactly (soda? glucose/energy? juice?)? The tax rate depends on it, so we left them
blank rather than guess.

**A3 — A few product checks** (these change the tax): Is **Club Soda** plain/unsweetened (or
flavoured/sweetened)? Is "**Jeera**" a ready-to-drink bottle (or a dry powder)? Is "**Nimbu
Pani**" made with real lemon juice (or just flavoured)?

**A4 — MRP per product** — the printed MRP for each SKU (for the bill / price checks). *(It
may be in your Beverages Catalogue — we can read it from there if you confirm.)* On the sample
invoice, MRP ₹360 vs billing ₹120 for 1 L water — is MRP **per piece** or **per case**?

**A5 — Delivery challan sample** (PDF/photo) — we've matched your **invoice** layout; we still
need the **challan** (van load-out / delivery paperwork) to match it too.

**A6 — Pricing basis & rounding** — your rates look **GST-inclusive** on the sample (tax taken
out of the price). Please confirm, and confirm any **rounding** rule (per line vs per bill).

**A7 — Brand names** — are "**Platinum**" / "**Gold**" the retail brand names for your water
SKUs? (The sample bills water as "PLATINUM"; our list calls it "Water".)

**A8 — Later, not now:** invoice **number format** (prefix / yearly reset / any per-van
series) — we'll use a placeholder until you confirm. Do you need **e-invoice (IRN)** or
**e-way bill**? **Credit notes / returns after a bill** — this phase, or handled manually?

## B. Products & pricing
- **B1 —** Selling rate per case for the **9 products** not in the June workbook (we'll list them).
- **B2 —** **Units per case** where it varies (e.g. 24 bottles/case) — for case ⇄ piece.
- **B3 —** Max **discount** a rep can give without approval (a number, or "none"). Any
  **schemes** (buy-X-get-Y, free goods)? (Schemes are a later add-on; we just note them now.)

## C. Customers (retailers)
- **C1 —** Do you track **individual shops** as customers, or only **routes**? *(Your workbook
  is route-based, but the sample invoice bills a named shop "MACHAN" — so we want to be sure.)*
  If route-only, we skip retailer onboarding/ledger (simpler).
- **C2 —** If shops: a **list** — shop name, owner, address, phone, GSTIN (if any), route.
- **C3 —** Onboarding a new shop in the field — what to capture (photo? location? owner phone?)
  and **who approves** a new shop (auto, or owner sign-off)?

## D. Inventory
- **D1 —** Do you track **batch & expiry** per product? (If yes we add sell-oldest-first + expiry
  alerts; if no we keep it simple — on-hand only.)
- **D2 —** What does **"low stock"** mean — a number per product, or one global rule (default: 10 cases)?

## E. People & go-live
- **E1 —** Confirm the **staff list** (we have your driver directory) + **2–3 pilot users**
  (name + phone) to test first.
- **E2 —** **SMS/OTP provider** for phone login (so login codes actually send).
- **E3 —** Confirm config numbers: **discount ceiling** (default 5%), **reconciliation
  tolerance**, **low-stock** default.
- **E4 —** Your **logo** (best quality) + brand colours, if not already shared (to white-label
  the app + bills).

---
*Everything above has a safe default in the system today — these answers turn provisional
invoicing into real, CA-compliant billing and let us run a live pilot.*

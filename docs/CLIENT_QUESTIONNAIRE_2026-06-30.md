# Campa DMS — follow-up checklist (Round 2)

Thank you for the detailed answers, the **product Catalogue**, the **sample invoice**, and the
**driver list** — that closed most of our open questions. We've captured all of it (summary at
the bottom). Below is the **short list of what's still pending** to finish real invoicing and
go live. Most have a working default already in the system, so none of this blocks the build.

> Where something doesn't apply, just write *"n/a"* — that's a real answer.

## ⭐ Still needed from you

### 1. Tax — final confirmation
- **Updated Catalogue with the new GST rates.** The Catalogue you shared still shows the
  **old** rates for **Water (18%)** and **Juice (12%)** — your sample invoice already bills
  **Water at 5%**, and the Sept-2025 GST revision moved water & most juice drinks to **5%**.
  Please send the **GST-revised Catalogue** (you mentioned it's being updated).
- **CA sign-off** on the final per-product **GST % + HSN** (a one-line confirmation from your CA).
- Quick confirms: is **Gluco Energy** taxed as a **juice** (as in the Catalogue) or an energy
  drink? And does **"Mix – 500 ML"** = Suncrush Mixed Fruit?
- **Rounding rule** — round each line, or the bill total? And do you ever bill **inter-state**
  (outside Haryana)? (decides CGST+SGST vs IGST on the invoice).

### 2. Delivery challan sample
The file shared was the **Campa product portfolio**, not a delivery challan. Please share a
**real delivery challan** (PDF/photo) so we match your van load-out / delivery paperwork.

### 3. Billing entity / GSTIN
You bill under two names — **Falcon Enterprises (Campa Sure)** and **Jaypee Enterprises
(Campa Cola)**. The samples we have both use GSTIN **`06AIMPB2225L2ZE`**. Please confirm:
- Does **Campa Cola (Jaypee)** bill under the **same GSTIN**, or a **different** one?
- The exact **legal name + address** to print for each, so the invoice shows the right seller per brand.
- **Which products go under which entity** — e.g. Campa Cola/Lemon/Orange/CSD → Jaypee, water/Campa
  Sure → Falcon. Please confirm the **full split** (incl. energy, juice, soda) so each invoice picks the right seller.

### 4. Logins & go-live
- **Staff phone numbers** for each person (you mentioned next week) — phone is the login.
- **SMS / OTP provider** (gateway + sender ID) so login codes actually send.
- **2–3 pilot users** (name + phone) to test first.

### 5. Branding
- Your **company logo** (best-quality file). And confirm what shows on the app & bills —
  **Campa** branding, **your** distributor logo, or **both**?

### 6. Pricing & schemes (for the B2B / wholesale side)
- The **Corporate / Wholesale price list** (bulk rates) — or confirm these are set **per-deal /
  negotiable** with an admin override each time.
- **1–2 examples of a current scheme** (e.g. buy-X-get-Y / free bottles with cases) so we model
  the scheme + freebie logic correctly.

### 7. A few smaller settings
- **Reconciliation tolerance** — how much cash/stock variance is acceptable before it's flagged?
- **e-invoice (IRN) / e-way bill** — required for this rollout, or skip for now?
- Any **cans** still missing a selling price in the Catalogue (a few were blank).

### 8. Credit, targets & sign-off
- **Credit terms** for credit-ledger shops: a **credit limit** per shop, the typical **credit period**
  (days), and when an account is **overdue** + who should be alerted.
- **Rep daily targets** — how are they set (per rep / per route, and who decides)? so each rep sees their own.
- **Per-feature acceptance criteria** — anything specific you'll check before signing off each module.

---

## ✅ Captured from your answers — no need to resend
Invoices: **yes**, rates **strictly GST-inclusive**, numbering per your sample · **MRP, units/case,
GST, HSN** from the Catalogue · **track individual shops** + rep onboarding (shop & owner name,
owner phone, **GPS**, **shop photo**, GSTIN optional; cash-only = on-spot, **credit needs
admin sign-off**) · **batch + expiry with strict FIFO** (mfg/expiry on incoming) · low-stock =
**under 5 days of average sales** · weekly Fri/Sat **physical count + adjustment** screen ·
damaged/expired = **wastage adjustment** (Phase 1), RTV later · selling = **van pre-sell + B2B
order-then-deliver + walk-in wholesale** · **order preview before confirm**, edits locked once
the challan is dispatched · **two price lists** (retail + wholesale) · **any price below list
needs admin approval** · **schemes = yes** · roles = **Owner / Warehouse Manager / Van Sales Rep
& Driver**; **reps never see margins** (own route + targets only) · **admin-only** panel to add
SKUs/schemes · Campa **purple, clean/minimal** UI.

_If any of the captured items above is wrong, tell us and we'll adjust._

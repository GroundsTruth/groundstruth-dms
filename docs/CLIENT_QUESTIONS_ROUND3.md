# Campa DMS — follow-up checklist (Round 3)

Thanks — the updated Catalogue, the redesigned delivery challan, the two sample invoices,
the dual driver directory, the logo, and the detailed answers **closed almost everything**.
We're proceeding with the build on all confirmed points (summary at the bottom). Just a
**few small items** left — where something doesn't apply, "n/a" is a fine answer.

## ⭐ Still needed from you

1. **Seller entity for Energy / Juice / Soda.**
   You confirmed **CSD/Cola/Lemon/Orange → Jaypee Enterprises** and **Water/Campa Sure →
   Falcon Enterprises**. The catalogue also has **Energy** (Gold Boost, Berry Kick),
   **Juice** (Rasiki, Suncrush, Gluco), and **Soda** (Campa Club Soda). Which entity bills
   each of these three? (Our working default until you confirm: Soda → Jaypee (Campa brand);
   Energy + Juice → Falcon. Please correct if wrong — it decides the seller printed on those invoices.)

2. **Jaypee Enterprises — legal name + registered address** to print on its invoices.
   We have Falcon's (from its sample). Is Jaypee's address the one on the challan
   (`59, Central Avenue Rd, Block L, South City I, Sector 45, Gurugram – 122016`)? And Jaypee's
   GSTIN is the same `06AIMPB2225L2ZE` as Falcon's samples — please confirm that's correct
   (two entities normally have different GSTINs; Falcon's is `06FVEPS8609PIZN`).

3. **Rounding + inter-state.** Round tax **per line** or on the **bill total**? And do you ever
   bill **outside Haryana** (inter-state)? (Decides CGST+SGST vs IGST.) Default we're using:
   per-line rounding, intra-state CGST+SGST (matches your samples).

4. **Schemes — BUILT (confirm mechanics).** We've built the admin-configurable buy-X-get-Y
   engine (cross-SKU, case-level; freebies added as ₹0 lines) — your two examples model directly.
   Confirm: (a) freebies **deduct free stock** from inventory (we assume yes), and (b) is the
   free item ever at the **open-bottle** (loose piece) level, or always full cases?

5. **New catalogue products.** Your updated Catalogue has ~14 items not in the original master
   (extra cans/variants, e.g. CSD Can 185/330, Suncrush cans, Rasiki Mixed Fruit). Should we add
   these as new SKUs now? (We've applied tax/MRP/price to the 37 that matched.)

6. **Per-feature acceptance criteria** — anything specific you'll check before signing off each
   module (invoice, reconciliation, van load-out, credit)? Helps us hit "done" first time.

## ✅ Captured & building now (no action needed)
- **Tax final** (from updated Catalogue): CSD/Energy = 40% · Water/Juice/**Soda** = 5% · cess 0;
  per-SKU HSN. **Gluco = Juice 5%**, **"Mix" = Suncrush Mixed Fruit (Juice 5%)**, Jeera = 40%.
  (This corrects our earlier Soda-18% / Gluco-40%.)
- **MRP + units-per-case + retail prices** ingested from the Catalogue.
- **Missing prices** — admin punches them in when that stock lands (no blocker).
- **Delivery challan** — matching the redesigned layout (Rate/Qty Out/Return/Qty Sale/Discount/Amount).
- **Dual entities** — Falcon (`06FVEPS8609PIZN`) / Jaypee (`06AIMPB2225L2ZE`), invoice picks seller by product.
- **Dual branding** — distributor logo (PPT_1) + entity name on app & invoices.
- **Pricing** — admin manual rate override at order time; per-retailer Campa Sure prices.
- **Reconciliation tolerances** — tiered: cash <0.1% ok / 0.1–0.3% warn / >0.3% critical;
  stock <0.2% / 0.2–0.6% / >0.6%.
- **Credit** — Campa Cola (Jaypee): no credit (cash/UPI only). Campa Sure (Falcon): ₹1,000–1,500/shop,
  1–3 day period, overdue flag after 3 days.
- **Login/OTP** — phone login; **default test OTP `1234`** for Phase-1 (no gateway yet); pilot users from the driver list.
- **Targets** — not enforced (per your note).

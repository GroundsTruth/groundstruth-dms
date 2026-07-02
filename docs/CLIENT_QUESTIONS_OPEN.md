# Campa DMS — open questions for the client (consolidated)

_2026-07-02. The single, current list of what we still need from you. Earlier rounds closed
almost everything (tax, HSN, challan layout, dual entities, credit rules, reconciliation
tolerances, logo, driver directory) — thank you. Below is **only what's still open**, grouped
by theme. Each item says **why it matters** and **our working default** so nothing is blocked
in the meantime — where a default is fine, just reply "ok"; where something doesn't apply, "n/a"._

**Nothing here stops us building or demoing.** These items gate two things only: (1) issuing
**real GST invoices** to your customers, and (2) turning on **login/lockdown** for field staff.

---

## A. Tax & invoicing (gates real invoices)

1. **Seller entity per category.** Confirmed: CSD / Cola / Lemon / Orange → **Jaypee**;
   Water / Campa Sure → **Falcon**. Still to confirm which entity bills:
   - **Energy** (Gold Boost, Berry Kick) — default: Falcon
   - **Juice** (Rasiki, Suncrush, Gluco) — default: Falcon
   - **Soda** (Campa Club Soda) — default: Jaypee (Campa brand)
   *Why:* decides the seller name/GSTIN printed on those invoices.

2. **Jaypee legal identity.** We have Falcon's from its sample. For Jaypee we need the exact
   **legal name + registered address + state code** to print. Is the address the one on the
   challan (*59, Central Avenue Rd, Block L, South City I, Sector 45, Gurugram – 122016*)?

3. **GSTIN confirmation (important).** Jaypee's GSTIN currently reads the **same** as Falcon's
   sample — `06AIMPB2225L2ZE` — while Falcon's own is `06FVEPS8609PIZN`. Two separate legal
   entities almost always have **different** GSTINs. **Please confirm each entity's correct GSTIN**,
   so we don't print the wrong tax number.

4. **Soda GST rate — please confirm the exact %.** Our notes conflict internally: one source
   says **Soda = 5%**, another **18%**. *Why:* directly changes the tax on every Club Soda invoice.
   Please state the single correct rate (and cess, if any).

5. **Rounding + place of supply.** Round tax **per line** or on the **bill total**? And do you ever
   bill **outside Haryana** (inter-state)? *Why:* decides CGST+SGST vs IGST. Default: per-line
   rounding, intra-state CGST+SGST (matches your samples).

6. **Invoice numbering.** Preferred **prefix + starting number + format** (e.g. `FAL/25-26/0001`),
   and should Falcon and Jaypee use **separate series**? Default: single `INV#####` series until you say.

7. **Challan sample (optional).** We built the delivery challan to your redesigned layout
   (Rate / Qty Out / Return / Qty Sale / Discount / Amount). A **filled sample** would let us match it
   exactly — otherwise we proceed with the layout as understood.

8. **MRP per SKU (optional).** For the MRP column on invoices / price ceiling. If it's in the
   Beverages Catalogue we can extract it — or send a simple MRP-per-SKU list. Default: MRP column omitted.

---

## B. Products & pricing

9. **~14 new catalogue products.** Your updated Catalogue has items not in the original list
   (e.g. CSD Can 185/330, Suncrush cans, Rasiki Mixed Fruit). **Add them as products now?**
   If yes, we'll bring in tax/MRP/price as already applied to the existing items.

10. **9 SKUs with no selling price.** These had no June sales so we have no rate. We'll let the
    admin punch the price in when that stock lands — or you can send the rates. *Why:* those SKUs
    can't be ordered until priced. (List available on request.)

11. **"Power UP" product identity.** One catalogue line we still can't map to a specific SKU
    (we resolved "Mix" → Suncrush Mixed Fruit). What product is **"Power UP"** (size/brand/tax)?

---

## C. Schemes (buy-X-get-Y — built; confirm mechanics)

12. **Free-goods stock.** When a scheme gives a free item, should the freebie **deduct from
    inventory** (reduce on-hand)? Default: **yes**.

13. **Free item unit.** Is a free item ever at the **open-bottle / loose-piece** level, or always
    **full cases**? Default: full cases.

---

## D. Credit (mostly confirmed — confirm defaults)

14. **Per-shop credit limit default.** Confirmed: Campa Cola (Jaypee) = **no credit** (cash/UPI only);
    Campa Sure (Falcon) = **₹1,000–1,500/shop**, 1–3 day period, overdue flag after 3 days.
    What **default limit** should a newly onboarded credit shop get (₹1,000? ₹1,500?), and can the
    admin override per shop? Default: ₹1,500, admin-overridable.

---

## E. Retailers & routes

15. **Retailer master list.** Name, shop name, address, phone, GSTIN, and route/beat per shop.
    *Why:* to pre-load `/retailers` (today it's route-only + onboard-on-the-fly). Not a blocker —
    but a real pilot reads better with your real shops.

16. **Route/beat confirmation.** We assumed **ROUTE-1 … ROUTE-7 + Warehouse** from the workbook.
    Correct names/count?

---

## F. Auth & go-live (gates the login lockdown)

17. **SMS / OTP gateway.** The provider + **sender ID** to enable phone-OTP in Supabase.
    *Why:* until this is on, real OTP codes won't send. **This is the main go-live gate for login.**

18. **Test phone numbers for the pilot.** For Phase-1 you mentioned a fixed test OTP `1234` —
    please give the **phone numbers** to register as test users (with fixed OTP) so we can trial
    login before the real gateway is live.

19. **Staff/driver list — confirm & consent.** We have `Jaypee_Driver_Directory` (8 staff: 2 store
    managers → warehouse, 6 drivers → driver-rep). Confirm the **role mapping** and that we may
    seed their **phone numbers** as login users. (PII — kept off git.)

---

## G. Operations & sign-off

20. **Opening stock at go-live.** On-hand per SKU (and batch/expiry if you track it) on the day we
    switch on. We loaded the June workbook (26/28 SKUs) as a starting point; a go-live snapshot makes
    inventory correct from day one.
    - Two items need a name alias to map: **"Energy Berry Kick 150 PET"** and **"Raskik Gluco Energy 250ml"** —
      are these the same as SKUs already on our list?

21. **Sales model — replace or feed?** Should this app **replace** the current WhatsApp sales flow,
    or **run alongside** it (data fed in)? Default: assuming hybrid.

22. **Config thresholds.** Confirm: low-stock alert = **< 5 days of average sales** (you stated),
    and any specific **discount ceiling** / **reconciliation tolerance** beyond the tiers you gave.

23. **Per-feature acceptance criteria.** For each module (invoice, reconciliation, van load-out,
    credit), what will you specifically check before signing it off? Helps us hit "done" first time.

---

## H. Heads-up for later (Phase 2 — not now, just flagging)

24. **Returnable bottle / crate deposit ledger.** If you take deposits on returnable glass/crates,
    we'll design a deposit ledger in Phase 2. Do you operate deposits today? (No action needed now.)

---

### Fastest path to go-live
The three that unblock the most: **(A1–A4) entity/GSTIN/Soda-rate confirmation** → real invoices;
**(F17–F19) SMS gateway + test numbers + staff consent** → login; **(E15 + G20) retailer list +
opening stock** → a real pilot.

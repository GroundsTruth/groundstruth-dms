# Campa DMS — open questions for the client

_2026-07-02 (v2). Your "Follow up, remaining stuff" doc + the 7/1 Catalogue + challan + driver
directory closed most of our earlier list — thank you. **Only 8 things remain**, and three of
them are one-word confirmations. Working defaults noted so nothing is blocked; where a default
is fine just reply "ok"._

## ⭐ Still needed

1. **Jaypee's exact legal name.** Your invoices print **"JAYPEE ADVERTISERS"** (4th Floor 1404,
   DLF Phase-4, Gurugram 122009), but the follow-up doc says "Jaypee **Enterprises**". Which name
   must print on tax invoices? *(Default: JAYPEE ADVERTISERS, as on your sample invoice.)*

2. **Falcon GSTIN check.** We have `06FVEPS8609PIZN` — is the 13th character the letter **I** or
   the digit **1** (`06FVEPS8609P1ZN`)? One glance at the GST portal settles it; it must be exact
   on invoices.

3. **Duplicate phone in the driver list.** `9289151748` is listed for BOTH **Dharamveer Singh**
   (Jaypee Van 5) and **Hira Lal** (Falcon Van C). Phone is the login identity — please send the
   correct number for one of them.

4. **Seller entity for Energy & Juice.** Confirmed: CSD/Cola family → Jaypee; Water/Campa Sure →
   Falcon; and your Jaypee invoice shows **Club Soda → Jaypee**. Who bills **Energy** (Gold Boost,
   Berry Kick) and **Juice** (Rasiki, Suncrush, Gluco)? *(Default: Falcon.)*

5. **Tax rounding + inter-state.** Round GST **per line** or on the **bill total**? And do you
   ever bill outside Haryana? *(Default: per-line, intra-state CGST+SGST — matches your samples.)*

6. **Scheme freebies & stock.** A free case/bottle given under a scheme — should it **deduct from
   inventory** like a sale at ₹0? *(Default: yes.)*

7. **Opening stock at go-live.** On-hand cases per product on the switch-on day (batch/expiry if
   tracked). Also: are "Energy Berry Kick 150 **PET**" and "**Raskik** Gluco Energy **250ml**" the
   same as the Berry Kick 150 ML and Gluco Energy 150 ML already on the list?

8. **Sign-off checks.** Anything specific you'll verify before accepting invoice / reconciliation /
   van load-out / credit? Helps us hit "done" first time.

## ✅ Closed by your last round (no action — just confirming we got it)
Soda/Water/Juice GST = **5%** · full Catalogue ingested (new cans/variants added; unpriced items
stay orderable-later, admin punches rates) · **redesigned challan** = our dispatch/settlement
format (salesman/driver/helper + UPI/Cash/CNG-expense reconciliation footer) · dual branding
(both logos now live in the app + invoices) · rates GST-inclusive · manual admin rate overrides ·
per-retailer Campa Sure pricing · piece-level (open-bottle) freebies · credit: Cola no-credit,
Sure ₹1,000–1,500 / 1–3 days / overdue flag · reconciliation tiers (cash 0.1/0.3%, stock
0.2/0.6%) · **test OTP 1234** for Phase-1 login (we'll also recommend an SMS gateway — MSG91 or
Twilio work well with our stack) · driver directory (both warehouses) · no daily targets ·
retailer list n/a (in-field onboarding with GPS + photo).

## ⏭️ Parked for Phase 2
Returnable bottle/crate **deposit ledger** (confirm you take deposits today, no action now).

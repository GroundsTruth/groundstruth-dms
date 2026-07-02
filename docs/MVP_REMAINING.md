# Campa DMS — what's left for the MVP (Aman + Hardik)

_2026-07-02 (evening) — refreshed after the client bug round (screenshot doc) + the FULL
WhatsApp-export re-read ("Follow up, remaining stuff.docx" answers, 7/1 Catalogue, redesigned
challan, final Driver_Directory, Jaypee sample invoice). Status: ✅ done · 🟡 in progress ·
⬜ todo · 🔒 blocked · ⏭️ post-MVP. Branch: `feat/e2e-bugfixes` (off dev)._

## Today's bug round — FIXED on `feat/e2e-bugfixes` (Aman)
All from the client's testing doc, verified (typecheck 0 · 134 tests · build clean):
input validation everywhere (qty text/13-digit, phone 10-digit, vehicle 12-char, mfg≤expiry,
bounded date pickers) · HSN+GST **prefill by category** in Add-SKU · category taxonomy →
client's (**Cola/Lemon/Orange merged into CSD**) · 7/1 **Catalogue resync** in seed (Soda→5%,
Energy/Juice HSNs, price updates, renames, **+10 new SKUs** SKU053–062) · route chart fixed
(zero-filled routes, no purple slab) · low-stock criteria + physical-count explainers ·
"Still out"→"Delivered" · variance shown in % · no raw ids in errors · GPS failure now says
exactly why (https/permission/timeout) · retailer mandatory fields (phone/shop/route/address) ·
**both entity logos live** (`public/brand/falcon.png` + `jaypee.png` from PPT_1; invoice header
should pick by seller — see A6).

## ⚠️ Client answers that changed facts (from the export re-read)
- **Soda GST = 5%** (7/1 Catalogue + Jaypee sample invoice bills Club Soda at 2.5+2.5). Code/seed
  updated; **live DB rates must be resynced** (H1). Water 18→5 and Juice 12→5 likewise.
- **Jaypee = "JAYPEE ADVERTISERS" — CONFIRMED 7/02** (client's Maps listing + both invoices).
  GSTIN `06AIMPB2225L2ZE`, registered office 4th Floor 1404 DLF Phase-4 122009. **NEW 7/02:
  warehouse legal address = 248U, South City I, Sector 41, Gurugram 122001** (now printed on
  the challan). Residual Q1: which address on tax invoices (default: registered office).
  → **Hardik H7a: set `config.seller_jaypee.name = "Jaypee Advertisers"` live** (if it says Enterprises).
- **Falcon GSTIN `06FVEPS8609PIZN`** — 13th char "I" is almost certainly digit **1**; verify on
  the GST portal before printing (Q2).
- **Test OTP `1234` sanctioned** for Phase 1 + we should **recommend an SMS gateway** (Q-us).
- **Driver directory FINAL** (13 staff, Jaypee vans 0–6 + Falcon vans 0/A/B/C). ⚠️ **phone
  9289151748 is assigned twice** (Dharamveer Singh & Hira Lal) — phone = login key; must resolve before seeding (Q3).
- **Schemes must support OPEN-BOTTLE (piece-level) freebies + cross-SKU** (their ex. 2) — engine is case-level today (H4).
- **Challan = end-of-day settlement sheet**: crew fields SALESMAN/DRIVER/HELPER, 44 fixed item
  rows, footer settlement (UPI + Cash + **CNG/Route-Expense** → Total Reconciled vs Net Due) (H5).
- **Per-retailer pricing for Campa Sure** confirmed (price_list.retailer_id exists — needs UI/flow) (H6).
- **Invoices need the bank/UPI + Scan-to-Pay block per entity** (both samples): Jaypee Axis
  a/c 923020024709310 / UPI `9350048556@ptyes`; Falcon Axis a/c 917020034981329 / UPI
  `falconenterprises@ybl`; IFSC UTIB0001527 (H7).
- **No fixed daily targets** (S5 confirmed out). Retailer master list = **n/a** (onboard in-field).

## Aman — remaining
| # | Item | Status | Notes |
|---|------|--------|-------|
| A1 | **Run the DB resync** `npx tsx scripts/seed-skus.ts` (after merge, machine with `.env.local`) | ⬜ MANUAL | pushes CSD taxonomy + 5% Soda/Water/Juice + new SKUs live |
| A2 | **Supabase auth setup** (enable Phone provider + test numbers OTP `1234`) | ⬜ MANUAL | then `/login` works end-to-end; Q3 collision first |
| A3 | Invoice header: pick **falcon/jaypee logo by seller entity** (BrandLogo entity prop) | 🟡 | assets in `public/brand/`; small edit in invoice-view |
| A4 | Receive **history drill-down** (By-SKU row click → movements) | ⬜ | needs a movements accessor (Hardik data lane) — pair |
| A5 | UI-kit polish (empty/loading) | 🟡 | low priority |

## Hardik — remaining (cross-lane asks in WORKLOG)
| # | Item | Status | Notes |
|---|------|--------|-------|
| H1 | 🔴 **Live tax resync**: Soda/Water/Juice → 5%, Energy HSN 22021090, Juice 22029920, category values → CSD taxonomy | ⬜ | seed script covers `skus`; check `config`/migration leftovers + demo invoices |
| H2 | **requireRole into mutating actions** + flip `AUTH_ENABLED` when A2 done | ⬜ | login UI + role matrix ready |
| H3 | **Van linkage for capture** (order/invoice ↔ van_load) → van-aware capture (grey non-van SKUs + remaining-qty), Phase-1 "driver/van selection" | ⬜ | client's ask; schema + captureSale change; Aman does the UI after |
| H4 | **Schemes: piece-level (open-bottle) + confirm freebies deduct stock** | ⬜ | client ex.2 is per-bottle cross-SKU |
| H5 | **Challan v2**: SALESMAN/DRIVER/HELPER fields + settlement footer (UPI/Cash/CNG-expense → Total Reconciled) + driver route-expense capture | ⬜ | redesigned chalan.xlsx is authoritative |
| H6 | **Per-retailer Campa Sure pricing** flow (setPrice retailer scope exists; expose it) | ⬜ | client-confirmed requirement |
| H7 | **Invoice bank/UPI/QR block per entity** in config + invoice-view | ⬜ | account details above |
| H8 | **Seed users** from final Driver_Directory once Q3 collision resolved + overdue-credit flag (>3 days) alerting | 🔒 Q3 | |
| H9 | Reconciliation tiers — verify hardcoded numbers match: cash 0.1/0.3, stock 0.2/0.6 | 🟡 | client re-stated exact tiers |

## Client — still genuinely open (ask list = `CLIENT_QUESTIONS_OPEN.md`, updated)
Q1 Jaypee "Advertisers vs Enterprises" · Q2 Falcon GSTIN I-vs-1 · Q3 duplicate phone 9289151748 ·
Q4 seller entity for **Energy/Juice** (Soda→Jaypee now evidenced by its invoice) · Q5 rounding
per-line vs total + inter-state? · Q6 freebies deduct stock? · Q7 opening-stock snapshot + 2 name
aliases · Q8 acceptance criteria · (Phase-2: deposit ledger).

## Go-live path (unchanged shape, fewer blockers)
1. Merge `feat/e2e-bugfixes` → dev → main; run A1 (seed) + A2 (Supabase auth).
2. Hardik H1+H2 → **auth on, tax correct** → re-run `docs/E2E.md` full pass (user's plan).
3. H3–H7 close the field-reality gaps (van-aware capture, challan settlement, piece freebies).
4. Client Q1–Q3 gate **real printed invoices + user seeding**; SMS gateway (we recommend MSG91
   or Twilio; test-OTP 1234 until then).

## Explicitly OUT (client-confirmed)
Daily targets (S5) · retailer master import (none exists) · realtime · WhatsApp-feed ingestion
(app replaces the flow for Phase 1) · deposit ledger (Phase 2).

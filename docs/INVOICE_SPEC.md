# Invoice Spec — GroundsTruth DMS  (shared seam — PR-review changes)

Reverse-engineered from the client's **sample tax invoice** (`Invoice-7210376259.pdf`,
provided 2026-06-30). This is the reference for **Hardik's invoice module (M18–M23)** —
the layout to replicate and the tax math to implement. It partially unblocks **open
question Q1** ("do they invoice?" → **yes**). What the sample does *not* settle is in
§7 "Open questions" — those still need the client / CA before invoicing goes live.

> ⚠️ **Not yet CA-signed-off.** Tax correctness stays with the client's CA (AGENTS.md
> P10). Build to this spec, but treat the rates/numbering as provisional until confirmed.

---

## 1. What the sample establishes

- They issue a **GST "TAX INVOICE"** (formal, not just a sales slip).
- **Intra-state** sale → tax split **CGST + SGST**. (Inter-state will need **IGST** — not
  in the sample; we must support both — see §4.)
- **Prices are GST-inclusive** — tax is *extracted* from the billing price, not added on
  top (proven by the math in §3).
- One line's tax data is evidenced — **packaged water → HSN `22011010`, GST 5% (2.5+2.5),
  no cess** — i.e. what the client *currently bills*. Seeded onto the Water SKUs
  (`src/lib/catalog/seed-data.ts`); treat as provisional until the CA confirms it's the
  current rate. All other SKUs still need their HSN/GST/cess from the client/CA — esp.
  **cola / aerated drinks**, which sit in a higher GST slab and historically carried
  compensation cess (confirm the *current* rates with the CA; GST on sweetened/aerated
  beverages has been revised recently, so don't assume the old 28% + 12%-cess structure).
- ⚠️ **Name ≠ master.** The sample's water line is branded **"PLATINUM - 1Ltr"**, but our
  catalog calls it "Water - 1 L" etc. We mapped it by **HSN, not by name** — a concrete
  instance of the alias/normalisation requirement (CLAUDE.md rule 3: feed/invoice names
  won't string-match the SKU master). See §7 for the client question on brand names.

## 2. Layout & fields (replicate this)

**Header**
| Field | Sample value | Source in our system |
|---|---|---|
| Seller name | `FALCON ENTERPRISES` | `config` (seller entity) — **not** hardcoded |
| Seller address | 4th Floor, 1404, DLF Phase-4, Gurugram, Haryana – 122009 | `config` |
| Seller GSTIN | `06AIMPB2225L2ZE` | `config` |
| Seller PAN | `AIMPB2225L` | `config` |
| Title | `TAX INVOICE` | static |
| Invoice No | `INV-1781620613418` | invoice-number **service** — see §5 |
| Date | `6/16/2026` (MM/DD/YYYY) | `invoices.issued_at` |
| Order ID | `7210376259` | `orders.id` (separate from invoice no) |

**Bill To / Ship To** (separate blocks, identical in the sample)
- Name (`MACHAN`), address (`Sec29, Machan`), **GSTIN** (`NA` here → B2C / unregistered),
  **State Code** (`06`). State code drives intra-vs-inter-state tax (§4).

**Line items table** — columns, in order:
`# · Item · HSN/SAC · Qty · MRP · Billing Price · Taxes (CGST/SGST split shown per line) ·
Net Amount · QPU`
- `QPU` = unit of measure for Qty (sample: `pcs`).
- `Net Amount` is the line **gross (incl. tax)**: `Qty × Billing Price`.

**Totals & tax summary**
`Subtotal` (taxable value, ex-tax) · `CGST` · `SGST` *(or `IGST`)* · `Total` (incl. tax) ·
**Amount in words** (`8,400 Rupees Only`).

**Footer**
- **Bank details** + **UPI ID** + **"Scan to Pay" QR** (UPI pay QR — *not* an e-invoice/IRN
  QR; see §7).  Sample: Axis Bank, A/c `917020034981329`, IFSC `UTIB0001527`,
  Udyog Vihar Gurgaon, UPI `falconenterprises@ybl`. → all `config`.
- Signature blocks: "Received By / Signature & Date" and "For <Seller> / Authorised Signatory".

## 3. Tax math — worked from the sample (GST-inclusive)

```
Billing Price (incl GST) = ₹120.00 / pc
Qty                      = 70 pcs
Line gross               = 70 × 120.00         = ₹8,400.00   (= "Net Amount")
Taxable value            = 8,400.00 ÷ 1.05      = ₹8,000.00   (= "Subtotal")
GST @ 5%                 = 8,000.00 × 0.05      =   ₹400.00
  CGST @ 2.5%            = 8,000.00 × 0.025     =   ₹200.00
  SGST @ 2.5%            = 8,000.00 × 0.025     =   ₹200.00
Invoice total            = 8,000.00 + 400.00    = ₹8,400.00   ✓ (= line gross)
```
Implementation rule (per line):
```
taxable_value = round( qty * billing_price_incl / (1 + slab/100), 2 )
tax_total     = round( qty * billing_price_incl, 2 ) - taxable_value
# intra-state: cgst = sgst = tax_total / 2 ;  inter-state: igst = tax_total
# cess (if any) is computed the same way on taxable_value and shown separately
```
Compute **per line**, then sum — don't compute tax on the rounded invoice total. Confirm the
rounding rule with the CA (§7); the sample rounds cleanly so it doesn't disambiguate.

## 3a. Per-SKU GST/HSN table (researched — PROVISIONAL, pending CA)

Researched against the **post-22-Sep-2025 "GST 2.0"** regime (56th GST Council; CBIC
Notification 09/2025-CT(R), incl. the **1-May-2026** HSN renumbering via 01/2026-CT(R)) and
adversarially cross-checked (workflow `research-sku-gst`, 2026-06-30). **Compensation cess is
NIL on all beverages from 22-Sep-2025.** Seeded into `skus` (`src/lib/catalog/seed-data.ts`);
**not CA-signed-off** — the CA verifies before go-live billing.

| Product class | SKUs | HSN | GST | Cess | Conf. |
|---|---|---|---|---|---|
| Carbonated soft drinks w/ sugar (cola/lemon/orange, incl "Zero") | SKU001–017, 019–021 | 22021010 | **40%** | 0 | high |
| Soda water (plain Club Soda) | SKU018 | 22011020 | **18%** | 0 | med |
| Energy / caffeinated (Gold Boost, Berry Kick) | SKU022–025, 027 | 22029991 | **40%** | 0 | high |
| Glucose "energy" (Gluco Energy) | SKU039 | 22029990 | **40%** | 0 | med |
| Fruit-juice drinks, non-carbonated (Rasiki, Suncrush) | SKU034–038, 041–044 | 22029929 | **5%** | 0 | high |
| Jaljeera RTD ("Jeera") | SKU028 | 22029990 | **40%** | 0 | med |
| Packaged water (incl. "Water Gold") | SKU048–052 | 22011010 | **5%** | 0 | high ✓ matches sample |
| **Unidentified — "Mix", "Power UP"** | SKU029–032 | — | — | — | **null — need product identity** |

**Headline:** the new **40% "sin" slab (zero cess)** replaced the old 28% GST + 12% cess for
aerated/sugary and caffeinated drinks. The sample invoice's water @ 5% corroborates the water row.
**Per-SKU watch-outs the CA must confirm:** carbonation (a *carbonated* fruit drink → 40%, not 5%);
whether Club Soda is sweetened (→ 40%); whether "Jeera" is a dry powder (→ ~5–18%) vs liquid RTD
(→ 40%); whether "Nimbu Pani" is genuinely juice-based (5%) vs flavoured-without-juice (40%); and
the identity of "Mix"/"Power UP" (could be 5% / 18% / 40%).

**Primary sources:** CBIC Notn 09/2025-CT(R) & 01/2026-CT(R); GST Council 56th-meeting PIB release;
AAR West Bengal (Sage Organics, 2026 — non-alcoholic RTD = 40%); corroborated across ClearTax,
TaxGuru, A2Z Taxcorp, CMA Knowledge, EY. Full per-class source URLs + verifier notes: research
transcript for workflow `research-sku-gst`.

**Live-DB reconciliation (for Hardik):** migration `20260629150401` already set *category-level*
provisional rates live (Cola/Lemon/Orange/Soda/Energy → 40%, Water/Juice → 5%, 'Other' → 18%, cess 0).
This table **refines** that per-SKU: plain **Soda → 18%** (vs 40%), **Jeera RTD → 40%** (vs 'Other' 18%),
and it **adds HSN codes** (the migration set rates only). The refined values live in
`src/lib/catalog/seed-data.ts`; applying them live (re-seed or a follow-up migration) is **HELD pending
agreement** — see the WORKLOG cross-lane asks. Either way, all rates stay provisional until CA sign-off.

## 4. Place-of-supply (CGST/SGST vs IGST)

`seller.state_code == buyer.state_code` → **CGST + SGST** (each = slab/2).
Otherwise → **IGST** (= full slab, single line). Sample is `06 == 06` (Haryana) → CGST+SGST.
Drive this off the buyer's **State Code**, never a hardcoded assumption.

## 5. Invoice numbering — ⚠️ design decision needed

The sample number `INV-1781620613418` decodes to an **epoch-millisecond timestamp**
(`1781620613418 ms` ≈ the 2026-06-16 invoice date). That's globally unique but **not the
gap-free, sequential series GST expects** (and the client's own Gap Checklist demands
"gap-free"). **Do not replicate the timestamp scheme.**

Recommended (matches AGENTS.md rule 4 — numbering from a **configured series**):
- `config` holds: `prefix`, `fy_reset` (yearly/monthly/none), `width` (zero-pad), optional
  per-van/series segment, and the running counter.
- Allocate the next number **inside the same Postgres transaction** as invoice + stock
  deduct (`confirmAndInvoice()`), so the series is gap-free and can't double-allocate on a
  flaky field network (ties into the idempotency rule).
- Keep `Order ID` (the human/order ref) **separate** from the invoice number, as the sample does.

→ Needs the client's actual convention + CA sign-off before we finalise (§7).

## 6. Data-model touchpoints (Hardik to design in `docs/SCHEMA.md`)

- `skus` — **already carries** `hsn`, `tax_slab_pct`, `cess_pct`, `mrp`, `units_per_case`
  (migration `0001`; surfaced in the Catalog as of 2026-06-30). The invoice reads tax fields
  from here per line.
- `config` — seller entity (name/address/GSTIN/PAN/bank/UPI), invoice-number series,
  rounding rule, inclusive-vs-exclusive flag.
- `invoices` / `invoice_lines` — store the **computed** taxable value, CGST/SGST/IGST, cess,
  and totals **as issued** (snapshot — never recompute a historical invoice from live SKU tax).
- `confirmAndInvoice()` RPC — number allocation + invoice write + FIFO stock deduct, **one txn**.

## 7. Open questions (client / CA — blockers for go-live billing)

1. ✅ **Billing entity — RESOLVED (Aman, 2026-06-30): `FALCON ENTERPRISES`**, GSTIN
   `06AIMPB2225L2ZE`, the seller on the sample invoice. This is the entity on every bill
   (goes in the `config` seller block, §2). ("Jaypee Advertisers" in the workbook is the
   operational/sales data source — same business group; Falcon is who invoices.)
2. 🟡 **Per-SKU tax table — researched & seeded (§3a), needs CA sign-off.** Confirm the
   researched HSN/GST/cess (esp. the **40%** slab on carbonated + energy drinks) and resolve
   the per-SKU watch-outs in §3a — and **identify "Mix" (SKU029) and "Power UP" (SKU030–032)**,
   which we couldn't classify from the name (left null). Also confirm: are **"Platinum" /
   "Gold"** the retail brand names for the Water SKUs (so we can set catalog aliases)?
3. 🕓 **Numbering convention — DEFERRED (Aman, 2026-06-30): handle later.** Not a build
   blocker. When we build invoicing we'll use a configured placeholder series (prefix +
   FY-reset + zero-padded counter, allocated in the txn) and swap in the client's real
   convention + **CA sign-off** before go-live billing. (The sample's timestamp number is
   not a GST-safe series, so we won't replicate it.)
4. **Inclusive vs exclusive + rounding rule** — sample math implies **inclusive**; confirm,
   and confirm the rounding rule (per line vs per invoice, nearest paisa/rupee).
5. **MRP basis** — sample shows MRP `₹360` vs Billing `₹120` for 1 L water; confirm MRP is
   per-piece vs per-case and how it relates to the billing price (we left `mrp` null for now).
6. **Retailer entity** — the sample bills a **named shop** (`MACHAN`), which suggests they
   *do* track individual retailers (relevant to open question Q2; the workbook is route-only).
7. **e-invoice (IRN) / e-way bill** — the QR is a **UPI-pay** QR, not an IRN QR → implies **no**
   e-invoicing today; confirm (it's a later add-on if needed).
8. **Credit notes / returns-after-bill** — needed this phase, or handled manually?

---
*Linked: `AGENTS.md` (rules 2, 4, 9), `docs/SCHEMA.md` (tables), `client/13_Client_Gap_Checklist.docx`
§2 (the invoice ask this sample answers).*

# Missing inputs — what's needed to unblock (client / CA / Drive)

_For Hardik + Aman. Owned by Hardik (raised 2026-06-28). Update the Status column as
items arrive._ The build is **not** halted on these — modules are built with safe
defaults and these inputs are slotted in as **data / config**, not code rewrites.
The exception is anything marked **GO-LIVE GATE**: don't issue real documents to the
client's customers until it's confirmed.

## Priority 1 — gates the money path (M21 invoice / M22 confirm-and-invoice)
| # | Input | Needed for | From | Build workaround in place | Status |
|---|-------|-----------|------|---------------------------|--------|
| 1 | **Invoice format / sample** (a real Jaypee tax invoice, PDF or image) | M21 invoice layout, M25 challan | Client (via Aman) | Building to a **standard GST Rule-46 layout**; swap to client's once provided | ⬜ needed |
| 2 | **Per-SKU GST rate + cess %** + **HSN code** | Correct tax on M21/M22 | Client/CA (statutory) | Seeding **provisional statutory rates** (aerated 28%+12% cess; water/juice lower) into `skus.tax_slab_pct`/`cess_pct`/`hsn`; flagged provisional | ⬜ needed · **GO-LIVE GATE** |
| 3 | **Distributor GSTIN** (+ legal name, address, state code) | Mandatory seller block on every GST invoice | Client | Placeholder in `config`; invoice prints "[GSTIN pending]" | ⬜ needed · **GO-LIVE GATE** |
| 4 | **CA sign-off** that #1–#3 are GST-compliant (P10) | Compliance before real issuance | Client's CA | n/a — this is the formal gate, not a code dependency | ⬜ needed · **GO-LIVE GATE** |
| 5 | **Rounding + place-of-supply rule** (round each line vs invoice total; intra/inter-state → CGST+SGST vs IGST) | Tax math correctness | Client/CA | Defaulting to **intra-state CGST+SGST, round at invoice total**; parameterised | ⬜ confirm |

## Priority 2 — completeness / accuracy
| # | Input | Needed for | From | Workaround | Status |
|---|-------|-----------|------|-----------|--------|
| 6 | **9 missing SKU prices** (`skus.rate_per_case` null) | Ordering those 9 SKUs | Client rate sheet | Punch form blocks unpriced SKUs (guarded) | ⬜ needed |
| 7 | **MRP per SKU** | MRP column on invoice; price ceiling checks | Client | `skus.mrp` null; omitted from invoice for now | ⬜ optional |
| 8 | **units_per_case per SKU** | Case ⇄ unit display, loose-unit sales | Client | `skus.units_per_case` null; everything in **cases** for now | ⬜ optional |
| 9 | **Retailer master list** (name, shop, address, phone, GSTIN, beat) | M16/M17 retailer onboarding; per-retailer pricing + named-shop invoices | Client | System is **route-only** today; `retailers` table ready and empty | ⬜ needed for M16/M17 |
| 10 | **Sales model confirmation** (pre-sell / deliver / hybrid) (P08) | Order→invoice→delivery sequencing nuance | Client | Schema supports both paths; assuming **hybrid** | ⬜ confirm |

## Priority 3 — auth & go-live (M05–M09, M35–M36)
| # | Input | Needed for | From | Workaround | Status |
|---|-------|-----------|------|-----------|--------|
| 11 | **Staff / driver list + roles** (owner, warehouse, driver-rep) | M05–M09 auth user seeding; `van_loads.driver_user_id` | Drive (driver PII — not git) | Auth not built yet; actions run server-only, `created_by`/`driver` null until then | ⬜ needed for auth |
| 12 | **SMS / OTP provider confirmation** (which gateway, sender ID) | M05 OTP login | Client/us | `.env.local` has Resend + WhatsApp tokens; OTP channel TBD | ⬜ confirm |
| 13 | **Per-feature acceptance criteria** (P11 → MSA Schedule C) | M33 QA sign-off, M9/M15/M23/M28 acceptance | Client | Building module acceptance tests to our best understanding | ⬜ needed for sign-off |

## Summary — the 3 that most unblock us
1. **Invoice format sample** (#1) — so M21/M25 match the client's document, not a generic one.
2. **Per-SKU GST/cess + HSN + distributor GSTIN** (#2, #3) — so invoice numbers are real, not provisional. **These are the true go-live gate.**
3. **Retailer master list** (#9) — to move from route-only to named-shop onboarding (M16/M17).

Everything else has a working default. Nothing here is blocking the *build* — only the
*go-live* of invoicing and the retailer/auth modules.

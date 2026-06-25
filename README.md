# GroundsTruth DMS

A white-labelled **Distribution Management System** for a Campa (Reliance Consumer Products) beverage distributor. Digitises the flow from **warehouse stock → van load-out → field sales → invoice → stock deduction → cash/UPI collection → owner dashboard**, with a **stock ↔ sales ↔ cash reconciliation ("anti-leakage") core** as the central value.

> Built by **GroundsTruth** — a venture by Hardik Goel & Aman Nama, in association with BookMyMedia.in.

---

## Status
Pre-build. Legal, requirements, design, branding and sales docs are done. Build starts once the client returns a short gap checklist (see **Open questions**). Roughly half the MVP can start immediately from the client's existing data workbook.

- **MVP (Phase 1):** go-live in ~4 weeks
- **Phase 2 (core):** go-live in ~6 weeks
- Clock starts on receipt of required inputs, not on signing.

---

## What it does

### Phase 1 — MVP
Auth & RBAC (OTP) · SKU & product master · warehouse inventory (batch/expiry, FIFO guidance, low-stock alerts) · van loading + delivery challan + return reconciliation · retailer onboarding · order → invoice → automatic stock deduct · cash/UPI collection + owner dashboard.

### Phase 2 — Core
Beat planning + GPS check-in · attendance · retailer ledger + credit limits + outstanding alerts · geo-tagged proof-of-delivery · discounting · low-stock & payment alerts (WhatsApp/push) · daily sales report.

### Out of scope (later paid add-ons)
Offline-first + auto-sync · native mobile app · automated scheme engine · targets/expense/KM · advanced analytics · full damaged-goods/RTV · IRN/e-invoice · e-way bill · payment-gateway money movement · multi-tenant.

---

## The anti-leakage core
The reason the system exists. Every unit that leaves the warehouse on a van must end the day **sold, returned, or flagged**.

```
for each (van_load, sku):
    expected_returned = qty_out - qty_sold_invoiced
    variance          = expected_returned - qty_returned_actual
    cash_variance     = cash_expected - cash_collected_recorded
    if abs(variance) > tolerance OR cash_variance != 0:
        flag to owner dashboard + audit
```

Tolerance is configurable. Invoice generation and stock deduction run in **one Postgres transaction** so the books and the stock can never silently drift.

---

## Tech stack
Aligned with BookMyMedia for speed and shared components.

| Layer | Choice |
|-------|--------|
| Hosting | **Vercel** (Next.js, edge-delivered, preview URLs) |
| Web app | **Next.js / React**, responsive, PWA-installable (web only — no native, no offline this build) |
| Backend | **Supabase** — Postgres + Auth + Storage + Row Level Security + Edge Functions + Cron |
| UI | **shadcn/ui + Tailwind**, **Tremor** for dashboard charts |
| Maps | **Google Maps API** (GPS, PoD, beats — Phase 2) |
| Email | **Resend** |
| Messaging | **Meta WhatsApp** (alerts) |
| Dev tool | **Claude** (accelerator; optional in-app assist later) |

**Architecture:** modular monolith — web client → API (Supabase auto-REST + RPC/Edge Functions for transactional logic) → service modules → Postgres (system of record). Cross-cutting: auth, audit, config, jobs.

---

## Security & governance
- **Supabase Auth** (phone OTP) + **Row Level Security on every table** — access enforced at the database (role + `auth.uid()` filter rows), not just in app code.
- **Append-only `audit_log`** for every mutation (stock, invoice, collection, discount, variance) — tamper-evident.
- Service-role key **server-side only**; browser holds the anon key (safe under RLS). Secrets in env/Vault, never in the repo.
- Versioned migrations · dev/staging separation · daily backups + tested restore.
- Driver discount capped by an approval ceiling; field roles never see margins or other beats.

---

## Design
Campa branding, clean/minimal background so data pops. Three personas, three layout styles:

- **Drivers (mobile)** — Onfleet-style: big thumb buttons, high contrast, minimal typing.
- **Warehouse (desktop)** — Odoo-style: clean data tables with status badges, batch/shelf-life.
- **Executives** — Stripe/Tremor-style: spacious KPI cards, readable-at-a-glance dashboards.

**Product palette:** Campa Purple `#5D2081` (primary), purple tint `#EFE7F5`, Campa Red `#E2231A` (alerts only), near-white `#F6F4F8`, status green/amber/red.

(The GroundsTruth company logo uses a separate ink/green palette: Ink `#16202E`, Signal Green `#1FB57A`.)

---

## Core data model (Postgres)
`users` · `roles` · `skus` · `inventory` (batch/expiry, qty ≥ 0) · `orders` · `order_lines` · `invoices` · `van_loads` · `van_load_lines` · `collections` · `ledger_entries` (Phase 2) · `audit_log`.

Roles: **Owner** (all) · **Warehouse** (inventory/van) · **Driver/Rep** (orders/invoice/collect/onboard, discount ≤ ceiling).

---

## Repository
- **Name:** `groundstruth-dms`
- **Branches:** `main` (prod) · `dev` (integration) · `feat/*` (per module)
- **Future split (at client #2):** `groundstruth-platform` (reusable core) + `groundstruth-<client>` (instance/config), mirroring the platform-vs-client-instance ownership split.

### Layout
```
groundstruth-dms/
├─ AGENTS.md         hard build rules for any coding agent       (tracked)
├─ README.md         this file — what & why                      (tracked)
├─ package.json      intended Next.js + Supabase manifest        (tracked)
├─ .env.example      env template (copy to .env.local)           (tracked)
├─ artefacts/   ← source data the client gave us (raw inputs)         ┐
├─ client/      ← what we created and shared with the client         │ git-ignored:
├─ dev/         ← material we need for the build (design, seed data)  │ local working
└─ wireframes/  ← all wireframes (PNG screens + doc)                  ┘ files only
```
> The four data folders are local working files — **git-ignored** so they stay out of the pushed repo. Sync them between the team over a private channel, not git.

### Scaffolding the Next.js app (first time)
A curated `package.json` already exists (intended deps incl. Tremor, `@supabase/ssr`, zod). `create-next-app` refuses a non-empty directory, so scaffold into a temp dir and merge — don't overwrite the curated manifest:
```bash
npx create-next-app@latest .scaffold --ts --app --tailwind --eslint --src-dir --use-npm
rsync -a --ignore-existing .scaffold/ .          # bring in app skeleton, keep our package.json/.gitignore/.env.example
rm -rf .scaffold
npm install                                      # installs the curated deps
npx shadcn@latest init                           # then add components as needed
```

### Getting started (once scaffolded)
```bash
# prerequisites: Node 20+, a Supabase project, a Vercel account
git clone <repo-url> && cd groundstruth-dms
npm install
cp .env.example .env.local   # add Supabase URL + anon key (service key server-side only)
npm run dev
```
Never commit `.env*` or any secret. The Supabase **service-role key is server-side only**.

---

## Seed data
The client shared a real June-2026 operational workbook (sales by route/van, stock, OPEX). From it:
- `seed_skus.sql` / `seed_skus.csv` — 52 SKUs (MRP/HSN/tax = TODO, pending client)
- `seed_sales_sample.csv` — real transaction schema (`timestamp, date, route_id, article_name, qty_sold, rate, line_total, data_source, order_id`)

⚠️ Same product appears under inconsistent names in the workbook (e.g. "185 ML" vs "185/200 ML") — needs one canonical product list before seeding, or stock/reconciliation counts will split.

---

## Build approach
Build the core first, prove it, then layer.
1. **Foundation** — Vercel + Supabase, schema + RLS, auth, design system.
2. **MVP core** — inventory + atomic invoice + van reconciliation (the anti-leakage spine) + collection + dashboard.
3. **Phase 2** — beat/GPS, attendance, ledger/credit, geo-PoD, discounting, alerts, reports.
4. **Harden** — tests on critical paths, pilot with 2–3 real users, backups, go-live.

A 70-step delivery tracker (Pre-Build → MVP → Phase 2 → Milestones) drives execution.

---

## Start now vs hold
**Start now** (the workbook de-risks these): project setup, schema + RLS, SKU seed, inventory + inward stock, van load model, sales ingestion, reconciliation core, dashboard skeleton.

**Hold** until the client answers: invoicing/tax + format, retailer onboarding/ledger (route-only vs individual shops), batch/expiry/FIFO/MRP.

---

## Open questions for the client (the 3 unblockers)
1. **Do they invoice?** If yes — GST/HSN/cess per SKU, format, numbering, CA sign-off.
2. **Individual retailers/shops, or route-only?** (The workbook is route-based with no retailer entity.)
3. **Batch/expiry tracked, or just on-hand?** (Plus MRP, units-per-case.)

Also: confirm the WhatsApp sales feed (replace vs ingest), "Warehouse Sales" channel, discount ceiling, staff list for logins.

---

## Conventions
- Don't hardcode tax/numbering/discount/tolerance — config from the start (they arrive from the client late).
- Reconciliation + audit from day one (the liability hotspot).
- Never invoice without an atomic stock deduct.
- Keep client-specific work separable from reusable platform/licensed components (clean IP lines).

---

*See `AGENTS.md` for the hard build rules any coding agent must follow.*

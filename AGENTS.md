# GroundsTruth DMS — Build Rules for Claude Code

> Read this BEFORE writing any code. These are hard constraints, not suggestions. Also read `README.md` (what & why). If a rule here conflicts with a quick fix, the rule wins.

> **Working method:** the **Superpowers** plugin is installed for this repo — use it. `brainstorming` before any new feature, `writing-plans`/`executing-plans` for multi-step work, `test-driven-development` + `systematic-debugging` while coding, `requesting-code-review` before merge. The **Caveman** compression plugin is also installed but keep it **OFF** while drafting any document where precise wording matters.

---

## Stack (do not substitute without asking)
- **Next.js (App Router) on Vercel** · TypeScript.
- **Supabase**: Postgres, Auth (phone OTP), Storage, Row Level Security, Edge Functions, Cron.
- **UI**: shadcn/ui + Tailwind; **Tremor** for dashboard charts.
- **Integrations**: Google Maps (Phase 2), Resend (email), Meta WhatsApp (alerts).
- Package manager: npm. Node 20+.

---

## NON-NEGOTIABLE RULES

1. **RLS on every table.** No table is exposed without a Row Level Security policy. Access is decided by the user's role + `auth.uid()` at the database, never only in app code. A driver must be physically unable to read another beat's rows.

2. **Invoice + stock deduct are atomic.** `order → invoice → stock deduction` happens in ONE Postgres transaction (a DB function / RPC, or an Edge Function wrapping a transaction). Never invoice without deducting; never deduct without invoicing. This is the foundation of the anti-leakage core.

3. **Audit every mutation.** Every state-changing operation on stock, invoices, collections, discounts, and variance writes an append-only row to `audit_log` (actor, entity, action, timestamp). `audit_log` is never updated or deleted.

4. **No hardcoded business config.** Tax slabs, HSN, invoice number series, low-stock thresholds, discount ceiling, reconciliation tolerance, units-per-case — all live in config tables, never in code. They arrive from the client late and change.

5. **Secrets discipline.** The Supabase **service-role key is server-side only** (Route Handlers / Server Actions / Edge Functions). The browser only ever uses the **anon key** (safe because of RLS). Never commit `.env*`. Never log secrets.

6. **Discount ceiling enforced server-side.** A driver/rep can apply a discount only up to the configured ceiling; enforce it in the DB/RPC, not just the UI.

7. **`qty_on_hand >= 0`** enforced by a DB constraint. Stock deduction only inside a transaction.

8. **Web app only this build.** No native mobile, no offline/service-worker sync. PWA-installable is fine. Always surface clear "no network / not saved" states since actions need connectivity.

9. **Idempotency** on invoice and collection POSTs (avoid double-submit on flaky field networks) — use a client-supplied idempotency key or unique constraint.

10. **Keep client-specific code separable** from reusable/licensed platform components (clean IP lines — platform is GroundsTruth's, instance is the client's).

---

## Roles (RBAC)
- **Owner** — everything; dashboards, reports, config, approvals, sees margins.
- **Warehouse** — inventory, batches, van load-out/return, stock counts. No invoicing, no margins.
- **Driver/Rep** — orders, invoices, collect cash/UPI, onboard retailers, discount ≤ ceiling. Cannot see margins or other beats.
- (Phase 2 optional) **Auditor** — read-only.

Enforce role checks in RLS policies first, UI second.

---

## Data model (core tables)
`users` · `roles` · `skus` · `inventory` (batch, expiry, qty_on_hand≥0, low_threshold) · `orders` · `order_lines` (discount ≤ ceiling) · `invoices` (1:1 with order, number from configured series, immutable once issued) · `van_loads` · `van_load_lines` (qty_out, qty_returned) · `collections` (mode cash/UPI, ref recorded not processed) · `ledger_entries` (Phase 2, append-only) · `audit_log` (append-only).

Build order (prove the core earliest): auth/RBAC → catalog/inventory → **atomic invoice** → **van reconciliation** → collection/dashboard.

---

## The anti-leakage reconciliation (build carefully, with audit)
```
for each (van_load, sku):
    expected_returned = qty_out - qty_sold_invoiced
    variance          = expected_returned - qty_returned_actual
    cash_variance     = cash_expected - cash_collected_recorded
    if abs(variance) > tolerance OR cash_variance != 0:
        raise VarianceFlag(...)  # -> owner dashboard + audit
```

---

## Seeding
- Seed files currently live in **`dev/`** (`dev/seed_skus.sql`, `dev/seed_skus.csv`, `dev/seed_sales_sample.csv`). On scaffold, move the SQL to `supabase/seed/seed_skus.sql` (the `db:seed` script in `package.json` expects it there). The `dev/` folder is git-ignored — do not rely on it being in a fresh clone.
- Load SKUs from `seed_skus.sql` (52 Campa SKUs). `mrp`, `hsn`, `tax_slab`, `units_per_case` are TODO — leave nullable, fill from client.
- ⚠️ Canonicalise product names first (workbook has "185 ML" vs "185/200 ML" duplicates) or stock/recon counts split.
- Sales schema reference: `seed_sales_sample.csv` (`timestamp,date,route_id,article_name,qty_sold,rate,line_total,data_source,order_id`).

---

## UI conventions
- Campa Purple `#5D2081` = primary buttons / active nav / chart accent. Campa Red `#E2231A` = alerts only. Near-white `#F6F4F8` background. Status = green/amber/red, always paired with a word (never colour alone).
- Drivers: full-width thumb buttons, steppers (no keyboards for qty), high contrast, minimal typing.
- Warehouse: dense data tables OK, every row state is a badge.
- Executives: big primary number per KPI card, readable at a glance.

---

## Definition of done (per feature)
- RLS policy written + tested · audit on mutations · matches the agreed one-line acceptance criterion · automated test on critical paths (invoice atomicity, reconciliation math, discount ceiling, RBAC) · works against real seed data.

## What NOT to do
- Don't expose any table without RLS. Don't put the service key in the browser. Don't hardcode tax/numbering/discount/tolerance. Don't build invoicing/retailer-ledger/batch-expiry until the client answers the 3 open questions (see README). Don't add offline/native scope. Don't name specific third-party tools or pricing in any client-facing output.

---
*Mirror this file as `.cursorrules` (Cursor) and/or `AGENTS.md` if your agent looks for those names. Keep `README.md` at repo root alongside this.*

# Schema — GroundsTruth DMS  (shared seam — PR-review changes)

The canonical ER schema. **Shared** (`COORDINATION.md`): propose changes in a PR the
other person reviews. Hardik owns the spine tables; Auth + core are joint. This is a
**template** — fill in columns/policies per table and propose for review; only `skus`
is built so far.

## Conventions every table follows
- **RLS on** (auto-RLS enables it) + an explicit **policy** per role that touches it.
- **Explicit grants in the migration** (auto-expose is OFF): `service_role` (our
  server) + the role that reads/writes (`authenticated`). See `CLAUDE.md` rule 5 —
  without grants you get "permission denied" even with the service key.
- **FKs** with a sensible `on delete`. `created_at` + `updated_at` (trigger) everywhere.
- Quantities/money: `numeric` with `>= 0` checks. The money path is **atomic** (one txn).
- Every mutation writes to **`audit_log`** (append-only).
- Timestamped migration files (`YYYYMMDDHHMMSS_<name>.sql`), logged in `docs/MIGRATIONS.md`.

## Reference (built)
- **`skus`** — migration `0001`: RLS + read policy (`authenticated`) + grants
  (`service_role` all, `authenticated` select) + `updated_at` trigger. **Copy this
  pattern** for every new table.

## Phase-1 tables to design  (propose columns + policies per table)

**Core / Auth — joint (M02–M03, M05–M09):**
- `users`, `roles` — auth identities + RBAC (Owner / Warehouse / Driver-Rep).
- `config` — tax slabs, invoice series, reconciliation tolerance, discount ceiling.
- `audit_log` — append-only mutation trail.

**Inventory — Hardik (M11–M14):**
- `inventory` / `stock_batches` — on-hand by SKU + batch + expiry, `qty >= 0`.
- (FIFO deduction is a *service* over batches, not a table — M13.)

**Sales / money path — Hardik (M18–M23):**
- `price_list` — price per SKU (per route/segment? — confirm with feed).
- `orders`, `order_lines` — order punch.
- `invoices`, `invoice_lines` — tax computed; **server-side invoice-number service**.
- `confirmAndInvoice()` — RPC doing invoice + stock deduct in **ONE transaction**.

**Van / reconciliation — Hardik (M24–M28):**
- `van_loads`, `van_load_lines` — qty_out per SKU per van/route.
- `returns` — qty_returned.
- reconciliation = *service* over loads − sold − returned → variance flags + audit.

**Collection — Hardik (M29):**
- `collections` — cash/UPI recorded against an invoice.

**Retailer — TBD, blocked on client Q2 (M16–M17):**
- `retailers` — only if the client confirms individual shops; the feed is route-centric today.

## Open schema questions (client/CA — see README "Open questions")
1. Invoicing/tax fields per SKU: MRP / HSN / tax-slab / cess / units-per-case.
2. Retailer entity yes/no (route-only vs individual shops).
3. Batch/expiry tracked, or on-hand only.

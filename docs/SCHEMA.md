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

## Phase-1 ER — proposed (built on `feat/core-schema`, pending Aman PR review)

15 tables added across six timestamped migrations (`20260628070450`–`455`), all on
the `skus` pattern: RLS on · read policy `authenticated` · **writes server-only**
(`service_role`, no write policy) · explicit grants · `updated_at` trigger ·
`numeric >= 0` checks. **Tables + constraints only** — the services (FIFO,
`confirmAndInvoice()`, `reconcile()`, AuditService) land in their own module branches.
Full design: `docs/superpowers/specs/2026-06-28-core-schema-design.md`.

**Core / Auth — `_core` (joint):**
- `users` — `id = auth.users.id`, name, phone, `role app_role(owner|warehouse|driver_rep)`, is_active.
- `config` — key/value (`jsonb`): tax slabs, invoice series, recon tolerance, discount ceiling, low-stock threshold.
- `audit_log` — append-only (select+insert grant only); written by AuditService (M02).

**Inventory — `_inventory` (Hardik):**
- `stock_batches` — on-hand by SKU + batch + expiry, `qty_on_hand >= 0`, `unique(sku_id,batch_no)`.
- `stock_movements` — append-only ledger (inward/sale_deduct/van_out/van_return/adjustment); truth source for FIFO (M13) + recon (M27).

**Retailer — `_retailer` (joint):** `retailers` — shops with `route` attribute + `approval_status`; forward-compatible with the route-centric feed.

**Sales / money path — `_sales` (Hardik):**
- `price_list` — price per SKU, optional retailer/route scope.
- `orders` / `order_lines` — order punch (`order_status`).
- `invoices` / `invoice_lines` — `invoice_no` unique (server series, M20); `invoice_lines.batch_id` records FIFO batch.
- `confirmAndInvoice()` (M22) — RPC: invoice + FIFO deduct + audit in **ONE transaction** (service, not a table).

**Van / reconciliation — `_van` (Hardik):**
- `van_loads` / `van_load_lines` — `qty_out` + `qty_returned` (returns as a column, M26).
- `reconciliations` — one per load: out − sold − returned variance + cash variance + `recon_status` flag.

**Collection — `_collection` (Hardik):** `collections` — cash/UPI against an invoice (`collection_mode`, reference captured not processed).

### Decisions flagged for review
1. **Role as enum**, no `roles` table (3 fixed roles; M07 permission map is code/config).
2. **Returns as `qty_returned` column** on `van_load_lines`, not a separate table.
3. **`stock_movements` ledger added** (not explicit in tracker) — makes FIFO/recon/audit verifiable.
4. **Writes server-only** (no write RLS policy) on every table — RBAC enforced in the server layer (M07).

## Open schema questions (client/CA — still gating *values*, not structure)
1. Invoicing/tax fields per SKU: MRP / HSN / tax-slab / cess / units-per-case (columns exist on `skus`, awaiting values).
2. Retailer entity — modelled as `retailers` (proposed default); confirm route-only vs per-shop with client.
3. Batch/expiry — modelled in `stock_batches` (proposed default); confirm with client.

# Design — Phase-1 Core ER Schema (P13 → M01)

_Branch:_ `feat/core-schema` · _Owner:_ Hardik · _Reviewer:_ Aman (shared seam)
_Date:_ 2026-06-28 · _Status:_ proposed (awaiting Aman PR review)

Delivers P13 (ER schema v1) + M01 (core-table migrations) from
`dev/11_Delivery_Tracker.xlsx`. Builds **on top of** Aman's merged work — extends,
never replaces. All product references FK to his existing `skus` table (migration
`0001`).

## Goal
A complete Phase-1 relational baseline: every MVP table created with RLS + grants +
triggers, so the transactional spine (inventory → sales/invoice → van/recon →
collection) and Auth/RBAC have their tables ready. Service-layer logic (FIFO,
`confirmAndInvoice()`, `reconcile()`) is **out of scope here** — those land in their
own module branches (M13, M22, M27). This branch is **tables + constraints only**.

## Non-goals (built later, named here for traceability)
- FIFO deduction service `deductStock()` — M13.
- `confirmAndInvoice()` RPC (atomic invoice + deduct) — M22.
- `reconcile()` service — M27.
- AuditService that writes `audit_log` — M02.
- Auth flows (OTP/JWT/RBAC middleware) — M05–M09. This branch only creates `users`.
- Tax/MRP/HSN values on SKUs — client/CA gated; columns already exist on `skus`.

## Conventions (every table — `CLAUDE.md` rule 5, mirrors `skus`)
- **RLS on**; **read policy** `to authenticated using (true)`.
- **Writes server-only**: `grant all` to `service_role`, **no insert/update/delete
  policy** (writes go through the Next.js server admin client, same as `skus`).
- **Explicit grants** (auto-expose is OFF): `service_role` all, `authenticated`
  select (+ nothing to `anon`).
- `created_at timestamptz default now()`; `updated_at` + shared `set_updated_at()`
  trigger (already defined in `0001`; reused, not redefined).
- Money/qty: `numeric` with `>= 0` CHECK. FKs declare `on delete`.
- Single-org (no `tenant_id`). Timestamped migration files; logged in
  `docs/MIGRATIONS.md`.

## Enums
`app_role(owner|warehouse|driver_rep)` ·
`order_status(draft|confirmed|invoiced|cancelled)` ·
`invoice_status(issued|cancelled)` · `van_load_status(open|reconciled)` ·
`recon_status(ok|flagged)` ·
`movement_type(inward|sale_deduct|van_out|van_return|adjustment)` ·
`collection_mode(cash|upi)` · `approval_status(pending|approved)`
All created with the `do $$ … exception when duplicate_object` guard from `0001`.

## Tables

### Core / Auth — `_core.sql` (joint, PR-reviewed)
**users**
| col | type | notes |
|-----|------|-------|
| id | uuid pk | = `auth.users.id` (`references auth.users on delete cascade`) |
| name | text not null | |
| phone | text unique | login identity (OTP later) |
| role | app_role not null | RBAC; default `driver_rep` |
| is_active | boolean not null default true | |
| created_at / updated_at | timestamptz | trigger |

**config** — key/value app settings.
| col | type | notes |
|-----|------|-------|
| key | text pk | e.g. `tax_slabs`, `invoice_series`, `recon_tolerance`, `discount_ceiling`, `low_stock_threshold` |
| value | jsonb not null | |
| updated_at | timestamptz | trigger |

**audit_log** — append-only mutation trail (populated by AuditService, M02).
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| actor_user_id | uuid null | `references users on delete set null` |
| action | text not null | e.g. `sku.update`, `invoice.create` |
| entity_table | text not null | |
| entity_id | uuid null | |
| before / after | jsonb null | |
| created_at | timestamptz | |

Append-only: grant `select, insert` only (no update/delete) to `service_role`;
`select` to `authenticated`. No `updated_at`.

### Inventory — `_inventory.sql` (Hardik)
**stock_batches**
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| sku_id | uuid not null | `references skus on delete restrict` |
| batch_no | text not null | |
| mfg_date / expiry_date | date null | FIFO orders by expiry then received_at |
| qty_on_hand | numeric(12,2) not null default 0 check `>= 0` | |
| received_at | timestamptz default now() | |
| created_at / updated_at | timestamptz | trigger |
| | | `unique(sku_id, batch_no)` |

**stock_movements** — append-only inventory ledger (truth source for FIFO + recon).
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| sku_id | uuid not null references skus | |
| batch_id | uuid null references stock_batches on delete set null | |
| movement_type | movement_type not null | |
| qty | numeric(12,2) not null check `>= 0` | sign implied by type |
| ref_type | text null | e.g. `invoice`, `van_load` |
| ref_id | uuid null | |
| created_by | uuid null references users | |
| created_at | timestamptz | append-only (no update/delete grant) |

### Retailer — `_retailer.sql` (joint)
**retailers** — name, shop_name, address, phone, gstin, route text, lat/lng
`numeric` null, approval_status `approval_status` default `pending`, is_active,
created_by → users, created_at/updated_at (trigger).

### Sales / money path — `_sales.sql` (Hardik)
**price_list** — sku_id → skus, retailer_id → retailers null, route text null,
`price numeric(10,2) check >= 0`, effective_from date, is_active, ts.

**orders** — order_no text unique, retailer_id → retailers, route text, status
`order_status` default `draft`, created_by → users, order_date date,
subtotal/tax_total/total `numeric(12,2) check >= 0`, ts.

**order_lines** — order_id → orders `on delete cascade`, sku_id → skus, `qty >= 0`,
unit_price, tax_pct, tax_amount, line_total (all `numeric >= 0`).

**invoices** — invoice_no text unique (server series, M20), order_id → orders null,
retailer_id → retailers, invoice_date date, subtotal/tax_total/cess_total/total
`numeric(12,2) >= 0`, status `invoice_status` default `issued`, pdf_path text null,
created_by → users, ts.

**invoice_lines** — invoice_id → invoices `on delete cascade`, sku_id → skus,
batch_id → stock_batches null (batch deducted), qty, unit_price, tax_pct, tax_amount,
cess_pct, cess_amount, line_total (all `numeric >= 0`).

### Van / reconciliation — `_van.sql` (Hardik)
**van_loads** — load_no text unique, vehicle text, driver_user_id → users, route
text, load_date date, status `van_load_status` default `open`, created_by → users, ts.

**van_load_lines** — van_load_id → van_loads `on delete cascade`, sku_id → skus,
batch_id → stock_batches null, `qty_out >= 0`, `qty_returned >= 0` default 0.

**reconciliations** — van_load_id → van_loads unique, qty_out/qty_sold/qty_returned,
variance, cash_expected/cash_collected/cash_variance (`numeric(12,2)`), status
`recon_status` default `ok`, reconciled_by → users, reconciled_at, created_at.

### Collection — `_collection.sql` (Hardik)
**collections** — invoice_id → invoices, retailer_id → retailers, `amount >= 0`,
mode `collection_mode`, reference text null, collected_by → users, collected_at, created_at.

## Data flow
```
receive → stock_batches (+movement inward)
order → order_lines
confirmAndInvoice()  →  invoices + invoice_lines
                        + FIFO deduct stock_batches (+movement sale_deduct)
                        + audit_log              [ONE txn — M22]
collection  →  collections (against invoice)

van_load (+movement van_out) → sell / qty_returned (+movement van_return)
   → reconcile(): out − sold − returned → variance → recon_status flag + audit  [M27]
```

## Migration files (timestamped — `docs/MIGRATIONS.md`)
Six files, applied in order via Supabase SQL Editor, each self-contained
(enums + tables + RLS + policies + grants + triggers), FK-ordered:
1. `<ts>_core.sql` — app_role; users, config, audit_log.
2. `<ts>_inventory.sql` — movement_type; stock_batches, stock_movements.
3. `<ts>_retailer.sql` — approval_status; retailers.
4. `<ts>_sales.sql` — order_status, invoice_status; price_list, orders, order_lines, invoices, invoice_lines.
5. `<ts>_van.sql` — van_load_status, recon_status; van_loads, van_load_lines, reconciliations.
6. `<ts>_collection.sql` — collection_mode; collections.

Each migration idempotent-safe (`create table if not exists`, guarded enums, `drop
policy if exists` before create) so re-running in the SQL Editor never hard-fails.

## Decisions flagged for Aman's review
1. **Role as enum, no `roles` table.** Three fixed roles; the M07 permission map is
   code/config, not rows. Add a `roles` table only if roles become data-driven.
2. **Returns as `qty_returned` column on `van_load_lines`**, not a separate `returns`
   table. One row per van line already holds out + returned.
3. **`stock_movements` ledger added** (not explicit in the tracker). It's the append-
   only source of truth that makes FIFO, reconciliation, and audit verifiable.
4. **Writes are server-only** (no write RLS policy) on every table, mirroring `skus`.
   RBAC enforcement is in the server layer (M07), not row policies, for MVP.

## Acceptance for this branch
- All six migrations apply cleanly in a fresh Supabase SQL Editor run, in order,
  and are safe to re-run.
- `docs/SCHEMA.md` updated from template → the real ER (tables above).
- `docs/MIGRATIONS.md` has one row per new file.
- `node scripts/check-supabase.mjs` still "CONNECTION OK"; a smoke query
  (`select count(*) from <each table>`) returns 0 with no permission error
  (proves grants).
- No file outside `supabase/migrations/**`, `src/lib/{inventory,sales,van,recon}/**`,
  `docs/**` touched (lane-clean).

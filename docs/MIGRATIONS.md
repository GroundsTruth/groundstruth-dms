# Migrations log — GroundsTruth DMS

One line per migration (newest at the bottom). Apply via the Supabase **SQL Editor**.
Every migration must include **RLS + explicit grants** (CLAUDE.md rule 5) — this
project has "auto-expose new tables" OFF, so nothing is reachable without a grant.

**Naming:** `0001_*` is the bootstrap. From here use **timestamped** names —
`supabase/migrations/YYYYMMDDHHMMSS_<name>.sql` — so Aman & Hardik never collide on
a sequential number (see `COORDINATION.md` § Migrations). Each module migrates only
the tables it owns; core/shared tables (users, roles, auth, config, audit) are
coordinated + PR-reviewed by the other person.

| File | Tables | Applied | By | Notes |
|------|--------|---------|----|-------|
| `0001_skus.sql` | `skus` | 2026-06-25 | Aman | RLS + read policy (`authenticated`) + grants (`service_role` all, `authenticated` select) + `updated_at` trigger. Seeded 46 canonical SKUs via `scripts/seed-skus.ts`. |
| `20260628070450_core.sql` | `users`, `config`, `audit_log` | _pending_ | Hardik | M01 core/auth. `app_role` enum. `audit_log` append-only (select+insert grant). Reuses `set_updated_at()`. |
| `20260628070451_inventory.sql` | `stock_batches`, `stock_movements` | _pending_ | Hardik | M11. `movement_type` enum; batch+expiry, `qty>=0`, `unique(sku_id,batch_no)`. `stock_movements` append-only ledger. |
| `20260628070452_retailer.sql` | `retailers` | _pending_ | Hardik | M16. `approval_status` enum; route attribute, lat/lng. |
| `20260628070453_sales.sql` | `price_list`, `orders`, `order_lines`, `invoices`, `invoice_lines` | _pending_ | Hardik | M18-M23. `order_status`/`invoice_status` enums; `invoice_no` unique; lines cascade. Tables only — `confirmAndInvoice()` later (M22). |
| `20260628070454_van.sql` | `van_loads`, `van_load_lines`, `reconciliations` | _pending_ | Hardik | M24-M28. `van_load_status`/`recon_status` enums; returns as `qty_returned` column. |
| `20260628070455_collection.sql` | `collections` | _pending_ | Hardik | M29. `collection_mode` enum; payment ref captured not processed. |

**Apply order (Hardik, once `.env.local` keys are in):** paste `070450`→`070455` in
sequence in the Supabase SQL Editor (FK-ordered). Each is idempotent — safe to re-run.
Mark "Applied" date + initials here after running.

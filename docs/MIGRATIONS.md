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
| `20260628070450_core.sql` | `users`, `config`, `audit_log` | 2026-06-28 | Hardik | M01 core/auth. `app_role` enum. `audit_log` append-only (select+insert grant). Reuses `set_updated_at()`. |
| `20260628070451_inventory.sql` | `stock_batches`, `stock_movements` | 2026-06-28 | Hardik | M11. `movement_type` enum; batch+expiry, `qty>=0`, `unique(sku_id,batch_no)`. `stock_movements` append-only ledger. |
| `20260628070452_retailer.sql` | `retailers` | 2026-06-28 | Hardik | M16. `approval_status` enum; route attribute, lat/lng. |
| `20260628070453_sales.sql` | `price_list`, `orders`, `order_lines`, `invoices`, `invoice_lines` | 2026-06-28 | Hardik | M18-M23. `order_status`/`invoice_status` enums; `invoice_no` unique; lines cascade. Tables only — `confirmAndInvoice()` later (M22). |
| `20260628070454_van.sql` | `van_loads`, `van_load_lines`, `reconciliations` | 2026-06-28 | Hardik | M24-M28. `van_load_status`/`recon_status` enums; returns as `qty_returned` column. |
| `20260628070455_collection.sql` | `collections` | 2026-06-28 | Hardik | M29. `collection_mode` enum; payment ref captured not processed. |
| `20260628080405_config_seed.sql` | `config` (seed rows) | 2026-06-28 | Hardik | M03. Inserts 5 default config rows (`invoice_series`, `recon_tolerance`, `discount_ceiling`, `low_stock_threshold`, `tax_slabs={}`) `on conflict do nothing`. Mirrors `src/lib/config/defaults.ts`. |
| `20260628082112_receive_stock_fn.sql` | `receive_stock()` fn | 2026-06-28 | Hardik | M12. Atomic RPC: batch upsert + inward `stock_movements` in one txn. `execute` granted to `service_role` only (revoked from public). |
| `20260628090247_deduct_stock_fn.sql` | `deduct_stock()` fn | 2026-06-28 | Hardik | M13. Atomic FIFO deduct: oldest-expiry batch first (`for update` lock), per-batch `sale_deduct` movement, raises on shortfall (full rollback). Returns allocations. `execute` to `service_role` only. |
| `20260628095313_seed_base_prices.sql` | `price_list` (seed) | 2026-06-28 | Hardik | M18/M19. Seeds base prices from `skus.rate_per_case` (37/46 SKUs; selling rate from workbook). Idempotent (`not exists` guard); unpriced SKUs left for client to confirm. |
| `20260628100608_next_invoice_no_fn.sql` | `next_invoice_no()` fn | 2026-06-28 | Hardik | M20. Atomic invoice numbering: reads+increments `config.invoice_series` under `for update` lock (no dup/skip), self-heals missing row. `execute` to `service_role` only. |
| `20260628101459_load_van_fn.sql` | `load_van()` fn | 2026-06-28 | Hardik | M24. Atomic van load-out: header + FIFO `van_out` per line (oldest-expiry, row-locked) + `van_load_lines`; raises on shortfall (full rollback). `p_lines` jsonb. `execute` to `service_role`. |
| `20260628104700_record_returns_fn.sql` | `record_returns()` fn | 2026-06-28 | Hardik | M26. Atomic returns: qty back to source batch + `van_return` movement + `qty_returned` bump per line; guards `returned+qty <= qty_out`. `p_returns` jsonb. `execute` to `service_role`. |
| `20260628110658_seed_provisional_tax.sql` | `skus` (tax cols) + `config` (seller) | 2026-06-28 | Hardik | M21. PROVISIONAL GST/cess by category (aerated 28%+12%, water 18%, juice 12%); fills nulls only. Seeds `seller` + `tax_provisional` config. |
| `20260628110659_confirm_and_invoice_fn.sql` | `confirm_and_invoice()` fn | 2026-06-28 | Hardik | M22. **The money path.** Atomic: `next_invoice_no` + invoice + lines + FIFO `deduct_stock` + tax + order→invoiced, ONE txn, full rollback on shortfall. `execute` to `service_role`. |
| `20260629150401_fix_provisional_tax_40_5.sql` | `skus` (tax cols) | 2026-06-29 | Hardik | Correct provisional GST per proposal: aerated 40%, water+juice 5% (cess 0). Supersedes 28%+12% from `110658`. Applied live (UPDATE). Still pending CA confirm. |
| `20260630134832_invoice_inclusive_tax_hsn.sql` | `invoice_lines` (+hsn), `confirm_and_invoice()`, `skus` (Soda) | _pending_ | Hardik | BUILD_AUDIT #1/#2/#3/#8: **GST-inclusive** `confirm_and_invoice` (mirrors `invoice-tax.ts`); `invoice_lines.hsn` snapshot; Soda→18%. Soda already applied live; **apply the alter+function in SQL Editor**. |

**Apply order (Hardik, once `.env.local` keys are in):** paste `070450`→`070455` in
sequence in the Supabase SQL Editor (FK-ordered). Each is idempotent — safe to re-run.
Mark "Applied" date + initials here after running.

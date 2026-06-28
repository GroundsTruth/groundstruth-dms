# Phase-1 Core ER Schema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Create all Phase-1 tables (RLS + grants + triggers) on top of Aman's `skus`, as six idempotent timestamped migrations.

**Architecture:** One migration file per domain, FK-ordered. Each file is self-contained (guarded enums + `create table if not exists` + RLS + read policy + explicit grants + `updated_at` trigger). Writes are server-only (service_role); `authenticated` reads. Mirrors the `skus` (0001) pattern exactly.

**Tech Stack:** PostgreSQL (Supabase, Mumbai `ap-south-1`), applied via SQL Editor. Spec: `docs/superpowers/specs/2026-06-28-core-schema-design.md`.

## Global Constraints
- Every table: `enable row level security`; `drop policy if exists` then `create policy … for select to authenticated using (true)`. **No write policy.**
- Every table: `grant all privileges on table … to service_role` + `grant select … to authenticated`. (auto-expose OFF — no grant = "permission denied".)
- Append-only tables (`audit_log`, `stock_movements`): grant `select, insert` only (no update/delete) to `service_role`.
- `created_at timestamptz default now()`; mutable tables get `updated_at` + reuse `public.set_updated_at()` (defined in 0001 — do NOT redefine).
- Enums via `do $$ begin create type … exception when duplicate_object then null; end $$;`.
- Money/qty `numeric` with `>= 0` CHECK. FKs declare `on delete`. No `tenant_id`.
- Filenames `YYYYMMDDHHMMSS_<domain>.sql`; log each in `docs/MIGRATIONS.md`.
- Idempotent: safe to re-run in SQL Editor (no hard-fail on second run).

---

### Task 1: Core / Auth migration
**Files:** Create `supabase/migrations/20260628070450_core.sql`
**Interfaces — Produces:** `public.users(id,role app_role,…)`, `public.config(key,value)`, `public.audit_log(...)`. Later tables FK `created_by`/`actor` → `users(id)`.
- [ ] Write file: `app_role` enum; `users` (id→auth.users cascade, name, phone unique, role default driver_rep, is_active, ts+trigger); `config` (key pk, value jsonb, updated_at+trigger); `audit_log` (append-only). RLS+policies+grants per Global Constraints; `audit_log` insert/select grant only.
- [ ] Verify structure: `grep -c "enable row level security" file` ⇒ 3; `grep -c "to service_role" file` ⇒ 3; `grep "set_updated_at" file` present for users+config, absent for audit_log.
- [ ] Log in `docs/MIGRATIONS.md`. Commit.

### Task 2: Inventory migration
**Files:** Create `supabase/migrations/20260628070451_inventory.sql`
**Interfaces — Consumes:** `skus(id)`, `users(id)`. **Produces:** `stock_batches(id,sku_id,qty_on_hand)`, `stock_movements(...)`.
- [ ] Write file: `movement_type` enum; `stock_batches` (sku_id→skus restrict, batch_no, mfg/expiry date, qty_on_hand `>=0`, received_at, ts+trigger, `unique(sku_id,batch_no)`); `stock_movements` (append-only: sku_id→skus, batch_id→stock_batches set null, movement_type, qty `>=0`, ref_type/ref_id, created_by→users, created_at). RLS+grants; movements insert/select grant only.
- [ ] Verify: 2 RLS, `unique (sku_id, batch_no)` present, `check (qty_on_hand >= 0)` present.
- [ ] Log + commit.

### Task 3: Retailer migration
**Files:** Create `supabase/migrations/20260628070452_retailer.sql`
**Interfaces — Consumes:** `users(id)`. **Produces:** `retailers(id, route, approval_status)`.
- [ ] Write file: `approval_status` enum; `retailers` (name, shop_name, address, phone, gstin, route, lat/lng numeric null, approval_status default pending, is_active, created_by→users set null, ts+trigger). RLS+policy+grants.
- [ ] Verify: 1 RLS, enum guarded. Log + commit.

### Task 4: Sales / money-path migration
**Files:** Create `supabase/migrations/20260628070453_sales.sql`
**Interfaces — Consumes:** `skus(id)`, `retailers(id)`, `users(id)`. **Produces:** `price_list`, `orders`, `order_lines`, `invoices`, `invoice_lines`.
- [ ] Write file (FK order): `order_status`+`invoice_status` enums; `price_list`; `orders`; `order_lines` (order_id cascade); `invoices` (invoice_no unique); `invoice_lines` (invoice_id cascade, batch_id→stock_batches null). All money/qty `>=0`. RLS+policy+grants per table; ts+trigger on parent tables.
- [ ] Verify: 5 RLS, `on delete cascade` on order_lines+invoice_lines, `invoice_no … unique`.
- [ ] Log + commit.

### Task 5: Van / reconciliation migration
**Files:** Create `supabase/migrations/20260628070454_van.sql`
**Interfaces — Consumes:** `skus(id)`, `users(id)`, `stock_batches(id)`. **Produces:** `van_loads`, `van_load_lines`, `reconciliations`.
- [ ] Write file: `van_load_status`+`recon_status` enums; `van_loads` (load_no unique, driver_user_id→users); `van_load_lines` (van_load_id cascade, qty_out/qty_returned `>=0`); `reconciliations` (van_load_id unique, variances). RLS+policy+grants; ts+trigger on van_loads.
- [ ] Verify: 3 RLS, `qty_returned … default 0`. Log + commit.

### Task 6: Collection migration + SCHEMA.md + handoff
**Files:** Create `supabase/migrations/20260628070455_collection.sql`; Modify `docs/SCHEMA.md`, `docs/MIGRATIONS.md`, `docs/WORKLOG.md`, `docs/STATUS.md`; Create `docs/handoffs/2026-06-28-hardik.md`
**Interfaces — Consumes:** `invoices(id)`, `retailers(id)`, `users(id)`.
- [ ] Write `collection.sql`: `collection_mode` enum; `collections` (invoice_id→invoices, retailer_id→retailers, amount `>=0`, mode, reference, collected_by→users, collected_at, created_at). RLS+policy+grants.
- [ ] Update `docs/SCHEMA.md`: replace template "to design" section with the real ER (built tables + the 4 flagged decisions).
- [ ] Update `docs/MIGRATIONS.md`: one row per new file.
- [ ] Write handoff `docs/handoffs/2026-06-28-hardik.md` + update `docs/WORKLOG.md` (top entry + In-flight) + `docs/STATUS.md` (tick M01).
- [ ] Final verify: all 6 files present; `for f in supabase/migrations/2026*; do grep -L "to service_role" $f; done` ⇒ empty (every file grants). Commit. Push (after write access).

## Verification (whole branch)
- All six files in `supabase/migrations/`, FK-ordered by timestamp.
- Apply-time (Hardik, once `.env.local` has keys): paste each file in Supabase SQL Editor in order → no error → re-run → still no error (idempotent).
- Smoke: `select count(*) from <table>` per table ⇒ 0, no "permission denied" (proves grants).
- Lane-clean: only `supabase/migrations/**` + `docs/**` changed.

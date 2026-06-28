-- 20260628070451_inventory.sql — Inventory tables (M11), Hardik's lane.
-- stock_batches (on-hand by SKU + batch + expiry) + stock_movements (append-only
-- ledger that makes FIFO/M13 + reconciliation/M27 + audit verifiable).
-- Depends on: 0001_skus.sql (skus), 20260628070450_core.sql (users).
-- Idempotent-safe. Apply via Supabase SQL Editor after core.

do $$ begin
  create type movement_type as enum
    ('inward','sale_deduct','van_out','van_return','adjustment');
exception when duplicate_object then null; end $$;

-- ── stock_batches ──────────────────────────────────────────────────────────
create table if not exists public.stock_batches (
  id           uuid primary key default gen_random_uuid(),
  sku_id       uuid not null references public.skus(id) on delete restrict,
  batch_no     text not null,
  mfg_date     date,
  expiry_date  date,                              -- FIFO: oldest expiry first, then received_at
  qty_on_hand  numeric(12,2) not null default 0 check (qty_on_hand >= 0),
  received_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (sku_id, batch_no)
);

alter table public.stock_batches enable row level security;
drop policy if exists stock_batches_read_authenticated on public.stock_batches;
create policy stock_batches_read_authenticated on public.stock_batches
  for select to authenticated using (true);
grant all privileges on table public.stock_batches to service_role;
grant select on table public.stock_batches to authenticated;

drop trigger if exists stock_batches_set_updated_at on public.stock_batches;
create trigger stock_batches_set_updated_at before update on public.stock_batches
  for each row execute function public.set_updated_at();

-- ── stock_movements ────────────────────────────────────────────────────────
-- Append-only ledger. qty is always positive; direction is implied by movement_type
-- (inward/van_return add; sale_deduct/van_out remove; adjustment signed by type use).
create table if not exists public.stock_movements (
  id             uuid primary key default gen_random_uuid(),
  sku_id         uuid not null references public.skus(id) on delete restrict,
  batch_id       uuid references public.stock_batches(id) on delete set null,
  movement_type  movement_type not null,
  qty            numeric(12,2) not null check (qty >= 0),
  ref_type       text,                            -- e.g. 'invoice', 'van_load'
  ref_id         uuid,
  created_by     uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

alter table public.stock_movements enable row level security;
drop policy if exists stock_movements_read_authenticated on public.stock_movements;
create policy stock_movements_read_authenticated on public.stock_movements
  for select to authenticated using (true);
grant select, insert on table public.stock_movements to service_role;  -- append-only
grant select on table public.stock_movements to authenticated;

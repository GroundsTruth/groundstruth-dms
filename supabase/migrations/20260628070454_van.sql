-- 20260628070454_van.sql — Van load-out, returns & reconciliation (M24-M28), Hardik.
-- van_loads, van_load_lines (returns as qty_returned column), reconciliations.
-- reconcile() (out − sold − returned → variance flag, M27) is a service over these.
-- Depends on: skus (0001), core (users), inventory (stock_batches). Idempotent-safe.

do $$ begin
  create type van_load_status as enum ('open','reconciled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type recon_status as enum ('ok','flagged');
exception when duplicate_object then null; end $$;

-- ── van_loads ──────────────────────────────────────────────────────────────
create table if not exists public.van_loads (
  id              uuid primary key default gen_random_uuid(),
  load_no         text not null unique,
  vehicle         text,
  driver_user_id  uuid references public.users(id) on delete set null,
  route           text,
  load_date       date not null default current_date,
  status          van_load_status not null default 'open',
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.van_loads enable row level security;
drop policy if exists van_loads_read_authenticated on public.van_loads;
create policy van_loads_read_authenticated on public.van_loads
  for select to authenticated using (true);
grant all privileges on table public.van_loads to service_role;
grant select on table public.van_loads to authenticated;

drop trigger if exists van_loads_set_updated_at on public.van_loads;
create trigger van_loads_set_updated_at before update on public.van_loads
  for each row execute function public.set_updated_at();

-- ── van_load_lines ─────────────────────────────────────────────────────────
-- One row per SKU per load; returns captured in-place as qty_returned (M26).
create table if not exists public.van_load_lines (
  id             uuid primary key default gen_random_uuid(),
  van_load_id    uuid not null references public.van_loads(id) on delete cascade,
  sku_id         uuid not null references public.skus(id) on delete restrict,
  batch_id       uuid references public.stock_batches(id) on delete set null,
  qty_out        numeric(12,2) not null check (qty_out >= 0),
  qty_returned   numeric(12,2) not null default 0 check (qty_returned >= 0),
  created_at     timestamptz not null default now()
);

alter table public.van_load_lines enable row level security;
drop policy if exists van_load_lines_read_authenticated on public.van_load_lines;
create policy van_load_lines_read_authenticated on public.van_load_lines
  for select to authenticated using (true);
grant all privileges on table public.van_load_lines to service_role;
grant select on table public.van_load_lines to authenticated;

-- ── reconciliations ────────────────────────────────────────────────────────
-- One reconciliation per van load: out − sold − returned, cash expected vs collected.
create table if not exists public.reconciliations (
  id              uuid primary key default gen_random_uuid(),
  van_load_id     uuid not null unique references public.van_loads(id) on delete cascade,
  qty_out         numeric(12,2) not null default 0 check (qty_out >= 0),
  qty_sold        numeric(12,2) not null default 0 check (qty_sold >= 0),
  qty_returned    numeric(12,2) not null default 0 check (qty_returned >= 0),
  variance        numeric(12,2) not null default 0,         -- signed: may be +/-
  cash_expected   numeric(12,2) not null default 0 check (cash_expected >= 0),
  cash_collected  numeric(12,2) not null default 0 check (cash_collected >= 0),
  cash_variance   numeric(12,2) not null default 0,         -- signed
  status          recon_status not null default 'ok',
  reconciled_by   uuid references public.users(id) on delete set null,
  reconciled_at   timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.reconciliations enable row level security;
drop policy if exists reconciliations_read_authenticated on public.reconciliations;
create policy reconciliations_read_authenticated on public.reconciliations
  for select to authenticated using (true);
grant all privileges on table public.reconciliations to service_role;
grant select on table public.reconciliations to authenticated;

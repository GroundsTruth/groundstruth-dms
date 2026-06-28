-- 20260628070450_core.sql — Core / Auth tables (M01, joint/PR-reviewed).
-- users (RBAC identity), config (app settings), audit_log (append-only trail).
-- Reuses public.set_updated_at() from 0001_skus.sql — do NOT redefine it here.
-- Apply via Supabase SQL Editor; idempotent-safe (re-runnable).

-- role enum (guarded so re-running won't hard-fail)
do $$ begin
  create type app_role as enum ('owner','warehouse','driver_rep');
exception when duplicate_object then null; end $$;

-- ── users ──────────────────────────────────────────────────────────────────
-- One row per signed-in staff member; id mirrors auth.users. OTP/JWT land in M05-M09.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  phone       text unique,                       -- login identity (OTP later)
  role        app_role not null default 'driver_rep',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.users enable row level security;
drop policy if exists users_read_authenticated on public.users;
create policy users_read_authenticated on public.users
  for select to authenticated using (true);
grant all privileges on table public.users to service_role;
grant select on table public.users to authenticated;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ── config ─────────────────────────────────────────────────────────────────
-- Key/value app settings: tax_slabs, invoice_series, recon_tolerance,
-- discount_ceiling, low_stock_threshold (seeded later by M03).
create table if not exists public.config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.config enable row level security;
drop policy if exists config_read_authenticated on public.config;
create policy config_read_authenticated on public.config
  for select to authenticated using (true);
grant all privileges on table public.config to service_role;
grant select on table public.config to authenticated;

drop trigger if exists config_set_updated_at on public.config;
create trigger config_set_updated_at before update on public.config
  for each row execute function public.set_updated_at();

-- ── audit_log ──────────────────────────────────────────────────────────────
-- Append-only mutation trail (written by AuditService, M02). No updates/deletes:
-- grant only select + insert, and no updated_at trigger.
create table if not exists public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references public.users(id) on delete set null,
  action         text not null,                  -- e.g. 'sku.update', 'invoice.create'
  entity_table   text not null,
  entity_id      uuid,
  before         jsonb,
  after          jsonb,
  created_at     timestamptz not null default now()
);

alter table public.audit_log enable row level security;
drop policy if exists audit_log_read_authenticated on public.audit_log;
create policy audit_log_read_authenticated on public.audit_log
  for select to authenticated using (true);
grant select, insert on table public.audit_log to service_role;  -- append-only
grant select on table public.audit_log to authenticated;

-- 0001_skus.sql — SKU / product master for the Catalog module.
-- RLS-enabled reference data. Apply via Supabase SQL Editor (idempotent-safe).
-- Columns marked TODO await the client/CA (tax, MRP, case packing).

-- category enum (guarded so re-running won't hard-fail)
do $$ begin
  create type sku_category as enum
    ('Cola','Lemon','Orange','Soda','Energy','Juice','Water','Other');
exception when duplicate_object then null; end $$;

create table if not exists public.skus (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,          -- canonical SKU code
  name           text not null,                 -- canonical display name
  category       sku_category not null default 'Other',
  pack_ml        integer,                        -- unit size in ml (null if N/A)
  pack_label     text not null,                  -- e.g. "500 ML PET", "Can 250"
  rate_per_case  numeric(10,2),                  -- distributor rate / case
  mrp            numeric(10,2),                  -- TODO: client
  hsn            text,                           -- TODO: client/CA
  tax_slab_pct   numeric(5,2),                   -- TODO: GST % per SKU
  cess_pct       numeric(5,2),                   -- TODO: cess % (cola carries cess)
  units_per_case integer,                        -- TODO: client
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.skus enable row level security;

-- Reference data: any signed-in user may read. Writes go through our server
-- (service role only) — so there is deliberately no insert/update/delete policy.
drop policy if exists skus_read_authenticated on public.skus;
create policy skus_read_authenticated on public.skus
  for select to authenticated using (true);

-- Data-API privileges. This project has "Automatically expose new tables" OFF,
-- so EVERY new table must GRANT explicitly (no auto-grant to API roles).
-- service_role = our server (admin client, bypasses RLS); authenticated = signed-in staff (read).
grant all privileges on table public.skus to service_role;
grant select on table public.skus to authenticated;

-- keep updated_at fresh on edits
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists skus_set_updated_at on public.skus;
create trigger skus_set_updated_at before update on public.skus
  for each row execute function public.set_updated_at();

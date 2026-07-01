-- 20260701130612_schemes.sql — Scheme / freebie engine (S2, client 2026-07-01).
-- Buy trigger_qty cases of trigger SKU → get free_qty cases of free SKU free (cross-SKU
-- allowed; e.g. buy 10 cases 1.5L water → 1 free; buy 2 cases CSD 1L → 1 case Suncrush
-- Mango 200ml free). Freebies are added as ₹0 order lines. Admin-configurable + toggleable
-- (Campa pushes them dynamically). Apply via SQL Editor. Idempotent; RLS + grants per rule 5.

create table if not exists public.schemes (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  trigger_sku_id uuid not null references public.skus(id) on delete restrict,
  trigger_qty    numeric(12,2) not null check (trigger_qty > 0),
  free_sku_id    uuid not null references public.skus(id) on delete restrict,
  free_qty       numeric(12,2) not null check (free_qty > 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.schemes enable row level security;
drop policy if exists schemes_read_authenticated on public.schemes;
create policy schemes_read_authenticated on public.schemes
  for select to authenticated using (true);
grant all privileges on table public.schemes to service_role;
grant select on table public.schemes to authenticated;

drop trigger if exists schemes_set_updated_at on public.schemes;
create trigger schemes_set_updated_at before update on public.schemes
  for each row execute function public.set_updated_at();

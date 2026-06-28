-- 20260628070452_retailer.sql — Retailer master (M16-M17), joint/PR-reviewed.
-- Individual shops. Today's WhatsApp feed is route-centric; `route` is kept as an
-- attribute so this is forward-compatible if the client confirms per-shop tracking.
-- Depends on: 20260628070450_core.sql (users). Idempotent-safe.

do $$ begin
  create type approval_status as enum ('pending','approved');
exception when duplicate_object then null; end $$;

create table if not exists public.retailers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  shop_name        text,
  address          text,
  phone            text,
  gstin            text,
  route            text,                          -- beat / route (feed is route-centric)
  lat              numeric(9,6),
  lng              numeric(9,6),
  approval_status  approval_status not null default 'pending',
  is_active        boolean not null default true,
  created_by       uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.retailers enable row level security;
drop policy if exists retailers_read_authenticated on public.retailers;
create policy retailers_read_authenticated on public.retailers
  for select to authenticated using (true);
grant all privileges on table public.retailers to service_role;
grant select on table public.retailers to authenticated;

drop trigger if exists retailers_set_updated_at on public.retailers;
create trigger retailers_set_updated_at before update on public.retailers
  for each row execute function public.set_updated_at();

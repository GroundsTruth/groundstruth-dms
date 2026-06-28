-- 20260628070455_collection.sql — Cash/UPI collection against invoices (M29), Hardik.
-- Records payment reference only (not processed). Depends on: sales (invoices),
-- retailer (retailers), core (users). Idempotent-safe. Apply last.

do $$ begin
  create type collection_mode as enum ('cash','upi');
exception when duplicate_object then null; end $$;

create table if not exists public.collections (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete restrict,
  retailer_id   uuid references public.retailers(id) on delete set null,
  amount        numeric(12,2) not null check (amount >= 0),
  mode          collection_mode not null,
  reference     text,                             -- UPI ref / receipt no (captured, not processed)
  collected_by  uuid references public.users(id) on delete set null,
  collected_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.collections enable row level security;
drop policy if exists collections_read_authenticated on public.collections;
create policy collections_read_authenticated on public.collections
  for select to authenticated using (true);
grant all privileges on table public.collections to service_role;
grant select on table public.collections to authenticated;

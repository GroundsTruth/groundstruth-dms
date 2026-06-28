-- 20260628070453_sales.sql — Sales / money path (M18-M23), Hardik's lane.
-- price_list, orders, order_lines, invoices, invoice_lines. Tables + constraints
-- only — confirmAndInvoice() (atomic invoice + FIFO deduct, M22) and the invoice-
-- number service (M20) are built in their own steps.
-- Depends on: skus (0001), core (users), inventory (stock_batches), retailer.
-- Idempotent-safe. Apply via Supabase SQL Editor in order.

do $$ begin
  create type order_status as enum ('draft','confirmed','invoiced','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type invoice_status as enum ('issued','cancelled');
exception when duplicate_object then null; end $$;

-- ── price_list ─────────────────────────────────────────────────────────────
-- Price per SKU, optionally scoped to a retailer or a route (both null = base price).
create table if not exists public.price_list (
  id              uuid primary key default gen_random_uuid(),
  sku_id          uuid not null references public.skus(id) on delete restrict,
  retailer_id     uuid references public.retailers(id) on delete cascade,
  route           text,
  price           numeric(10,2) not null check (price >= 0),
  effective_from  date not null default current_date,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.price_list enable row level security;
drop policy if exists price_list_read_authenticated on public.price_list;
create policy price_list_read_authenticated on public.price_list
  for select to authenticated using (true);
grant all privileges on table public.price_list to service_role;
grant select on table public.price_list to authenticated;

drop trigger if exists price_list_set_updated_at on public.price_list;
create trigger price_list_set_updated_at before update on public.price_list
  for each row execute function public.set_updated_at();

-- ── orders ─────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  order_no     text not null unique,
  retailer_id  uuid references public.retailers(id) on delete restrict,
  route        text,
  status       order_status not null default 'draft',
  order_date   date not null default current_date,
  subtotal     numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_total    numeric(12,2) not null default 0 check (tax_total >= 0),
  total        numeric(12,2) not null default 0 check (total >= 0),
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.orders enable row level security;
drop policy if exists orders_read_authenticated on public.orders;
create policy orders_read_authenticated on public.orders
  for select to authenticated using (true);
grant all privileges on table public.orders to service_role;
grant select on table public.orders to authenticated;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ── order_lines ────────────────────────────────────────────────────────────
create table if not exists public.order_lines (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  sku_id        uuid not null references public.skus(id) on delete restrict,
  qty           numeric(12,2) not null check (qty >= 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  tax_pct       numeric(5,2) not null default 0 check (tax_pct >= 0),
  tax_amount    numeric(12,2) not null default 0 check (tax_amount >= 0),
  line_total    numeric(12,2) not null default 0 check (line_total >= 0),
  created_at    timestamptz not null default now()
);

alter table public.order_lines enable row level security;
drop policy if exists order_lines_read_authenticated on public.order_lines;
create policy order_lines_read_authenticated on public.order_lines
  for select to authenticated using (true);
grant all privileges on table public.order_lines to service_role;
grant select on table public.order_lines to authenticated;

-- ── invoices ───────────────────────────────────────────────────────────────
-- invoice_no comes from the server-side numbering service (M20, configured series).
create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  invoice_no    text not null unique,
  order_id      uuid references public.orders(id) on delete set null,
  retailer_id   uuid references public.retailers(id) on delete restrict,
  invoice_date  date not null default current_date,
  subtotal      numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_total     numeric(12,2) not null default 0 check (tax_total >= 0),
  cess_total    numeric(12,2) not null default 0 check (cess_total >= 0),
  total         numeric(12,2) not null default 0 check (total >= 0),
  status        invoice_status not null default 'issued',
  pdf_path      text,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.invoices enable row level security;
drop policy if exists invoices_read_authenticated on public.invoices;
create policy invoices_read_authenticated on public.invoices
  for select to authenticated using (true);
grant all privileges on table public.invoices to service_role;
grant select on table public.invoices to authenticated;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

-- ── invoice_lines ──────────────────────────────────────────────────────────
-- batch_id records which stock batch FIFO deducted (set by confirmAndInvoice, M22).
create table if not exists public.invoice_lines (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  sku_id        uuid not null references public.skus(id) on delete restrict,
  batch_id      uuid references public.stock_batches(id) on delete set null,
  qty           numeric(12,2) not null check (qty >= 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  tax_pct       numeric(5,2) not null default 0 check (tax_pct >= 0),
  tax_amount    numeric(12,2) not null default 0 check (tax_amount >= 0),
  cess_pct      numeric(5,2) not null default 0 check (cess_pct >= 0),
  cess_amount   numeric(12,2) not null default 0 check (cess_amount >= 0),
  line_total    numeric(12,2) not null default 0 check (line_total >= 0),
  created_at    timestamptz not null default now()
);

alter table public.invoice_lines enable row level security;
drop policy if exists invoice_lines_read_authenticated on public.invoice_lines;
create policy invoice_lines_read_authenticated on public.invoice_lines
  for select to authenticated using (true);
grant all privileges on table public.invoice_lines to service_role;
grant select on table public.invoice_lines to authenticated;

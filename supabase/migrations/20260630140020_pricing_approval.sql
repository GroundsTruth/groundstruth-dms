-- 20260630140020_pricing_approval.sql — Pricing + below-list approval (audit #4/#5/#9/#21).
-- order_lines gain list_price + discount_pct (rep can charge below list). Orders get a
-- 'pending_approval' state for any below-list line (gated in the confirmAndInvoice action).
-- price_list gains list_type (retail vs wholesale); retailers gain customer_category to pick
-- which list applies. Apply via Supabase SQL Editor. Idempotent.

-- #5: below-list orders route to admin approval.
alter type order_status add value if not exists 'pending_approval';

-- #4: rep-entered rate (unit_price = charged) + the list it was compared against + discount.
alter table public.order_lines add column if not exists list_price   numeric(10,2);
alter table public.order_lines add column if not exists discount_pct numeric(5,2) not null default 0;

-- #9: two price lists. Existing rows default to 'retail'.
alter table public.price_list add column if not exists list_type text not null default 'retail';

-- #21: customer category picks the price list (retail shop vs wholesale buyer).
alter table public.retailers add column if not exists customer_category text not null default 'retail';

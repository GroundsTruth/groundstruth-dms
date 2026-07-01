-- 20260630141226_retailer_credit_onboarding.sql — Retailer credit + onboarding (audit
-- #6/#11/#12/#22). cash vs credit customer type, a credit limit, distinct owner name, and
-- a shop-photo path (anti-fraud). Outstanding/credit is DERIVED (invoices − collections),
-- so no ledger table is needed. Apply via Supabase SQL Editor. Idempotent.

alter table public.retailers add column if not exists customer_type   text not null default 'cash'; -- cash | credit
alter table public.retailers add column if not exists credit_limit    numeric(12,2) not null default 0 check (credit_limit >= 0);
alter table public.retailers add column if not exists owner_name      text;
alter table public.retailers add column if not exists shop_photo_path text;

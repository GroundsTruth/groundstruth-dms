-- _apply_pending.sql — paste-once for ALL pending migrations (Supabase SQL Editor).
-- Generated 2026-07-01. Order matters (FK/enum deps). Every file is idempotent
-- (if-not-exists / create-or-replace), so re-running is safe.
-- If the editor complains on an 'alter type ... add value' line inside a txn,
-- run that single line on its own, then re-run the rest.
-- After running: mark each Applied in docs/MIGRATIONS.md.

-- ============================================================
-- 20260630134832_invoice_inclusive_tax_hsn.sql
-- ============================================================
-- 20260630134832_invoice_inclusive_tax_hsn.sql — Money-correctness fixes (Hardik).
-- Fixes BUILD_AUDIT #1/#2 (GST is INCLUSIVE, was added on top → over-billing), #8 (HSN
-- never reached the invoice), #3 (Soda wrongly 40% → 18%). Per docs/INVOICE_SPEC.md §3.
-- Apply via Supabase SQL Editor. Idempotent (create or replace + add column if not exists).

-- #8: snapshot HSN onto the invoice line (a GST invoice must show HSN).
alter table public.invoice_lines add column if not exists hsn text;

-- #3: Soda is plain club soda @ 18%, not the 40% aerated slab (was lumped in by the
-- category migration). Corrective + (going forward) per-SKU seed is the source of truth.
update public.skus set tax_slab_pct = 18 where category = 'Soda';

-- #1/#2: confirm_and_invoice — GST-INCLUSIVE extraction (mirrors src/lib/sales/invoice-tax.ts).
-- taxable = gross / (1 + (gst+cess)/100); gst/cess are %-of-taxable; line_total = gross.
create or replace function public.confirm_and_invoice(
  p_order_id uuid,
  p_actor    uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_order      record;
  v_line       record;
  v_inv_id     uuid;
  v_inv_no     text;
  v_tax_pct    numeric;
  v_cess_pct   numeric;
  v_hsn        text;
  alloc        record;
  v_gross      numeric;
  v_taxable    numeric;
  v_tax        numeric;
  v_cess       numeric;
  v_subtotal   numeric := 0;
  v_tax_total  numeric := 0;
  v_cess_total numeric := 0;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'confirm_and_invoice: order % not found', p_order_id; end if;
  if v_order.status = 'invoiced' then raise exception 'confirm_and_invoice: order % is already invoiced', p_order_id; end if;
  if v_order.status = 'cancelled' then raise exception 'confirm_and_invoice: order % is cancelled', p_order_id; end if;

  v_inv_no := public.next_invoice_no();

  insert into public.invoices
    (invoice_no, order_id, retailer_id, status, subtotal, tax_total, cess_total, total, created_by)
  values
    (v_inv_no, p_order_id, v_order.retailer_id, 'issued', 0, 0, 0, 0, p_actor)
  returning id into v_inv_id;

  for v_line in select * from public.order_lines where order_id = p_order_id
  loop
    select coalesce(tax_slab_pct, 0), coalesce(cess_pct, 0), hsn
      into v_tax_pct, v_cess_pct, v_hsn
      from public.skus where id = v_line.sku_id;

    for alloc in
      select * from public.deduct_stock(v_line.sku_id, v_line.qty, p_actor, 'invoice', v_inv_id)
    loop
      -- unit_price is GST-INCLUSIVE; extract the taxable value out of the gross.
      -- Total tax = gross − taxable (taxable + tax reconciles to gross exactly, no paisa
      -- drift); cess is its share, GST the remainder.
      v_gross   := round(alloc.qty * v_line.unit_price, 2);
      v_taxable := round(v_gross / (1 + (v_tax_pct + v_cess_pct) / 100), 2);
      v_cess    := round(v_taxable * v_cess_pct / 100, 2);
      v_tax     := round(v_gross - v_taxable - v_cess, 2);

      insert into public.invoice_lines
        (invoice_id, sku_id, batch_id, hsn, qty, unit_price, tax_pct, tax_amount, cess_pct, cess_amount, line_total)
      values
        (v_inv_id, v_line.sku_id, alloc.batch_id, v_hsn, alloc.qty, v_line.unit_price,
         v_tax_pct, v_tax, v_cess_pct, v_cess, v_gross);   -- line_total = inclusive gross

      v_subtotal   := v_subtotal + v_taxable;
      v_tax_total  := v_tax_total + v_tax;
      v_cess_total := v_cess_total + v_cess;
    end loop;
  end loop;

  update public.invoices
    set subtotal = v_subtotal, tax_total = v_tax_total, cess_total = v_cess_total,
        total = v_subtotal + v_tax_total + v_cess_total
    where id = v_inv_id;

  update public.orders set status = 'invoiced' where id = p_order_id;

  return v_inv_id;
end;
$$;

revoke all on function public.confirm_and_invoice(uuid, uuid) from public;
grant execute on function public.confirm_and_invoice(uuid, uuid) to service_role;


-- ============================================================
-- 20260630140020_pricing_approval.sql
-- ============================================================
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


-- ============================================================
-- 20260630141226_retailer_credit_onboarding.sql
-- ============================================================
-- 20260630141226_retailer_credit_onboarding.sql — Retailer credit + onboarding (audit
-- #6/#11/#12/#22). cash vs credit customer type, a credit limit, distinct owner name, and
-- a shop-photo path (anti-fraud). Outstanding/credit is DERIVED (invoices − collections),
-- so no ledger table is needed. Apply via Supabase SQL Editor. Idempotent.

alter table public.retailers add column if not exists customer_type   text not null default 'cash'; -- cash | credit
alter table public.retailers add column if not exists credit_limit    numeric(12,2) not null default 0 check (credit_limit >= 0);
alter table public.retailers add column if not exists owner_name      text;
alter table public.retailers add column if not exists shop_photo_path text;


-- ============================================================
-- 20260630142741_adjust_stock_fn.sql
-- ============================================================
-- 20260630142741_adjust_stock_fn.sql — Stock adjustment / wastage / physical count
-- (audit #15/#16). Adjusts a batch's on-hand by a signed delta (negative = wastage/expiry,
-- positive = found/count-up), writing an 'adjustment' movement with the reason. Guards
-- against going below 0 (qty>=0 constraint). Server-only. Apply via SQL Editor. Idempotent.

create or replace function public.adjust_stock(
  p_batch_id uuid,
  p_qty_delta numeric,
  p_reason   text,
  p_actor    uuid default null
) returns void
language plpgsql
as $$
declare
  r     record;
  v_new numeric;
begin
  if p_qty_delta = 0 then return; end if;

  select * into r from public.stock_batches where id = p_batch_id for update;
  if not found then raise exception 'adjust_stock: batch % not found', p_batch_id; end if;

  v_new := r.qty_on_hand + p_qty_delta;
  if v_new < 0 then
    raise exception 'adjust_stock: would go below 0 (have %, delta %)', r.qty_on_hand, p_qty_delta;
  end if;

  update public.stock_batches
    set qty_on_hand = v_new, updated_at = now()
    where id = p_batch_id;

  insert into public.stock_movements
    (sku_id, batch_id, movement_type, qty, ref_type, ref_id, created_by)
  values
    (r.sku_id, p_batch_id, 'adjustment', abs(p_qty_delta),
     coalesce(nullif(p_reason, ''), 'adjustment'), null, p_actor);
end;
$$;

revoke all on function public.adjust_stock(uuid, numeric, text, uuid) from public;
grant execute on function public.adjust_stock(uuid, numeric, text, uuid) to service_role;


-- ============================================================
-- 20260701124019_recon_tiers.sql
-- ============================================================
-- 20260701124019_recon_tiers.sql — Tiered reconciliation status (client 2026-07-01).
-- recon_status gains 'warn' + 'critical' (was ok/flagged). Cash: <0.1% ok · 0.1-0.3% warn ·
-- >0.3% critical. Stock: <0.2% · 0.2-0.6% · >0.6%. Thresholds live in reconcile-logic.ts.
-- Apply via SQL Editor before reconciling (else writing 'warn'/'critical' errors). Idempotent.

alter type recon_status add value if not exists 'warn';
alter type recon_status add value if not exists 'critical';


-- ============================================================
-- 20260701130612_schemes.sql
-- ============================================================
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



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

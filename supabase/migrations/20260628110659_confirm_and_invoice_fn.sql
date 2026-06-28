-- 20260628110659_confirm_and_invoice_fn.sql — Atomic invoice + stock deduct (M22), Hardik.
-- THE money path. In ONE transaction: reserve an invoice number (next_invoice_no),
-- create the invoice header + a line per FIFO batch allocation (deduct_stock), compute
-- GST + cess per line from skus rates, total it, and flip the order to 'invoiced'.
-- Reuses the tested next_invoice_no() + deduct_stock() (same txn). If any SKU is short,
-- deduct_stock raises and the WHOLE thing rolls back — no invoice, no number burned, no
-- partial deduct. Returns the invoice id. Server-only (execute to service_role).
-- Depends on: sales tables, next_invoice_no, deduct_stock. Idempotent (create or replace).

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
  alloc        record;
  v_taxable    numeric;
  v_tax        numeric;
  v_cess       numeric;
  v_subtotal   numeric := 0;
  v_tax_total  numeric := 0;
  v_cess_total numeric := 0;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'confirm_and_invoice: order % not found', p_order_id;
  end if;
  if v_order.status = 'invoiced' then
    raise exception 'confirm_and_invoice: order % is already invoiced', p_order_id;
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'confirm_and_invoice: order % is cancelled', p_order_id;
  end if;

  v_inv_no := public.next_invoice_no();

  insert into public.invoices
    (invoice_no, order_id, retailer_id, status, subtotal, tax_total, cess_total, total, created_by)
  values
    (v_inv_no, p_order_id, v_order.retailer_id, 'issued', 0, 0, 0, 0, p_actor)
  returning id into v_inv_id;

  for v_line in select * from public.order_lines where order_id = p_order_id
  loop
    select coalesce(tax_slab_pct, 0), coalesce(cess_pct, 0)
      into v_tax_pct, v_cess_pct
      from public.skus where id = v_line.sku_id;

    -- FIFO deduct (raises on shortfall → full rollback); one invoice_line per allocation.
    for alloc in
      select * from public.deduct_stock(v_line.sku_id, v_line.qty, p_actor, 'invoice', v_inv_id)
    loop
      v_taxable := round(alloc.qty * v_line.unit_price, 2);
      v_tax     := round(v_taxable * v_tax_pct / 100, 2);
      v_cess    := round(v_taxable * v_cess_pct / 100, 2);

      insert into public.invoice_lines
        (invoice_id, sku_id, batch_id, qty, unit_price, tax_pct, tax_amount, cess_pct, cess_amount, line_total)
      values
        (v_inv_id, v_line.sku_id, alloc.batch_id, alloc.qty, v_line.unit_price,
         v_tax_pct, v_tax, v_cess_pct, v_cess, v_taxable + v_tax + v_cess);

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

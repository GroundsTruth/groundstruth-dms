-- 20260628090247_deduct_stock_fn.sql — Atomic FIFO stock deduction (M13), Hardik.
-- Deducts p_qty of a SKU across its batches, oldest-expiry first (nulls last), then
-- oldest received. Per batch: decrement qty_on_hand + write a 'sale_deduct' movement.
-- All in ONE txn: if total on-hand < p_qty it RAISES (whole deduction rolls back —
-- never a partial deduct, never negative stock). `for update` locks the batch rows so
-- two concurrent deducts can't oversell. Returns the allocations (batch_id, qty) so
-- the caller (confirmAndInvoice, M22) can stamp invoice_lines.batch_id.
-- Depends on: 20260628070451_inventory.sql. Idempotent (create or replace).

create or replace function public.deduct_stock(
  p_sku_id   uuid,
  p_qty      numeric,
  p_actor    uuid default null,
  p_ref_type text default null,
  p_ref_id   uuid default null
) returns table(batch_id uuid, qty numeric)
language plpgsql
as $$
declare
  v_remaining numeric := p_qty;
  v_take      numeric;
  r           record;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'deduct_stock: qty must be > 0 (got %)', p_qty;
  end if;

  for r in
    select id, qty_on_hand
    from public.stock_batches
    where sku_id = p_sku_id and qty_on_hand > 0
    order by expiry_date asc nulls last, received_at asc
    for update
  loop
    exit when v_remaining <= 0;
    v_take := least(r.qty_on_hand, v_remaining);

    update public.stock_batches
      set qty_on_hand = qty_on_hand - v_take, updated_at = now()
      where id = r.id;

    insert into public.stock_movements
      (sku_id, batch_id, movement_type, qty, ref_type, ref_id, created_by)
    values
      (p_sku_id, r.id, 'sale_deduct', v_take, p_ref_type, p_ref_id, p_actor);

    batch_id := r.id;
    qty := v_take;
    return next;

    v_remaining := v_remaining - v_take;
  end loop;

  if v_remaining > 0 then
    raise exception 'deduct_stock: insufficient stock for sku % (short by %)',
      p_sku_id, v_remaining;
  end if;
end;
$$;

-- Server-only: revoke from PUBLIC, grant execute to service_role (our admin client).
revoke all on function public.deduct_stock(uuid, numeric, uuid, text, uuid) from public;
grant execute on function public.deduct_stock(uuid, numeric, uuid, text, uuid) to service_role;

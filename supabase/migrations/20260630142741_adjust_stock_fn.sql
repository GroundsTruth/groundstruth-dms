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

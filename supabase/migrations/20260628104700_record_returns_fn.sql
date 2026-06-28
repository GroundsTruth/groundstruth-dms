-- 20260628104700_record_returns_fn.sql — Atomic van return capture (M26), Hardik.
-- For each return line: add the qty back to the SAME batch it was loaded from (so
-- expiry/FIFO integrity holds), bump van_load_lines.qty_returned, and write a
-- 'van_return' stock_movement. Guards: qty >= 0 and (returned + qty) <= qty_out.
-- All in one txn — a bad line rolls back the whole return. p_returns = jsonb array of
-- {line_id, qty}. Server-only (execute to service_role). Idempotent (create or replace).

create or replace function public.record_returns(
  p_van_load_id uuid,
  p_returns     jsonb,
  p_actor       uuid default null
) returns void
language plpgsql
as $$
declare
  r     jsonb;
  v_id  uuid;
  v_qty numeric;
  rec   record;
begin
  for r in select * from jsonb_array_elements(p_returns)
  loop
    v_id  := (r->>'line_id')::uuid;
    v_qty := (r->>'qty')::numeric;

    if v_qty is null or v_qty < 0 then
      raise exception 'record_returns: qty must be >= 0 for line %', v_id;
    end if;
    continue when v_qty = 0;

    select * into rec
    from public.van_load_lines
    where id = v_id and van_load_id = p_van_load_id
    for update;
    if not found then
      raise exception 'record_returns: line % not in load %', v_id, p_van_load_id;
    end if;

    if rec.qty_returned + v_qty > rec.qty_out then
      raise exception 'record_returns: return (%) exceeds out (%) for line %',
        rec.qty_returned + v_qty, rec.qty_out, v_id;
    end if;

    update public.van_load_lines
      set qty_returned = qty_returned + v_qty
      where id = v_id;

    if rec.batch_id is not null then
      update public.stock_batches
        set qty_on_hand = qty_on_hand + v_qty, updated_at = now()
        where id = rec.batch_id;
    end if;

    insert into public.stock_movements
      (sku_id, batch_id, movement_type, qty, ref_type, ref_id, created_by)
    values
      (rec.sku_id, rec.batch_id, 'van_return', v_qty, 'van_load', p_van_load_id, p_actor);
  end loop;
end;
$$;

revoke all on function public.record_returns(uuid, jsonb, uuid) from public;
grant execute on function public.record_returns(uuid, jsonb, uuid) to service_role;

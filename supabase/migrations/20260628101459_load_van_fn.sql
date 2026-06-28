-- 20260628101459_load_van_fn.sql — Atomic van load-out (M24), Hardik.
-- Creates a van_load header, then for each line FIFO-pulls qty_out from warehouse
-- batches (oldest-expiry first, row-locked), writing a 'van_out' stock_movement and a
-- van_load_line per batch allocation. ALL in one txn: if any SKU is short, the whole
-- load rolls back (no half-loaded van, no negative stock). Returns the van_load id.
-- p_lines = jsonb array of {sku_id, qty}. Server-only (execute to service_role).
-- Depends on: van + inventory migrations. Idempotent (create or replace).

create or replace function public.load_van(
  p_load_no   text,
  p_vehicle   text,
  p_driver    uuid,
  p_route     text,
  p_load_date date,
  p_lines     jsonb,
  p_actor     uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_id        uuid;
  v_line      jsonb;
  v_sku       uuid;
  v_qty       numeric;
  v_remaining numeric;
  v_take      numeric;
  r           record;
begin
  insert into public.van_loads (load_no, vehicle, driver_user_id, route, load_date, status, created_by)
  values (p_load_no, p_vehicle, p_driver, p_route, coalesce(p_load_date, current_date), 'open', p_actor)
  returning id into v_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_sku := (v_line->>'sku_id')::uuid;
    v_qty := (v_line->>'qty')::numeric;
    if v_qty is null or v_qty <= 0 then
      raise exception 'load_van: qty must be > 0 for sku %', v_sku;
    end if;

    v_remaining := v_qty;
    for r in
      select id, qty_on_hand from public.stock_batches
      where sku_id = v_sku and qty_on_hand > 0
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
      values (v_sku, r.id, 'van_out', v_take, 'van_load', v_id, p_actor);

      insert into public.van_load_lines (van_load_id, sku_id, batch_id, qty_out)
      values (v_id, v_sku, r.id, v_take);

      v_remaining := v_remaining - v_take;
    end loop;

    if v_remaining > 0 then
      raise exception 'load_van: insufficient stock for sku % (short by %)', v_sku, v_remaining;
    end if;
  end loop;

  return v_id;
end;
$$;

revoke all on function public.load_van(text, text, uuid, text, date, jsonb, uuid) from public;
grant execute on function public.load_van(text, text, uuid, text, date, jsonb, uuid) to service_role;

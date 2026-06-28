-- 20260628082112_receive_stock_fn.sql — Atomic stock receive RPC (M12), Hardik.
-- One transaction: upsert the batch (add to existing qty, or create) + write the
-- `inward` stock_movement. Both commit or neither — no half-written stock. Sets the
-- transaction pattern reused by FIFO deduct (M13) and confirmAndInvoice() (M22).
-- Called server-side via supabase.rpc('receive_stock', …) with the service-role key.
-- Depends on: 20260628070451_inventory.sql. Idempotent (create or replace).

create or replace function public.receive_stock(
  p_sku_id      uuid,
  p_batch_no    text,
  p_qty         numeric,
  p_mfg_date    date default null,
  p_expiry_date date default null,
  p_actor       uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_batch_id uuid;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'receive_stock: qty must be > 0 (got %)', p_qty;
  end if;

  -- Add to the batch if it already exists for this SKU, else create it.
  insert into public.stock_batches (sku_id, batch_no, mfg_date, expiry_date, qty_on_hand)
  values (p_sku_id, p_batch_no, p_mfg_date, p_expiry_date, p_qty)
  on conflict (sku_id, batch_no) do update
    set qty_on_hand = public.stock_batches.qty_on_hand + excluded.qty_on_hand,
        mfg_date    = coalesce(public.stock_batches.mfg_date, excluded.mfg_date),
        expiry_date = coalesce(public.stock_batches.expiry_date, excluded.expiry_date),
        updated_at  = now()
  returning id into v_batch_id;

  -- Append-only ledger entry for the inward move.
  insert into public.stock_movements
    (sku_id, batch_id, movement_type, qty, ref_type, ref_id, created_by)
  values
    (p_sku_id, v_batch_id, 'inward', p_qty, 'receive', v_batch_id, p_actor);

  return v_batch_id;
end;
$$;

-- Server-only: revoke from PUBLIC, grant execute to service_role (our admin client).
revoke all on function public.receive_stock(uuid, text, numeric, date, date, uuid) from public;
grant execute on function public.receive_stock(uuid, text, numeric, date, date, uuid) to service_role;

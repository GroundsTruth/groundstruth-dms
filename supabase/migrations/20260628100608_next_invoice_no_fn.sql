-- 20260628100608_next_invoice_no_fn.sql — Atomic invoice-number service (M20), Hardik.
-- Reads config.invoice_series ({prefix,next,padding}), formats the current number, and
-- increments `next` — all under a row lock (`for update`) so two concurrent invoices
-- can never get the same number or skip one. Self-heals if the config row is missing.
-- Server-only: execute granted to service_role. Depends on: config (core migration).
-- Idempotent (create or replace).

create or replace function public.next_invoice_no()
returns text
language plpgsql
as $$
declare
  v        jsonb;
  v_prefix text;
  v_next   integer;
  v_pad    integer;
  v_no     text;
begin
  select value into v from public.config where key = 'invoice_series' for update;

  if v is null then
    v := '{"prefix":"INV","next":1,"padding":5}'::jsonb;
    insert into public.config (key, value) values ('invoice_series', v)
      on conflict (key) do update set value = excluded.value;
    -- re-lock the freshly inserted row
    select value into v from public.config where key = 'invoice_series' for update;
  end if;

  v_prefix := coalesce(nullif(trim(v->>'prefix'), ''), 'INV');
  v_next   := coalesce((v->>'next')::integer, 1);
  v_pad    := coalesce((v->>'padding')::integer, 5);
  if v_pad < 1 then v_pad := 5; end if;

  v_no := v_prefix || lpad(v_next::text, v_pad, '0');

  update public.config
    set value = jsonb_set(v, '{next}', to_jsonb(v_next + 1)), updated_at = now()
    where key = 'invoice_series';

  return v_no;
end;
$$;

revoke all on function public.next_invoice_no() from public;
grant execute on function public.next_invoice_no() to service_role;

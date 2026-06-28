-- 20260628110658_seed_provisional_tax.sql — PROVISIONAL GST rates + seller config (M21).
-- Sets skus.tax_slab_pct / cess_pct by category from STATUTORY Indian GST (aerated
-- 28%+12% cess; packaged water 18%; juice 12%; other 18%). These are PROVISIONAL until
-- the client/CA confirm HSN→rate (see docs/MISSING_INPUTS.md). Only fills NULLs, so a
-- client-confirmed value is never overwritten. Also seeds a placeholder seller block
-- and a `tax_provisional` flag the invoice view reads to show the "provisional" banner.
-- Depends on: 0001_skus.sql, config. Idempotent. Apply via SQL Editor.

update public.skus set tax_slab_pct = 28, cess_pct = 12
  where category in ('Cola','Lemon','Orange','Soda','Energy') and tax_slab_pct is null;
update public.skus set tax_slab_pct = 18, cess_pct = 0
  where category = 'Water' and tax_slab_pct is null;
update public.skus set tax_slab_pct = 12, cess_pct = 0
  where category = 'Juice' and tax_slab_pct is null;
update public.skus set tax_slab_pct = 18, cess_pct = 0
  where category = 'Other' and tax_slab_pct is null;

insert into public.config (key, value) values
  ('seller', '{"name":"Jaypee Advertisers","gstin":"[GSTIN pending]","address":"[address pending]","state_code":""}'::jsonb),
  ('tax_provisional', 'true'::jsonb)
on conflict (key) do nothing;

-- 20260628080405_config_seed.sql — Seed default config rows (M03), Hardik's lane.
-- Mirrors src/lib/config/defaults.ts. Idempotent: on conflict do nothing, so the
-- app's runtime fallback and these seeded rows stay in lockstep without clobbering
-- any value the owner edits later. `tax_slabs` seeded empty — GST/cess is CA-gated.
-- Depends on: 20260628070450_core.sql (config table). Apply via Supabase SQL Editor.

insert into public.config (key, value) values
  ('invoice_series',      '{"prefix":"INV","next":1,"padding":5}'::jsonb),
  ('recon_tolerance',     '{"amount":0,"pct":1}'::jsonb),
  ('discount_ceiling',    '{"pct":5}'::jsonb),
  ('low_stock_threshold', '{"cases":10}'::jsonb),
  ('tax_slabs',           '{}'::jsonb)
on conflict (key) do nothing;

-- 20260629150401_fix_provisional_tax_40_5.sql — Correct provisional GST (M21), Hardik.
-- The proposal deck states post-Sept-2025 rates: aerated/cola = 40% GST (the 40% slab
-- folds in the old cess), water + juice = 5%. Supersedes 20260628110658 (which used the
-- old 28%+12% cess). STILL PROVISIONAL — replace with CA-confirmed HSN→rate values.
-- Overwrites by category (all current values are provisional, none client-confirmed yet).
-- Idempotent. Apply via Supabase SQL Editor (or already applied live as an UPDATE).

update public.skus set tax_slab_pct = 40, cess_pct = 0
  where category in ('Cola','Lemon','Orange','Soda','Energy');

update public.skus set tax_slab_pct = 5, cess_pct = 0
  where category in ('Water','Juice');

-- 'Other' left untouched (unknown classification) — confirm with CA.

-- Client taxonomy (7/1 Catalogue): Cola/Lemon/Orange merge into one category, CSD.
-- The skus.category column is the enum sku_category — add the value, then migrate rows.
--
-- ⚠ RUN IN TWO SEPARATE EXECUTIONS in the SQL Editor: Postgres refuses to ADD an enum
-- value and USE it inside the same transaction, and the editor wraps each run in one.
--
-- ── Run 1 ─────────────────────────────────────────────────────────────────────
alter type sku_category add value if not exists 'CSD';

-- ── Run 2 (separate execution) ────────────────────────────────────────────────
-- update public.skus set category = 'CSD' where category in ('Cola','Lemon','Orange');
--
-- (Old enum values Cola/Lemon/Orange stay defined — harmless; nothing writes them
-- anymore. After Run 2, re-run `npx tsx scripts/seed-skus.ts` to apply the rest of
-- the 7/1 Catalogue resync: 5% Soda/Water/Juice, HSN fixes, renames, new SKUs 053–062.)

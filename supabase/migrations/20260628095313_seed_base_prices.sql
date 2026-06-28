-- 20260628095313_seed_base_prices.sql — Seed base price_list rows (M18/M19), Hardik.
-- The per-case SELLING rate is already on skus.rate_per_case (from the Jaypee workbook,
-- 37/46 SKUs). Seed those as BASE prices (retailer_id null, route null) so the order
-- punch (M19) can resolve a line price. SKUs with null rate_per_case stay unpriced —
-- the punch flags them until the client confirms the missing 9.
-- Idempotent: only inserts a base row where one doesn't already exist for that SKU.
-- Depends on: 20260628070453_sales.sql (price_list), 0001_skus.sql. Apply via SQL Editor.

insert into public.price_list (sku_id, retailer_id, route, price, effective_from)
select s.id, null, null, s.rate_per_case, current_date
from public.skus s
where s.rate_per_case is not null
  and not exists (
    select 1 from public.price_list p
    where p.sku_id = s.id and p.retailer_id is null and p.route is null
  );

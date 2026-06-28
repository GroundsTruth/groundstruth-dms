import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePrice, type PriceRule, type PriceContext } from "./pricing";

/**
 * Price-list accessors (M18) — server-side reads, seed-safe ([] on error). Pure
 * resolution lives in ./pricing (unit-tested); this is the thin DB wrapper.
 */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Active price rules, optionally narrowed to one SKU. */
export async function getPriceRules(skuId?: string): Promise<PriceRule[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("price_list")
      .select("sku_id,retailer_id,route,price,effective_from,is_active")
      .eq("is_active", true);
    if (skuId) query = query.eq("sku_id", skuId);
    const { data, error } = await query;

    if (error) {
      console.error("getPriceRules: Supabase error —", error.message);
      return [];
    }
    return (data ?? []).map((r) => ({
      skuId: r.sku_id,
      retailerId: r.retailer_id,
      route: r.route,
      price: Number(r.price),
      effectiveFrom: r.effective_from,
      isActive: r.is_active,
    }));
  } catch (err) {
    console.error("getPriceRules: unexpected error —", err);
    return [];
  }
}

/**
 * Resolve the unit price for a SKU in context (retailer/route), as of today unless
 * `asOf` is given. Returns null when no rule applies — callers must handle that
 * (don't guess a price). This is the `priceLine()` the order punch (M19) calls.
 */
export async function priceFor(ctx: PriceContext): Promise<number | null> {
  const rules = await getPriceRules(ctx.skuId);
  return resolvePrice(rules, { ...ctx, asOf: ctx.asOf ?? todayISO() });
}

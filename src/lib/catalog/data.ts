import type { Category, Sku } from "./types";
import { SEED_SKUS } from "./seed-data";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Canonical SKU access. The seed-of-record lives in `./seed-data`; this module
 * reads the live `skus` table (server-side, service role) and falls back to the
 * seed if the DB is unreachable or empty, so pages always render.
 */
export { SEED_SKUS };

type SkuRow = {
  code: string;
  name: string;
  category: string;
  pack_ml: number | null;
  pack_label: string;
  rate_per_case: number | null;
};

/**
 * Single accessor for the SKU list. Same signature as the original seed
 * accessor — callers don't change. Reads Supabase at request time.
 */
export async function getSkus(): Promise<Sku[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("skus")
      .select("code,name,category,pack_ml,pack_label,rate_per_case")
      .eq("is_active", true)
      .order("code");

    if (error) {
      console.error("getSkus: Supabase error, using seed —", error.message);
      return SEED_SKUS;
    }
    if (!data || data.length === 0) {
      console.warn("getSkus: skus table empty, using seed.");
      return SEED_SKUS;
    }
    return (data as SkuRow[]).map((r) => ({
      code: r.code,
      name: r.name,
      category: r.category as Category,
      packMl: r.pack_ml,
      packLabel: r.pack_label,
      ratePerCase: r.rate_per_case,
    }));
  } catch (err) {
    console.error("getSkus: unexpected error, using seed —", err);
    return SEED_SKUS;
  }
}

export function categoriesOf(skus: Sku[]): string[] {
  return Array.from(new Set(skus.map((s) => s.category)));
}

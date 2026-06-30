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
  is_active: boolean;
  mrp: number | null;
  hsn: string | null;
  tax_slab_pct: number | null;
  cess_pct: number | null;
  units_per_case: number | null;
};

const SKU_COLUMNS =
  "code,name,category,pack_ml,pack_label,rate_per_case,is_active," +
  "mrp,hsn,tax_slab_pct,cess_pct,units_per_case";

/**
 * Single accessor for the SKU list. Reads Supabase at request time. Pass
 * `{ includeInactive: true }` to also return deactivated SKUs (the catalog's
 * manage view). Falls back to the static seed if the DB is unreachable or empty.
 */
export async function getSkus(opts?: { includeInactive?: boolean }): Promise<Sku[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("skus")
      .select(SKU_COLUMNS)
      .order("code");
    if (!opts?.includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;

    if (error) {
      console.error("getSkus: Supabase error, using seed —", error.message);
      return SEED_SKUS;
    }
    if (!data || data.length === 0) {
      console.warn("getSkus: skus table empty, using seed.");
      return SEED_SKUS;
    }
    return (data as unknown as SkuRow[]).map((r) => ({
      code: r.code,
      name: r.name,
      category: r.category as Category,
      packMl: r.pack_ml,
      packLabel: r.pack_label,
      ratePerCase: r.rate_per_case,
      isActive: r.is_active,
      mrp: r.mrp,
      hsn: r.hsn,
      taxSlabPct: r.tax_slab_pct,
      cessPct: r.cess_pct,
      unitsPerCase: r.units_per_case,
    }));
  } catch (err) {
    console.error("getSkus: unexpected error, using seed —", err);
    return SEED_SKUS;
  }
}

export function categoriesOf(skus: Sku[]): string[] {
  return Array.from(new Set(skus.map((s) => s.category)));
}

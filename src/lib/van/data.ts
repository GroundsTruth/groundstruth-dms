import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Van read accessors (M24) — server-side, seed-safe ([] on error). No nested joins:
 * SKU names merged in JS. Each van_load aggregates its lines for the list view.
 */

export type VanLoadSummary = {
  id: string;
  loadNo: string;
  route: string | null;
  vehicle: string | null;
  loadDate: string;
  status: string;
  totalOut: number;
  totalReturned: number;
  skuCount: number;
};

export type VanLoadLine = {
  skuId: string;
  code: string;
  name: string;
  qtyOut: number;
  qtyReturned: number;
};

/** Recent van loads with out/returned totals. */
export async function getVanLoads(limit = 25): Promise<VanLoadSummary[]> {
  try {
    const supabase = createAdminClient();
    const { data: loads, error: loadErr } = await supabase
      .from("van_loads")
      .select("id,load_no,route,vehicle,load_date,status")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (loadErr) {
      console.error("getVanLoads: Supabase error —", loadErr.message);
      return [];
    }
    const ids = (loads ?? []).map((l) => l.id);
    if (ids.length === 0) return [];

    const { data: lines, error: lineErr } = await supabase
      .from("van_load_lines")
      .select("van_load_id,sku_id,qty_out,qty_returned")
      .in("van_load_id", ids);
    if (lineErr) {
      console.error("getVanLoads: lines error —", lineErr.message);
      return [];
    }

    const agg = new Map<string, { out: number; ret: number; skus: Set<string> }>();
    for (const l of lines ?? []) {
      const cur = agg.get(l.van_load_id) ?? { out: 0, ret: 0, skus: new Set<string>() };
      cur.out += Number(l.qty_out);
      cur.ret += Number(l.qty_returned);
      cur.skus.add(l.sku_id);
      agg.set(l.van_load_id, cur);
    }

    return (loads ?? []).map((l) => {
      const a = agg.get(l.id) ?? { out: 0, ret: 0, skus: new Set<string>() };
      return {
        id: l.id,
        loadNo: l.load_no,
        route: l.route,
        vehicle: l.vehicle,
        loadDate: l.load_date,
        status: l.status,
        totalOut: a.out,
        totalReturned: a.ret,
        skuCount: a.skus.size,
      };
    });
  } catch (err) {
    console.error("getVanLoads: unexpected error —", err);
    return [];
  }
}

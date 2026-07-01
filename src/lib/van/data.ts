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

export type VanLoadDetail = {
  id: string;
  loadNo: string;
  route: string | null;
  vehicle: string | null;
  loadDate: string;
  status: string;
  lines: {
    lineId: string;
    skuId: string;
    code: string;
    name: string;
    rate: number; // base retail price (for the challan)
    qtyOut: number;
    qtyReturned: number;
    remaining: number;
  }[];
};

/** One van load with its lines (for the detail + returns view). Null if not found. */
export async function getVanLoad(id: string): Promise<VanLoadDetail | null> {
  try {
    const supabase = createAdminClient();
    const { data: load, error: loadErr } = await supabase
      .from("van_loads")
      .select("id,load_no,route,vehicle,load_date,status")
      .eq("id", id)
      .maybeSingle();
    if (loadErr || !load) {
      if (loadErr) console.error("getVanLoad: load error —", loadErr.message);
      return null;
    }

    const { data: lines, error: lineErr } = await supabase
      .from("van_load_lines")
      .select("id,sku_id,qty_out,qty_returned")
      .eq("van_load_id", id);
    if (lineErr) {
      console.error("getVanLoad: lines error —", lineErr.message);
      return null;
    }

    const skuIds = Array.from(new Set((lines ?? []).map((l) => l.sku_id)));
    const [skusRes, priceRes] = await Promise.all([
      skuIds.length
        ? supabase.from("skus").select("id,code,name").in("id", skuIds)
        : Promise.resolve({ data: [] as { id: string; code: string; name: string }[] }),
      skuIds.length
        ? supabase.from("price_list").select("sku_id,price").in("sku_id", skuIds)
            .is("retailer_id", null).is("route", null).eq("list_type", "retail").eq("is_active", true)
        : Promise.resolve({ data: [] as { sku_id: string; price: number }[] }),
    ]);
    const skuById = new Map((skusRes.data ?? []).map((s) => [s.id, { code: s.code, name: s.name }]));
    const rateById = new Map((priceRes.data ?? []).map((p) => [p.sku_id, Number(p.price)]));

    return {
      id: load.id,
      loadNo: load.load_no,
      route: load.route,
      vehicle: load.vehicle,
      loadDate: load.load_date,
      status: load.status,
      lines: (lines ?? []).map((l) => {
        const sku = skuById.get(l.sku_id) ?? { code: "—", name: "Unknown SKU" };
        const qtyOut = Number(l.qty_out);
        const qtyReturned = Number(l.qty_returned);
        return {
          lineId: l.id,
          skuId: l.sku_id,
          code: sku.code,
          name: sku.name,
          rate: rateById.get(l.sku_id) ?? 0,
          qtyOut,
          qtyReturned,
          remaining: qtyOut - qtyReturned,
        };
      }),
    };
  } catch (err) {
    console.error("getVanLoad: unexpected error —", err);
    return null;
  }
}

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

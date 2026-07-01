import { createAdminClient } from "@/lib/supabase/admin";
import type { Scheme } from "./logic";

export type SchemeRow = Scheme & { isActive: boolean; triggerName: string; freeName: string };

function mapScheme(r: {
  id: string; name: string; trigger_sku_id: string; trigger_qty: number; free_sku_id: string; free_qty: number;
}): Scheme {
  return {
    id: r.id, name: r.name,
    triggerSkuId: r.trigger_sku_id, triggerQty: Number(r.trigger_qty),
    freeSkuId: r.free_sku_id, freeQty: Number(r.free_qty),
  };
}

/** Active schemes for the freebie engine (order/capture time). */
export async function getActiveSchemes(): Promise<Scheme[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("schemes")
      .select("id,name,trigger_sku_id,trigger_qty,free_sku_id,free_qty")
      .eq("is_active", true);
    if (error) return [];
    return (data ?? []).map(mapScheme);
  } catch {
    return [];
  }
}

/** All schemes with SKU names for the admin list. */
export async function getSchemes(): Promise<SchemeRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("schemes")
      .select("id,name,trigger_sku_id,trigger_qty,free_sku_id,free_qty,is_active")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    const ids = Array.from(new Set(data.flatMap((s) => [s.trigger_sku_id, s.free_sku_id])));
    const { data: skus } = ids.length
      ? await supabase.from("skus").select("id,name").in("id", ids)
      : { data: [] as { id: string; name: string }[] };
    const nameById = new Map((skus ?? []).map((s) => [s.id, s.name]));
    return data.map((r) => ({
      ...mapScheme(r),
      isActive: r.is_active,
      triggerName: nameById.get(r.trigger_sku_id) ?? "—",
      freeName: nameById.get(r.free_sku_id) ?? "—",
    }));
  } catch {
    return [];
  }
}

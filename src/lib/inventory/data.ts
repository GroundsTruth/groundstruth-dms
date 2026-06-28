import { createAdminClient } from "@/lib/supabase/admin";
import { getConfig } from "@/lib/config/data";
import { lowStockFlag } from "./logic";

/**
 * Stock-view accessors (M12) — server-side reads, seed-safe (return [] on error so
 * pages still render). Per CLAUDE.md rule 2 we never use nested joins: SKU names are
 * fetched separately and merged in JS.
 */

export type SkuStock = {
  skuId: string;
  code: string;
  name: string;
  qtyOnHand: number;
  batchCount: number;
  lowStock: boolean;
};

export type BatchRow = {
  id: string;
  skuId: string;
  code: string;
  name: string;
  batchNo: string;
  qtyOnHand: number;
  mfgDate: string | null;
  expiryDate: string | null;
  receivedAt: string;
};

export type SkuOption = { id: string; code: string; name: string };

/** Active SKUs as {id,code,name} for the receive form's picker (id needed for the RPC). */
export async function getSkuOptions(): Promise<SkuOption[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("skus")
      .select("id,code,name")
      .eq("is_active", true)
      .order("code");
    if (error) {
      console.error("getSkuOptions: Supabase error —", error.message);
      return [];
    }
    return (data ?? []).map((s) => ({ id: s.id, code: s.code, name: s.name }));
  } catch (err) {
    console.error("getSkuOptions: unexpected error —", err);
    return [];
  }
}

/** On-hand totals per active SKU, with a low-stock flag from config. */
export async function getStockBySku(): Promise<SkuStock[]> {
  try {
    const supabase = createAdminClient();
    const [batchesRes, skusRes, threshold] = await Promise.all([
      supabase.from("stock_batches").select("sku_id,qty_on_hand"),
      supabase.from("skus").select("id,code,name").eq("is_active", true),
      getConfig("low_stock_threshold"),
    ]);

    if (batchesRes.error || skusRes.error) {
      console.error(
        "getStockBySku: Supabase error —",
        batchesRes.error?.message ?? skusRes.error?.message,
      );
      return [];
    }

    const totals = new Map<string, { qty: number; count: number }>();
    for (const b of batchesRes.data ?? []) {
      const cur = totals.get(b.sku_id) ?? { qty: 0, count: 0 };
      cur.qty += Number(b.qty_on_hand);
      cur.count += 1;
      totals.set(b.sku_id, cur);
    }

    return (skusRes.data ?? [])
      .map((s) => {
        const t = totals.get(s.id) ?? { qty: 0, count: 0 };
        return {
          skuId: s.id,
          code: s.code,
          name: s.name,
          qtyOnHand: t.qty,
          batchCount: t.count,
          lowStock: lowStockFlag(t.qty, threshold.cases),
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch (err) {
    console.error("getStockBySku: unexpected error —", err);
    return [];
  }
}

/** Individual batches (newest received first), merged with their SKU code/name. */
export async function getBatches(): Promise<BatchRow[]> {
  try {
    const supabase = createAdminClient();
    const [batchesRes, skusRes] = await Promise.all([
      supabase
        .from("stock_batches")
        .select("id,sku_id,batch_no,qty_on_hand,mfg_date,expiry_date,received_at")
        .order("received_at", { ascending: false }),
      supabase.from("skus").select("id,code,name"),
    ]);

    if (batchesRes.error || skusRes.error) {
      console.error(
        "getBatches: Supabase error —",
        batchesRes.error?.message ?? skusRes.error?.message,
      );
      return [];
    }

    const skuById = new Map(
      (skusRes.data ?? []).map((s) => [s.id, { code: s.code, name: s.name }]),
    );

    return (batchesRes.data ?? []).map((b) => {
      const sku = skuById.get(b.sku_id) ?? { code: "—", name: "Unknown SKU" };
      return {
        id: b.id,
        skuId: b.sku_id,
        code: sku.code,
        name: sku.name,
        batchNo: b.batch_no,
        qtyOnHand: Number(b.qty_on_hand),
        mfgDate: b.mfg_date,
        expiryDate: b.expiry_date,
        receivedAt: b.received_at,
      };
    });
  } catch (err) {
    console.error("getBatches: unexpected error —", err);
    return [];
  }
}

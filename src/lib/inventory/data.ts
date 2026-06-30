import { createAdminClient } from "@/lib/supabase/admin";
import { getConfig } from "@/lib/config/data";
import { lowStockFlag, daysOfCover, isLowStockDynamic } from "./logic";

const COVER_WINDOW_DAYS = 30; // window for the avg-daily-sales estimate (#14)

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
  avgDailySales: number;
  daysOfCover: number; // Infinity when there are no recent sales
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
    const sinceIso = new Date(Date.now() - COVER_WINDOW_DAYS * 86400_000).toISOString();
    const [batchesRes, skusRes, threshold, coverDays, movesRes] = await Promise.all([
      supabase.from("stock_batches").select("sku_id,qty_on_hand"),
      supabase.from("skus").select("id,code,name").eq("is_active", true),
      getConfig("low_stock_threshold"),
      getConfig("low_stock_days"),
      supabase
        .from("stock_movements")
        .select("sku_id,qty,movement_type")
        .in("movement_type", ["sale_deduct", "van_out"])
        .gte("created_at", sinceIso),
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

    // Avg daily sales over the window → days-of-cover (#14).
    const sold = new Map<string, number>();
    for (const m of movesRes.data ?? []) {
      sold.set(m.sku_id, (sold.get(m.sku_id) ?? 0) + Number(m.qty));
    }

    return (skusRes.data ?? [])
      .map((s) => {
        const t = totals.get(s.id) ?? { qty: 0, count: 0 };
        const avgDailySales = (sold.get(s.id) ?? 0) / COVER_WINDOW_DAYS;
        // Dynamic when there are sales; fall back to the static case threshold otherwise.
        const lowStock =
          avgDailySales > 0
            ? isLowStockDynamic(t.qty, avgDailySales, coverDays.days)
            : lowStockFlag(t.qty, threshold.cases);
        return {
          skuId: s.id,
          code: s.code,
          name: s.name,
          qtyOnHand: t.qty,
          batchCount: t.count,
          avgDailySales,
          daysOfCover: daysOfCover(t.qty, avgDailySales),
          lowStock,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch (err) {
    console.error("getStockBySku: unexpected error —", err);
    return [];
  }
}

/**
 * Low-stock SKUs (M14) — those in stock but at/below the configured threshold.
 * For the Owner Dashboard low-stock tile/list (M30). Out-of-stock (qty 0) is
 * excluded — that's a separate "out of stock" state.
 */
export async function getLowStockSkus(): Promise<SkuStock[]> {
  const stock = await getStockBySku();
  return stock.filter((s) => s.qtyOnHand > 0 && s.lowStock);
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

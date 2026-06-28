import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Order read accessors (M19) — server-side, seed-safe ([] on error). No nested joins
 * (rule 2): SKU/price merges happen in JS.
 */

/** Canonical routes (the distributor runs 7; matches the Jaypee workbook). */
export const ROUTES = [
  "ROUTE-1", "ROUTE-2", "ROUTE-3", "ROUTE-4", "ROUTE-5", "ROUTE-6", "ROUTE-7",
] as const;

export type OrderableSku = {
  id: string;
  code: string;
  name: string;
  basePrice: number | null;
};

export type OrderSummary = {
  id: string;
  orderNo: string;
  route: string | null;
  status: string;
  total: number;
  orderDate: string;
};

/** Active SKUs with their base price (for the punch form). Null = unpriced (guarded). */
export async function getOrderableSkus(): Promise<OrderableSku[]> {
  try {
    const supabase = createAdminClient();
    const [skusRes, priceRes] = await Promise.all([
      supabase.from("skus").select("id,code,name").eq("is_active", true).order("code"),
      supabase
        .from("price_list")
        .select("sku_id,price")
        .is("retailer_id", null)
        .is("route", null)
        .eq("is_active", true),
    ]);
    if (skusRes.error || priceRes.error) {
      console.error(
        "getOrderableSkus: Supabase error —",
        skusRes.error?.message ?? priceRes.error?.message,
      );
      return [];
    }
    const basePrice = new Map(
      (priceRes.data ?? []).map((p) => [p.sku_id, Number(p.price)]),
    );
    return (skusRes.data ?? []).map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      basePrice: basePrice.has(s.id) ? basePrice.get(s.id)! : null,
    }));
  } catch (err) {
    console.error("getOrderableSkus: unexpected error —", err);
    return [];
  }
}

/** Most recent orders for the list view. */
export async function getRecentOrders(limit = 25): Promise<OrderSummary[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_no,route,status,total,order_date")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("getRecentOrders: Supabase error —", error.message);
      return [];
    }
    return (data ?? []).map((o) => ({
      id: o.id,
      orderNo: o.order_no,
      route: o.route,
      status: o.status,
      total: Number(o.total),
      orderDate: o.order_date,
    }));
  } catch (err) {
    console.error("getRecentOrders: unexpected error —", err);
    return [];
  }
}

import { getLowStockSkus } from "@/lib/inventory/data";
import { getRecentInvoices } from "@/lib/sales/invoice-data";
import { getRecentOrders, ROUTES } from "@/lib/sales/orders-data";
import { getVanLoads } from "@/lib/van/data";
import { getCollections } from "@/lib/collections/data";

export type RouteSales = { route: string; sales: number };
export type TopSku = { code: string; name: string; units: number; sales: number };
export type LowStockRow = {
  code: string;
  name: string;
  qtyOnHand: number;
  daysOfCover: number;
};

export type DashboardSummary = {
  /** "live" once any real order/invoice/stock/van row exists; else the demo "seed". */
  source: "live" | "seed";
  month: string;
  revenue: number;
  unitsSold: number;
  collected: number;
  pending: number;
  lowStockCount: number;
  lowStockSkus: LowStockRow[];
  vansActive: number;
  ordersPendingApproval: number;
  routeSales: RouteSales[];
  topSkus: TopSku[];
};

/** Representative June-2026 seed figures — shown until real transactions exist. */
const SEED: DashboardSummary = {
  source: "seed",
  month: "June 2026",
  revenue: 567187,
  unitsSold: 1826,
  collected: 490000,
  pending: 77187,
  lowStockCount: 3,
  lowStockSkus: [],
  vansActive: 6,
  ordersPendingApproval: 0,
  routeSales: [
    { route: "Route 1", sales: 92400 },
    { route: "Route 2", sales: 78300 },
    { route: "Route 3", sales: 125600 },
    { route: "Route 4", sales: 64200 },
    { route: "Route 5", sales: 71800 },
    { route: "Route 6", sales: 83500 },
    { route: "Route 7", sales: 51387 },
  ],
  topSkus: [
    { code: "SKU008", name: "CSD Cola - 500 ML", units: 220, sales: 86900 },
    { code: "SKU019", name: "Campa Cola - 2.25 L", units: 95, sales: 64315 },
    { code: "SKU051", name: "Water - 750 ML", units: 280, sales: 43400 },
    { code: "SKU025", name: "Gold Boost Energy Can - 330 ML", units: 70, sales: 34650 },
    { code: "SKU017", name: "CSD Orange - 500 ML", units: 80, sales: 31600 },
  ],
};

function monthLabel(): string {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/**
 * Owner dashboard figures. Composes Hardik's read accessors (invoices, collections,
 * inventory low-stock, van loads, orders) into the summary the dashboard renders —
 * each accessor is seed-safe (returns empty on DB error). When there's no real data
 * yet (fresh DB, or DB unreachable) we fall back to the representative `SEED` so the
 * page always renders. `source` tells the UI which it's showing.
 *
 * NOT yet live (no line-level accessor): `topSkus` + `unitsSold` — kept from SEED and
 * labelled illustrative. Wire once a per-SKU sales aggregate lands.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const [lowStock, invoices, vans, orders] = await Promise.all([
      getLowStockSkus(),
      getRecentInvoices(100),
      getVanLoads(100),
      getRecentOrders(100),
    ]);

    const hasLive =
      lowStock.length > 0 ||
      invoices.length > 0 ||
      vans.length > 0 ||
      orders.length > 0;
    if (!hasLive) return SEED;

    // Revenue = issued/paid invoice totals. Collected = sum of collections per invoice.
    const billed = invoices.filter((i) => i.status !== "cancelled");
    const revenue = billed.reduce((a, i) => a + i.total, 0);
    const collectedPer = await Promise.all(
      billed.map((i) => getCollections(i.id).then((c) => c.total)),
    );
    const collected = collectedPer.reduce((a, n) => a + n, 0);
    const pending = Math.max(0, revenue - collected);

    // Route sales from invoiced/confirmed orders (orders carry the route; invoices don't).
    // ALL routes are shown, zero-filled — with data on only 1–2 routes the chart
    // otherwise collapses into a couple of full-width bars (client bug 2026-07-02:
    // "Sales by route looks off — earlier we were able to see all routes").
    const routeMap = new Map<string, number>(ROUTES.map((r) => [r, 0]));
    for (const o of orders) {
      if (o.status === "cancelled" || o.status === "pending_approval") continue;
      const key = o.route ?? "Unassigned";
      routeMap.set(key, (routeMap.get(key) ?? 0) + o.total);
    }
    const routeSales = [...routeMap.entries()].map(([route, sales]) => ({ route, sales }));

    const lowStockSkus: LowStockRow[] = lowStock.map((s) => ({
      code: s.code,
      name: s.name,
      qtyOnHand: s.qtyOnHand,
      daysOfCover: s.daysOfCover,
    }));

    return {
      source: "live",
      month: monthLabel(),
      revenue,
      unitsSold: SEED.unitsSold, // illustrative until a per-SKU sales aggregate exists
      collected,
      pending,
      lowStockCount: lowStock.length,
      lowStockSkus,
      vansActive: vans.filter((v) => v.status === "open").length,
      ordersPendingApproval: orders.filter((o) => o.status === "pending_approval")
        .length,
      routeSales: routeSales.length > 0 ? routeSales : SEED.routeSales,
      topSkus: SEED.topSkus, // illustrative until a per-SKU sales aggregate exists
    };
  } catch (err) {
    console.error("getDashboardSummary: unexpected error — falling back to seed —", err);
    return SEED;
  }
}

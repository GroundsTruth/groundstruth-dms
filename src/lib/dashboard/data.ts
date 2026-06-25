export type RouteSales = { route: string; sales: number };
export type TopSku = { code: string; name: string; units: number; sales: number };

export type DashboardSummary = {
  month: string;
  revenue: number;
  unitsSold: number;
  collected: number;
  pending: number;
  lowStockCount: number;
  vansActive: number;
  routeSales: RouteSales[];
  topSkus: TopSku[];
};

/**
 * Owner dashboard figures. Today these are representative numbers from the
 * June-2026 Jaypee seed workbook (revenue/units are the workbook totals; the
 * per-route + top-SKU splits are illustrative). Swapped for live aggregate
 * queries over Hardik's sales/inventory tables later — same accessor.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return {
    month: "June 2026",
    revenue: 567187,
    unitsSold: 1826,
    collected: 490000,
    pending: 77187,
    lowStockCount: 3,
    vansActive: 6,
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
}

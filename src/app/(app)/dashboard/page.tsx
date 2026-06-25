import { IndianRupee, Wallet, AlertTriangle, Truck } from "lucide-react";

import { getDashboardSummary } from "@/lib/dashboard/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteSalesChart } from "@/components/dashboard/route-sales-chart";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default async function DashboardPage() {
  const s = await getDashboardSummary();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${s.month} · figures from the seed workbook`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={inr(s.revenue)}
          accent
          icon={IndianRupee}
          sub={`${s.unitsSold.toLocaleString("en-IN")} units`}
        />
        <KpiCard
          label="Collected"
          value={inr(s.collected)}
          icon={Wallet}
          sub={<StatusBadge tone="warn">{inr(s.pending)} pending</StatusBadge>}
        />
        <KpiCard
          label="Low stock"
          value={`${s.lowStockCount} SKUs`}
          icon={AlertTriangle}
          sub={<StatusBadge tone="bad">Reorder</StatusBadge>}
        />
        <KpiCard label="Vans active" value={String(s.vansActive)} icon={Truck} sub="Routes 1–7" />
      </div>

      {/* chart + top SKUs */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sales by route</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteSalesChart data={s.routeSales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top SKUs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.topSkus.map((t, i) => (
              <div key={t.code} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.units} cases</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {inr(t.sales)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* reconciliation — wires to Hardik's live engine */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Stock ↔ Sales ↔ Cash reconciliation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge tone="ok">No variance flags</StatusBadge>
            <span>
              · the live anti-leakage feed renders here once the reconciliation
              engine (Hardik&apos;s module) is wired.
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

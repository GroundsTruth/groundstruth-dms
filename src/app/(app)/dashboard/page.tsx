import { IndianRupee, Wallet, AlertTriangle, Truck, ClipboardCheck, Boxes } from "lucide-react";

import { getDashboardSummary } from "@/lib/dashboard/data";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteSalesChart } from "@/components/dashboard/route-sales-chart";

export const dynamic = "force-dynamic";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default async function DashboardPage() {
  const [s, user] = await Promise.all([getDashboardSummary(), getSessionUser()]);

  // #24 role-scope: only the owner sees whole-business financials + the revenue split.
  // Warehouse/driver-rep get the operational view (stock + vans + approvals). Auth
  // dormant (null user) → show everything so dev/testing isn't gated.
  const seesFinancials = !user || user.role === "owner";
  const sourceNote =
    s.source === "live" ? "live figures" : "figures from the seed workbook";

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${s.month} · ${sourceNote}${user ? ` · ${user.name}` : ""}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {seesFinancials ? (
          <>
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
              sub={
                s.pending > 0 ? (
                  <StatusBadge tone="warn">{inr(s.pending)} pending</StatusBadge>
                ) : (
                  <StatusBadge tone="ok">All collected</StatusBadge>
                )
              }
            />
          </>
        ) : (
          <KpiCard
            label="Orders to approve"
            value={String(s.ordersPendingApproval)}
            icon={ClipboardCheck}
            sub={
              s.ordersPendingApproval > 0 ? (
                <StatusBadge tone="warn">Needs review</StatusBadge>
              ) : (
                <StatusBadge tone="ok">Clear</StatusBadge>
              )
            }
          />
        )}
        <KpiCard
          label="Low stock"
          value={`${s.lowStockCount} SKUs`}
          icon={AlertTriangle}
          sub={
            s.lowStockCount > 0 ? (
              <StatusBadge tone="bad">Reorder</StatusBadge>
            ) : (
              <StatusBadge tone="ok">Healthy</StatusBadge>
            )
          }
        />
        <KpiCard label="Vans active" value={String(s.vansActive)} icon={Truck} sub="Out on routes" />
      </div>

      {/* Owner: business-wide chart + top SKUs. Others: skip. */}
      {seesFinancials ? (
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
              <CardTitle className="text-base">
                Top SKUs
                {s.source === "live" ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    illustrative
                  </span>
                ) : null}
              </CardTitle>
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
      ) : null}

      {/* Low-stock list — LIVE (getLowStockSkus). Actionable reorder list for everyone. */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4" /> Low stock — reorder
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            A SKU is low when it has under <span className="font-medium">5 days of cover</span> —
            on-hand cases ÷ its average daily sales (client-set threshold).
          </p>
        </CardHeader>
        <CardContent>
          {s.lowStockSkus.length === 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge tone="ok">Nothing below threshold</StatusBadge>
              {s.source === "seed" ? (
                <span>· live days-of-cover renders here once stock + sales exist.</span>
              ) : null}
            </div>
          ) : (
            <div className="divide-y">
              {s.lowStockSkus.map((r) => (
                <div key={r.code} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.code}</p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums">{r.qtyOnHand} on hand</p>
                  <StatusBadge tone={r.daysOfCover < 3 ? "bad" : "warn"}>
                    {Number.isFinite(r.daysOfCover)
                      ? `${r.daysOfCover.toFixed(1)}d cover`
                      : "no sales"}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

import { ClipboardList, IndianRupee, PackageCheck } from "lucide-react";
import { getOrderableSkus, getRecentOrders } from "@/lib/sales/orders-data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { PunchForm } from "@/components/orders/punch-form";
import { OrdersTable } from "@/components/orders/orders-table";

// Orders are read from Supabase per request.
export const dynamic = "force-dynamic";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function OrdersPage() {
  const [skus, orders] = await Promise.all([getOrderableSkus(), getRecentOrders()]);

  const priced = skus.filter((s) => s.basePrice != null).length;
  const ordersTotal = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Punch orders against the price list. Each line is priced by the active rule for the route; unpriced SKUs are blocked until a price is set."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Recent orders" value={String(orders.length)} icon={ClipboardList} accent />
        <KpiCard label="Priced SKUs" value={`${priced}/${skus.length}`} icon={PackageCheck} />
        <KpiCard label="Recent value" value={inr(ordersTotal)} icon={IndianRupee} />
      </div>

      <div className="mb-8">
        <PunchForm skus={skus} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Recent orders</h2>
        <OrdersTable rows={orders} />
      </section>
    </>
  );
}

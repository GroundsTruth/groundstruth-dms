import { Truck, PackageMinus, Undo2 } from "lucide-react";
import { getVanLoads } from "@/lib/van/data";
import { getStockBySku } from "@/lib/inventory/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { LoadForm, type VanSku } from "@/components/vans/load-form";
import { LoadsTable } from "@/components/vans/loads-table";

// Van loads are read from Supabase per request.
export const dynamic = "force-dynamic";

export default async function VansPage() {
  const [loads, stock] = await Promise.all([getVanLoads(), getStockBySku()]);

  const skus: VanSku[] = stock
    .filter((s) => s.qtyOnHand > 0)
    .map((s) => ({ id: s.skuId, code: s.code, name: s.name, onHand: s.qtyOnHand }));

  const openLoads = loads.filter((l) => l.status === "open").length;
  const totalOut = loads.reduce((acc, l) => acc + l.totalOut, 0);
  const totalReturned = loads.reduce((acc, l) => acc + l.totalReturned, 0);

  return (
    <>
      <PageHeader
        title="Van loads"
        subtitle="Load-out pulls stock FIFO from the warehouse (atomic) and tracks what each van carries. Returns and reconciliation close the loop."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Open loads" value={String(openLoads)} icon={Truck} accent />
        <KpiCard label="Cases out" value={String(totalOut)} icon={PackageMinus} />
        <KpiCard label="Cases returned" value={String(totalReturned)} icon={Undo2} />
      </div>

      <div className="mb-8">
        <LoadForm skus={skus} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Recent loads</h2>
        <LoadsTable rows={loads} />
      </section>
    </>
  );
}

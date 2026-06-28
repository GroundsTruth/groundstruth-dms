import { Boxes, PackageX, TriangleAlert } from "lucide-react";
import { getStockBySku, getBatches, getSkuOptions } from "@/lib/inventory/data";
import { sumOnHand } from "@/lib/inventory/logic";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { ReceiveForm } from "@/components/inventory/receive-form";
import { StockBySkuTable, BatchTable } from "@/components/inventory/stock-tables";

// Stock is read from Supabase per request — never frozen at build time.
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [stock, batches, skus] = await Promise.all([
    getStockBySku(),
    getBatches(),
    getSkuOptions(),
  ]);

  const totalCases = sumOnHand(stock.map((s) => ({ qtyOnHand: s.qtyOnHand })));
  const inStock = stock.filter((s) => s.qtyOnHand > 0).length;
  const lowCount = stock.filter((s) => s.qtyOnHand > 0 && s.lowStock).length;

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="On-hand stock by SKU and batch. Receiving is atomic — each receive writes a batch and an inward ledger entry in one transaction."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Cases on hand" value={String(totalCases)} icon={Boxes} accent />
        <KpiCard label="SKUs in stock" value={String(inStock)} icon={PackageX} />
        <KpiCard label="Low stock" value={String(lowCount)} icon={TriangleAlert} />
      </div>

      <div className="mb-8">
        <ReceiveForm skus={skus} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">By SKU</h2>
        <StockBySkuTable rows={stock} />
      </section>

      {batches.length > 0 ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Batches</h2>
          <BatchTable rows={batches} />
        </section>
      ) : null}
    </>
  );
}

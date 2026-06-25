import { getSkus, categoriesOf } from "@/lib/catalog/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { StatusBadge } from "@/components/kit/status-badge";
import { CatalogTable } from "@/components/catalog/catalog-table";

export default async function CatalogPage() {
  const skus = await getSkus();
  const priced = skus.filter((s) => s.ratePerCase != null).length;
  const cats = categoriesOf(skus);

  return (
    <>
      <PageHeader
        title="SKU Catalog"
        subtitle="Cleaned from the Jaypee master list — the canonical product list the whole system joins on."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="SKUs" value={String(skus.length)} accent />
        <KpiCard
          label="Priced"
          value={String(priced)}
          sub={<StatusBadge tone="ok">rate set</StatusBadge>}
        />
        <KpiCard
          label="Needs rate"
          value={String(skus.length - priced)}
          sub={<StatusBadge tone="warn">from client</StatusBadge>}
        />
        <KpiCard label="Categories" value={String(cats.length)} />
      </div>

      <CatalogTable skus={skus} categories={cats} />
    </>
  );
}

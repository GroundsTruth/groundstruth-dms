import { Gift } from "lucide-react";
import { getSchemes } from "@/lib/schemes/data";
import { getSkuOptions } from "@/lib/inventory/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { SchemesClient } from "@/components/schemes/schemes-client";

export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const [schemes, skus] = await Promise.all([getSchemes(), getSkuOptions()]);
  const active = schemes.filter((s) => s.isActive).length;

  return (
    <>
      <PageHeader
        title="Schemes & freebies"
        subtitle="Buy-X-get-Y offers (cross-SKU, case-level). Freebies auto-apply as ₹0 lines on matching orders. Campa pushes these — toggle on/off."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Active schemes" value={String(active)} icon={Gift} accent />
        <KpiCard label="Total" value={String(schemes.length)} icon={Gift} />
      </div>
      <SchemesClient schemes={schemes} skus={skus} />
    </>
  );
}

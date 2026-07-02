import { Store, PackageCheck, Truck } from "lucide-react";
import { getOrderableSkus } from "@/lib/sales/orders-data";
import { getRetailers } from "@/lib/retailers/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { CaptureClient } from "@/components/capture/capture-client";

// Field sales capture reads live data per request.
export const dynamic = "force-dynamic";

/**
 * Ground-Level Sales Capture (audit #7) — the client's 6/29 priority: one mobile-first
 * journey for a driver/rep in the field — pick route → pick/onboard shop → add items
 * (qty/rate/discount) → take payment → review → invoice. Composes Hardik's `captureSale`
 * backend. Built thumb-first (QtyStepper, big buttons) per the Onfleet benchmark.
 */
export default async function CapturePage() {
  const [skus, retailers] = await Promise.all([getOrderableSkus(), getRetailers()]);
  const sellable = skus.filter((s) => s.basePrice != null);
  const activeShops = retailers.filter((r) => r.isActive);

  return (
    <>
      <PageHeader
        title="Capture sale"
        subtitle="Field sale → invoice in one go. Pick the shop, add what was delivered, take payment."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Sellable SKUs" value={`${sellable.length}/${skus.length}`} icon={PackageCheck} accent />
        <KpiCard label="Shops" value={String(activeShops.length)} icon={Store} />
        <KpiCard label="Routes" value="7" icon={Truck} />
      </div>

      <CaptureClient skus={skus} retailers={activeShops} />
    </>
  );
}

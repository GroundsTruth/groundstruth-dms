import { Store, BadgeCheck, Clock } from "lucide-react";
import { getRetailers } from "@/lib/retailers/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { RetailersClient } from "@/components/retailers/retailers-client";

export const dynamic = "force-dynamic";

export default async function RetailersPage() {
  const retailers = await getRetailers();
  const active = retailers.filter((r) => r.isActive);
  const approved = active.filter((r) => r.approvalStatus === "approved").length;
  const pending = active.filter((r) => r.approvalStatus !== "approved").length;

  return (
    <>
      <PageHeader
        title="Retailers"
        subtitle="Onboard shops and beats. New retailers start pending and an approver activates them. Route is kept so the system works whether the client tracks shops or routes."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Retailers" value={String(active.length)} icon={Store} accent />
        <KpiCard label="Approved" value={String(approved)} icon={BadgeCheck} />
        <KpiCard label="Pending" value={String(pending)} icon={Clock} />
      </div>

      <RetailersClient retailers={retailers} />
    </>
  );
}

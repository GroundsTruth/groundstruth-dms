import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getVanLoad } from "@/lib/van/data";
import { PageHeader } from "@/components/kit/page-header";
import { StatusBadge, type StatusTone } from "@/components/kit/status-badge";
import { ReturnsForm } from "@/components/vans/returns-form";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, StatusTone> = { open: "warn", reconciled: "ok" };

export default async function VanLoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const load = await getVanLoad(id);
  if (!load) notFound();

  return (
    <>
      <Link
        href="/vans"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Van loads
      </Link>

      <PageHeader
        title={`Load ${load.loadNo}`}
        subtitle={`${load.route ?? "No route"}${load.vehicle ? ` · ${load.vehicle}` : ""} · ${load.loadDate}`}
        actions={<StatusBadge tone={STATUS_TONE[load.status] ?? "neutral"}>{load.status}</StatusBadge>}
      />

      <ReturnsForm load={load} />
    </>
  );
}

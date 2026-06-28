import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge, type StatusTone } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
import { Truck } from "lucide-react";
import type { VanLoadSummary } from "@/lib/van/data";

const STATUS_TONE: Record<string, StatusTone> = {
  open: "warn",
  reconciled: "ok",
};

export function LoadsTable({ rows }: { rows: VanLoadSummary[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No van loads yet"
        description="Load a van using the form above — load-out pulls stock FIFO and shows up here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Load</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">SKUs</TableHead>
            <TableHead className="text-right">Out</TableHead>
            <TableHead className="text-right">Returned</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-mono text-xs">
                <Link href={`/vans/${l.id}`} className="text-primary hover:underline">
                  {l.loadNo}
                </Link>
              </TableCell>
              <TableCell>{l.route ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{l.vehicle ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{l.loadDate}</TableCell>
              <TableCell className="text-right tabular-nums">{l.skuCount}</TableCell>
              <TableCell className="text-right tabular-nums">{l.totalOut}</TableCell>
              <TableCell className="text-right tabular-nums">{l.totalReturned}</TableCell>
              <TableCell>
                <StatusBadge tone={STATUS_TONE[l.status] ?? "neutral"}>{l.status}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

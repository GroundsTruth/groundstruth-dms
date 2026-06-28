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
import { ClipboardList } from "lucide-react";
import type { OrderSummary } from "@/lib/sales/orders-data";
import { ConfirmInvoiceButton } from "./confirm-invoice-button";

const STATUS_TONE: Record<string, StatusTone> = {
  draft: "neutral",
  confirmed: "warn",
  invoiced: "ok",
  cancelled: "bad",
};

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function OrdersTable({ rows }: { rows: OrderSummary[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No orders yet"
        description="Punch your first order using the form above — it'll show up here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono text-xs">{o.orderNo}</TableCell>
              <TableCell>{o.route ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{o.orderDate}</TableCell>
              <TableCell className="text-right tabular-nums">{inr(o.total)}</TableCell>
              <TableCell>
                <StatusBadge tone={STATUS_TONE[o.status] ?? "neutral"}>
                  {o.status}
                </StatusBadge>
              </TableCell>
              <TableCell className="text-right">
                {o.status === "draft" ? <ConfirmInvoiceButton orderId={o.id} /> : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

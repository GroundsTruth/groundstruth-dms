import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
import { Package } from "lucide-react";
import type { SkuStock, BatchRow } from "@/lib/inventory/data";

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** On-hand by SKU, with a low-stock badge. */
export function StockBySkuTable({ rows }: { rows: SkuStock[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No stock yet"
        description="Receive your first batch using the form above — it'll show up here by SKU."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">On hand</TableHead>
            <TableHead className="text-right">Batches</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.skuId}>
              <TableCell className="font-mono text-xs">{r.code}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(r.qtyOnHand)}</TableCell>
              <TableCell className="text-right tabular-nums">{r.batchCount}</TableCell>
              <TableCell>
                {r.qtyOnHand <= 0 ? (
                  <StatusBadge tone="bad">Out of stock</StatusBadge>
                ) : r.lowStock ? (
                  <StatusBadge tone="warn">Low stock</StatusBadge>
                ) : (
                  <StatusBadge tone="ok">In stock</StatusBadge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Individual batches (newest first) with expiry. */
export function BatchTable({ rows }: { rows: BatchRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono text-xs">{b.code}</TableCell>
              <TableCell>{b.batchNo}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(b.qtyOnHand)}</TableCell>
              <TableCell className="text-muted-foreground">{b.expiryDate ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {b.receivedAt.slice(0, 10)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

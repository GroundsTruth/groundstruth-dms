import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter,
} from "@/components/ui/table";
import type { VanLoadDetail } from "@/lib/van/data";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/**
 * Delivery Challan (M25) — printable van load-out matching the client's redesigned
 * layout (Rate · Qty Out · Return · Qty Sale · Discount · Amount). Qty Sale = out −
 * return; Amount = qty sale × rate. Discount is 0 until per-line van discounts are captured.
 */
export function ChallanView({ load }: { load: VanLoadDetail }) {
  const rows = load.lines.map((l) => {
    const qtySale = l.qtyOut - l.qtyReturned;
    return { ...l, qtySale, amount: qtySale * l.rate };
  });
  const totalAmount = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-8">
      <div className="border-b border-border pb-3 text-center">
        <h2 className="text-lg font-bold uppercase tracking-wide">Delivery Challan</h2>
        <p className="text-xs text-muted-foreground">
          Falcon / Jaypee Enterprises · Gurugram, Haryana
        </p>
      </div>

      <dl className="my-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div><dt className="inline text-muted-foreground">Challan: </dt><dd className="inline font-mono">{load.loadNo}</dd></div>
        <div><dt className="inline text-muted-foreground">Date: </dt><dd className="inline">{load.loadDate}</dd></div>
        <div><dt className="inline text-muted-foreground">Route: </dt><dd className="inline">{load.route ?? "—"}</dd></div>
        <div><dt className="inline text-muted-foreground">Vehicle: </dt><dd className="inline">{load.vehicle ?? "—"}</dd></div>
        <div><dt className="inline text-muted-foreground">Salesman: </dt><dd className="inline">____</dd></div>
        <div><dt className="inline text-muted-foreground">Driver / Helper: </dt><dd className="inline">____</dd></div>
      </dl>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Qty Out</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Qty Sale</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.lineId}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{r.code}</span> — {r.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">{inr(r.rate)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.qtyOut}</TableCell>
                <TableCell className="text-right tabular-nums">{r.qtyReturned}</TableCell>
                <TableCell className="text-right tabular-nums">{r.qtySale}</TableCell>
                <TableCell className="text-right tabular-nums">—</TableCell>
                <TableCell className="text-right tabular-nums">{inr(r.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7} className="text-right font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{inr(totalAmount)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

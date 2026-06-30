import { TriangleAlert } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { InvoiceDetail } from "@/lib/sales/invoice-data";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Printable GST tax invoice (M21). Layout follows a standard GST Rule-46 structure. */
export function InvoiceView({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-8">
      {invoice.provisional ? (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs">
            <strong>Provisional</strong> — GST/cess rates and the seller GSTIN are statutory
            defaults pending client/CA confirmation (see <code>docs/MISSING_INPUTS.md</code>).
            Not for issuance to customers yet.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold">{invoice.seller.name}</h2>
          <p className="text-sm text-muted-foreground">{invoice.seller.address}</p>
          <p className="text-sm text-muted-foreground">GSTIN: {invoice.seller.gstin}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tax Invoice
          </p>
          <p className="font-mono text-sm">{invoice.invoiceNo}</p>
          <p className="text-sm text-muted-foreground">{invoice.invoiceDate}</p>
          {invoice.route ? (
            <p className="text-sm text-muted-foreground">Route: {invoice.route}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>HSN</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Billing (incl)</TableHead>
              <TableHead className="text-right">Taxable</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Cess</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell>
                  <span className="font-mono text-xs">{l.code}</span> — {l.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.hsn ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(l.unitPrice)}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(l.taxable)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {inr(l.taxAmount)} <span className="text-muted-foreground">({l.taxPct}%)</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {l.cessPct > 0 ? `${inr(l.cessAmount)} (${l.cessPct}%)` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{inr(l.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-end">
        <dl className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxable value</dt>
            <dd className="tabular-nums">{inr(invoice.subtotal)}</dd>
          </div>
          {/* Intra-state default → CGST + SGST (each half). Inter-state = IGST (full),
              wired once the buyer's state code is captured (INVOICE_SPEC §4). */}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">CGST</dt>
            <dd className="tabular-nums">{inr(invoice.taxTotal / 2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">SGST</dt>
            <dd className="tabular-nums">{inr(invoice.taxTotal / 2)}</dd>
          </div>
          {invoice.cessTotal > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cess</dt>
              <dd className="tabular-nums">{inr(invoice.cessTotal)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
            <dt>Total (incl. GST)</dt>
            <dd className="tabular-nums">{inr(invoice.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

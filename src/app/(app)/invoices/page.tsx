import Link from "next/link";
import { FileText, IndianRupee } from "lucide-react";
import { getRecentInvoices } from "@/lib/sales/invoice-data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { EmptyState } from "@/components/kit/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/kit/status-badge";

export const dynamic = "force-dynamic";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function InvoicesPage() {
  const invoices = await getRecentInvoices();
  const total = invoices.reduce((a, i) => a + i.total, 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Tax invoices generated when an order is confirmed — invoice + stock deduction happen in one atomic step."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Invoices" value={String(invoices.length)} icon={FileText} accent />
        <KpiCard label="Value" value={inr(total)} icon={IndianRupee} />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Confirm a draft order from the Orders page to generate its tax invoice."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/invoices/${i.id}`} className="text-primary hover:underline">
                      {i.invoiceNo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{i.invoiceDate}</TableCell>
                  <TableCell className="text-right tabular-nums">{inr(i.total)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={i.status === "issued" ? "ok" : "bad"}>{i.status}</StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

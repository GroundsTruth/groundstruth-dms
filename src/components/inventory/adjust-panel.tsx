"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { adjustStock } from "@/lib/inventory/adjust";
import type { BatchRow } from "@/lib/inventory/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

/**
 * Physical count / wastage (audit #15/#16). Enter the counted quantity per batch; the
 * difference vs system posts an adjustment (negative = wastage/expiry).
 */
export function AdjustPanel({ batches }: { batches: BatchRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  if (batches.length === 0) return null;

  function save(b: BatchRow) {
    const counted = Number(counts[b.id]);
    if (counts[b.id] === undefined || counts[b.id] === "" || Number.isNaN(counted)) {
      setMsg("Enter a counted quantity.");
      return;
    }
    const delta = counted - b.qtyOnHand;
    if (delta === 0) {
      setMsg("No change for that batch.");
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const res = await adjustStock(b.id, delta, reasons[b.id] || "physical count");
      if (res.ok) {
        setMsg(`Adjusted ${b.code} batch ${b.batchNo} by ${delta > 0 ? "+" : ""}${delta}.`);
        setCounts((c) => ({ ...c, [b.id]: "" }));
        router.refresh();
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        Physical count / adjustment
      </h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">System</TableHead>
              <TableHead className="text-right">Counted</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.code}</TableCell>
                <TableCell>{b.batchNo}</TableCell>
                <TableCell className="text-right tabular-nums">{b.qtyOnHand}</TableCell>
                <TableCell className="text-right">
                  <Input type="number" step="any" min={0} className="ml-auto w-24"
                    value={counts[b.id] ?? ""} placeholder={String(b.qtyOnHand)}
                    onChange={(e) => setCounts((c) => ({ ...c, [b.id]: e.target.value }))} />
                </TableCell>
                <TableCell>
                  <Input className="w-36" placeholder="wastage / expiry…"
                    value={reasons[b.id] ?? ""}
                    onChange={(e) => setReasons((r) => ({ ...r, [b.id]: e.target.value }))} />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => save(b)}>
                    Adjust
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {msg ? <p className="mt-3 text-sm font-medium text-muted-foreground">{msg}</p> : null}
    </section>
  );
}

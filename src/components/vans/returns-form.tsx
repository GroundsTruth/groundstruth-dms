"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { recordReturns } from "@/lib/van/returns";
import type { VanLoadDetail } from "@/lib/van/data";
import { IntInput } from "@/components/kit/validated-inputs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

/**
 * Returns capture (M26). One input per load line, bounded by what's still out.
 * Submits all non-zero returns to the atomic record_returns action.
 */
export function ReturnsForm({ load }: { load: VanLoadDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, string>>({});

  const allReturned = load.lines.every((l) => l.remaining <= 0);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const returns = load.lines
      .map((l) => ({ lineId: l.lineId, qty: Number(qtys[l.lineId] ?? 0), remaining: l.remaining }))
      .filter((r) => r.qty > 0);

    const over = returns.find((r) => r.qty > r.remaining);
    if (over) {
      setError("A return can't be more than the delivered (not-yet-returned) quantity.");
      return;
    }
    if (returns.length === 0) {
      setError("Enter at least one return quantity.");
      return;
    }

    startTransition(async () => {
      const res = await recordReturns(
        load.id,
        returns.map((r) => ({ lineId: r.lineId, qty: r.qty })),
      );
      if (res.ok) {
        setOk("Returns recorded.");
        setQtys({});
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Undo2 className="h-4 w-4 text-muted-foreground" aria-hidden />
        Record returns
      </h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Out</TableHead>
              <TableHead className="text-right">Returned</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Return now</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {load.lines.map((l) => (
              <TableRow key={l.lineId}>
                <TableCell>
                  <span className="font-mono text-xs">{l.code}</span> — {l.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">{l.qtyOut}</TableCell>
                <TableCell className="text-right tabular-nums">{l.qtyReturned}</TableCell>
                <TableCell className="text-right tabular-nums">{l.remaining}</TableCell>
                <TableCell className="text-right">
                  <IntInput
                    aria-label={`Return qty for ${l.code}`}
                    value={qtys[l.lineId] ?? ""}
                    onValueChange={(v) => setQtys((q) => ({ ...q, [l.lineId]: v }))}
                    disabled={l.remaining <= 0}
                    placeholder="0"
                    className="ml-auto w-24"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm font-medium text-emerald-600">{ok}</p> : null}

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={pending || allReturned}>
          {pending ? "Recording…" : allReturned ? "All returned" : "Record returns"}
        </Button>
      </div>
    </form>
  );
}

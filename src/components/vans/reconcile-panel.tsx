"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { reconcileVanLoad } from "@/lib/van/reconcile";
import type { ReconciliationRow } from "@/lib/van/reconcile";
import { StatusBadge } from "@/components/kit/status-badge";
import { Button } from "@/components/ui/button";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Reconcile a van load + show the result (variance + cash + flag). */
export function ReconcilePanel({
  vanLoadId,
  existing,
}: {
  vanLoadId: string;
  existing: ReconciliationRow | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ReconciliationRow | null>(existing);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await reconcileVanLoad(vanLoadId);
      if (res.ok) {
        setRow({ ...res.result, reconciledAt: new Date().toISOString() });
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4 text-muted-foreground" aria-hidden />
          Reconciliation
        </h2>
        <Button size="sm" variant="outline" onClick={run} disabled={pending}>
          {pending ? "Reconciling…" : row ? "Re-reconcile" : "Reconcile"}
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm font-medium text-destructive">{error}</p> : null}

      {row ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status</span>
            {row.status === "flagged" ? (
              <StatusBadge tone="bad">Flagged — variance beyond tolerance</StatusBadge>
            ) : (
              <StatusBadge tone="ok">Reconciled — within tolerance</StatusBadge>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div><dt className="text-muted-foreground">Out</dt><dd className="tabular-nums">{row.qtyOut}</dd></div>
            <div><dt className="text-muted-foreground">Returned</dt><dd className="tabular-nums">{row.qtyReturned}</dd></div>
            <div><dt className="text-muted-foreground">Invoiced</dt><dd className="tabular-nums">{row.qtySold}</dd></div>
            <div>
              <dt className="text-muted-foreground">Stock variance</dt>
              <dd className={`tabular-nums ${row.variance !== 0 ? "font-semibold text-destructive" : ""}`}>{row.variance}</dd>
            </div>
            <div><dt className="text-muted-foreground">Cash expected</dt><dd className="tabular-nums">{inr(row.cashExpected)}</dd></div>
            <div><dt className="text-muted-foreground">Cash collected</dt><dd className="tabular-nums">{inr(row.cashCollected)}</dd></div>
            <div>
              <dt className="text-muted-foreground">Cash variance</dt>
              <dd className={`tabular-nums ${row.cashVariance !== 0 ? "font-semibold text-destructive" : ""}`}>{inr(row.cashVariance)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Sales/cash matched by route + date. Cash collected fills in once collections (M29) are recorded.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not reconciled yet. Run it after returns are captured to check out − sold − returned.
        </p>
      )}
    </div>
  );
}

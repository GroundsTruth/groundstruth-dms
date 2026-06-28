/**
 * Reconciliation math (M27) — pure, unit-tested. The anti-leakage check: of the stock
 * that left the van (out − returned), how much is backed by an invoice? The gap is
 * unaccounted stock. Cash variance = what the invoices say is owed vs what was
 * collected. Either gap beyond tolerance flags the load to the owner.
 *
 * `soldInvoiced` and the cash figures come from invoices/collections tied to the
 * load's route + date (best linkage we have until van↔invoice is explicit).
 */

export type ReconcileInput = {
  qtyOut: number;
  qtyReturned: number;
  soldInvoiced: number;
  cashExpected: number;
  cashCollected: number;
  qtyTolerance: number;
  cashTolerance: number;
};

export type ReconcileResult = {
  qtyOut: number;
  qtyReturned: number;
  qtySold: number;
  variance: number;
  cashExpected: number;
  cashCollected: number;
  cashVariance: number;
  status: "ok" | "flagged";
};

export function computeReconciliation(input: ReconcileInput): ReconcileResult {
  const physicalSold = input.qtyOut - input.qtyReturned;
  const variance = physicalSold - input.soldInvoiced; // unaccounted stock
  const cashVariance = input.cashExpected - input.cashCollected;

  const flagged =
    Math.abs(variance) > input.qtyTolerance ||
    Math.abs(cashVariance) > input.cashTolerance;

  return {
    qtyOut: input.qtyOut,
    qtyReturned: input.qtyReturned,
    qtySold: input.soldInvoiced,
    variance,
    cashExpected: input.cashExpected,
    cashCollected: input.cashCollected,
    cashVariance,
    status: flagged ? "flagged" : "ok",
  };
}

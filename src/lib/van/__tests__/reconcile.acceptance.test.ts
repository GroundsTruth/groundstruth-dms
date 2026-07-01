import { describe, it, expect } from "vitest";
import { computeReconciliation } from "../reconcile-logic";

/**
 * M28 acceptance — "variance beyond tolerance flags to owner (+ audit)."
 * Van loaded 100, returned 20 → 80 left; invoices account for only 70 → 10 unaccounted
 * (10% of out) → CRITICAL. A small gap inside tolerance stays ok.
 */
describe("M28 reconciliation acceptance: tiered variance flags", () => {
  it("unaccounted stock beyond tolerance → critical", () => {
    const r = computeReconciliation({ qtyOut: 100, qtyReturned: 20, soldInvoiced: 70, cashExpected: 7000, cashCollected: 7000 });
    expect(r.variance).toBe(10);
    expect(r.status).toBe("critical");
  });

  it("tiny gap inside tolerance → ok", () => {
    const r = computeReconciliation({ qtyOut: 1000, qtyReturned: 20, soldInvoiced: 979, cashExpected: 7800, cashCollected: 7800 });
    // physicalSold 980 vs 979 → variance 1 = 0.1% of out (< 0.2) → ok
    expect(r.variance).toBe(1);
    expect(r.status).toBe("ok");
  });
});

import { describe, it, expect } from "vitest";
import { computeReconciliation } from "../reconcile-logic";

/**
 * M28 acceptance — "variance beyond tolerance flags to owner (+ audit)."
 *
 * Scenario derived from the same figures the service reads: a van loaded 100, returned
 * 20 → 80 physically left the van. Invoices only account for 70 sold → 10 cases
 * unaccounted. With zero tolerance this MUST flag. With the configured tolerance it
 * must NOT flag when the gap is within it.
 */
describe("M28 reconciliation acceptance: variance flags beyond tolerance", () => {
  it("flags when stock that left the van isn't backed by invoices", () => {
    const r = computeReconciliation({
      qtyOut: 100,
      qtyReturned: 20,
      soldInvoiced: 70,
      cashExpected: 7000,
      cashCollected: 7000,
      qtyTolerance: 0,
      cashTolerance: 0,
    });
    expect(r.variance).toBe(10);
    expect(r.status).toBe("flagged");
  });

  it("does not flag a small gap inside tolerance", () => {
    const r = computeReconciliation({
      qtyOut: 100,
      qtyReturned: 20,
      soldInvoiced: 78,
      cashExpected: 7800,
      cashCollected: 7800,
      qtyTolerance: 5,
      cashTolerance: 0,
    });
    expect(r.variance).toBe(2);
    expect(r.status).toBe("ok");
  });
});

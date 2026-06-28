import { describe, it, expect } from "vitest";
import { computeReconciliation } from "../reconcile-logic";

const baseTol = { qtyTolerance: 0, cashTolerance: 0 };

describe("computeReconciliation", () => {
  it("balances when out − returned equals invoiced sales (variance 0, ok)", () => {
    const r = computeReconciliation({
      qtyOut: 100,
      qtyReturned: 20,
      soldInvoiced: 80,
      cashExpected: 0,
      cashCollected: 0,
      ...baseTol,
    });
    expect(r.qtySold).toBe(80);
    expect(r.variance).toBe(0);
    expect(r.status).toBe("ok");
  });

  it("flags a stock variance — cases left the van but weren't invoiced (leakage)", () => {
    const r = computeReconciliation({
      qtyOut: 100,
      qtyReturned: 20,
      soldInvoiced: 70, // 80 should have sold; 10 unaccounted
      cashExpected: 0,
      cashCollected: 0,
      ...baseTol,
    });
    expect(r.variance).toBe(10);
    expect(r.status).toBe("flagged");
  });

  it("flags a cash variance beyond tolerance", () => {
    const r = computeReconciliation({
      qtyOut: 50,
      qtyReturned: 0,
      soldInvoiced: 50,
      cashExpected: 1000,
      cashCollected: 900,
      qtyTolerance: 0,
      cashTolerance: 50,
    });
    expect(r.cashVariance).toBe(100);
    expect(r.status).toBe("flagged");
  });

  it("stays ok when variances are within tolerance", () => {
    const r = computeReconciliation({
      qtyOut: 100,
      qtyReturned: 20,
      soldInvoiced: 78, // variance 2
      cashExpected: 1000,
      cashCollected: 970, // cash variance 30
      qtyTolerance: 5,
      cashTolerance: 50,
    });
    expect(r.variance).toBe(2);
    expect(r.cashVariance).toBe(30);
    expect(r.status).toBe("ok");
  });
});

import { describe, it, expect } from "vitest";
import { computeReconciliation } from "../reconcile-logic";

describe("computeReconciliation (tiered tolerances)", () => {
  it("balances → ok", () => {
    const r = computeReconciliation({ qtyOut: 100, qtyReturned: 20, soldInvoiced: 80, cashExpected: 8000, cashCollected: 8000 });
    expect(r.variance).toBe(0);
    expect(r.status).toBe("ok");
  });

  it("stock 0.4% variance → warn (0.2–0.6)", () => {
    const r = computeReconciliation({ qtyOut: 1000, qtyReturned: 0, soldInvoiced: 996, cashExpected: 0, cashCollected: 0 });
    expect(r.variance).toBe(4);
    expect(r.variancePct).toBe(0.4);
    expect(r.status).toBe("warn");
  });

  it("stock >0.6% variance → critical", () => {
    const r = computeReconciliation({ qtyOut: 100, qtyReturned: 20, soldInvoiced: 70, cashExpected: 0, cashCollected: 0 });
    expect(r.variance).toBe(10); // 10% of out
    expect(r.status).toBe("critical");
  });

  it("cash 0.2% short → warn; overall = worst tier", () => {
    const r = computeReconciliation({ qtyOut: 100, qtyReturned: 20, soldInvoiced: 80, cashExpected: 10000, cashCollected: 9980 });
    expect(r.cashVariancePct).toBe(0.2);
    expect(r.status).toBe("warn"); // stock ok, cash warn → warn
  });

  it("cash >0.3% short → critical", () => {
    const r = computeReconciliation({ qtyOut: 100, qtyReturned: 20, soldInvoiced: 80, cashExpected: 10000, cashCollected: 9900 });
    expect(r.cashVariancePct).toBe(1);
    expect(r.status).toBe("critical");
  });
});

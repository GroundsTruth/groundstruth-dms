import { describe, it, expect } from "vitest";
import { validateOrderLines, computeOrderTotals } from "../order-logic";

describe("validateOrderLines", () => {
  it("accepts priced lines with positive qty", () => {
    expect(
      validateOrderLines([{ skuId: "s-1", qty: 2, unitPrice: 100 }]),
    ).toBeNull();
  });
  it("requires at least one line", () => {
    expect(validateOrderLines([])).toMatch(/at least one|no lines/i);
  });
  it("requires qty > 0 on every line", () => {
    expect(
      validateOrderLines([{ skuId: "s-1", qty: 0, unitPrice: 100 }]),
    ).toMatch(/quantity|qty/i);
  });
  it("rejects a line with no resolved price (missing-price guard)", () => {
    expect(
      validateOrderLines([{ skuId: "s-9", qty: 1, unitPrice: null }]),
    ).toMatch(/price/i);
  });
});

describe("computeOrderTotals", () => {
  it("computes line totals, subtotal and total (tax 0 until CA slabs)", () => {
    const out = computeOrderTotals([
      { skuId: "s-1", qty: 2, unitPrice: 100 },
      { skuId: "s-2", qty: 3, unitPrice: 50 },
    ]);
    expect(out.lines).toEqual([
      { skuId: "s-1", qty: 2, unitPrice: 100, lineTotal: 200 },
      { skuId: "s-2", qty: 3, unitPrice: 50, lineTotal: 150 },
    ]);
    expect(out.subtotal).toBe(350);
    expect(out.taxTotal).toBe(0);
    expect(out.total).toBe(350);
  });
});

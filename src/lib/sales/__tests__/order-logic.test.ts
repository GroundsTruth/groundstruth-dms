import { describe, it, expect } from "vitest";
import { validateOrderLines, computeOrderTotals } from "../order-logic";

describe("validateOrderLines", () => {
  it("accepts priced lines with positive qty", () => {
    expect(validateOrderLines([{ skuId: "s-1", qty: 2, listPrice: 100 }])).toBeNull();
  });
  it("requires at least one line", () => {
    expect(validateOrderLines([])).toMatch(/at least one|no lines/i);
  });
  it("requires qty > 0 on every line", () => {
    expect(validateOrderLines([{ skuId: "s-1", qty: 0, listPrice: 100 }])).toMatch(/quantity|qty/i);
  });
  it("rejects a line with no list price (missing-price guard)", () => {
    expect(validateOrderLines([{ skuId: "s-9", qty: 1, listPrice: null }])).toMatch(/price/i);
  });
  it("rejects a negative charged price", () => {
    expect(
      validateOrderLines([{ skuId: "s-1", qty: 1, listPrice: 100, chargedPrice: -5 }]),
    ).toMatch(/charged|price/i);
  });
});

describe("computeOrderTotals", () => {
  it("uses list price when no charged price given; no approval needed", () => {
    const out = computeOrderTotals([
      { skuId: "s-1", qty: 2, listPrice: 100 },
      { skuId: "s-2", qty: 3, listPrice: 50 },
    ]);
    expect(out.lines[0].unitPrice).toBe(100);
    expect(out.lines[0].belowList).toBe(false);
    expect(out.subtotal).toBe(350);
    expect(out.needsApproval).toBe(false);
  });

  it("a below-list charged price flags the line + routes the order to approval", () => {
    const out = computeOrderTotals([
      { skuId: "s-1", qty: 10, listPrice: 100, chargedPrice: 90 }, // 10% below
    ]);
    expect(out.lines[0].unitPrice).toBe(90);
    expect(out.lines[0].belowList).toBe(true);
    expect(out.lines[0].discountPct).toBe(10);
    expect(out.lines[0].lineTotal).toBe(900);
    expect(out.needsApproval).toBe(true);
  });

  it("a charged price at/above list is not below-list", () => {
    const out = computeOrderTotals([
      { skuId: "s-1", qty: 1, listPrice: 100, chargedPrice: 100 },
    ]);
    expect(out.lines[0].discountPct).toBe(0);
    expect(out.needsApproval).toBe(false);
  });
});

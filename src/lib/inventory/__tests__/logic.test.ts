import { describe, it, expect } from "vitest";
import { validateReceive, lowStockFlag, sumOnHand } from "../logic";

describe("validateReceive", () => {
  const ok = {
    skuId: "s-1",
    batchNo: "B-2026-01",
    qty: 10,
    mfgDate: "2026-01-01",
    expiryDate: "2026-12-31",
  };

  it("accepts a well-formed receive", () => {
    expect(validateReceive(ok)).toBeNull();
  });

  it("requires a SKU", () => {
    expect(validateReceive({ ...ok, skuId: "" })).toMatch(/sku/i);
  });

  it("requires a batch number", () => {
    expect(validateReceive({ ...ok, batchNo: "   " })).toMatch(/batch/i);
  });

  it("requires qty > 0", () => {
    expect(validateReceive({ ...ok, qty: 0 })).toMatch(/quantity|qty/i);
    expect(validateReceive({ ...ok, qty: -5 })).toMatch(/quantity|qty/i);
    expect(validateReceive({ ...ok, qty: Number.NaN })).toMatch(/quantity|qty/i);
  });

  it("rejects expiry before manufacture", () => {
    expect(
      validateReceive({ ...ok, mfgDate: "2026-12-31", expiryDate: "2026-01-01" }),
    ).toMatch(/expiry/i);
  });

  it("allows missing optional dates", () => {
    expect(validateReceive({ skuId: "s-1", batchNo: "B1", qty: 1 })).toBeNull();
  });
});

describe("lowStockFlag", () => {
  it("flags when on-hand is at or below threshold", () => {
    expect(lowStockFlag(10, 10)).toBe(true);
    expect(lowStockFlag(3, 10)).toBe(true);
  });
  it("does not flag when above threshold", () => {
    expect(lowStockFlag(11, 10)).toBe(false);
  });
});

describe("sumOnHand", () => {
  it("sums qty across batches", () => {
    expect(sumOnHand([{ qtyOnHand: 5 }, { qtyOnHand: 2.5 }, { qtyOnHand: 0 }])).toBe(7.5);
  });
  it("is 0 for no batches", () => {
    expect(sumOnHand([])).toBe(0);
  });
});

import { daysOfCover, isLowStockDynamic } from "../logic";

describe("daysOfCover / isLowStockDynamic (audit #14)", () => {
  it("on-hand ÷ avg daily sales", () => {
    expect(daysOfCover(100, 20)).toBe(5);
    expect(daysOfCover(0, 20)).toBe(0);
  });
  it("no sales → infinite cover (never low)", () => {
    expect(daysOfCover(100, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(isLowStockDynamic(100, 0, 5)).toBe(false);
  });
  it("flags when cover < threshold days", () => {
    expect(isLowStockDynamic(80, 20, 5)).toBe(true); // 4 days < 5
    expect(isLowStockDynamic(120, 20, 5)).toBe(false); // 6 days
  });
});

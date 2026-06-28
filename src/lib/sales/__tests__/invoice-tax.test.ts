import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "../invoice-tax";

describe("computeInvoiceTotals", () => {
  it("computes per-line tax + cess and invoice totals", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-1", qty: 2, unitPrice: 100, taxPct: 28, cessPct: 12 }, // taxable 200
      { skuId: "s-2", qty: 1, unitPrice: 50, taxPct: 18, cessPct: 0 }, //  taxable 50
    ]);

    expect(out.lines[0]).toEqual({
      skuId: "s-1",
      qty: 2,
      unitPrice: 100,
      taxable: 200,
      taxPct: 28,
      taxAmount: 56, // 200 * 0.28
      cessPct: 12,
      cessAmount: 24, // 200 * 0.12
      lineTotal: 280, // 200 + 56 + 24
    });
    expect(out.lines[1].taxAmount).toBe(9); // 50 * 0.18
    expect(out.lines[1].cessAmount).toBe(0);

    expect(out.subtotal).toBe(250); // 200 + 50
    expect(out.taxTotal).toBe(65); // 56 + 9
    expect(out.cessTotal).toBe(24); // 24 + 0
    expect(out.total).toBe(339); // 250 + 65 + 24
  });

  it("treats missing rates as 0 (unconfigured SKU)", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-3", qty: 3, unitPrice: 10, taxPct: null, cessPct: null },
    ]);
    expect(out.taxTotal).toBe(0);
    expect(out.cessTotal).toBe(0);
    expect(out.total).toBe(30);
  });

  it("rounds money to 2 decimals", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-4", qty: 1, unitPrice: 99.99, taxPct: 18, cessPct: 0 },
    ]);
    expect(out.lines[0].taxAmount).toBe(18); // 99.99 * 0.18 = 17.9982 -> 18.00
    expect(out.total).toBe(117.99);
  });
});

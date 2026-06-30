import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "../invoice-tax";

// GST-INCLUSIVE: unitPrice is the billing price WITH tax (per docs/INVOICE_SPEC.md §3).
// Tax is EXTRACTED: taxable = gross / (1 + rate/100); tax = gross − taxable.
describe("computeInvoiceTotals (GST-inclusive)", () => {
  it("matches the client sample: 70 × ₹120 incl 5% → taxable 8000, GST 400, total 8400", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-1", qty: 70, unitPrice: 120, taxPct: 5, cessPct: 0 },
    ]);
    expect(out.lines[0]).toEqual({
      skuId: "s-1",
      qty: 70,
      unitPrice: 120,
      taxable: 8000, // 8400 / 1.05
      taxPct: 5,
      taxAmount: 400, // 8000 * 0.05
      cessPct: 0,
      cessAmount: 0,
      lineTotal: 8400, // = gross (qty × price), unchanged
    });
    expect(out.subtotal).toBe(8000);
    expect(out.taxTotal).toBe(400);
    expect(out.cessTotal).toBe(0);
    expect(out.total).toBe(8400); // customer pays the inclusive price, never more
  });

  it("extracts GST + cess from the inclusive price (combined slab)", () => {
    // gross 140 incl 28%+12% (=40%): taxable 100, GST 28, cess 12.
    const out = computeInvoiceTotals([
      { skuId: "s-2", qty: 1, unitPrice: 140, taxPct: 28, cessPct: 12 },
    ]);
    expect(out.lines[0].taxable).toBe(100);
    expect(out.lines[0].taxAmount).toBe(28);
    expect(out.lines[0].cessAmount).toBe(12);
    expect(out.lines[0].lineTotal).toBe(140);
  });

  it("40% inclusive: ₹140 → taxable 100, GST 40 (no over-billing)", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-3", qty: 1, unitPrice: 140, taxPct: 40, cessPct: 0 },
    ]);
    expect(out.lines[0].taxable).toBe(100);
    expect(out.lines[0].taxAmount).toBe(40);
    expect(out.total).toBe(140);
  });

  it("treats missing rates as 0 — whole price is taxable, no tax", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-4", qty: 3, unitPrice: 10, taxPct: null, cessPct: null },
    ]);
    expect(out.subtotal).toBe(30);
    expect(out.taxTotal).toBe(0);
    expect(out.total).toBe(30);
  });

  it("the line total always equals qty × billing price (inclusive)", () => {
    const out = computeInvoiceTotals([
      { skuId: "s-5", qty: 7, unitPrice: 99.99, taxPct: 18, cessPct: 0 },
    ]);
    expect(out.lines[0].lineTotal).toBe(699.93); // 7 × 99.99
    expect(out.total).toBe(699.93);
  });
});

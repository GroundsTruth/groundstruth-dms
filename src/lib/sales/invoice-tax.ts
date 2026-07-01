/**
 * Invoice tax engine (M21) — pure, unit-tested. GST is **INCLUSIVE**: the unitPrice is
 * the billing price WITH tax, and tax is EXTRACTED, not added on top
 * (docs/INVOICE_SPEC.md §3). Per line: gross = qty × price; taxable = gross / (1 +
 * (gst+cess)/100); gst/cess are each their %-of-taxable; lineTotal = gross. So the
 * customer never pays more than the billing price. Rates are PROVISIONAL (pending CA).
 * CGST/SGST split (intra-state) vs IGST (inter-state) is a render concern off the
 * buyer's state code (§4). MUST mirror the confirm_and_invoice RPC so UI and DB agree.
 */

export type InvoiceTaxLineInput = {
  skuId: string;
  qty: number;
  unitPrice: number;
  taxPct: number | null;
  cessPct: number | null;
};

export type InvoiceTaxLine = {
  skuId: string;
  qty: number;
  unitPrice: number;
  taxable: number;
  taxPct: number;
  taxAmount: number;
  cessPct: number;
  cessAmount: number;
  lineTotal: number;
};

export type InvoiceTotals = {
  lines: InvoiceTaxLine[];
  subtotal: number;
  taxTotal: number;
  cessTotal: number;
  total: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeInvoiceTotals(lines: InvoiceTaxLineInput[]): InvoiceTotals {
  const out: InvoiceTaxLine[] = lines.map((l) => {
    const taxPct = l.taxPct ?? 0;
    const cessPct = l.cessPct ?? 0;
    // gross is the inclusive billing amount the customer pays.
    const gross = round2(l.qty * l.unitPrice);
    // Extract the taxable value out of the inclusive gross using the combined slab.
    const taxable = round2(gross / (1 + (taxPct + cessPct) / 100));
    // Total tax = gross − taxable (so taxable + tax always reconciles to gross, no paisa
    // drift). Cess is its share; GST is the remainder.
    const cessAmount = round2((taxable * cessPct) / 100);
    const taxAmount = round2(gross - taxable - cessAmount);
    return {
      skuId: l.skuId,
      qty: l.qty,
      unitPrice: l.unitPrice,
      taxable,
      taxPct,
      taxAmount,
      cessPct,
      cessAmount,
      lineTotal: gross, // customer pays the inclusive price, never more
    };
  });

  const subtotal = round2(out.reduce((a, l) => a + l.taxable, 0));
  const taxTotal = round2(out.reduce((a, l) => a + l.taxAmount, 0));
  const cessTotal = round2(out.reduce((a, l) => a + l.cessAmount, 0));
  // Total is the sum of the inclusive line grosses (what the customer actually pays).
  const total = round2(out.reduce((a, l) => a + l.lineTotal, 0));
  return { lines: out, subtotal, taxTotal, cessTotal, total };
}

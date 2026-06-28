/**
 * Invoice tax engine (M21) — pure, unit-tested. Computes per-line GST + cess and
 * invoice totals from rates supplied per line (tax_slab_pct / cess_pct, sourced from
 * skus). Rates are PROVISIONAL until client/CA confirm (see docs/MISSING_INPUTS.md);
 * the math here doesn't change when the values do. Place-of-supply default is
 * intra-state (a single GST amount; CGST/SGST split is a display concern on the PDF).
 * Mirrors the confirm_and_invoice RPC so server + UI agree.
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
    const taxable = round2(l.qty * l.unitPrice);
    const taxAmount = round2((taxable * taxPct) / 100);
    const cessAmount = round2((taxable * cessPct) / 100);
    return {
      skuId: l.skuId,
      qty: l.qty,
      unitPrice: l.unitPrice,
      taxable,
      taxPct,
      taxAmount,
      cessPct,
      cessAmount,
      lineTotal: round2(taxable + taxAmount + cessAmount),
    };
  });

  const subtotal = round2(out.reduce((a, l) => a + l.taxable, 0));
  const taxTotal = round2(out.reduce((a, l) => a + l.taxAmount, 0));
  const cessTotal = round2(out.reduce((a, l) => a + l.cessAmount, 0));
  return { lines: out, subtotal, taxTotal, cessTotal, total: round2(subtotal + taxTotal + cessTotal) };
}

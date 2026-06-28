/**
 * Order math + validation (M19) — pure, unit-tested. Lines arrive already priced
 * (the action resolves each via priceFor); a null unitPrice means "no price rule" and
 * is rejected here (the missing-price guard). Tax is 0 until the CA tax slabs land
 * (config.tax_slabs, M21) — taxTotal is wired through so adding slabs is localized.
 */

export type OrderLineInput = {
  skuId: string;
  qty: number;
  unitPrice: number | null;
};

export type PricedOrderLine = {
  skuId: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderTotals = {
  lines: PricedOrderLine[];
  subtotal: number;
  taxTotal: number;
  total: number;
};

/** First validation error, or null. */
export function validateOrderLines(lines: OrderLineInput[]): string | null {
  if (!lines || lines.length === 0) return "An order needs at least one line.";
  for (const l of lines) {
    if (typeof l.qty !== "number" || Number.isNaN(l.qty) || l.qty <= 0) {
      return "Every line needs a quantity greater than 0.";
    }
    if (l.unitPrice == null) {
      return `No price set for SKU ${l.skuId}. Set a price before ordering it.`;
    }
  }
  return null;
}

/** Compute line totals + order subtotal/tax/total. Assumes lines are validated. */
export function computeOrderTotals(lines: OrderLineInput[]): OrderTotals {
  const priced: PricedOrderLine[] = lines.map((l) => ({
    skuId: l.skuId,
    qty: l.qty,
    unitPrice: l.unitPrice as number,
    lineTotal: l.qty * (l.unitPrice as number),
  }));
  const subtotal = priced.reduce((acc, l) => acc + l.lineTotal, 0);
  const taxTotal = 0; // CA tax slabs gated (config.tax_slabs) — wire in at M21.
  return { lines: priced, subtotal, taxTotal, total: subtotal + taxTotal };
}

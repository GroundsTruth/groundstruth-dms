/**
 * Order math + validation (M19 + audit #4/#5/#10). Each line carries a resolved
 * **list price** and a rep-entered **charged price** (defaults to list). A charged
 * price below list is allowed but marks the line `belowList` — any below-list line
 * routes the whole order to **admin approval** (audit #5) instead of a fixed discount
 * ceiling (#10, removed). Prices are GST-INCLUSIVE billing prices (tax extracted at
 * invoice time, see invoice-tax.ts).
 */

export type OrderLineInput = {
  skuId: string;
  qty: number;
  listPrice: number | null; // resolved from the price list (null = unpriced → blocked)
  chargedPrice?: number | null; // rep-entered; defaults to listPrice
};

export type PricedOrderLine = {
  skuId: string;
  qty: number;
  listPrice: number;
  unitPrice: number; // the charged price
  discountPct: number; // (list − charged) / list, 0 if at/above list
  lineTotal: number;
  belowList: boolean;
};

export type OrderTotals = {
  lines: PricedOrderLine[];
  subtotal: number;
  total: number;
  needsApproval: boolean; // true if any line is below list
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** First validation error, or null. */
export function validateOrderLines(lines: OrderLineInput[]): string | null {
  if (!lines || lines.length === 0) return "An order needs at least one line.";
  for (const l of lines) {
    if (typeof l.qty !== "number" || Number.isNaN(l.qty) || l.qty <= 0) {
      return "Every line needs a quantity greater than 0.";
    }
    if (l.listPrice == null) {
      return `No price set for SKU ${l.skuId}. Set a price before ordering it.`;
    }
    const charged = l.chargedPrice ?? l.listPrice;
    if (typeof charged !== "number" || Number.isNaN(charged) || charged < 0) {
      return "Charged price must be 0 or more.";
    }
  }
  return null;
}

/** Compute line totals + whether the order needs approval. Assumes validated. */
export function computeOrderTotals(lines: OrderLineInput[]): OrderTotals {
  const priced: PricedOrderLine[] = lines.map((l) => {
    const listPrice = l.listPrice as number;
    const unitPrice = l.chargedPrice ?? listPrice;
    const belowList = unitPrice < listPrice;
    const discountPct = listPrice > 0 && belowList ? round2(((listPrice - unitPrice) / listPrice) * 100) : 0;
    return {
      skuId: l.skuId,
      qty: l.qty,
      listPrice,
      unitPrice,
      discountPct,
      lineTotal: round2(l.qty * unitPrice),
      belowList,
    };
  });
  const subtotal = round2(priced.reduce((a, l) => a + l.lineTotal, 0));
  return {
    lines: priced,
    subtotal,
    total: subtotal,
    needsApproval: priced.some((l) => l.belowList),
  };
}

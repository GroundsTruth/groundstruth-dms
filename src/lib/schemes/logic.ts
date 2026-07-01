/**
 * Scheme / freebie engine (S2) — pure, unit-tested. Given the order lines and the active
 * schemes, compute the free lines to add (₹0). Buy `triggerQty` cases of the trigger SKU →
 * get `freeQty` cases of the free SKU, per multiple (cross-SKU allowed). Freebies from
 * multiple schemes on the same free SKU are summed.
 */

export type Scheme = {
  id: string;
  name: string;
  triggerSkuId: string;
  triggerQty: number;
  freeSkuId: string;
  freeQty: number;
};

export type Freebie = { skuId: string; qty: number; schemeId: string; schemeName: string };

export function applySchemes(
  lines: { skuId: string; qty: number }[],
  schemes: Scheme[],
): Freebie[] {
  const orderedQty = new Map<string, number>();
  for (const l of lines) orderedQty.set(l.skuId, (orderedQty.get(l.skuId) ?? 0) + l.qty);

  const out: Freebie[] = [];
  for (const s of schemes) {
    const have = orderedQty.get(s.triggerSkuId) ?? 0;
    const times = Math.floor(have / s.triggerQty);
    if (times > 0) {
      out.push({ skuId: s.freeSkuId, qty: times * s.freeQty, schemeId: s.id, schemeName: s.name });
    }
  }
  return out;
}

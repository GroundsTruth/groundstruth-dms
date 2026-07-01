/**
 * Price-list resolution (M18) — pure, unit-tested. Resolves the price for a SKU in a
 * given context (retailer / route) by specificity: a retailer-specific price beats a
 * route price beats the base price. Within the same specificity the latest
 * `effective_from` (as of the order date) wins. Inactive or not-yet-effective rules
 * are ignored. The price_list table (M01) feeds these rules; see ./data.ts.
 */

export type PriceListType = "retail" | "wholesale";

export type PriceRule = {
  skuId: string;
  retailerId: string | null;
  route: string | null;
  price: number;
  effectiveFrom: string; // ISO date
  isActive: boolean;
  listType?: PriceListType; // audit #9; defaults to retail
};

export type PriceContext = {
  skuId: string;
  retailerId?: string | null;
  route?: string | null;
  listType?: PriceListType; // which list (retail/wholesale) applies to this buyer
  asOf?: string; // ISO date; defaults to "today" via the caller
};

export type SetPriceInput = {
  skuId: string;
  price: number;
  retailerId?: string | null;
  route?: string | null;
  effectiveFrom?: string | null;
};

/** Validate a new price rule. A rule scopes to ONE of: retailer, route, or base. */
export function validateSetPrice(input: SetPriceInput): string | null {
  if (!input.skuId?.trim()) return "A SKU is required.";
  if (typeof input.price !== "number" || Number.isNaN(input.price) || input.price < 0) {
    return "Price must be 0 or more.";
  }
  if (input.retailerId && input.route) {
    return "A price applies to one scope — a retailer OR a route, not both.";
  }
  return null;
}

// Higher number = more specific = wins.
function specificity(rule: PriceRule, ctx: PriceContext): number {
  if (rule.retailerId != null && rule.retailerId === ctx.retailerId) return 3;
  if (rule.route != null && rule.route === ctx.route) return 2;
  if (rule.retailerId == null && rule.route == null) return 1;
  return 0; // rule targets a different retailer/route — not a candidate
}

/** Resolve the applicable unit price, or null if no rule applies. */
export function resolvePrice(rules: PriceRule[], ctx: PriceContext): number | null {
  const asOf = ctx.asOf ?? "9999-12-31";

  let best: { spec: number; effectiveFrom: string; price: number } | null = null;

  const wantList = ctx.listType ?? "retail";

  for (const rule of rules) {
    if (!rule.isActive) continue;
    if (rule.skuId !== ctx.skuId) continue;
    if (rule.effectiveFrom > asOf) continue;
    if ((rule.listType ?? "retail") !== wantList) continue; // #9: pick the right list

    const spec = specificity(rule, ctx);
    if (spec === 0) continue;

    if (
      best === null ||
      spec > best.spec ||
      (spec === best.spec && rule.effectiveFrom > best.effectiveFrom)
    ) {
      best = { spec, effectiveFrom: rule.effectiveFrom, price: rule.price };
    }
  }

  return best?.price ?? null;
}

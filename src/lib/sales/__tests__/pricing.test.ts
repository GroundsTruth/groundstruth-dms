import { describe, it, expect } from "vitest";
import { resolvePrice, validateSetPrice, type PriceRule } from "../pricing";

const base: PriceRule = {
  skuId: "s-1",
  retailerId: null,
  route: null,
  price: 100,
  effectiveFrom: "2026-01-01",
  isActive: true,
};
const routeRule: PriceRule = {
  skuId: "s-1",
  retailerId: null,
  route: "ROUTE-3",
  price: 95,
  effectiveFrom: "2026-01-01",
  isActive: true,
};
const retailerRule: PriceRule = {
  skuId: "s-1",
  retailerId: "r-9",
  route: null,
  price: 90,
  effectiveFrom: "2026-01-01",
  isActive: true,
};

describe("resolvePrice precedence (retailer > route > base)", () => {
  const rules = [base, routeRule, retailerRule];

  it("uses the retailer price when the retailer matches", () => {
    expect(resolvePrice(rules, { skuId: "s-1", retailerId: "r-9", route: "ROUTE-3" })).toBe(90);
  });

  it("falls to route price when no retailer match", () => {
    expect(resolvePrice(rules, { skuId: "s-1", retailerId: "r-other", route: "ROUTE-3" })).toBe(95);
  });

  it("falls to base when neither retailer nor route match", () => {
    expect(resolvePrice(rules, { skuId: "s-1", retailerId: "r-x", route: "ROUTE-9" })).toBe(100);
  });

  it("returns null when no rule exists for the SKU", () => {
    expect(resolvePrice(rules, { skuId: "s-404", retailerId: "r-9" })).toBeNull();
  });
});

describe("resolvePrice filters", () => {
  it("ignores inactive rules", () => {
    const rules = [{ ...base, isActive: false }];
    expect(resolvePrice(rules, { skuId: "s-1" })).toBeNull();
  });

  it("ignores rules not yet effective as of the order date", () => {
    const future = { ...base, effectiveFrom: "2026-12-01" };
    expect(resolvePrice([future], { skuId: "s-1", asOf: "2026-06-28" })).toBeNull();
  });

  it("within the same specificity, the latest effective_from wins", () => {
    const older = { ...base, price: 100, effectiveFrom: "2026-01-01" };
    const newer = { ...base, price: 110, effectiveFrom: "2026-06-01" };
    expect(resolvePrice([older, newer], { skuId: "s-1", asOf: "2026-06-28" })).toBe(110);
  });
});

describe("validateSetPrice", () => {
  it("accepts a base price", () => {
    expect(validateSetPrice({ skuId: "s-1", price: 100 })).toBeNull();
  });
  it("requires a SKU", () => {
    expect(validateSetPrice({ skuId: "", price: 100 })).toMatch(/sku/i);
  });
  it("requires price >= 0", () => {
    expect(validateSetPrice({ skuId: "s-1", price: -1 })).toMatch(/price/i);
    expect(validateSetPrice({ skuId: "s-1", price: Number.NaN })).toMatch(/price/i);
  });
  it("rejects scoping to both a retailer and a route", () => {
    expect(
      validateSetPrice({ skuId: "s-1", price: 100, retailerId: "r-1", route: "ROUTE-3" }),
    ).toMatch(/retailer.*route|one scope/i);
  });
});

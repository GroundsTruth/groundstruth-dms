import { describe, it, expect } from "vitest";
import { applySchemes, type Scheme } from "../logic";

const waterScheme: Scheme = { id: "s1", name: "10+1 Water", triggerSkuId: "water15", triggerQty: 10, freeSkuId: "water15", freeQty: 1 };
const crossScheme: Scheme = { id: "s2", name: "CSD→Suncrush", triggerSkuId: "csd1l", triggerQty: 2, freeSkuId: "sun200", freeQty: 1 };

describe("applySchemes", () => {
  it("case-level: buy 10 → 1 free (same SKU)", () => {
    expect(applySchemes([{ skuId: "water15", qty: 10 }], [waterScheme])).toEqual([
      { skuId: "water15", qty: 1, schemeId: "s1", schemeName: "10+1 Water" },
    ]);
  });
  it("scales with multiples", () => {
    expect(applySchemes([{ skuId: "water15", qty: 25 }], [waterScheme])[0].qty).toBe(2); // floor(25/10)
  });
  it("no freebie below the trigger", () => {
    expect(applySchemes([{ skuId: "water15", qty: 9 }], [waterScheme])).toEqual([]);
  });
  it("cross-SKU: buy 2 cases CSD 1L → 1 case Suncrush Mango free", () => {
    const f = applySchemes([{ skuId: "csd1l", qty: 4 }], [crossScheme]);
    expect(f).toEqual([{ skuId: "sun200", qty: 2, schemeId: "s2", schemeName: "CSD→Suncrush" }]);
  });
});

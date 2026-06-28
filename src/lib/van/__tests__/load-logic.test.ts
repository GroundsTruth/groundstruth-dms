import { describe, it, expect } from "vitest";
import { validateLoad, formatLoadNo } from "../load-logic";

describe("validateLoad", () => {
  const ok = { route: "ROUTE-3", lines: [{ skuId: "s-1", qty: 5 }] };

  it("accepts a load with a route and a positive line", () => {
    expect(validateLoad(ok)).toBeNull();
  });
  it("requires at least one line", () => {
    expect(validateLoad({ route: "ROUTE-3", lines: [] })).toMatch(/at least one|no lines/i);
  });
  it("requires qty > 0 on every line", () => {
    expect(validateLoad({ route: "ROUTE-3", lines: [{ skuId: "s-1", qty: 0 }] })).toMatch(/quantity|qty/i);
  });
  it("rejects duplicate SKUs in one load (merge them first)", () => {
    expect(
      validateLoad({
        route: "ROUTE-3",
        lines: [{ skuId: "s-1", qty: 5 }, { skuId: "s-1", qty: 2 }],
      }),
    ).toMatch(/duplicate|same sku/i);
  });
});

describe("formatLoadNo", () => {
  it("pads to VL0001", () => {
    expect(formatLoadNo(1)).toBe("VL0001");
    expect(formatLoadNo(42)).toBe("VL0042");
  });
});

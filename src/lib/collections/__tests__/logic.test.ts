import { describe, it, expect } from "vitest";
import { outstanding, validateCollection } from "../logic";

describe("outstanding", () => {
  it("is invoice total minus collected", () => {
    expect(outstanding(1000, 300)).toBe(700);
    expect(outstanding(1000, 1000)).toBe(0);
  });
});

describe("validateCollection", () => {
  const ctx = { outstanding: 700 };
  it("accepts a cash payment within outstanding", () => {
    expect(validateCollection({ amount: 500, mode: "cash" }, ctx)).toBeNull();
  });
  it("accepts a UPI payment with a reference", () => {
    expect(validateCollection({ amount: 700, mode: "upi", reference: "UTR123" }, ctx)).toBeNull();
  });
  it("requires amount > 0", () => {
    expect(validateCollection({ amount: 0, mode: "cash" }, ctx)).toMatch(/amount/i);
  });
  it("rejects an unknown mode", () => {
    // @ts-expect-error testing invalid mode
    expect(validateCollection({ amount: 100, mode: "card" }, ctx)).toMatch(/mode|cash|upi/i);
  });
  it("rejects collecting more than outstanding", () => {
    expect(validateCollection({ amount: 800, mode: "cash" }, ctx)).toMatch(/outstanding|more than/i);
  });
});

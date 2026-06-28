import { describe, it, expect } from "vitest";
import { returnableRemaining, validateReturnLine } from "../returns-logic";

describe("returnableRemaining", () => {
  it("is qty_out minus already returned", () => {
    expect(returnableRemaining(10, 3)).toBe(7);
    expect(returnableRemaining(10, 10)).toBe(0);
  });
});

describe("validateReturnLine", () => {
  it("accepts a return within the remaining", () => {
    expect(validateReturnLine({ qty: 4, qtyOut: 10, qtyReturned: 3 })).toBeNull();
  });
  it("accepts zero (no return on this line)", () => {
    expect(validateReturnLine({ qty: 0, qtyOut: 10, qtyReturned: 0 })).toBeNull();
  });
  it("rejects a negative qty", () => {
    expect(validateReturnLine({ qty: -1, qtyOut: 10, qtyReturned: 0 })).toMatch(/0 or more|negative/i);
  });
  it("rejects returning more than was taken out", () => {
    expect(validateReturnLine({ qty: 8, qtyOut: 10, qtyReturned: 3 })).toMatch(/more than|exceeds|out/i);
  });
});

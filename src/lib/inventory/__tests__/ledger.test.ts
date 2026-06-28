import { describe, it, expect } from "vitest";
import { netFromMovements } from "../ledger";

describe("netFromMovements", () => {
  it("adds inward and van_return, subtracts sale_deduct and van_out", () => {
    const net = netFromMovements([
      { movementType: "inward", qty: 100 },
      { movementType: "sale_deduct", qty: 30 },
      { movementType: "van_out", qty: 20 },
      { movementType: "van_return", qty: 5 },
    ]);
    expect(net).toBe(55); // 100 - 30 - 20 + 5
  });

  it("treats adjustment as a signed add (can be negative)", () => {
    expect(netFromMovements([{ movementType: "adjustment", qty: -4 }])).toBe(-4);
    expect(netFromMovements([{ movementType: "adjustment", qty: 7 }])).toBe(7);
  });

  it("is 0 for an empty ledger", () => {
    expect(netFromMovements([])).toBe(0);
  });
});

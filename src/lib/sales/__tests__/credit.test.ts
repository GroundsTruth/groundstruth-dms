import { describe, it, expect } from "vitest";
import { creditCheck, creditRuleForEntity } from "../credit";

describe("brand credit rules", () => {
  it("Jaypee = no credit; Falcon = ₹1500/3-day", () => {
    expect(creditRuleForEntity("jaypee").creditAllowed).toBe(false);
    expect(creditRuleForEntity("falcon")).toEqual({ creditAllowed: true, maxLimit: 1500, overdueDays: 3 });
  });
  it("cash customer always ok", () => {
    expect(creditCheck({ entity: "jaypee", customerType: "cash", outstanding: 0, orderTotal: 500, creditLimit: 0 }).ok).toBe(true);
  });
  it("credit customer blocked on Jaypee (cola)", () => {
    const r = creditCheck({ entity: "jaypee", customerType: "credit", outstanding: 0, orderTotal: 500, creditLimit: 1000 });
    expect(r.ok).toBe(false);
  });
  it("Falcon credit within cap → ok; over cap → blocked", () => {
    expect(creditCheck({ entity: "falcon", customerType: "credit", outstanding: 500, orderTotal: 500, creditLimit: 1500 }).ok).toBe(true);
    expect(creditCheck({ entity: "falcon", customerType: "credit", outstanding: 1200, orderTotal: 500, creditLimit: 1500 }).ok).toBe(false);
  });
});

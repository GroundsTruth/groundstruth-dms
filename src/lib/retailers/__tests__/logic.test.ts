import { describe, it, expect } from "vitest";
import { validateRetailer, normalizePhone } from "../logic";

describe("validateRetailer", () => {
  const ok = { name: "Sharma Stores", phone: "9876543210", gstin: "27ABCDE1234F1Z5" };

  it("accepts a well-formed retailer", () => {
    expect(validateRetailer(ok)).toBeNull();
  });
  it("requires a name", () => {
    expect(validateRetailer({ ...ok, name: "  " })).toMatch(/name/i);
  });
  it("accepts a retailer with only a name (rest optional)", () => {
    expect(validateRetailer({ name: "Corner Shop" })).toBeNull();
  });
  it("rejects a malformed phone", () => {
    expect(validateRetailer({ ...ok, phone: "12345" })).toMatch(/phone/i);
  });
  it("rejects a malformed GSTIN", () => {
    expect(validateRetailer({ ...ok, gstin: "BADGSTIN" })).toMatch(/gstin/i);
  });
});

describe("normalizePhone", () => {
  it("strips non-digits", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("9198765 43210".replace(/\D/g, ""));
    expect(normalizePhone("(987) 654 3210")).toBe("9876543210");
  });
});

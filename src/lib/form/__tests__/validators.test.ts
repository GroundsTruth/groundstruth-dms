import { describe, expect, it } from "vitest";
import {
  digitsOnly,
  parseCases,
  phoneError,
  sanitizeVehicle,
  dateOrderError,
  MAX_QTY_CASES,
  VEHICLE_MAX_CHARS,
} from "../validators";

describe("digitsOnly", () => {
  it("strips non-digits and caps length", () => {
    expect(digitsOnly("43fsgsddf98sdf76")).toBe("439876");
    expect(digitsOnly("98-765 43210x", 10)).toBe("9876543210");
    expect(digitsOnly("", 10)).toBe("");
  });
});

describe("parseCases", () => {
  it("rejects text (the 'hubbub' bug)", () => {
    const r = parseCases("hubbub");
    expect(r.ok).toBe(false);
  });
  it("rejects absurdly large quantities (the 13-digit bug)", () => {
    const r = parseCases("8988998989898");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("too large");
  });
  it("rejects zero, negatives, decimals and empty", () => {
    expect(parseCases("0").ok).toBe(false);
    expect(parseCases("-5").ok).toBe(false);
    expect(parseCases("2.5").ok).toBe(false);
    expect(parseCases("").ok).toBe(false);
  });
  it("accepts sane whole numbers up to the cap", () => {
    const r = parseCases("50");
    expect(r).toEqual({ ok: true, value: 50 });
    expect(parseCases(String(MAX_QTY_CASES)).ok).toBe(true);
    expect(parseCases(String(MAX_QTY_CASES + 1)).ok).toBe(false);
  });
});

describe("phoneError", () => {
  it("optional + empty is fine; required + empty is not", () => {
    expect(phoneError("")).toBeNull();
    expect(phoneError("", true)).toMatch(/required/);
  });
  it("rejects partial numbers with progress hint", () => {
    expect(phoneError("98765")).toContain("5/10");
  });
  it("accepts exactly 10 digits", () => {
    expect(phoneError("9876543210")).toBeNull();
  });
});

describe("sanitizeVehicle", () => {
  it("uppercases, strips junk, caps at the client limit", () => {
    expect(sanitizeVehicle("mh-04-ab-1234")).toBe("MH-04-AB-123"); // 13 chars → capped to 12
    expect(sanitizeVehicle("dwcdwcdwcdwcwdwcwdcwddwd")).toHaveLength(VEHICLE_MAX_CHARS);
    expect(sanitizeVehicle("mh04ab1234")).toBe("MH04AB1234");
  });
});

describe("dateOrderError", () => {
  it("flags mfg after expiry", () => {
    expect(dateOrderError("2026-07-30", "2026-07-02")).toMatch(/cannot be after/);
  });
  it("allows correct order or missing dates", () => {
    expect(dateOrderError("2026-06-01", "2026-12-31")).toBeNull();
    expect(dateOrderError(null, "2026-12-31")).toBeNull();
    expect(dateOrderError("2026-06-01", null)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import {
  CONFIG_DEFAULTS,
  CONFIG_KEYS,
  getDefault,
  coerceConfigValue,
} from "../defaults";

describe("CONFIG_DEFAULTS", () => {
  it("defines a default for every known key", () => {
    for (const key of CONFIG_KEYS) {
      expect(CONFIG_DEFAULTS[key]).toBeDefined();
    }
  });

  it("invoice_series carries prefix + numbering shape", () => {
    const d = CONFIG_DEFAULTS.invoice_series;
    expect(d.prefix).toBe("INV");
    expect(d.next).toBe(1);
    expect(d.padding).toBeGreaterThanOrEqual(1);
  });

  it("recon_tolerance / low_stock_threshold / low_stock_days are numeric defaults", () => {
    expect(CONFIG_DEFAULTS.recon_tolerance.amount).toBe(0);
    expect(CONFIG_DEFAULTS.low_stock_threshold.cases).toBeGreaterThan(0);
    expect(CONFIG_DEFAULTS.low_stock_days.days).toBeGreaterThan(0);
  });

  it("tax_slabs is an empty placeholder (client/CA-gated)", () => {
    expect(CONFIG_DEFAULTS.tax_slabs).toEqual({});
  });
});

describe("getDefault", () => {
  it("returns the typed default for a key", () => {
    expect(getDefault("low_stock_days")).toEqual(CONFIG_DEFAULTS.low_stock_days);
  });
});

describe("coerceConfigValue", () => {
  it("returns the stored value when present", () => {
    const stored = { prefix: "CMP", next: 42, padding: 6 };
    expect(coerceConfigValue("invoice_series", stored)).toEqual(stored);
  });

  it("falls back to the default when stored is null/undefined", () => {
    expect(coerceConfigValue("invoice_series", null)).toEqual(
      CONFIG_DEFAULTS.invoice_series,
    );
    expect(coerceConfigValue("low_stock_threshold", undefined)).toEqual(
      CONFIG_DEFAULTS.low_stock_threshold,
    );
  });
});

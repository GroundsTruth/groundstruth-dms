import { describe, it, expect } from "vitest";
import { formatInvoiceNo } from "../invoice-format";

describe("formatInvoiceNo", () => {
  it("pads the sequence to the configured width and prefixes it", () => {
    expect(formatInvoiceNo("INV", 1, 5)).toBe("INV00001");
    expect(formatInvoiceNo("INV", 42, 5)).toBe("INV00042");
  });
  it("does not truncate a sequence longer than the padding", () => {
    expect(formatInvoiceNo("INV", 123456, 5)).toBe("INV123456");
  });
  it("falls back to safe defaults for missing parts", () => {
    expect(formatInvoiceNo("", 7, 0)).toBe("INV00007"); // default prefix + min width 5
  });
});

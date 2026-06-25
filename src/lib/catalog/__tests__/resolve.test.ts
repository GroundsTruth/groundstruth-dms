import { describe, it, expect } from "vitest";
import { resolveSku, parsePackMl, detectFree, signature } from "../resolve";

describe("parsePackMl", () => {
  it("reads ml and litres", () => {
    expect(parsePackMl("Water - 750 ML")).toBe(750);
    expect(parsePackMl("CSD Cola - 2 L")).toBe(2000);
    expect(parsePackMl("Campa Cola - 2.25 Ltr")).toBe(2250);
    expect(parsePackMl("Water - 1.5 L")).toBe(1500);
  });
  it("returns null when no size", () => {
    expect(parsePackMl("Mystery Drink")).toBeNull();
  });
});

describe("detectFree", () => {
  it("flags free-goods lines", () => {
    expect(detectFree("Water - 750 ML (FREE)")).toBe(true);
    expect(detectFree("Water - 750 ML")).toBe(false);
  });
});

describe("signature", () => {
  it("normalises feed and master to the same form for easy matches", () => {
    expect(signature("Water 750 ml")).toBe(signature("Water - 750 ML"));
    expect(signature("CSD Orange - 500 ML")).toBe("csd orange 500 ml");
  });
});

describe("resolveSku — real feed names from seed_sales_sample.csv", () => {
  it("matches exact-ish names", () => {
    expect(resolveSku("Water 750 ml").sku?.code).toBe("SKU051");
    expect(resolveSku("CSD Orange - 500 ML").sku?.code).toBe("SKU017");
    expect(resolveSku("Gold Boost Energy Can - 185 ML").sku?.code).toBe("SKU024");
    expect(resolveSku("Water Gold - 750 ML").sku?.code).toBe("SKU052");
    expect(resolveSku("Suncrush Mango - 200 Ml").sku?.code).toBe("SKU041");
    expect(resolveSku("Mix - 500 ML").sku?.code).toBe("SKU029");
  });

  it("resolves names that only differ via the alias map", () => {
    expect(resolveSku("Soda ML 500 ML").sku?.code).toBe("SKU018");
    expect(resolveSku("CAMPA ENERGY GB 330ml CAN").sku?.code).toBe("SKU025");
    expect(resolveSku("RASIK 150ML Nimbu Pani").sku?.code).toBe("SKU038");
    expect(resolveSku("RASIK 500 ML").sku?.code).toBe("SKU035");
  });

  it("strips (FREE) and flags it while still resolving the SKU", () => {
    const r = resolveSku("Water - 750 ML (FREE)");
    expect(r.sku?.code).toBe("SKU051");
    expect(r.isFree).toBe(true);
  });

  it("flags ambiguous names instead of guessing", () => {
    // "CSD 500ml" has no flavour — matches Cola/Lemon/Orange 500ml equally.
    const r = resolveSku("CSD 500ml");
    expect(r.sku).toBeNull();
    expect(r.confidence).toBe("ambiguous");
  });

  it("resolves a confident fuzzy match", () => {
    // missing the unit word, but brand+flavour+size are unambiguous
    expect(resolveSku("Campa Cola 2.25").sku?.code).toBe("SKU019");
  });

  it("returns none for genuinely unknown products", () => {
    const r = resolveSku("Totally Unknown Drink 1L");
    expect(r.sku).toBeNull();
    expect(r.confidence).toBe("none");
  });
});

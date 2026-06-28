import { describe, it, expect } from "vitest";
import { validateDeduct, planFifo } from "../fifo-logic";

describe("validateDeduct", () => {
  it("accepts a positive qty with a sku", () => {
    expect(validateDeduct({ skuId: "s-1", qty: 5 })).toBeNull();
  });
  it("requires a sku", () => {
    expect(validateDeduct({ skuId: "", qty: 5 })).toMatch(/sku/i);
  });
  it("requires qty > 0", () => {
    expect(validateDeduct({ skuId: "s-1", qty: 0 })).toMatch(/quantity|qty/i);
    expect(validateDeduct({ skuId: "s-1", qty: -1 })).toMatch(/quantity|qty/i);
  });
});

describe("planFifo", () => {
  // Deliberately unsorted; planFifo must order by expiry asc (nulls last), then receivedAt.
  const batches = [
    { id: "b-late", qtyOnHand: 10, expiryDate: "2026-12-01", receivedAt: "2026-06-01" },
    { id: "b-early", qtyOnHand: 4, expiryDate: "2026-08-01", receivedAt: "2026-05-01" },
    { id: "b-none", qtyOnHand: 100, expiryDate: null, receivedAt: "2026-01-01" },
  ];

  it("takes the earliest-expiry batch first", () => {
    const { allocations, short } = planFifo(batches, 3);
    expect(short).toBe(0);
    expect(allocations).toEqual([{ batchId: "b-early", qty: 3 }]);
  });

  it("spills across batches in expiry order, nulls last", () => {
    const { allocations, short } = planFifo(batches, 16);
    expect(short).toBe(0);
    expect(allocations).toEqual([
      { batchId: "b-early", qty: 4 }, // earliest expiry, fully drained
      { batchId: "b-late", qty: 10 }, // next expiry, fully drained
      { batchId: "b-none", qty: 2 }, // null expiry comes last
    ]);
  });

  it("reports the shortfall when stock is insufficient", () => {
    const small = [{ id: "b1", qtyOnHand: 5, expiryDate: null, receivedAt: "2026-01-01" }];
    const { allocations, short } = planFifo(small, 8);
    expect(allocations).toEqual([{ batchId: "b1", qty: 5 }]);
    expect(short).toBe(3);
  });

  it("breaks ties on receivedAt (older first) when expiry equal", () => {
    const tie = [
      { id: "newer", qtyOnHand: 5, expiryDate: "2026-09-01", receivedAt: "2026-06-10" },
      { id: "older", qtyOnHand: 5, expiryDate: "2026-09-01", receivedAt: "2026-06-01" },
    ];
    const { allocations } = planFifo(tie, 3);
    expect(allocations).toEqual([{ batchId: "older", qty: 3 }]);
  });
});

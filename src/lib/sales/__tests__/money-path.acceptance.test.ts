import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "../invoice-tax";
import { planFifo, type FifoBatch } from "../../inventory/fifo-logic";
import { netFromMovements, type MovementType } from "../../inventory/ledger";

/**
 * M23 acceptance — "punch order → invoice → stock auto-deducts."
 *
 * Pure simulation of what confirm_and_invoice does in SQL: price the lines, compute
 * GST+cess, FIFO-deduct the ordered qty across batches, and prove the invoice totals
 * and the stock ledger both balance — and that a deduct is recorded for every line
 * (audited). No live DB; documents the atomic contract.
 */

type Batch = FifoBatch & { skuId: string };
type Movement = { movementType: MovementType; qty: number };

describe("M23 money-path acceptance: order → invoice → auto-deduct", () => {
  it("invoice totals and stock ledger both balance after invoicing", () => {
    // Warehouse: SKU s-1 has two batches (90 total), s-2 one batch (40).
    const batches: Batch[] = [
      { id: "b1", skuId: "s-1", qtyOnHand: 50, expiryDate: "2026-08-01", receivedAt: "2026-06-01" },
      { id: "b2", skuId: "s-1", qtyOnHand: 40, expiryDate: "2026-12-01", receivedAt: "2026-06-02" },
      { id: "b3", skuId: "s-2", qtyOnHand: 40, expiryDate: null, receivedAt: "2026-06-01" },
    ];
    const movements: Movement[] = [
      { movementType: "inward", qty: 50 },
      { movementType: "inward", qty: 40 },
      { movementType: "inward", qty: 40 },
    ];

    // Order: 60 of s-1 @100 (28%+12%), 10 of s-2 @50 (18%, 0 cess).
    const order = [
      { skuId: "s-1", qty: 60, unitPrice: 100, taxPct: 28, cessPct: 12 },
      { skuId: "s-2", qty: 10, unitPrice: 50, taxPct: 18, cessPct: 0 },
    ];

    // Invoice tax — GST-INCLUSIVE (tax extracted from the billing price).
    const inv = computeInvoiceTotals(order);
    // s-1: gross 6000 incl 40% → taxable 4285.71, GST 1200, cess 514.29
    // s-2: gross 500 incl 18% → taxable 423.73, GST 76.27
    expect(inv.subtotal).toBe(4709.44);
    expect(inv.taxTotal).toBe(1276.27);
    expect(inv.cessTotal).toBe(514.29);
    expect(inv.total).toBe(6500); // customer pays exactly qty × billing price
    // breakdown reconciles to the inclusive total
    expect(inv.subtotal + inv.taxTotal + inv.cessTotal).toBeCloseTo(inv.total, 2);

    // FIFO deduct each ordered line; record a sale_deduct movement per allocation.
    for (const line of order) {
      const skuBatches = batches.filter((b) => b.skuId === line.skuId);
      const { allocations, short } = planFifo(skuBatches, line.qty);
      expect(short).toBe(0); // enough stock — invoice would commit
      for (const a of allocations) {
        const b = batches.find((x) => x.id === a.batchId)!;
        b.qtyOnHand -= a.qty;
        movements.push({ movementType: "sale_deduct", qty: a.qty });
      }
    }

    // s-1: 60 pulled from b1(50)+b2(10) → b1=0, b2=30 ; s-2: 10 from b3 → b3=30.
    expect(batches.find((b) => b.id === "b1")!.qtyOnHand).toBe(0);
    expect(batches.find((b) => b.id === "b2")!.qtyOnHand).toBe(30);
    expect(batches.find((b) => b.id === "b3")!.qtyOnHand).toBe(30);

    // Stock ledger balances: 130 in − 70 sold = 60 on hand.
    const onHand = batches.reduce((a, b) => a + b.qtyOnHand, 0);
    expect(onHand).toBe(60);
    expect(netFromMovements(movements)).toBe(onHand);

    // Audited: 3 inward + 3 sale_deduct allocations (s-1 split across 2 batches).
    expect(movements.filter((m) => m.movementType === "sale_deduct")).toHaveLength(3);
  });
});

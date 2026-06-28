import { describe, it, expect } from "vitest";
import { planFifo, type FifoBatch } from "../fifo-logic";
import { netFromMovements, type MovementType } from "../ledger";

/**
 * M15 acceptance — "receive stock, deduct, balance correct & audited."
 *
 * Pure simulation of the invariant the two RPCs (receive_stock, deduct_stock)
 * enforce in SQL: after receiving and FIFO-deducting, on-hand per batch must equal
 * the movement ledger's net, and every operation must leave a ledger entry (audited).
 * This documents the contract without needing a live DB.
 */

type Batch = FifoBatch;
type Movement = { movementType: MovementType; qty: number };

function receive(
  batches: Batch[],
  movements: Movement[],
  b: Batch,
): void {
  batches.push({ ...b });
  movements.push({ movementType: "inward", qty: b.qtyOnHand });
}

/** Apply a FIFO deduction to the batch list + ledger. Returns false if short (no-op). */
function deduct(
  batches: Batch[],
  movements: Movement[],
  qty: number,
): boolean {
  const { allocations, short } = planFifo(batches, qty);
  if (short > 0) return false; // all-or-nothing, like the RPC's rollback
  for (const a of allocations) {
    const batch = batches.find((x) => x.id === a.batchId)!;
    batch.qtyOnHand -= a.qty;
    movements.push({ movementType: "sale_deduct", qty: a.qty });
  }
  return true;
}

function onHand(batches: Batch[]): number {
  return batches.reduce((acc, b) => acc + b.qtyOnHand, 0);
}

describe("M15 inventory acceptance: receive → deduct → balance correct & audited", () => {
  it("balance equals the movement ledger net, and every op is audited", () => {
    const batches: Batch[] = [];
    const movements: Movement[] = [];

    receive(batches, movements, {
      id: "B1",
      qtyOnHand: 100,
      expiryDate: "2026-08-01",
      receivedAt: "2026-06-01",
    });
    receive(batches, movements, {
      id: "B2",
      qtyOnHand: 50,
      expiryDate: "2026-12-01",
      receivedAt: "2026-06-02",
    });

    const ok = deduct(batches, movements, 120);
    expect(ok).toBe(true);

    // FIFO drained the earlier-expiry batch first.
    expect(batches.find((b) => b.id === "B1")!.qtyOnHand).toBe(0);
    expect(batches.find((b) => b.id === "B2")!.qtyOnHand).toBe(30);

    // Balance correct: physical on-hand === ledger net.
    expect(onHand(batches)).toBe(30);
    expect(netFromMovements(movements)).toBe(onHand(batches));

    // Audited: 2 inward + 2 sale_deduct movements, none missing.
    expect(movements).toHaveLength(4);
  });

  it("rejects a deduct beyond available stock (no partial, no negative)", () => {
    const batches: Batch[] = [];
    const movements: Movement[] = [];
    receive(batches, movements, {
      id: "B1",
      qtyOnHand: 10,
      expiryDate: null,
      receivedAt: "2026-06-01",
    });

    const ok = deduct(batches, movements, 25);
    expect(ok).toBe(false);
    // Untouched: stock unchanged, no sale_deduct recorded.
    expect(onHand(batches)).toBe(10);
    expect(movements).toHaveLength(1); // only the inward
  });
});

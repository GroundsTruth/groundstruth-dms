/**
 * FIFO deduction logic (M13) — pure, no Supabase imports, unit-tested. `planFifo`
 * mirrors what the `deduct_stock` RPC does in SQL (oldest-expiry first, nulls last,
 * then oldest received), so the allocation rule is documented and testable without a
 * DB. The RPC is the transactional source of truth; this is the spec it implements.
 */

export type DeductInput = {
  skuId: string;
  qty: number;
  actorUserId?: string | null;
  refType?: string | null;
  refId?: string | null;
};

export type Allocation = { batchId: string; qty: number };

export type FifoBatch = {
  id: string;
  qtyOnHand: number;
  expiryDate: string | null;
  receivedAt: string;
};

/** First validation error, or null. */
export function validateDeduct(input: Pick<DeductInput, "skuId" | "qty">): string | null {
  if (!input.skuId?.trim()) return "A SKU is required.";
  if (typeof input.qty !== "number" || Number.isNaN(input.qty) || input.qty <= 0) {
    return "Quantity must be greater than 0.";
  }
  return null;
}

/** Sort key: earliest expiry first (null expiry last), tie-break on oldest receivedAt. */
function fifoCompare(a: FifoBatch, b: FifoBatch): number {
  if (a.expiryDate !== b.expiryDate) {
    if (a.expiryDate === null) return 1; // a has no expiry → after b
    if (b.expiryDate === null) return -1; // b has no expiry → after a
    return a.expiryDate < b.expiryDate ? -1 : 1;
  }
  return a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : 0;
}

/**
 * Plan a FIFO deduction of `qty` across batches. Returns the per-batch allocations
 * and `short` = how much could not be covered (0 when fully satisfied).
 */
export function planFifo(
  batches: FifoBatch[],
  qty: number,
): { allocations: Allocation[]; short: number } {
  const ordered = [...batches]
    .filter((b) => b.qtyOnHand > 0)
    .sort(fifoCompare);

  const allocations: Allocation[] = [];
  let remaining = qty;

  for (const b of ordered) {
    if (remaining <= 0) break;
    const take = Math.min(b.qtyOnHand, remaining);
    allocations.push({ batchId: b.id, qty: take });
    remaining -= take;
  }

  return { allocations, short: remaining > 0 ? remaining : 0 };
}

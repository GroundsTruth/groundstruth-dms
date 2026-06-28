/**
 * Van return logic (M26) — pure, unit-tested. A return adds unsold cases back to the
 * batch they were loaded from; you can never return more than went out. The atomic
 * record_returns RPC enforces the same rule under a row lock; this guards the input.
 */

export type ReturnLineInput = { lineId: string; qty: number };

/** Cases still on the van for a load line (out − already returned). */
export function returnableRemaining(qtyOut: number, qtyReturned: number): number {
  return qtyOut - qtyReturned;
}

/** First validation error for one return line, or null. */
export function validateReturnLine(input: {
  qty: number;
  qtyOut: number;
  qtyReturned: number;
}): string | null {
  if (typeof input.qty !== "number" || Number.isNaN(input.qty) || input.qty < 0) {
    return "Return quantity must be 0 or more.";
  }
  if (input.qty > returnableRemaining(input.qtyOut, input.qtyReturned)) {
    return "Can't return more than what's still out on the van.";
  }
  return null;
}

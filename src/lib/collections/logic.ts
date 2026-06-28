/**
 * Collection logic (M29) — pure, unit-tested. A collection records cash/UPI against an
 * invoice; you can't collect more than is outstanding. The reference is captured, not
 * processed (no payment gateway). The accessor/action wrap this with the DB write.
 */

export type CollectionMode = "cash" | "upi";

export type CollectionInput = {
  amount: number;
  mode: CollectionMode;
  reference?: string | null;
};

/** Amount still owed on an invoice. */
export function outstanding(invoiceTotal: number, collected: number): number {
  return invoiceTotal - collected;
}

/** First validation error, or null. */
export function validateCollection(
  input: CollectionInput,
  ctx: { outstanding: number },
): string | null {
  if (typeof input.amount !== "number" || Number.isNaN(input.amount) || input.amount <= 0) {
    return "Collection amount must be greater than 0.";
  }
  if (input.mode !== "cash" && input.mode !== "upi") {
    return "Payment mode must be cash or UPI.";
  }
  if (input.amount > ctx.outstanding) {
    return "Can't collect more than the outstanding amount.";
  }
  return null;
}

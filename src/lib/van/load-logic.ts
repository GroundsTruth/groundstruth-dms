/**
 * Van load-out logic (M24) — pure, unit-tested. Validates a load request and formats
 * load numbers. The actual stock move (FIFO van_out across batches) is atomic in the
 * load_van RPC; this guards the input shape before we call it.
 */

export type LoadLineInput = { skuId: string; qty: number };
export type LoadInput = {
  vehicle?: string | null;
  driverUserId?: string | null;
  route?: string | null;
  lines: LoadLineInput[];
};

/** First validation error, or null. */
export function validateLoad(input: LoadInput): string | null {
  if (!input.lines || input.lines.length === 0) {
    return "A van load needs at least one line.";
  }
  const seen = new Set<string>();
  for (const l of input.lines) {
    if (!l.skuId?.trim()) return "Every line needs a SKU.";
    if (typeof l.qty !== "number" || Number.isNaN(l.qty) || l.qty <= 0) {
      return "Every line needs a quantity greater than 0.";
    }
    if (seen.has(l.skuId)) {
      return `Duplicate SKU ${l.skuId} — merge it into one line.`;
    }
    seen.add(l.skuId);
  }
  return null;
}

/** Format a sequence into a load number (VL0001). */
export function formatLoadNo(next: number): string {
  return `VL${String(next).padStart(4, "0")}`;
}

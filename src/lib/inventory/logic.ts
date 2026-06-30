/**
 * Inventory pure logic (M11/M12) — no Supabase imports, unit-tested. Validation +
 * stock math shared by the receive service, the stock-view accessor, and tests.
 */

export type ReceiveInput = {
  skuId: string;
  batchNo: string;
  qty: number;
  mfgDate?: string | null;
  expiryDate?: string | null;
  actorUserId?: string | null;
};

/** First validation error, or null if the receive is well-formed. */
export function validateReceive(input: ReceiveInput): string | null {
  if (!input.skuId?.trim()) return "A SKU is required.";
  if (!input.batchNo?.trim()) return "A batch number is required.";
  if (typeof input.qty !== "number" || Number.isNaN(input.qty) || input.qty <= 0) {
    return "Quantity must be greater than 0.";
  }
  if (input.mfgDate && input.expiryDate) {
    if (new Date(input.expiryDate).getTime() < new Date(input.mfgDate).getTime()) {
      return "Expiry date cannot be before the manufacture date.";
    }
  }
  return null;
}

/** A SKU is low on stock when on-hand cases are at or below the configured threshold. */
export function lowStockFlag(casesOnHand: number, threshold: number): boolean {
  return casesOnHand <= threshold;
}

/** Days of stock cover = on-hand ÷ average daily sales. Infinity if no sales (audit #14). */
export function daysOfCover(onHand: number, avgDailySales: number): number {
  if (avgDailySales <= 0) return Number.POSITIVE_INFINITY;
  return onHand / avgDailySales;
}

/** Dynamic low-stock: fewer than `thresholdDays` of cover left. */
export function isLowStockDynamic(
  onHand: number,
  avgDailySales: number,
  thresholdDays: number,
): boolean {
  return daysOfCover(onHand, avgDailySales) < thresholdDays;
}

/** Total on-hand quantity across a SKU's batches. */
export function sumOnHand(batches: { qtyOnHand: number }[]): number {
  return batches.reduce((acc, b) => acc + b.qtyOnHand, 0);
}

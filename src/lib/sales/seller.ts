/**
 * Dual billing entity (client 2026-07-01) — pure, unit-tested. Each product bills under
 * one of two legal entities; the invoice picks the seller by the products on it:
 *   Jaypee Enterprises  → Campa Cola / CSD (Cola, Lemon, Orange, Soda)
 *   Falcon Enterprises  → Campa Sure / Water, and (provisional) Energy, Juice
 * The Energy/Juice/Soda split is a DEFAULT pending client confirm (CLIENT_QUESTIONS_ROUND3 #1).
 * Seller profiles live in config (seller_jaypee / seller_falcon), read at invoice time.
 */

export type SellerEntity = "jaypee" | "falcon";

const FALCON_CATEGORIES = new Set(["Water", "Juice", "Energy"]);

/** Entity that bills a SKU of this category. */
export function sellerEntityForCategory(category: string): SellerEntity {
  return FALCON_CATEGORIES.has(category) ? "falcon" : "jaypee";
}

/** Pick the invoice's entity from its lines' categories (dominant; ties → jaypee). */
export function invoiceSellerEntity(categories: string[]): SellerEntity {
  let jaypee = 0;
  let falcon = 0;
  for (const c of categories) {
    if (sellerEntityForCategory(c) === "falcon") falcon++;
    else jaypee++;
  }
  return falcon > jaypee ? "falcon" : "jaypee";
}

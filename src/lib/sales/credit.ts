import type { SellerEntity } from "./seller";

/**
 * Brand-specific credit rules (client 2026-07-01) — pure, unit-tested.
 *   Campa Cola (Jaypee): strictly NO credit — cash/UPI immediate.
 *   Campa Sure (Falcon): credit up to ₹1,500/shop, 1–3 day period, overdue flag after 3 days.
 */
export type CreditRule = { creditAllowed: boolean; maxLimit: number; overdueDays: number };

const RULES: Record<SellerEntity, CreditRule> = {
  jaypee: { creditAllowed: false, maxLimit: 0, overdueDays: 0 },
  falcon: { creditAllowed: true, maxLimit: 1500, overdueDays: 3 },
};

export function creditRuleForEntity(entity: SellerEntity): CreditRule {
  return RULES[entity];
}

/**
 * Can this order proceed on credit? Cash customers always ok (they pay now). Credit
 * customers: blocked on Jaypee (cola) entirely; on Falcon, blocked if the new balance
 * exceeds the ₹1,500 cap (or their own lower limit).
 */
export function creditCheck(input: {
  entity: SellerEntity;
  customerType: string; // 'cash' | 'credit'
  outstanding: number;
  orderTotal: number;
  creditLimit: number;
}): { ok: true } | { ok: false; reason: string } {
  if (input.customerType !== "credit") return { ok: true };

  const rule = RULES[input.entity];
  if (!rule.creditAllowed) {
    return { ok: false, reason: "Campa Cola (Jaypee) is cash/UPI only — no credit." };
  }
  const cap = Math.min(input.creditLimit || rule.maxLimit, rule.maxLimit);
  if (input.outstanding + input.orderTotal > cap) {
    return { ok: false, reason: `Credit limit ₹${cap} exceeded (outstanding ₹${input.outstanding}).` };
  }
  return { ok: true };
}

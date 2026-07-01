/**
 * Reconciliation math (M27) — pure, unit-tested. Anti-leakage check: of the stock that
 * left the van (out − returned), how much is backed by invoices? Cash owed vs collected.
 * Variances are graded against the client's **tiered tolerances** (hardcoded per their
 * 2026-07-01 spec): ok / warn / critical, as a % of the expected figure. Overall status
 * is the worst of the cash and stock tiers.
 */

export type ReconcileInput = {
  qtyOut: number;
  qtyReturned: number;
  soldInvoiced: number;
  cashExpected: number;
  cashCollected: number;
};

export type ReconStatus = "ok" | "warn" | "critical";

export type ReconcileResult = {
  qtyOut: number;
  qtyReturned: number;
  qtySold: number;
  variance: number;
  variancePct: number;
  cashExpected: number;
  cashCollected: number;
  cashVariance: number;
  cashVariancePct: number;
  status: ReconStatus;
};

// Client-confirmed tiers (2026-07-01), as % of expected.
const CASH_TIERS = { ok: 0.1, warn: 0.3 }; // <0.1 ok · 0.1–0.3 warn · >0.3 critical
const STOCK_TIERS = { ok: 0.2, warn: 0.6 }; // <0.2 ok · 0.2–0.6 warn · >0.6 critical

function tier(pct: number, t: { ok: number; warn: number }): ReconStatus {
  const p = Math.abs(pct);
  if (p < t.ok) return "ok";
  if (p <= t.warn) return "warn";
  return "critical";
}

const RANK: Record<ReconStatus, number> = { ok: 0, warn: 1, critical: 2 };

export function computeReconciliation(input: ReconcileInput): ReconcileResult {
  const physicalSold = input.qtyOut - input.qtyReturned;
  const variance = physicalSold - input.soldInvoiced;
  const cashVariance = input.cashExpected - input.cashCollected;

  const variancePct = input.qtyOut > 0 ? (Math.abs(variance) / input.qtyOut) * 100 : 0;
  const cashVariancePct = input.cashExpected > 0 ? (Math.abs(cashVariance) / input.cashExpected) * 100 : 0;

  const stockTier = tier(variancePct, STOCK_TIERS);
  const cashTier = tier(cashVariancePct, CASH_TIERS);
  const status = RANK[stockTier] >= RANK[cashTier] ? stockTier : cashTier;

  return {
    qtyOut: input.qtyOut,
    qtyReturned: input.qtyReturned,
    qtySold: input.soldInvoiced,
    variance,
    variancePct: Math.round(variancePct * 100) / 100,
    cashExpected: input.cashExpected,
    cashCollected: input.cashCollected,
    cashVariance,
    cashVariancePct: Math.round(cashVariancePct * 100) / 100,
    status,
  };
}

/**
 * Inventory ledger math (M15 / foundation for recon M27) — pure, unit-tested.
 * On-hand is the signed sum of stock_movements: inward + van_return add stock,
 * sale_deduct + van_out remove it, adjustment is a signed correction. This is the
 * invariant the receive_stock / deduct_stock RPCs preserve in SQL.
 */

export type MovementType =
  | "inward"
  | "sale_deduct"
  | "van_out"
  | "van_return"
  | "adjustment";

const SIGN: Record<MovementType, number> = {
  inward: +1,
  van_return: +1,
  sale_deduct: -1,
  van_out: -1,
  adjustment: +1, // qty already carries its sign for adjustments
};

/** Net on-hand contribution of a movement list. */
export function netFromMovements(
  movements: { movementType: MovementType; qty: number }[],
): number {
  return movements.reduce((acc, m) => acc + SIGN[m.movementType] * m.qty, 0);
}

/**
 * Invoice-number formatting (M20) — pure, no imports, unit-tested. Kept separate
 * from the DB call (./invoice-number) so it loads in vitest without the `@/` alias.
 */

/** Format a sequence into a display invoice number. */
export function formatInvoiceNo(prefix: string, next: number, padding: number): string {
  const p = prefix?.trim() || "INV";
  const width = padding && padding > 0 ? padding : 5;
  return `${p}${String(next).padStart(width, "0")}`;
}

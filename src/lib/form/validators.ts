/**
 * Shared input validation (pure, unit-tested — no imports). Born from the client's
 * E2E bug round (2026-07-02): text accepted in quantity fields, 13-digit quantities,
 * letters in phone fields, unbounded vehicle numbers, mfg > expiry. Every form takes
 * user input through these so the rules stay identical across screens.
 */

/** Hard ceiling for a single quantity entry (cases). Warehouse holds ~13k cases total,
 * so any single line beyond this is a typo, not a real movement. Client to confirm the
 * exact threshold (CLIENT_QUESTIONS_OPEN G22) — change here only. */
export const MAX_QTY_CASES = 10_000;

/** Indian mobile numbers: exactly 10 digits (we prefix +91 at the auth boundary). */
export const PHONE_DIGITS = 10;

/** Vehicle registration: client cap — "12 digits max" (fits MH-04-AB-1234 style). */
export const VEHICLE_MAX_CHARS = 12;

/** Strip everything but digits; optionally cap the length. */
export function digitsOnly(s: string, maxLen?: number): string {
  const d = (s ?? "").replace(/\D/g, "");
  return maxLen != null ? d.slice(0, maxLen) : d;
}

/** Parse a whole-number case quantity. Returns the number or a user-facing error. */
export function parseCases(
  raw: string | number,
  max: number = MAX_QTY_CASES,
): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (String(raw).trim() === "" || Number.isNaN(n)) {
    return { ok: false, error: "Enter a quantity in numbers." };
  }
  if (!Number.isInteger(n)) {
    return { ok: false, error: "Quantity must be a whole number of cases." };
  }
  if (n <= 0) return { ok: false, error: "Quantity must be greater than 0." };
  if (n > max) {
    return { ok: false, error: `Quantity looks too large — the limit per entry is ${max.toLocaleString("en-IN")} cases.` };
  }
  return { ok: true, value: n };
}

/**
 * Phone validation. Empty is OK when the field is optional (pass required=true to
 * reject empty). Anything non-empty must be exactly 10 digits.
 */
export function phoneError(s: string, required = false): string | null {
  const d = digitsOnly(s ?? "");
  if (d.length === 0) return required ? "Phone number is required." : null;
  if (d.length !== PHONE_DIGITS) return `Enter all ${PHONE_DIGITS} digits (${d.length}/${PHONE_DIGITS}).`;
  return null;
}

/** Uppercase, strip to plate-safe chars (A–Z 0–9 space dash), cap length. */
export function sanitizeVehicle(s: string): string {
  return (s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, "")
    .slice(0, VEHICLE_MAX_CHARS);
}

/** Manufacture date must not be after expiry. Null/absent dates are fine. */
export function dateOrderError(
  mfgDate?: string | null,
  expiryDate?: string | null,
): string | null {
  if (!mfgDate || !expiryDate) return null;
  if (new Date(mfgDate).getTime() > new Date(expiryDate).getTime()) {
    return "Manufacture date cannot be after the expiry date.";
  }
  return null;
}

/** Today as yyyy-mm-dd (for date-input min/max bounds). */
export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

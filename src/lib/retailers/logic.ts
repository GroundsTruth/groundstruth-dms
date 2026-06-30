/**
 * Retailer validation (M16/M17) — pure, unit-tested. Only the name is required; the
 * field-onboarding form captures the rest as available. Phone/GSTIN are light-checked
 * when present (don't block onboarding on a missing optional field).
 */

export type CustomerType = "cash" | "credit";

export type RetailerInput = {
  name: string;
  ownerName?: string | null;
  shopName?: string | null;
  address?: string | null;
  phone?: string | null;
  gstin?: string | null;
  route?: string | null;
  lat?: number | null;
  lng?: number | null;
  customerType?: CustomerType;
  customerCategory?: "retail" | "wholesale";
  creditLimit?: number | null;
  shopPhotoPath?: string | null;
};

// GSTIN: 2-digit state + 10-char PAN + entity + Z + checksum (15 chars).
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** Strip a phone to digits only. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** First validation error, or null. */
export function validateRetailer(input: RetailerInput): string | null {
  if (!input.name?.trim()) return "Retailer name is required.";

  if (input.phone) {
    const digits = normalizePhone(input.phone);
    if (digits.length < 10 || digits.length > 12) {
      return "Phone number looks invalid (need 10 digits).";
    }
  }

  if (input.gstin) {
    if (!GSTIN_RE.test(input.gstin.trim().toUpperCase())) {
      return "GSTIN looks invalid (expected a 15-character GSTIN).";
    }
  }

  if (input.customerType && input.customerType !== "cash" && input.customerType !== "credit") {
    return "Customer type must be cash or credit.";
  }
  if (input.creditLimit != null && (Number.isNaN(input.creditLimit) || input.creditLimit < 0)) {
    return "Credit limit must be 0 or more.";
  }
  if (input.customerType === "credit" && (input.creditLimit ?? 0) <= 0) {
    return "A credit customer needs a credit limit greater than 0.";
  }

  return null;
}

export type Category =
  | "Cola"
  | "Lemon"
  | "Orange"
  | "Soda"
  | "Energy"
  | "Juice"
  | "Water"
  | "Other";

export type Sku = {
  /** Canonical id, e.g. "SKU006". Stable join key across the system. */
  code: string;
  /** Cleaned display name. */
  name: string;
  category: Category;
  /** Normalised pack size in millilitres, or null if unknown. */
  packMl: number | null;
  /** Human label, e.g. "500 ML", "2.25 L". */
  packLabel: string;
  /** ₹ per case where known; null = client still to confirm. */
  ratePerCase: number | null;
  /** Active in the catalog. Optional — `undefined` ≡ active (the static seed). */
  isActive?: boolean;

  // ── Commercial / tax fields ──────────────────────────────────────────────
  // Optional (like `isActive`): `undefined` ≡ "not captured yet". These arrive
  // from the client / CA late (AGENTS rule 4 — never hardcode tax). The sample
  // invoice (docs/INVOICE_SPEC.md) confirms only the water line so far; the rest
  // await the client's per-SKU HSN/GST/cess table.
  /** Printed MRP in ₹. Basis (per piece vs per case) pending client — see spec. */
  mrp?: number | null;
  /** HSN/SAC code, e.g. "22011010" (packaged water). */
  hsn?: string | null;
  /** Total GST %, e.g. 5 / 12 / 18 / 28. Split into CGST+SGST or IGST at invoice time. */
  taxSlabPct?: number | null;
  /** Compensation cess % — some goods carry it (confirm per-SKU with the CA); water does not. */
  cessPct?: number | null;
  /** Pieces per case — converts case ⇄ piece (QPU on the invoice). */
  unitsPerCase?: number | null;
};

/**
 * A SKU's user-editable fields — not the auto-assigned `code`, and not the
 * `isActive` flag (activation is managed separately via `setSkuActive`).
 */
export type SkuInput = Omit<Sku, "code" | "isActive">;

export type Confidence = "exact" | "alias" | "fuzzy" | "ambiguous" | "none";

/** Result of mapping a messy feed `article_name` to a canonical SKU. */
export type ResolveResult = {
  input: string;
  cleaned: string;
  sku: Sku | null;
  confidence: Confidence;
  /** True when the line is a free-goods line (e.g. "… (FREE)"). */
  isFree: boolean;
  note?: string;
};

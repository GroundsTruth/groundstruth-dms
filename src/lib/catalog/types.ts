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
  // TODO (from client / CA): mrp, hsn, taxSlabPct, cessPct, unitsPerCase.
};

/** A SKU's editable fields (everything except the auto-assigned `code`). */
export type SkuInput = Omit<Sku, "code">;

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

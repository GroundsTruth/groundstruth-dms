/**
 * Config defaults (M03) — pure module, no Supabase imports, safe to unit-test and
 * to import from scripts. `config` table rows override these at runtime
 * (see ./data.ts `getConfig`), but the app always has a sensible fallback so a
 * missing/empty config row never breaks a flow. Mirrors the catalog seed-fallback.
 *
 * `tax_slabs` is intentionally an empty placeholder — GST %/cess per HSN is
 * client/CA-gated (see docs/SCHEMA.md "Open schema questions"). Fill via M21.
 */

export type InvoiceSeries = { prefix: string; next: number; padding: number };
export type ReconTolerance = { amount: number; pct: number };
export type LowStockThreshold = { cases: number };
export type LowStockDays = { days: number }; // audit #14 — days-of-cover threshold
export type TaxSlabs = Record<string, never> | Record<string, number>;

export type ConfigShape = {
  invoice_series: InvoiceSeries;
  recon_tolerance: ReconTolerance;
  low_stock_threshold: LowStockThreshold;
  low_stock_days: LowStockDays;
  tax_slabs: TaxSlabs;
};

export type ConfigKey = keyof ConfigShape;

export const CONFIG_DEFAULTS: ConfigShape = {
  // Server-side invoice numbering (M20). `next` is the seed; the real counter
  // advances atomically in the invoice-number service.
  invoice_series: { prefix: "INV", next: 1, padding: 5 },
  // Reconciliation variance allowed before a load is flagged (M27). Both 0 = strict.
  recon_tolerance: { amount: 0, pct: 1 },
  // Cases-on-hand at or below which a SKU is flagged low-stock (static fallback, M14).
  low_stock_threshold: { cases: 10 },
  // Dynamic low-stock: flag when days-of-cover (on-hand ÷ avg daily sales) < this (#14).
  low_stock_days: { days: 5 },
  // GST %/cess per slab — empty until CA sign-off.
  tax_slabs: {},
};

export const CONFIG_KEYS = Object.keys(CONFIG_DEFAULTS) as ConfigKey[];

/** Typed default for a key. */
export function getDefault<K extends ConfigKey>(key: K): ConfigShape[K] {
  return CONFIG_DEFAULTS[key];
}

/**
 * Resolve a stored config value, falling back to the default when the row is
 * missing (null/undefined). Keeps the fallback decision in one pure place so
 * both the accessor and tests share it.
 */
export function coerceConfigValue<K extends ConfigKey>(
  key: K,
  stored: ConfigShape[K] | null | undefined,
): ConfigShape[K] {
  return stored == null ? CONFIG_DEFAULTS[key] : stored;
}

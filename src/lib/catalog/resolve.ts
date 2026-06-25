import type { ResolveResult, Sku } from "./types";
import { SEED_SKUS } from "./data";

/**
 * Resolve a messy WhatsApp-feed `article_name` to a canonical SKU.
 *
 * The feed and the SKU master DO NOT share names ("Water 750 ml" vs
 * "Water - 750 ML", "Soda ML 500 ML" vs "Campa Club Soda - 500 ML"). Exact
 * string matching across that boundary silently drops sales, which corrupts
 * stock/cash reconciliation. So we resolve through:
 *   1. a hand-curated alias map (the feed emits a finite vocabulary)
 *   2. exact canonical-signature match
 *   3. a conservative fuzzy fallback (token overlap + pack size)
 * Anything not confidently matched returns `none`/`ambiguous` to be reviewed —
 * we never guess a wrong SKU.
 */

/** Strip "(FREE)", collapse whitespace. */
export function cleanName(raw: string): string {
  return raw
    .replace(/\(\s*free\s*\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectFree(raw: string): boolean {
  return /\bfree\b/i.test(raw);
}

/** Pack size in millilitres from a product string, else null. */
export function parsePackMl(raw: string): number | null {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(ml|l|lt|ltr|litre|liter)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  return unit === "ml" ? Math.round(n) : Math.round(n * 1000);
}

/** Order- and punctuation-insensitive signature for matching. */
export function signature(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\(\s*free\s*\)/g, " ")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(\d)\s*([a-z])/g, "$1 $2") // 500ml -> 500 ml
    .replace(/([a-z])\s*(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

const UNITS = new Set(["ml", "l", "lt", "ltr", "litre", "liter", "pet", "can", "tetra"]);
const STOP = new Set(["the", "of", "ka"]);

/** Brand/flavour keywords from a signature (drops size + unit + stop words). */
function keywords(sig: string): string[] {
  return sig
    .split(" ")
    .filter((w) => w && !/^\d/.test(w) && !UNITS.has(w) && !STOP.has(w));
}

/**
 * Hand-curated aliases — feed signature -> canonical sku code. Only needed for
 * names whose signature differs from the canonical (the easy ones match exactly).
 */
export const ALIASES: Record<string, string> = {
  "soda ml 500 ml": "SKU018", // Campa Club Soda 500ml
  "campa energy gb 330 ml can": "SKU025", // Gold Boost Energy Can 330ml
  "rasik 150 ml nimbu pani": "SKU038", // Rasiki Nimbu Pani 150ml
  "rasik 500 ml": "SKU035", // Rasiki Mango 500ml (only Rasiki at 500ml)
};

export function resolveSku(input: string, skus: Sku[] = SEED_SKUS): ResolveResult {
  const cleaned = cleanName(input);
  const sig = signature(input);
  const isFree = detectFree(input);
  const base = { input, cleaned, isFree };

  // 1. alias
  const aliasCode = ALIASES[sig];
  if (aliasCode) {
    const sku = skus.find((s) => s.code === aliasCode) ?? null;
    return { ...base, sku, confidence: sku ? "alias" : "none" };
  }

  // 2. exact canonical signature
  const exact = skus.find((s) => signature(s.name) === sig);
  if (exact) return { ...base, sku: exact, confidence: "exact" };

  // 3. fuzzy: keyword overlap + pack size
  const inTokens = keywords(sig);
  const inMl = parsePackMl(input);
  if (inTokens.length === 0) return { ...base, sku: null, confidence: "none" };

  let bestScore = 0;
  let bestSkus: Sku[] = [];
  for (const s of skus) {
    const sTokens = keywords(signature(s.name));
    const overlap = inTokens.filter((t) => sTokens.includes(t)).length;
    const coverage = overlap / inTokens.length;
    const sizeOk = inMl == null || s.packMl == null || s.packMl === inMl;
    const score = coverage * (sizeOk ? 1 : 0.4);
    if (score > bestScore) {
      bestScore = score;
      bestSkus = [s];
    } else if (score === bestScore && score > 0) {
      bestSkus.push(s);
    }
  }

  if (bestScore >= 0.6 && bestSkus.length === 1) {
    return { ...base, sku: bestSkus[0], confidence: "fuzzy" };
  }
  if (bestScore >= 0.6 && bestSkus.length > 1) {
    return {
      ...base,
      sku: null,
      confidence: "ambiguous",
      note: `${bestSkus.length} candidates: ${bestSkus.map((s) => s.code).join(", ")}`,
    };
  }
  return { ...base, sku: null, confidence: "none" };
}

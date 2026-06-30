import type { Sku } from "./types";

/**
 * Canonical SKU seed, cleaned from the Jaypee `seed_skus.csv` (52 rows):
 *   - dropped 5 spreadsheet-summary rows that leaked in as "SKUs"
 *     (REVENUE SUMMARY BY VAN, Revenue Share %, TOTAL, Total Qty Sold, Total Revenue)
 *   - merged 1 obvious duplicate (SKU026 trailing-space dup of SKU027)
 *   - normalised pack labels; kept original codes for traceability
 *
 * This is the seed-of-record: `scripts/seed-skus.ts` upserts it into the
 * `skus` table, and `getSkus()` falls back to it if the DB is unreachable.
 * Kept as a PURE module (no Supabase / path-alias imports) so the seed script
 * can import it cleanly under tsx.
 *
 * `ratePerCase` is ₹/case from the workbook where known; null = client to confirm.
 *
 * Tax fields (hsn / taxSlabPct / cessPct) are PROVISIONAL — researched against the
 * post-22-Sep-2025 "GST 2.0" regime (56th GST Council; Notn 09/2025-CT(R), incl. the
 * 1-May-2026 HSN renumbering via 01/2026-CT(R)), each rate adversarially verified with
 * citations recorded in `docs/INVOICE_SPEC.md` §3a — **pending the client's CA sign-off**.
 * Water (5%) is additionally corroborated by the client's own sample invoice. Mapping:
 *   - Carbonated soft drinks w/ sugar (cola/lemon/orange, incl "Zero") → 22021010, 40%, 0
 *   - Soda water (plain Club Soda)                                      → 22011020, 18%, 0
 *   - Energy / caffeinated (Gold Boost, Berry Kick)                     → 22029991, 40%, 0
 *   - "Gluco Energy" (client Catalogue classes it as juice)            → 22029929,  5%, 0
 *   - Fruit-juice drinks, non-carbonated (Rasiki / Suncrush)            → 22029929,  5%, 0
 *   - Jaljeera RTD ("Jeera")                                            → 22029990, 40%, 0
 *   - Packaged water (incl. "Water Gold")                               → 22011010,  5%, 0
 * Compensation cess is NIL on all beverages from 22-Sep-2025, so cessPct = 0 throughout.
 *
 * UNRESOLVED — left null, need product identity from the client: "Mix" (SKU029) and
 * "Power UP" (SKU030–032) could be 5% / 18% / 40% depending on what they actually are.
 * LOWER-CONFIDENCE (flagged for CA): Club Soda assumed plain/unsweetened (sweetened → 40%);
 * "Jeera" assumed a liquid RTD (a dry powder would be ~5–18%); "Rasiki Nimbu Pani" assumed
 * lemon-juice-based at 5% (a flavoured drink without juice would be 40%); the branded
 * "Water Gold" assumed plain water. MRP and unitsPerCase remain null — client to provide.
 */
export const SEED_SKUS: Sku[] = [
  // ── Carbonated soft drinks w/ sugar → HSN 22021010, GST 40%, cess 0 ──────────
  { code: "SKU001", name: "CSD Can Cola - 330 ML", category: "Cola", packMl: 330, packLabel: "330 ML", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU002", name: "CSD Can Lemon - 200 ML", category: "Lemon", packMl: 200, packLabel: "200 ML", ratePerCase: 492, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU003", name: "CSD Can Zero - 200 ML", category: "Cola", packMl: 200, packLabel: "200 ML", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU004", name: "CSD Cola - 200 ML", category: "Cola", packMl: 200, packLabel: "200 ML", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU005", name: "CSD Cola - 1 L", category: "Cola", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU006", name: "CSD Cola - 200 ML", category: "Cola", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU007", name: "CSD Cola - 2 L", category: "Cola", packMl: 2000, packLabel: "2 L", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU008", name: "CSD Cola - 500 ML", category: "Cola", packMl: 500, packLabel: "500 ML", ratePerCase: 395, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU009", name: "CSD Lemon - 1 L", category: "Lemon", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU010", name: "CSD Lemon - 200 ML", category: "Lemon", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU011", name: "CSD Lemon - 2 L", category: "Lemon", packMl: 2000, packLabel: "2 L", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU012", name: "CSD Lemon - 500 ML", category: "Lemon", packMl: 500, packLabel: "500 ML", ratePerCase: 395, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU013", name: "CSD Orange - 200 ML", category: "Orange", packMl: 200, packLabel: "200 ML", ratePerCase: 492, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU014", name: "CSD Orange - 1 L", category: "Orange", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU015", name: "CSD Orange - 200 ML", category: "Orange", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU016", name: "CSD Orange - 2 L", category: "Orange", packMl: 2000, packLabel: "2 L", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU017", name: "CSD Orange - 500 ML", category: "Orange", packMl: 500, packLabel: "500 ML", ratePerCase: 395, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // ── Soda water (assumed plain/unsweetened) → HSN 22011020, GST 18%, cess 0 ───
  { code: "SKU018", name: "Campa Club Soda - 500 ML", category: "Soda", packMl: 500, packLabel: "500 ML", ratePerCase: 215, hsn: "22011020", taxSlabPct: 18, cessPct: 0 },
  { code: "SKU019", name: "Campa Cola - 2.25 L", category: "Cola", packMl: 2250, packLabel: "2.25 L", ratePerCase: 677, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU020", name: "Campa Lemon - 2.25 L", category: "Lemon", packMl: 2250, packLabel: "2.25 L", ratePerCase: 677, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU021", name: "Campa Orange - 2.25 L", category: "Orange", packMl: 2250, packLabel: "2.25 L", ratePerCase: 677, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // ── Energy / caffeinated → HSN 22029991, GST 40%, cess 0 ─────────────────────
  { code: "SKU022", name: "Energy Berry Kick - 150 ML", category: "Energy", packMl: 150, packLabel: "150 ML", ratePerCase: 225, hsn: "22029991", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU023", name: "Energy Berry Kick - 250 ML", category: "Energy", packMl: 250, packLabel: "250 ML", ratePerCase: 450, hsn: "22029991", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU024", name: "Gold Boost Energy Can - 185 ML", category: "Energy", packMl: 185, packLabel: "185 ML", ratePerCase: 625, hsn: "22029991", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU025", name: "Gold Boost Energy Can - 330 ML", category: "Energy", packMl: 330, packLabel: "330 ML", ratePerCase: 495, hsn: "22029991", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU027", name: "Gold Boost Energy PET - 300 ML", category: "Energy", packMl: 300, packLabel: "300 ML", ratePerCase: 495, hsn: "22029991", taxSlabPct: 40, cessPct: 0 },
  // ── Jaljeera RTD (assumed liquid) → HSN 22029990, GST 40%, cess 0 ────────────
  { code: "SKU028", name: "Jeera - 150 ML", category: "Other", packMl: 150, packLabel: "150 ML", ratePerCase: 225, hsn: "22029990", taxSlabPct: 40, cessPct: 0 },
  // ── UNRESOLVED — product identity unknown; tax left null (client to identify) ─
  { code: "SKU029", name: "Mix - 500 ML", category: "Other", packMl: 500, packLabel: "500 ML", ratePerCase: 770 },
  { code: "SKU030", name: "Power UP - 1 L", category: "Other", packMl: 1000, packLabel: "1 L", ratePerCase: 400 },
  { code: "SKU031", name: "Power UP - 200 ML", category: "Other", packMl: 200, packLabel: "200 ML", ratePerCase: 240 },
  { code: "SKU032", name: "Power UP - 500 ML", category: "Other", packMl: 500, packLabel: "500 ML", ratePerCase: null },
  // ── Fruit-juice drinks, non-carbonated → HSN 22029929, GST 5%, cess 0 ────────
  { code: "SKU034", name: "Rasiki Mango - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU035", name: "Rasiki Mango - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 482, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU036", name: "Rasiki Mango Tetra - 125 ML", category: "Juice", packMl: 125, packLabel: "125 ML", ratePerCase: 277, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU037", name: "Rasiki Mix - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU038", name: "Rasiki Nimbu Pani - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  // "Gluco Energy" — the client Catalogue classifies it as JUICE (not energy) → 22029929, 5%, cess 0
  { code: "SKU039", name: "Rasiki Gluco Energy - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU041", name: "Suncrush Mango - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU042", name: "Suncrush Mango - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 770, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU043", name: "Suncrush Mixed Fruit - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU044", name: "Suncrush Orange - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362, hsn: "22029929", taxSlabPct: 5, cessPct: 0 },
  // ── Packaged water → HSN 22011010, GST 5%, cess 0 (matches sample invoice) ───
  { code: "SKU048", name: "Water - 1 L", category: "Water", packMl: 1000, packLabel: "1 L", ratePerCase: null, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU049", name: "Water - 1.5 L", category: "Water", packMl: 1500, packLabel: "1.5 L", ratePerCase: 115, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU050", name: "Water - 250 ML", category: "Water", packMl: 250, packLabel: "250 ML", ratePerCase: null, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU051", name: "Water - 750 ML", category: "Water", packMl: 750, packLabel: "750 ML", ratePerCase: 155, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU052", name: "Water Gold - 750 ML", category: "Water", packMl: 750, packLabel: "750 ML", ratePerCase: 192, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
];

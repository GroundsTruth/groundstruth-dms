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
 * `ratePerCase` is the RETAIL ₹/case; null = stock not yet received (client 7/1:
 * "the admin will just manually punch in the prices whenever those products land").
 *
 * RESYNCED 2026-07-02 to the client's 7/1 Catalogue ("Catalogue Cola.xlsx") — the
 * confirmed source of truth. Category taxonomy = client's (CSD / Soda / Energy /
 * Juice / Water); tax per category (cess 0 throughout):
 *   - CSD (cola/lemon/orange/Zero/Jeera/Power UP) → 22021010, 40%
 *   - Energy (Gold Boost, Berry Kick)             → 22021090, 40%
 *   - Juice (Rasiki / Suncrush / Gluco)           → 22029920,  5%
 *   - Water (incl. "Water Gold")                  → 22011010,  5%
 *   - Soda (Campa Club Soda)                      → 22011010,  5%   ← was 18% pre-Catalogue
 * 7/1 identity fixes: "Mix - 500 ML" = Suncrush Mixed Fruit - 500 ML; "Rasiki Mix" =
 * Rasiki Mixed Fruit; Can Lemon/Zero packs corrected 200→185 ML. SKU053+ are the
 * catalogue's NEW products (cans/variants) — several arrive unpriced (see above).
 * ⚠ Data anomalies inherited from the client sheet (flagged, not guessed): Berry Kick
 * Can MRPs look off (300 < retail) — MRP left null there; Suncrush Can pack/units
 * columns were shifted — units left null. Live DB re-seed: `npx tsx scripts/seed-skus.ts`.
 */
export const SEED_SKUS: Sku[] = [
  // ── Carbonated soft drinks w/ sugar → HSN 22021010, GST 40%, cess 0 ──────────
  { code: "SKU001", name: "CSD Can Cola - 330 ML", category: "CSD", packMl: 330, packLabel: "330 ML", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // Renamed 200→185 ML per the 7/1 Catalogue (client corrected the pack size).
  { code: "SKU002", name: "CSD Can Lemon - 185 ML", category: "CSD", packMl: 185, packLabel: "185 ML", ratePerCase: 492, hsn: "22021010", taxSlabPct: 40, cessPct: 0, unitsPerCase: 24 },
  { code: "SKU003", name: "CSD Can Zero - 185 ML", category: "CSD", packMl: 185, packLabel: "185 ML", ratePerCase: 612, hsn: "22021010", taxSlabPct: 40, cessPct: 0, unitsPerCase: 24 },
  { code: "SKU004", name: "CSD Cola - 200 ML", category: "CSD", packMl: 200, packLabel: "200 ML", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU005", name: "CSD Cola - 1 L", category: "CSD", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU006", name: "CSD Cola - 200 ML", category: "CSD", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU007", name: "CSD Cola - 2 L", category: "CSD", packMl: 2000, packLabel: "2 L", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU008", name: "CSD Cola - 500 ML", category: "CSD", packMl: 500, packLabel: "500 ML", ratePerCase: 395, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU009", name: "CSD Lemon - 1 L", category: "CSD", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU010", name: "CSD Lemon - 200 ML", category: "CSD", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU011", name: "CSD Lemon - 2 L", category: "CSD", packMl: 2000, packLabel: "2 L", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU012", name: "CSD Lemon - 500 ML", category: "CSD", packMl: 500, packLabel: "500 ML", ratePerCase: 395, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU013", name: "CSD Orange - 200 ML", category: "CSD", packMl: 200, packLabel: "200 ML", ratePerCase: 492, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU014", name: "CSD Orange - 1 L", category: "CSD", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU015", name: "CSD Orange - 200 ML", category: "CSD", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU016", name: "CSD Orange - 2 L", category: "CSD", packMl: 2000, packLabel: "2 L", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU017", name: "CSD Orange - 500 ML", category: "CSD", packMl: 500, packLabel: "500 ML", ratePerCase: 395, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // ── Club Soda → Soda, GST 5%, HSN 22011010 (7/1 Catalogue — was 18% research) ─
  { code: "SKU018", name: "Campa Club Soda - 500 ML", category: "Soda", packMl: 500, packLabel: "500 ML", ratePerCase: 240, hsn: "22011010", taxSlabPct: 5, cessPct: 0, unitsPerCase: 24 },
  { code: "SKU019", name: "Campa Cola - 2.25 L", category: "CSD", packMl: 2250, packLabel: "2.25 L", ratePerCase: 690, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU020", name: "Campa Lemon - 2.25 L", category: "CSD", packMl: 2250, packLabel: "2.25 L", ratePerCase: 690, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU021", name: "Campa Orange - 2.25 L", category: "CSD", packMl: 2250, packLabel: "2.25 L", ratePerCase: 690, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // ── Energy / caffeinated → HSN 22021090 (7/1 Catalogue), GST 40%, cess 0 ─────
  { code: "SKU022", name: "Energy Berry Kick - 150 ML", category: "Energy", packMl: 150, packLabel: "150 ML", ratePerCase: 240, hsn: "22021090", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU023", name: "Energy Berry Kick - 250 ML", category: "Energy", packMl: 250, packLabel: "250 ML", ratePerCase: 450, hsn: "22021090", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU024", name: "Gold Boost Energy Can - 185 ML", category: "Energy", packMl: 185, packLabel: "185 ML", ratePerCase: 625, hsn: "22021090", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU025", name: "Gold Boost Energy Can - 330 ML", category: "Energy", packMl: 330, packLabel: "330 ML", ratePerCase: 495, hsn: "22021090", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU027", name: "Gold Boost Energy PET - 300 ML", category: "Energy", packMl: 300, packLabel: "300 ML", ratePerCase: 495, hsn: "22021090", taxSlabPct: 40, cessPct: 0 },
  // ── Jeera = carbonated jaljeera → CSD 40% (7/1 Catalogue moved it Juice→CSD) ──
  { code: "SKU028", name: "Jeera - 150 ML", category: "CSD", packMl: 150, packLabel: "150 ML", ratePerCase: 225, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // ── "Mix" resolved (7/1): it IS Suncrush Mixed Fruit 500 ML → Juice 5% ────────
  { code: "SKU029", name: "Suncrush Mixed Fruit - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 720, hsn: "22029920", taxSlabPct: 5, cessPct: 0, mrp: 960 },
  // ── Power UP = CSD per the 7/1 Catalogue (GST 40, HSN 22021010) ───────────────
  { code: "SKU030", name: "Power UP - 1 L", category: "CSD", packMl: 1000, packLabel: "1 L", ratePerCase: 400, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU031", name: "Power UP - 200 ML", category: "CSD", packMl: 200, packLabel: "200 ML", ratePerCase: 240, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  { code: "SKU032", name: "Power UP - 500 ML", category: "CSD", packMl: 500, packLabel: "500 ML", ratePerCase: null, hsn: "22021010", taxSlabPct: 40, cessPct: 0 },
  // ── Fruit-juice drinks, non-carbonated → HSN 22029920, GST 5%, cess 0 ────────
  { code: "SKU034", name: "Rasiki Mango - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU035", name: "Rasiki Mango - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 482, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU036", name: "Rasiki Mango Tetra - 125 ML", category: "Juice", packMl: 125, packLabel: "125 ML", ratePerCase: 277, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU037", name: "Rasiki Mixed Fruit - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 217.5, hsn: "22029920", taxSlabPct: 5, cessPct: 0, mrp: 300 },
  { code: "SKU038", name: "Rasiki Nimbu Pani - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  // "Gluco Energy" — the client Catalogue classifies it as JUICE (not energy) → 22029920, 5%, cess 0
  { code: "SKU039", name: "Rasiki Gluco Energy - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU041", name: "Suncrush Mango - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU042", name: "Suncrush Mango - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 770, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU043", name: "Suncrush Mixed Fruit - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU044", name: "Suncrush Orange - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  // ── Packaged water → HSN 22011010, GST 5%, cess 0 (matches sample invoice) ───
  { code: "SKU048", name: "Water - 1 L", category: "Water", packMl: 1000, packLabel: "1 L", ratePerCase: null, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU049", name: "Water - 1.5 L", category: "Water", packMl: 1500, packLabel: "1.5 L", ratePerCase: 140, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU050", name: "Water - 250 ML", category: "Water", packMl: 250, packLabel: "250 ML", ratePerCase: null, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU051", name: "Water - 750 ML", category: "Water", packMl: 750, packLabel: "750 ML", ratePerCase: 160, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU052", name: "Water Gold - 750 ML", category: "Water", packMl: 750, packLabel: "750 ML", ratePerCase: 192, hsn: "22011010", taxSlabPct: 5, cessPct: 0 },

  // ── NEW products from the 7/1 Catalogue (client Q9 = yes, add them) ──────────
  // Unpriced rows = stock not received yet; admin punches the rate on arrival.
  { code: "SKU053", name: "CSD Can Cola - 185 ML", category: "CSD", packMl: 185, packLabel: "185 ML", ratePerCase: 600, hsn: "22021010", taxSlabPct: 40, cessPct: 0, mrp: 720, unitsPerCase: 24 },
  { code: "SKU054", name: "CSD Can Orange - 185 ML", category: "CSD", packMl: 185, packLabel: "185 ML", ratePerCase: 600, hsn: "22021010", taxSlabPct: 40, cessPct: 0, mrp: 720, unitsPerCase: 24 },
  { code: "SKU055", name: "CSD Can Orange - 330 ML", category: "CSD", packMl: 330, packLabel: "330 ML", ratePerCase: 1174, hsn: "22021010", taxSlabPct: 40, cessPct: 0, mrp: 2400, unitsPerCase: 24 },
  { code: "SKU056", name: "CSD Can Lemon - 330 ML", category: "CSD", packMl: 330, packLabel: "330 ML", ratePerCase: 1174, hsn: "22021010", taxSlabPct: 40, cessPct: 0, mrp: 2400, unitsPerCase: 24 },
  // Berry Kick Can MRPs in the client sheet look wrong (300 < retail) — left null.
  { code: "SKU057", name: "Energy Berry Kick Can - 185 ML", category: "Energy", packMl: 185, packLabel: "185 ML", ratePerCase: 612, hsn: "22021090", taxSlabPct: 40, cessPct: 0, unitsPerCase: 30 },
  { code: "SKU058", name: "Energy Berry Kick Can - 330 ML", category: "Energy", packMl: 330, packLabel: "330 ML", ratePerCase: null, hsn: "22021090", taxSlabPct: 40, cessPct: 0 },
  // Suncrush cans: client sheet's pack/units cells were shifted — units left null.
  { code: "SKU059", name: "Suncrush Mango Can - 185 ML", category: "Juice", packMl: 185, packLabel: "185 ML", ratePerCase: 600, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU060", name: "Suncrush Orange Can - 185 ML", category: "Juice", packMl: 185, packLabel: "185 ML", ratePerCase: 600, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU061", name: "Suncrush Mixed Fruit Can - 185 ML", category: "Juice", packMl: 185, packLabel: "185 ML", ratePerCase: 600, hsn: "22029920", taxSlabPct: 5, cessPct: 0 },
  { code: "SKU062", name: "Campa Club Soda - 200 ML", category: "Soda", packMl: 200, packLabel: "200 ML", ratePerCase: 182, hsn: "22011010", taxSlabPct: 5, cessPct: 0, mrp: 360, unitsPerCase: 24 },
];

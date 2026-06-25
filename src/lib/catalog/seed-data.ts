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
 * MRP / HSN / tax slab / cess / units-per-case are still TODO from the client.
 */
export const SEED_SKUS: Sku[] = [
  { code: "SKU001", name: "CSD Can Cola - 330 ML", category: "Cola", packMl: 330, packLabel: "330 ML", ratePerCase: null },
  { code: "SKU002", name: "CSD Can Lemon - 200 ML", category: "Lemon", packMl: 200, packLabel: "200 ML", ratePerCase: 492 },
  { code: "SKU003", name: "CSD Can Zero - 200 ML", category: "Cola", packMl: 200, packLabel: "200 ML", ratePerCase: null },
  { code: "SKU004", name: "CSD Cola - 200 ML", category: "Cola", packMl: 200, packLabel: "200 ML", ratePerCase: null },
  { code: "SKU005", name: "CSD Cola - 1 L", category: "Cola", packMl: 1000, packLabel: "1 L", ratePerCase: 400 },
  { code: "SKU006", name: "CSD Cola - 200 ML", category: "Cola", packMl: 200, packLabel: "200 ML", ratePerCase: 240 },
  { code: "SKU007", name: "CSD Cola - 2 L", category: "Cola", packMl: 2000, packLabel: "2 L", ratePerCase: null },
  { code: "SKU008", name: "CSD Cola - 500 ML", category: "Cola", packMl: 500, packLabel: "500 ML", ratePerCase: 395 },
  { code: "SKU009", name: "CSD Lemon - 1 L", category: "Lemon", packMl: 1000, packLabel: "1 L", ratePerCase: 400 },
  { code: "SKU010", name: "CSD Lemon - 200 ML", category: "Lemon", packMl: 200, packLabel: "200 ML", ratePerCase: 240 },
  { code: "SKU011", name: "CSD Lemon - 2 L", category: "Lemon", packMl: 2000, packLabel: "2 L", ratePerCase: null },
  { code: "SKU012", name: "CSD Lemon - 500 ML", category: "Lemon", packMl: 500, packLabel: "500 ML", ratePerCase: 395 },
  { code: "SKU013", name: "CSD Orange - 200 ML", category: "Orange", packMl: 200, packLabel: "200 ML", ratePerCase: 492 },
  { code: "SKU014", name: "CSD Orange - 1 L", category: "Orange", packMl: 1000, packLabel: "1 L", ratePerCase: 400 },
  { code: "SKU015", name: "CSD Orange - 200 ML", category: "Orange", packMl: 200, packLabel: "200 ML", ratePerCase: 240 },
  { code: "SKU016", name: "CSD Orange - 2 L", category: "Orange", packMl: 2000, packLabel: "2 L", ratePerCase: null },
  { code: "SKU017", name: "CSD Orange - 500 ML", category: "Orange", packMl: 500, packLabel: "500 ML", ratePerCase: 395 },
  { code: "SKU018", name: "Campa Club Soda - 500 ML", category: "Soda", packMl: 500, packLabel: "500 ML", ratePerCase: 215 },
  { code: "SKU019", name: "Campa Cola - 2.25 L", category: "Cola", packMl: 2250, packLabel: "2.25 L", ratePerCase: 677 },
  { code: "SKU020", name: "Campa Lemon - 2.25 L", category: "Lemon", packMl: 2250, packLabel: "2.25 L", ratePerCase: 677 },
  { code: "SKU021", name: "Campa Orange - 2.25 L", category: "Orange", packMl: 2250, packLabel: "2.25 L", ratePerCase: 677 },
  { code: "SKU022", name: "Energy Berry Kick - 150 ML", category: "Energy", packMl: 150, packLabel: "150 ML", ratePerCase: 225 },
  { code: "SKU023", name: "Energy Berry Kick - 250 ML", category: "Energy", packMl: 250, packLabel: "250 ML", ratePerCase: 450 },
  { code: "SKU024", name: "Gold Boost Energy Can - 185 ML", category: "Energy", packMl: 185, packLabel: "185 ML", ratePerCase: 625 },
  { code: "SKU025", name: "Gold Boost Energy Can - 330 ML", category: "Energy", packMl: 330, packLabel: "330 ML", ratePerCase: 495 },
  { code: "SKU027", name: "Gold Boost Energy PET - 300 ML", category: "Energy", packMl: 300, packLabel: "300 ML", ratePerCase: 495 },
  { code: "SKU028", name: "Jeera - 150 ML", category: "Other", packMl: 150, packLabel: "150 ML", ratePerCase: 225 },
  { code: "SKU029", name: "Mix - 500 ML", category: "Other", packMl: 500, packLabel: "500 ML", ratePerCase: 770 },
  { code: "SKU030", name: "Power UP - 1 L", category: "Other", packMl: 1000, packLabel: "1 L", ratePerCase: 400 },
  { code: "SKU031", name: "Power UP - 200 ML", category: "Other", packMl: 200, packLabel: "200 ML", ratePerCase: 240 },
  { code: "SKU032", name: "Power UP - 500 ML", category: "Other", packMl: 500, packLabel: "500 ML", ratePerCase: null },
  { code: "SKU034", name: "Rasiki Mango - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215 },
  { code: "SKU035", name: "Rasiki Mango - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 482 },
  { code: "SKU036", name: "Rasiki Mango Tetra - 125 ML", category: "Juice", packMl: 125, packLabel: "125 ML", ratePerCase: 277 },
  { code: "SKU037", name: "Rasiki Mix - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215 },
  { code: "SKU038", name: "Rasiki Nimbu Pani - 150 ML", category: "Juice", packMl: 150, packLabel: "150 ML", ratePerCase: 215 },
  { code: "SKU039", name: "Rasiki Gluco Energy - 150 ML", category: "Energy", packMl: 150, packLabel: "150 ML", ratePerCase: 215 },
  { code: "SKU041", name: "Suncrush Mango - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362 },
  { code: "SKU042", name: "Suncrush Mango - 500 ML", category: "Juice", packMl: 500, packLabel: "500 ML", ratePerCase: 770 },
  { code: "SKU043", name: "Suncrush Mixed Fruit - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362 },
  { code: "SKU044", name: "Suncrush Orange - 200 ML", category: "Juice", packMl: 200, packLabel: "200 ML", ratePerCase: 362 },
  { code: "SKU048", name: "Water - 1 L", category: "Water", packMl: 1000, packLabel: "1 L", ratePerCase: null },
  { code: "SKU049", name: "Water - 1.5 L", category: "Water", packMl: 1500, packLabel: "1.5 L", ratePerCase: 115 },
  { code: "SKU050", name: "Water - 250 ML", category: "Water", packMl: 250, packLabel: "250 ML", ratePerCase: null },
  { code: "SKU051", name: "Water - 750 ML", category: "Water", packMl: 750, packLabel: "750 ML", ratePerCase: 155 },
  { code: "SKU052", name: "Water Gold - 750 ML", category: "Water", packMl: 750, packLabel: "750 ML", ratePerCase: 192 },
];

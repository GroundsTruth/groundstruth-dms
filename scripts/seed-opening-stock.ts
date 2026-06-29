// Seeds REAL opening stock (June-1 on-hand, from the Jaypee workbook MASTER_INVENTORY)
// into stock_batches, mapping each workbook article name -> canonical SKU via the
// resolver (resolveSku) so inconsistent names ("1LT" vs "1 L") still match.
// Idempotent: upsert on (sku_id, batch_no='OPENING-2026-06'), so re-running resets,
// not doubles. Run from repo root: npx --yes tsx scripts/seed-opening-stock.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveSku } from "../src/lib/catalog/resolve";
import type { Sku } from "../src/lib/catalog/types";

const BATCH = "OPENING-2026-06";

// article + opening on-hand (cases), qty>0, from MASTER_INVENTORY.
const OPENING: { article: string; qty: number }[] = [
  { article: "CSD Cola - 200 ML", qty: 2654 },
  { article: "CSD Cola - 500 ML", qty: 355 },
  { article: "CSD Cola - 1LT", qty: 522 },
  { article: "Campa Cola - 2.25 Ltr", qty: 107 },
  { article: "CSD Orange - 200 ML", qty: 50 },
  { article: "CSD Orange - 500 ML", qty: 721 },
  { article: "CSD Orange - 1LT", qty: 147 },
  { article: "CSD Lemon - 500 ML", qty: 540 },
  { article: "CSD Lemon - 1LT", qty: 556 },
  { article: "Campa Lemon - 2.25 Ltr", qty: 128 },
  { article: "Water Gold - 750 ML", qty: 816 },
  { article: "Water - 1.5Ltr", qty: 1474 },
  { article: "Gold Boost Energy Pet  - 300 ML", qty: 1732 },
  { article: "Gold Boost Energy Can - 185 ML", qty: 541 },
  { article: "Energy Berry Kick - 150 PET", qty: 1012 },
  { article: "Rasiki Nimbu Pani - 150 ML", qty: 373 },
  { article: "Rasiki Mango - 150 ML", qty: 24 },
  { article: "Rasiki Mango - 500 ML", qty: 352 },
  { article: "Rasiki Mix - 150 ML Pet", qty: 50 },
  { article: "Rasiki Mango Tetra - 125 ML", qty: 16 },
  { article: "Suncrush Mango - 200 Ml", qty: 255 },
  { article: "Suncrush Orange PET - 200 ML", qty: 59 },
  { article: "Suncrush Mixed Fruit - 200 ML PET", qty: 54 },
  { article: "Jeera 150ml - 150 ML", qty: 55 },
  { article: "Power UP - 200 ML", qty: 50 },
  { article: "Power UP - 1Ltr", qty: 470 },
  { article: "Campa Club Soda - 500 ML", qty: 64 },
  { article: "Raskik Gluco Energy - 250 ml", qty: 95 },
];

function loadEnvLocal() {
  const text = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars in .env.local (run from repo root).");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Live SKUs → Sku[] for the resolver + a code→id map for the FK.
  const { data: rows, error } = await supabase
    .from("skus")
    .select("id,code,name,category,pack_ml,pack_label,rate_per_case,is_active");
  if (error) {
    console.error("read skus:", error.message);
    process.exit(1);
  }
  const idByCode = new Map(rows!.map((r) => [r.code, r.id]));
  const skus: Sku[] = rows!.map((r) => ({
    code: r.code,
    name: r.name,
    category: r.category,
    packMl: r.pack_ml,
    packLabel: r.pack_label,
    ratePerCase: r.rate_per_case,
    isActive: r.is_active,
  }));

  const unmatched: string[] = [];
  let loaded = 0;
  for (const { article, qty } of OPENING) {
    const res = resolveSku(article, skus);
    if (!res.sku || res.confidence === "none") {
      unmatched.push(`${article} (qty ${qty})`);
      continue;
    }
    const skuId = idByCode.get(res.sku.code);
    if (!skuId) {
      unmatched.push(`${article} → ${res.sku.code} (no id)`);
      continue;
    }
    const { error: upErr } = await supabase
      .from("stock_batches")
      .upsert(
        { sku_id: skuId, batch_no: BATCH, qty_on_hand: qty, expiry_date: null },
        { onConflict: "sku_id,batch_no" },
      );
    if (upErr) {
      unmatched.push(`${article} → upsert err: ${upErr.message}`);
      continue;
    }
    loaded++;
    console.log(`  ${article.padEnd(34)} → ${res.sku.code} ${res.sku.name.padEnd(28)} ${qty}  [${res.confidence}]`);
  }

  console.log(`\nLoaded ${loaded}/${OPENING.length} opening-stock batches (${OPENING.reduce((a, o) => a + o.qty, 0)} cases total).`);
  if (unmatched.length) {
    console.log(`\nUNMATCHED (${unmatched.length}) — need a manual SKU or alias:`);
    unmatched.forEach((u) => console.log("  •", u));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

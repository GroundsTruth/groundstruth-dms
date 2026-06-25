// Seeds the canonical SKUs into the `skus` table (idempotent upsert on `code`).
// Reads .env.local at runtime; never prints keys.
// Run FROM THE REPO ROOT: npx --yes tsx scripts/seed-skus.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SEED_SKUS } from "../src/lib/catalog/seed-data";

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

  const rows = SEED_SKUS.map((s) => ({
    code: s.code,
    name: s.name,
    category: s.category,
    pack_ml: s.packMl,
    pack_label: s.packLabel,
    rate_per_case: s.ratePerCase,
  }));

  const { data, error } = await supabase
    .from("skus")
    .upsert(rows, { onConflict: "code" })
    .select("code");

  if (error) {
    console.error("❌ Seed FAILED:", error.message);
    process.exit(1);
  }
  console.log(`✅ Upserted ${data?.length ?? 0} SKUs.`);

  const { count } = await supabase
    .from("skus")
    .select("*", { count: "exact", head: true });
  console.log(`Total rows in skus table: ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

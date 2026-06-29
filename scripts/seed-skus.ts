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

  // Pass 1 — core columns the seed is authoritative for. Safe to upsert for every
  // SKU on every run. We deliberately DON'T send tax/commercial columns here: a
  // heterogeneous upsert defaults any missing key to NULL, which would clobber
  // values captured elsewhere (e.g. a CA filling HSN/GST via /catalog). See pass 2.
  const coreRows = SEED_SKUS.map((s) => ({
    code: s.code,
    name: s.name,
    category: s.category,
    pack_ml: s.packMl,
    pack_label: s.packLabel,
    rate_per_case: s.ratePerCase,
  }));

  const { data, error } = await supabase
    .from("skus")
    .upsert(coreRows, { onConflict: "code" })
    .select("code");

  if (error) {
    console.error("❌ Seed FAILED:", error.message);
    process.exit(1);
  }
  console.log(`✅ Upserted ${data?.length ?? 0} SKUs (core columns).`);

  // Pass 2 — tax/commercial columns, ONLY for the SKUs whose seed entry actually
  // defines at least one (today: the water SKUs confirmed by the sample invoice).
  // An explicit per-row UPDATE of just the defined columns means a re-seed never
  // nulls tax values on rows the seed doesn't own (the null-overwrite footgun).
  const taxRows = SEED_SKUS.filter(
    (s) =>
      s.mrp != null ||
      s.hsn != null ||
      s.taxSlabPct != null ||
      s.cessPct != null ||
      s.unitsPerCase != null,
  );
  for (const s of taxRows) {
    const patch: Record<string, string | number> = {};
    if (s.mrp != null) patch.mrp = s.mrp;
    if (s.hsn != null) patch.hsn = s.hsn;
    if (s.taxSlabPct != null) patch.tax_slab_pct = s.taxSlabPct;
    if (s.cessPct != null) patch.cess_pct = s.cessPct;
    if (s.unitsPerCase != null) patch.units_per_case = s.unitsPerCase;
    const { error: taxErr } = await supabase.from("skus").update(patch).eq("code", s.code);
    if (taxErr) {
      console.error(`❌ Tax update FAILED for ${s.code}:`, taxErr.message);
      process.exit(1);
    }
  }
  console.log(`✅ Applied tax/commercial fields to ${taxRows.length} SKUs.`);

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

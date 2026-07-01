// ingest-catalogue.mjs — apply the client's confirmed Catalogue (Catalogue Cola.xlsx,
// exported to scratch_catalogue.json) to live skus: GST + HSN (by category, authoritative),
// MRP, units_per_case, cess=0; and seed base retail prices into price_list. Matches by
// normalized name. Run: node scripts/ingest-catalogue.mjs  (reads .env.local).
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(".env.local", "utf8").split("\n").filter(Boolean);
for (const l of env) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]; }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Client-confirmed per-category GST + HSN (updated Catalogue, 2026-07-01).
const CAT = {
  CSD:    { gst: 40, hsn: "22021010" },
  Energy: { gst: 40, hsn: "22021090" },
  Water:  { gst: 5,  hsn: "22011010" },
  Juice:  { gst: 5,  hsn: "22029920" },
  Soda:   { gst: 5,  hsn: "22011010" },
};
const norm = (x) =>
  String(x).toLowerCase().replace(/ltr|lt(?![a-z])/g, "l").replace(/[^a-z0-9]/g, "");

async function main() {
  const cat = JSON.parse(fs.readFileSync("scratch_catalogue.json", "utf8"));
  const { data: skus } = await s.from("skus").select("id,code,name,category");
  const byName = new Map(skus.map((r) => [norm(r.name), r]));

  let updated = 0, priced = 0;
  const unmatched = [];
  for (const r of cat) {
    const sku = byName.get(norm(r.name));
    if (!sku) { unmatched.push(r.name); continue; }
    const rule = CAT[r.category] ?? null;
    const gst = typeof r.gst === "number" && r.gst <= 100 ? r.gst : rule?.gst ?? null;
    const hsn = /^\d{8}$/.test(r.hsn || "") ? r.hsn : rule?.hsn ?? null;
    const patch = { cess_pct: 0 };
    if (gst != null) patch.tax_slab_pct = gst;
    if (hsn) patch.hsn = hsn;
    if (r.mrp != null && r.mrp > 0) patch.mrp = r.mrp;
    if (r.pack != null && r.pack > 0) patch.units_per_case = Math.round(r.pack);
    await s.from("skus").update(patch).eq("id", sku.id);
    updated++;
    if (r.retail != null && r.retail > 0) {
      // base retail price (only if no base rule exists yet)
      const { data: exists } = await s.from("price_list").select("id")
        .eq("sku_id", sku.id).is("retailer_id", null).is("route", null).eq("list_type", "retail").maybeSingle();
      if (!exists) {
        await s.from("price_list").insert({ sku_id: sku.id, price: r.retail, list_type: "retail", effective_from: "2026-07-01" });
        priced++;
      }
    }
  }
  console.log(`Updated ${updated} SKUs (gst/hsn/mrp/units). Seeded ${priced} base retail prices.`);
  if (unmatched.length) console.log("Unmatched catalogue rows:", unmatched.join(" · "));
  // sanity
  const { data: soda } = await s.from("skus").select("code,tax_slab_pct,hsn").eq("category", "Soda");
  const { data: gluco } = await s.from("skus").select("code,tax_slab_pct").ilike("name", "%Gluco%");
  console.log("Soda now:", JSON.stringify(soda), "| Gluco:", JSON.stringify(gluco));
}
main().catch((e) => { console.error(e); process.exit(1); });

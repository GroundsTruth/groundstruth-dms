// seed-demo.mjs — populate a DEMO end-to-end flow so the UI isn't empty.
// Run: `npm run seed:demo`. Writes to the DB pointed at by .env.local (service role).
// Produces: stock receive (3 SKUs) → retailer → order → confirmAndInvoice (GST invoice
// + FIFO deduct) → partial collection → van load-out. Safe to run repeatedly (each run
// adds a fresh order/invoice/load). NOT for production data — for demos/staging only.
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(".env.local", "utf8").split("\n").filter(Boolean);
for (const l of env) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]; }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const log = (...a) => console.log(...a);

async function main() {
  // 1. Pick 3 priced SKUs (base price_list rows).
  const { data: prices } = await s.from("price_list").select("sku_id,price").is("retailer_id", null).is("route", null).limit(3);
  if (!prices?.length) { log("No base prices — run seed_base_prices first."); return; }
  const { data: skus } = await s.from("skus").select("id,code,name").in("id", prices.map(p => p.sku_id));
  const priced = prices.map(p => ({ ...p, ...skus.find(x => x.id === p.sku_id) }));
  log("Priced SKUs:", priced.map(p => `${p.code} @${p.price}`).join(", "));

  // 2. Receive 100 of each (atomic RPC).
  for (const p of priced) {
    const { error } = await s.rpc("receive_stock", { p_sku_id: p.sku_id, p_batch_no: "DEMO-B1", p_qty: 100, p_mfg_date: "2026-06-01", p_expiry_date: "2026-12-31", p_actor: null });
    if (error) log("receive err", p.code, error.message); else log("Received 100", p.code);
  }

  // 3. Onboard a retailer (approved).
  const { data: ret } = await s.from("retailers").insert({ name: "Demo Kirana Store", shop_name: "Demo Store", route: "ROUTE-3", phone: "9876543210", approval_status: "approved", is_active: true }).select("id").single();
  log("Retailer:", ret?.id);

  // 4. Punch an order (draft) with 2 lines, then confirm+invoice (atomic).
  const orderNo = "ORDDEMO" + Date.now().toString().slice(-4);
  const subtotal = priced.slice(0, 2).reduce((a, p) => a + 10 * Number(p.price), 0);
  const { data: order } = await s.from("orders").insert({ order_no: orderNo, retailer_id: ret?.id, route: "ROUTE-3", status: "draft", subtotal, tax_total: 0, total: subtotal }).select("id").single();
  for (const p of priced.slice(0, 2)) {
    await s.from("order_lines").insert({ order_id: order.id, sku_id: p.sku_id, qty: 10, unit_price: p.price, line_total: 10 * Number(p.price) });
  }
  log("Order:", orderNo);
  const { data: invId, error: invErr } = await s.rpc("confirm_and_invoice", { p_order_id: order.id, p_actor: null });
  if (invErr) log("invoice err", invErr.message); else log("Invoiced → invoice id", invId);

  // 5. Record a partial collection against the invoice.
  if (invId) {
    const { data: inv } = await s.from("invoices").select("total").eq("id", invId).single();
    await s.from("collections").insert({ invoice_id: invId, retailer_id: ret?.id, amount: Math.round(Number(inv.total) * 0.6), mode: "cash", reference: "DEMO-CASH" });
    log("Collected 60% of", inv.total);
  }

  // 6. Load a van (atomic FIFO van_out).
  const loadNo = "VLDEMO" + Date.now().toString().slice(-4);
  const { data: vlId, error: vlErr } = await s.rpc("load_van", { p_load_no: loadNo, p_vehicle: "MH-04-DEMO", p_driver: null, p_route: "ROUTE-3", p_load_date: null, p_lines: priced.map(p => ({ sku_id: p.sku_id, qty: 20 })), p_actor: null });
  if (vlErr) log("load err", vlErr.message); else log("Van loaded:", loadNo);

  // 7. Final counts.
  for (const t of ["stock_batches", "orders", "invoices", "van_loads", "retailers", "collections"]) {
    const { count } = await s.from(t).select("*", { count: "exact", head: true });
    log(t.padEnd(16), count, "rows");
  }
  log("\nDONE — refresh /inventory /orders /invoices /vans /retailers");
}
main().catch(e => { console.error(e); process.exit(1); });

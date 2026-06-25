// One-off connectivity check. Reads .env.local at runtime; prints status only,
// never the keys. Run: node scripts/check-supabase.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL                :", url);
console.log("anon key length    :", anonKey?.length ?? 0);
console.log("service key length :", serviceKey?.length ?? 0);

try {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) console.log("RESULT             : reached Supabase, API said:", error.message);
  else console.log("RESULT             : ✅ CONNECTION OK — users in project:", data.users.length);
} catch (e) {
  console.log("RESULT             : ❌ NETWORK/DNS ERROR ->", e.message, e.cause?.code ?? "");
  console.log("(if this is a DNS/timeout error, your local ISP is blocking *.supabase.co — fixable with alt-DNS/VPN for local dev; production on Vercel is unaffected)");
}

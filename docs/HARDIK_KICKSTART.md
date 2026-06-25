# Hardik — kickstart for your Claude Code agent

Paste this whole file as your agent's first message (or point it at this path).

## What this is
GroundsTruth is building a **Campa Cola distribution-management system (DMS)** for an
OOH/beverage distributor. **Web app only** for Phase 1 (no native, no offline — offline
is a later paid add-on). Phase-1 MVP target ~4 weeks. You (Hardik, senior dev) own the
**transactional spine**; Aman owns UI Kit / SKU Catalog / Owner Dashboard + shared
foundation. Two devs + two Claude agents in parallel — folders are ownership, PRs are
the seam.

## Read first, in order
1. `CLAUDE.md` — coordination + non-negotiable build rules (BookMyMedia learnings).
2. `AGENTS.md` — the hard build rules (source of truth).
3. `docs/COORDINATION.md` — folder ownership, branch/PR flow, migration rules.
4. `docs/STATUS.md` — live checklist + current state.
5. `docs/WORKLOG.md` — latest session + who's on what (read at every session start).
6. `docs/handoffs/2026-06-25-aman.md` — what's shipped so far.
7. `docs/MIGRATIONS.md` — migration log + naming convention.
8. `dev/11_Delivery_Tracker.xlsx` (now committed to the repo) — module sequencing; Owner column = the split.
9. `artefacts/` · `client/` · `wireframes/` — briefs, proposals, requirements, UI wireframes (build reference, in the repo). NOTE: signed MSA/NDA, client financials, and driver PII are **not** in git — get those from Aman's Drive.

## Stack (proven — do not swap)
Next.js 15 (App Router, `src/`) · React 19 · TypeScript · Tailwind v3 · shadcn/ui
(new-york) · Supabase (Postgres/Auth/Storage/RLS) · Vercel · npm · vitest.

## What's already live
- **Repo** `GroundsTruth/groundstruth-dms` (private), branches `main` (prod) + `dev`.
- **Vercel** connected (GroundsTruth account): every push auto-deploys, PRs get a preview URL.
- **Supabase** in **Mumbai (`ap-south-1`)**: Data API on, **auto-expose-new-tables OFF**, **auto-RLS on**.
- **Built:** foundation/scaffold, UI Kit base (`/kit`), **SKU Catalog on Supabase**
  (`skus`, migration `0001`, 46 seeded, live at `/catalog`), Owner Dashboard from seed
  (`/dashboard`). `npm run build` green, 10 vitest tests pass.
- **Server client** `src/lib/supabase/admin.ts` (service role, server-only) — reuse it.

## YOUR lane — the transactional spine (Phase 1)
- **M01–M03** platform: core-table migrations · audit-log hook (every mutation) · config (tax slabs, invoice series).
- **M11–M15** inventory: stock model (batch + expiry) · inward · **FIFO deduction** · low-stock alert.
- **M18–M23** sales: price list · order punch · **invoice-number service (server-side)** · invoice gen (tax) · **`confirmAndInvoice()` = atomic invoice + stock deduct**.
- **M24–M28** van: load-out · delivery challan · return capture · **reconciliation (out − sold − returned)**.
- **M29** collection: cash/UPI against invoice.
- **M05–M09 Auth & RBAC = SHARED** — build **with Aman** (one OTP/JWT/RBAC foundation, not two).

The tracker's Owner column reflects this. Aman owns M04 (UI states), M10 (Catalog), M30/M31 (Dashboard).

## Hard rules you MUST follow
1. **All Supabase access is server-side** (`@supabase/ssr` server client / Route Handlers /
   Server Actions). The browser must **never** hit `*.supabase.co` — Indian ISPs DNS-block
   it, so a field app would just fail to load. No browser Realtime. Storage served via a proxy route.
2. **No Supabase nested joins** (`.select("*, rel(*)")`) — they fail silently in prod.
   Separate queries + merge in JS.
3. **Normalize at ingestion.** The WhatsApp sales feed's `article_name` / `route_id` do NOT
   match the masters — resolve to canonical ids (see `src/lib/catalog/resolve.ts` for the
   SKU resolver pattern). Never exact-match across that boundary; flag, don't guess.
4. **Check `.error` on every Supabase call.** Side-effects (audit/notify) in try/catch,
   never block the response.
5. **Every table migration GRANTs explicitly** (auto-expose is OFF):
   ```sql
   grant all privileges on table public.<t> to service_role;   -- our server
   grant select on table public.<t> to authenticated;          -- + insert/update where that role legitimately writes
   ```
   Without it you get "permission denied" even with the service-role key. RLS on top (auto-RLS
   enables RLS — add policies).
6. **The money path is atomic.** Invoice number + invoice + stock deduct in ONE transaction
   (Postgres function / RPC), so a failure can't half-write. This is the anti-leakage core.

## How to start
1. `git clone https://github.com/GroundsTruth/groundstruth-dms.git && cd groundstruth-dms`
2. `npm install`
3. Create `.env.local` — get the 3 Supabase values from Aman / the shared vault (never commit; it's git-ignored):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. `node scripts/check-supabase.mjs` → expect "✅ CONNECTION OK".
5. `npm run dev` (open `/`, `/catalog`, `/dashboard`, `/kit`) · `npm run build` · `npm test` → all green.
6. **Migrations:** write `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql` (timestamped),
   apply via the Supabase **SQL Editor**, log one line in `docs/MIGRATIONS.md`. Always
   include RLS + the grants (rule 5).
7. **Scripts run under `tsx`** (compiled to CommonJS): no top-level `await` (wrap in `main()`);
   `@/*` aliases may not resolve — use relative imports; load `.env.local` manually; never
   print keys. (See `scripts/seed-skus.ts` for the pattern.)
8. **Workflow:** branch `feat/<module>` off `dev` → PR into `dev` → review the **Vercel
   preview** → merge. Never commit directly to `dev` / `main`.

## Coordinate with Aman on
- **Auth/RBAC (M05–M09)** — shared; agree the schema + who builds what before starting.
- **Core/shared schema** (`supabase/migrations/**` core tables, `src/lib/supabase/**`,
  `src/lib/database.types.ts`) — PR-review each other.
- **Your first move:** propose the **ER schema** for the spine (orders, order_lines,
  invoices, invoice_lines, stock/batches, van_loads, returns, collections) in `docs/SCHEMA.md`
  for Aman to review — everything downstream joins on it.

## Blockers (waiting on client / CA — flag, don't guess)
- Invoice/challan format + CA sign-off (P10) and per-feature acceptance criteria (P11).
- The 3 open questions: invoicing model · **retailers-vs-route** (the feed is route-centric,
  not retailer-centric) · batch/expiry handling.
- SKU tax fields (MRP / HSN / tax-slab / cess / units-per-case) — pending client/CA.

## Suggested first week
Auth foundation (with Aman) → core schema in `docs/SCHEMA.md` + M01 migrations →
inventory model + FIFO (M11–M15) → atomic invoice path (M18–M23). Build the anti-leakage
core (reconciliation) early — that's the product's whole reason to exist.

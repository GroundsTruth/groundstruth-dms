# Campa DMS — for Claude Code agents (Aman's & Hardik's)

**Read order:** this file → `AGENTS.md` (hard build rules — non-negotiable) →
`docs/COORDINATION.md` (who owns what, branch/PR flow) → `docs/STATUS.md`
(current state + checklist).

`AGENTS.md` is the source of truth for build rules. This file only adds the
cross-team coordination and a few hard-won learnings from **BookMyMedia** (the
live production OOH platform we reuse patterns and components from).

---

## Non-negotiable additions to AGENTS.md (BookMyMedia learnings)

1. **All Supabase access goes through the Next.js server** — `@supabase/ssr`
   server client in Route Handlers / Server Components / Server Actions. The
   browser must **never** call `*.supabase.co` directly: Indian ISPs (Jio/Airtel)
   DNS-block that host, so a field driver's app would simply fail to load. RLS
   still enforces (the server client carries the user's session). Project is in
   the **Mumbai (`ap-south-1`)** region.
   - User-facing **images/PDFs in Supabase Storage** are served via a small
     Next.js proxy route, never via direct storage URLs (same ISP reason).
   - **No browser-side Realtime** (WebSockets are blocked too). MVP doesn't need it.

2. **Never use Supabase nested joins** (`.select("*, relation(*)")`) — they fail
   silently in production. Always do separate queries + merge in JS.

3. **Normalize at ingestion.** The WhatsApp sales feed's `article_name` / `route_id`
   do **not** match the SKU master ("Water 750 ml" vs "Water - 750 ML",
   "Route 3" vs "ROUTE-3"). Resolve to a **canonical SKU id** via an alias map —
   never exact-string-match across that boundary. (Lives in the Catalog module.)

4. **Check `.error` on every Supabase call**; return 500 on main-flow errors.
   Side-effects (audit, notifications) wrap in try/catch and never block the
   response.

5. **Every table migration GRANTs explicitly.** This project has Supabase's
   "Automatically expose new tables" turned **OFF** (deliberate — nothing is
   exposed by accident). So every `create table` migration MUST also
   `grant ... to service_role` (our server) + grant the read role
   (`authenticated`; never `anon` unless truly public). Without the grant, even
   the service-role key gets "permission denied". RLS applies on top (auto-RLS
   enables it — add policies).

---

## Supabase: migrations & seeding (current workflow)

- **Apply migrations** via the Supabase **SQL Editor** (paste
  `supabase/migrations/NNNN_*.sql`, Run). Files are version-controlled; we apply
  manually for now (CLI `db push` can come later via `supabase link`).
- **Server client:** `src/lib/supabase/admin.ts` (service role, bypasses RLS,
  server-only) is live. The user-session client + session middleware land with Auth.
- **Scripts run under `tsx`** (compiled to CommonJS), which means: (a) no top-level
  `await` — wrap logic in an async `main()`; (b) tsconfig `@/*` path aliases may
  not resolve — use **relative** imports. Keep seed data in a **pure module**
  (`src/lib/catalog/seed-data.ts` — no `@/`, no Supabase imports) so scripts import
  it cleanly. Load `.env.local` manually in scripts (Node doesn't auto-load it);
  **never print keys**.
- **Data accessors** (e.g. `getSkus()`) read via the admin client and **fall back
  to the seed** on error/empty so pages always render. Pages reading live data set
  `export const dynamic = "force-dynamic"`.

---

## Decisions log

- **Tremor → shadcn charts (recharts).** `@tremor/react@3` peer-requires React 18;
  we're on React 19. The Owner Dashboard uses shadcn's recharts-based charts.
  _(Pending Hardik ack — alternative is to pin React 18.)_
- **Stack confirmed:** Next.js 15 · React 19 · TypeScript · Tailwind v3 ·
  shadcn/ui (new-york) · Supabase · Vercel · npm.
- **Recurring cost target:** Supabase Pro + Vercel Pro ≈ ₹3,800/mo at production;
  ~₹0 during build/pilot (free tiers). We evaluated Neon/Firebase/AWS/self-host —
  Supabase wins on fit + ease for this app (see the cost analysis in the handoff).
- **Supabase live (2026-06-25).** Project `lmhhxjtvsbjgjdvcifso`, Mumbai
  (`ap-south-1`); Data API on, auto-expose-new-tables OFF, auto-RLS on. First table
  `skus` (migration `0001`) seeded with the 46 canonical SKUs; `/catalog` reads it
  live. Keys in `.env.local` only — **TODO: add the 3 vars to Vercel** for the
  deployed app.

See `docs/COORDINATION.md` for ownership + workflow, `docs/STATUS.md` for state.

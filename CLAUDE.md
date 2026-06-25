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
   still enforces (the server client carries the user's session). Provision the
   Supabase project in the **Mumbai (`ap-south-1`) region**.
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

See `docs/COORDINATION.md` for ownership + workflow, `docs/STATUS.md` for state.

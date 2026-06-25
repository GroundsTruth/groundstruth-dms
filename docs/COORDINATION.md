# Coordination — GroundsTruth DMS (Aman ⇄ Hardik)

Two people + two Claude Code agents building in parallel. This doc is how we
avoid colliding.

## Who owns what — folders are ownership; don't edit the other person's folders

| Area | Owner | Paths |
|------|-------|-------|
| Foundation / scaffold / shared config | Aman (now) | `tailwind.config.ts`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json`, `src/app/layout.tsx` |
| UI Kit — design system, app shell, primitives | Aman | `src/components/ui/**`, `src/components/layout/**`, `src/components/kit/**`, `src/app/(app)/kit/**`, `src/app/globals.css`, `src/lib/nav.ts`, `src/lib/utils.ts` |
| SKU / Product Catalog + canonical resolver | Aman | `src/app/(app)/catalog/**`, `src/components/catalog/**`, `src/lib/catalog/**`, migration(s) for `skus` |
| Owner / Executive Dashboard (read-only) | Aman | `src/app/(app)/dashboard/**`, `src/lib/dashboard/**` |
| **Transactional spine** — atomic invoice, FIFO deduct, van load + reconciliation | **Hardik** | `src/app/(app)/{inventory,vans,invoices,collections}/**`, `src/lib/{inventory,sales,van,recon}/**`, the RPCs / Edge Functions, migrations for those tables |
| Auth / RBAC / core schema | **shared — coordinate** | `src/lib/supabase/**`, `supabase/migrations/**` core tables |

**Shared seams — change only by agreement (PR-review the other person):**
`supabase/migrations/**` core tables · `src/lib/database.types.ts` ·
`src/lib/supabase/**` · `docs/SCHEMA.md` · `docs/API_CONTRACT.md` · this file ·
`tailwind.config.ts` · the token block in `src/app/globals.css`.

## Branch / PR / preview flow
- `feat/*` per module → PR into `dev` → `dev` into `main` (prod). **Never** commit
  directly to `dev` / `main`.
- Small PRs, rebased on `dev` before opening.
- Every PR gets a **Vercel preview URL** — we review there before merge. This is
  our standard QA gate.
- _(Default branch is currently `master`; rename to `main` to match the README, or
  treat `master` as `main`.)_

## Migrations — timestamped, so we never collide
- Supabase native timestamped files: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`.
  Two people can't grab the same number (unlike sequential integers).
- Each module migrates only the tables it owns. Core/shared tables (users, roles,
  auth, config, audit_log) are coordinated.
- Log every migration one-line in `docs/MIGRATIONS.md` so the other agent sees it.

## Session handoff — do this at the end of every working session
1. Update `docs/STATUS.md` (tick done, note next).
2. Add `docs/handoffs/YYYY-MM-DD-<who>.md`: what changed, decisions, anything the
   other agent needs, what's next.
3. Commit. Open / refresh the PR so the Vercel preview rebuilds.

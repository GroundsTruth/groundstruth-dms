# Work Log — GroundsTruth DMS

One running log so **both agents always know the latest state + what to pick up next**,
without passing kickstart prompts back and forth.

- **Session start:** read the top log entry + the "In flight" table + `docs/STATUS.md`, then `git switch <your branch>`.
- **Session end:** add a dated entry at the TOP (newest first) and update "In flight".
- **One source of truth:** the build-reference material (tracker, wireframes, briefs,
  proposals, requirements, seed) lives in this private repo under `dev/`, `wireframes/`,
  `client/`, `artefacts/`. The **signed MSA/NDA, client financials, and driver PII are
  NOT in git** — get those from Aman's private Drive. ⚠️ Repo stays **private**.

## 🚧 In flight — claim before you start (this is how we avoid collisions)
| Who | Branch | Module / task | Lane folders | Since |
|-----|--------|---------------|--------------|-------|
| Aman | `feat/ui-kit-states` | UI Kit states + forms (M04) **+** Catalog add/edit (M10) | `src/components/kit/` · `src/components/catalog/` · `src/lib/catalog/` · `src/components/ui/input.tsx` · `/kit` · `/catalog` | 2026-06-25 |
| Hardik | — | (nothing active) | transactional spine · (auth = shared) | — |

**Rules that keep us conflict-free:**
- Edit only the folders your lane owns (`COORDINATION.md`). No overlap → no conflicts.
- Shared seams (`supabase/migrations/**` core tables, `src/lib/supabase/**`,
  `src/lib/database.types.ts`, `tailwind.config.ts`, the `globals.css` token block, docs)
  change **only by a PR the other reviews**.
- Migrations use **timestamped** filenames (`docs/MIGRATIONS.md`) — never collide.
- Always branch `feat/<module>` off `dev`; PR into `dev`; never commit to `dev`/`main`.

---

## Log (newest first)

### 2026-06-25 · Aman + Claude · Aman's lane — UI Kit states + Catalog CRUD (`feat/ui-kit-states`, one PR)
- **UI Kit:** `EmptyState`, `ErrorState` (error + retryable offline), `LoadingState` + `Spinner`,
  `FormField` + `FormActions`. `Input` shows a red border on `aria-invalid`. Demoed on `/kit`.
- **Catalog add/edit (M10):** server actions `createSku` / `updateSku` (`src/lib/catalog/actions.ts`
  — service-role, auto-assigns the next `SKUNNN`, revalidates `/catalog`) + `SkuFormSheet`
  (slide-over reusing `FormField`) + per-row Edit + a real "Add SKU" on `/catalog`. Reads still
  fall back to the seed. `TODO(auth)`: gate the actions to owner/warehouse once M05–M09 land.
- One consolidated PR by choice (Hardik reviews the lane in one pass). Independent of Hardik;
  only shared seam touched = `src/components/ui/input.tsx` (additive).

### 2026-06-25 · Aman + Claude · handover prep · Supabase + Catalog · repo as shared source
- `feat/supabase-catalog` → merged to `dev` + `main`.
- **Supabase live** (Mumbai); `skus` table (migration `0001`) + 46 seeded; **Catalog reads
  live** at `/catalog`; server admin client (`src/lib/supabase/admin.ts`).
- Docs added/refreshed: STATUS · CLAUDE (grant rule + Supabase workflow) · COORDINATION ·
  MIGRATIONS · SCHEMA (ER template) · 2026-06-25 handoff · HARDIK_KICKSTART · README · this WORKLOG.
- **Build-reference committed** to the private repo (tracker, wireframes, briefs,
  proposals, requirements, seed). Signed MSA/NDA + client financials + driver PII stay
  in the private Drive (not git).
- Delivery Tracker updated: P-statuses + Aman/Hardik owner split.
- **Next:** Auth/RBAC (M05–M09, shared) — agree the approach before either starts.

### 2026-06-24 · Aman + Claude · foundation + 3 modules
- Scaffold (Next 15 + Tailwind v3 + shadcn). UI Kit base (`/kit`). SKU Catalog + canonical
  resolver (`/catalog`, 10 tests). Owner Dashboard from seed (`/dashboard`).
- Repo secured: clean history, **private** `GroundsTruth/groundstruth-dms`, Vercel connected.

---

## Hardik — start here (one time)
1. Read `docs/HARDIK_KICKSTART.md`, then the read-order it lists.
2. Get the 3 Supabase keys from Aman (vault) → `.env.local`; `node scripts/check-supabase.mjs` → "CONNECTION OK".
3. Claim your first module in **In flight** above.
4. First task: propose the ER schema in `docs/SCHEMA.md` (PR for Aman to review).
5. Delete the old **public** `hardik-goel/groundstruth-dms` (last external exposure).

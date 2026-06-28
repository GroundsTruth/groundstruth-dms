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
| Aman | `feat/ui-kit-states` | UI Kit — states, forms, ConfirmDialog (M04) **+** Catalog add/edit/deactivate (M10) | `src/components/kit/` · `src/components/ui/{input,dialog}.tsx` · `src/components/catalog/` · `src/lib/catalog/` · `/kit` · `/catalog` | 2026-06-25 |
| Hardik | `feat/inventory-receive` | M11/M12 — receive stock (atomic RPC) + stock view + `/inventory` | `src/lib/inventory/**` · `src/app/(app)/inventory/**` · `src/components/inventory/**` · new migration | 2026-06-28 |

**Rules that keep us conflict-free:**
- Edit only the folders your lane owns (`COORDINATION.md`). No overlap → no conflicts.
- Shared seams (`supabase/migrations/**` core tables, `src/lib/supabase/**`,
  `src/lib/database.types.ts`, `tailwind.config.ts`, the `globals.css` token block, docs)
  change **only by a PR the other reviews**.
- Migrations use **timestamped** filenames (`docs/MIGRATIONS.md`) — never collide.
- Always branch `feat/<module>` off `dev`; PR into `dev`; never commit to `dev`/`main`.

---

## Log (newest first)

### 2026-06-28 · Hardik + Claude · inventory — receive stock (atomic) + stock view + `/inventory` (M11/M12) (`feat/inventory-receive`)
- **Atomic receive:** `receive_stock()` RPC (`20260628082112_receive_stock_fn.sql`) — batch
  upsert + inward `stock_movements` in ONE txn; `execute` to `service_role` only. Sets the
  txn pattern for FIFO deduct (M13) + confirmAndInvoice (M22).
- **`src/lib/inventory/`:** pure `logic` (validateReceive/lowStockFlag/sumOnHand, 10 tests) +
  `receiveStock()` (rpc + non-blocking `logAudit`) + `getStockBySku`/`getBatches`/`getSkuOptions`
  (separate queries + JS merge — no nested joins) + `receiveStockAction` server action.
- **`/inventory` page** (dynamic): KPIs + receive form (reuses kit FormField/Input/Button) +
  by-SKU table (low-stock `StatusBadge`) + batches table. Reuses Aman's kit, none of his files edited.
- **32 tests green**, typecheck + build clean (`/inventory` = ƒ dynamic).
- ⏳ **receive_stock RPC NOT applied yet** — run `20260628082112_*.sql` in SQL Editor, then date MIGRATIONS.
- ⚠️ **Nav link pending** — `/inventory` needs adding to `src/lib/nav.ts` (Aman's lane); flagged for him.
- **Next (me):** M13 FIFO deduct (reuses this RPC pattern) or M14 low-stock dashboard wiring.

### 2026-06-28 · Hardik + Claude · platform — AuditService (M02) + config layer (M03) (`feat/audit-config`)
- **M02 audit:** `src/lib/audit/` — pure `buildAuditRow` (camel→snake, normalize, validate;
  5 tests) + `logAudit()` side-effect writer to `audit_log` (try/catch, **never throws/blocks**,
  CLAUDE.md rule 4). Call after the primary mutation.
- **M03 config:** `src/lib/config/` — pure `CONFIG_DEFAULTS` + `getDefault`/`coerceConfigValue`
  (7 tests) + `getConfig`/`getAllConfig` accessors (DB read, default fallback — `getSkus` pattern)
  + `20260628080405_config_seed.sql` (5 default rows, `on conflict do nothing`). `tax_slabs` empty (CA-gated).
- **22 tests green** (10 catalog + 12 new), typecheck + `next build` clean. PR open → `dev`.
- ⏳ **config_seed NOT applied yet** — run `20260628080405_config_seed.sql` in SQL Editor, then date MIGRATIONS.
- **Next (me):** inventory M11 (stock receive) → M12 (stock view). Auth M05–M09 = sync with Aman first.

### 2026-06-28 · Hardik + Claude · transactional spine — P13 ER schema + M01 core migrations (`feat/core-schema`)
- **Merge hygiene:** `feat/ui-kit-states` → `dev` (PR #1). `feat/supabase-catalog` stale
  (already in `dev`) — delete it. Cut `feat/core-schema` off updated `dev`.
- **P13/M01 schema:** filled `docs/SCHEMA.md` (template → real ER) + **six timestamped
  migrations** (`20260628070450`–`455`): `users/config/audit_log`,
  `stock_batches/stock_movements`, `retailers`, `price_list/orders/order_lines/invoices/invoice_lines`,
  `van_loads/van_load_lines/reconciliations`, `collections`. **15 tables**, all on the
  `skus`/0001 pattern (RLS + read policy + server-only writes + grants + trigger).
- **Tables + constraints only** — FIFO/`confirmAndInvoice()`/`reconcile()`/AuditService
  deferred to their module branches. Auth M05–M09 = only `users` table created here.
- 4 decisions flagged for Aman: role-as-enum (no `roles` table), returns-as-column,
  added `stock_movements` ledger, server-only writes. See `docs/handoffs/2026-06-28-hardik.md`.
- **Applied to Supabase 2026-06-28** — all 6 run via SQL Editor; 16 tables live (verified).
  `docs/MIGRATIONS.md` dated. PR #2 merged → `dev`.
- Added `docs/MODULE_OWNERSHIP.md` (status table). Hardened `.gitignore` (`*env.local`, `/*.txt`).
- **Now (me):** `feat/audit-config` — M02 audit hook + M03 config. Then inventory M11–M12.

### 2026-06-25 · Aman + Claude · Aman's lane — UI Kit + Catalog CRUD (`feat/ui-kit-states`, one PR)
- **UI Kit:** `EmptyState`, `ErrorState` (error + retryable offline), `LoadingState` + `Spinner`,
  `FormField` + `FormActions`, and `ConfirmDialog` + `useConfirm()` (on a new `ui/dialog.tsx`
  primitive). `Input` shows a red border on `aria-invalid`. All demoed on `/kit`.
- **Catalog (M10):** server actions `createSku` / `updateSku` / `setSkuActive`
  (`src/lib/catalog/actions.ts` — service-role, auto-assigns next `SKUNNN`, revalidates) +
  `SkuFormSheet` (slide-over reusing `FormField`) + per-row Edit + Add SKU + soft
  deactivate/reactivate (confirmed via `useConfirm`) + a Show-inactive toggle on `/catalog`.
  Reads fall back to the seed. `TODO(auth)`: gate the actions to owner/warehouse once M05–M09 land.
- One consolidated PR by choice (Hardik reviews the lane in one pass). Independent of Hardik;
  shared seams touched = `src/components/ui/input.tsx` + new `src/components/ui/dialog.tsx` (additive).

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

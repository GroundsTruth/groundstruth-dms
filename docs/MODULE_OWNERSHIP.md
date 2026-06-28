# Module Ownership & Status — GroundsTruth DMS

Source of sequencing: `dev/11_Delivery_Tracker.xlsx` (tabs Pre-Build + MVP Phase 1).
This is the clarity mirror for **who builds what**. Status legend: **TODO** ·
**INPROGRESS** · **DONE** · **BLOCKED** (on client). Update at session end.

_Last updated: 2026-06-28 (Hardik). **Hardik's lane is built + merged** (M01–M29, M16/M17,
M05–M07 backend). Remaining items are **Aman's UI** (login, dashboard tiles, user mgmt, nav)
or **client-gated** (invoice format, GST values, M25 challan) — see `docs/MISSING_INPUTS.md`._

## What Aman has already built (one line)
Foundation scaffold (Next 15 + Tailwind v3 + shadcn) + **UI Kit / design system**,
**SKU Catalog** (46 canonical SKUs, `resolveSku` resolver, Supabase-persisted, CRUD +
empty/loading/error/offline states), and a read-only **Owner Dashboard** from seed.

---

## Pre-Build (foundation)
| ID | Module | Owner | Status | Depends on | Notes |
|----|--------|-------|--------|-----------|-------|
| P15 | Repo + branch strategy | Both | INPROGRESS | P05 | Private repo + `feat/*→dev→main` live |
| P16 | Envs / DB / secrets | Both | INPROGRESS | P15 | Supabase Mumbai live; ⬜ add 3 vars to Vercel |
| P17 | Scaffold app | Both | **DONE** | P16 | Next15+Tailwind+shadcn, build green |
| P18 | Design system / UI kit | **Aman** | INPROGRESS | P09 | base shipped; states on `feat/ui-kit-states` |
| P13 | ER schema + migration plan | **Hardik** | TODO | P12 | **Hardik's first task** → `docs/SCHEMA.md` |
| P14 | API contract | Both | TODO | P12 | |
| P10 | CA sign-off invoice/challan | Aman | BLOCKED | P07 | client-gated |
| P11 | Acceptance criteria | Both | BLOCKED | P06 | client-gated |

## MVP Phase 1

### Aman's lane — UI / Catalog / Dashboard
| ID | Module | Status | Depends on | Notes |
|----|--------|--------|-----------|-------|
| M04 | Error/empty/no-network UI states + idempotency | INPROGRESS | P17 | on `feat/ui-kit-states` (pending PR→dev) |
| M10 | SKU master CRUD + import | INPROGRESS | M03 | live + CRUD done; MRP/HSN/tax/cess pending (client/CA) |
| M30 | Owner dashboard | INPROGRESS | M29,M27,M14 | read-only from seed; live aggregates pending |
| M31 | Daily sales view | INPROGRESS | M30 | from seed; wire to live later |

### Hardik's lane — transactional spine (anti-leakage core)
| ID | Module | Status | Depends on | Notes |
|----|--------|--------|-----------|-------|
| M01 | Core DB migrations (16 tables) + ER schema (P13) | **DONE** | P13,P17 | merged PR #2; applied to Supabase 2026-06-28 |
| M02 | Audit logging hook (`logAudit` → audit_log) | **DONE** | M01 | merged PR #3 |
| M03 | Config layer (`getConfig` + defaults + seed) | **DONE** | M01 | merged PR #3; 5 rows seeded |
| M11 | Stock model: batch + expiry, qty>=0 | **DONE** | M10 | table in M01; receive RPC PR #4 |
| M12 | Inward stock (receive RPC) + stock view + `/inventory` | **DONE** | M11 | merged PR #4; atomic `receive_stock()` |
| M13 | FIFO deduction service (atomic RPC) | **DONE** | M11,M02 | merged PR #5; `deduct_stock()`, oldest-expiry |
| M14 | Low-stock accessor (`getLowStockSkus`) | **DONE** | M12,M03 | merged; dashboard tile = Aman (M30) |
| M15 | Acceptance: receive→deduct→balance & audited | **DONE** | M13 | merged; pure acceptance test |
| M18 | Price-list rule (SKU × retailer/region) | **DONE** | M10,M16 | merged; `resolvePrice`/`priceFor`/`setPrice` |
| M19 | Order punch UI + order/order_lines model | **DONE** | M18 | merged; `/orders` punch + `createOrder`, base prices seeded |
| M20 | Invoice number service (server-side series) | **DONE** | M03 | merged; atomic `next_invoice_no()` |
| M21 | Invoice generation (tax compute) + view | **DONE** (provisional) | M20 | merged; provisional GST engine + `/invoices/[id]`. **Final PDF/format = client-gated** (MISSING_INPUTS #1–#3) |
| M22 | confirmAndInvoice(): invoice + stock deduct in ONE txn | **DONE** | M21,M13 | merged; atomic RPC (reuses next_invoice_no + deduct_stock) |
| M23 | Acceptance: order→invoice→auto-deduct | **DONE** | M22 | merged; money-path acceptance test |
| M24 | Van load-out (qty_out) + load sheet | **DONE** | M11 | merged; atomic `load_van()` + `/vans` |
| M25 | Delivery challan PDF | 🔒 **BLOCKED** | M24,P10 | needs invoice/challan **format** (client, MISSING_INPUTS #1) |
| M26 | Return-stock capture | **DONE** | M24 | merged; atomic `record_returns()` + `/vans/[id]` |
| M27 | Reconciliation: out − sold − returned variance flag | **DONE** | M26,M22 | merged; `reconcileVanLoad` + panel |
| M28 | Acceptance: variance beyond tolerance flags + audit | **DONE** | M27 | merged; reconcile acceptance test |
| M29 | Record cash/UPI against invoice | **DONE** | M22 | merged; `recordCollection` + Payments panel |

### Shared — coordinate (PR-review the other)
| ID | Module | Owner | Status | Depends on | Notes |
|----|--------|-------|--------|-----------|-------|
| M05 | OTP request + verify (SMS) | Both | **Hardik DONE (backend)** · ⬜ Aman UI | M01,P05 | merged `requestOtp`/`verifyOtp`; **Aman: `/login` screen**; SMS provider gated (#12) |
| M06 | JWT + role claim + refresh | Both | **Hardik DONE** | M05 | merged: SSR session client + middleware refresh + `getSessionUser` |
| M07 | RBAC middleware + permission map | Both | **Hardik DONE** · ⬜ Aman confirm matrix | M06 | merged: `rbac.ts` + middleware gate (dormant via `AUTH_ENABLED`); Aman confirms role→screen matrix |
| M08 | User CRUD + role assignment | Both | ⬜ **Aman UI** + Hardik actions | M07 | needs Aman screen + staff list (#11) |
| M09 | Acceptance: role-gated screens | Both | ⬜ joint | M08 | after matrix confirmed + `AUTH_ENABLED` flipped |
| M16 | Retailer CRUD + import | Both → **Hardik** | **DONE** | M01 | merged; CRUD + `/retailers` |
| M17 | Field onboarding form + approval | Both → **Hardik** | **DONE** | M16 | merged; onboard form + pending→approved rule |

### Phase-1 hardening (Both)
M32 critical-path tests · M33 QA pass · M34 backups/monitoring · M35 pilot · M36 go-live — all TODO.

---

## Branch state (2026-06-27)
- `main` == `dev` (identical).
- `feat/supabase-catalog` — **stale**: behind dev, 0 commits ahead (already merged to main). → **delete**.
- `feat/ui-kit-states` — **3 commits ahead** of dev, 0 behind → clean fast-forward. → **PR into dev**.

## PR / merge order
1. **PR #1** `feat/ui-kit-states → dev` (Aman's M04 states + M10 CRUD). Review on Vercel preview, merge.
2. `dev → main` once preview is green (keeps prod in sync).
3. Delete stale `feat/supabase-catalog`.
4. Hardik branches `feat/core-schema` off **dev** → P13 (`docs/SCHEMA.md`) then M01 core migrations → PR into dev.

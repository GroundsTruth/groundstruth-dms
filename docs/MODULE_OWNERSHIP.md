# Module Ownership & Status — GroundsTruth DMS

Source of sequencing: `dev/11_Delivery_Tracker.xlsx` (tabs Pre-Build + MVP Phase 1).
This is the clarity mirror for **who builds what**. Status legend: **TODO** ·
**INPROGRESS** · **DONE** · **BLOCKED** (on client). Update at session end.

_Last updated: 2026-06-27 (Hardik)._

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
| M14 | Low-stock accessor (`getLowStockSkus`) | **INPROGRESS** | M12,M03 | code on `feat/inventory-alerts`; dashboard tile = Aman |
| M15 | Acceptance: receive→deduct→balance & audited | **INPROGRESS** | M13 | `feat/inventory-alerts`, PR open |
| M18 | Price-list rule (SKU × retailer/region) | **INPROGRESS** | M10,M16 | `feat/sales-pricelist`, PR open; `resolvePrice`/`priceFor`/`setPrice`, 11 tests |
| M19 | Order punch UI + order/order_lines model | **INPROGRESS** | M18,M07 | `feat/sales-orders`, PR open; `/orders` punch + `createOrder`, base prices seeded |
| M20 | Invoice number service (server-side series) | **INPROGRESS** | M03 | `feat/sales-invoice-no`, PR open; atomic `next_invoice_no()` RPC + `formatInvoiceNo` |
| M21 | Invoice generation (tax to CA spec) + PDF | TODO | M20,P10 | blocked on P10 format |
| M22 | confirmAndInvoice(): invoice + stock deduct in ONE txn | TODO | M21,M13 | **critical atomicity** |
| M23 | Acceptance: order→invoice→auto-deduct | TODO | M22 | headline acceptance |
| M24 | Van load-out (qty_out) + load sheet | **INPROGRESS** | M11 | `feat/van-load`, PR open; atomic `load_van()` FIFO van_out + `/vans` |
| M25 | Delivery challan PDF | TODO | M24,P10 | |
| M26 | Return-stock capture | TODO | M24 | |
| M27 | Reconciliation: out − sold − returned variance flag | TODO | M26,M22 | **the reason the system exists** |
| M28 | Acceptance: variance beyond tolerance flags + audit | TODO | M27 | |
| M29 | Record cash/UPI against invoice | TODO | M22 | |

### Shared — coordinate (PR-review the other)
| ID | Module | Owner | Status | Depends on | Notes |
|----|--------|-------|--------|-----------|-------|
| M05 | OTP request + verify (SMS) | Both | TODO | M01,P05 | Supabase Auth |
| M06 | JWT + role claim + refresh | Both | TODO | M05 | |
| M07 | RBAC middleware + permission map | Both | TODO | M06 | |
| M08 | User CRUD + role assignment | Both | TODO | M07 | |
| M09 | Acceptance: role-gated screens | Both | TODO | M08 | |
| M16 | Retailer CRUD + import | Both | TODO | M01 | |
| M17 | Field onboarding form + approval | Both | TODO | M16,M07 | |

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

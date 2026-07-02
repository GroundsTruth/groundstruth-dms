# Campa DMS — what's left for the MVP (Aman + Hardik)

_2026-07-02. One place that says: what's **done**, what's **remaining**, who **owns** it, and
what it **depends on**. Read with `docs/WORKLOG.md` (running log) + `docs/CLIENT_QUESTIONS_OPEN.md`
(client asks). Status legend: ✅ done · 🟡 in progress · ⬜ todo · 🔒 blocked (client/config) · ⏭️ post-MVP._

## What "MVP" means here
A driver/rep can, on a phone: **log in → capture a sale (existing or new shop) → get a GST invoice →
take payment (cash/UPI/credit)**; the warehouse can **receive + load vans + reconcile**; the owner can
**see live numbers, approve below-list prices, run schemes, and manage credit** — all atomic + audited,
on live Supabase data.

---

## Status snapshot — BUILT & verified (don't rebuild)
Branch `feat/aman-mvp-e2e` (9 commits ahead of dev, 0 behind, **0 conflicts**; typecheck 0,
**120 tests**, build clean). Dev has the full spine already merged.

- **Spine (Hardik, merged):** schema (16 tables + RPCs), audit + config, inventory (receive / FIFO
  deduct / low-stock / wastage-count), sales (price-list / order punch / atomic `confirm_and_invoice`
  with **GST-inclusive** math + HSN / two price lists / below-list approval), van (load / returns /
  **tiered reconciliation**), collections, retailers (cash-credit + GPS + photo + role-gated approval),
  **dual-seller by brand**, **brand-credit guard**, **delivery challan**, **schemes engine**,
  **catalogue ingest** (tax/HSN/MRP/units live), `captureSale` backend.
- **Auth backend (Hardik, merged):** SSR session client, dormant middleware, `getSessionUser` /
  `requireRole`, `requestOtp` / `verifyOtp` / `signOut`, RBAC map.
- **UI (Aman, on branch):** `/capture` field flow · `/login` phone→OTP→verify · role-aware nav ·
  Owner Dashboard **live tiles + role-scope (#24)** · `/schemes` nav · Gluco→Juice reclassify ·
  E2E runbook + test plan.

---

## Remaining for MVP

### Aman's lane
| # | Item | Status | Depends on | Notes |
|---|------|--------|-----------|-------|
| A1 | **Dual-branding logo** on invoice header + app shell | ⬜ | asset in `PPT_1.pptx` (have it) | cosmetic; invoice already prints correct entity name/GSTIN |
| A2 | **M08 user-management screen** (`/users` — list users, assign roles) | ⬜ | Hardik `updateUserRole` (H2) | needed only for auth lockdown, not the demo |
| A3 | **14 new catalogue SKUs** (+seed) | 🔒 | client Q9 ("add these?") | don't guess — wait for the yes |
| A4 | **Catalog: surface MRP / units-per-case columns** on `/catalog` | 🟡 | — | data is ingested; just display |
| A5 | **UI-kit remainder** (empty/loading polish, form patterns) | 🟡 | — | low priority |
| ✅ | Sales-Capture UI · Login UI · role-nav · Dashboard live tiles + role-scope · `/schemes` nav · Gluco reclassify | ✅ | — | on branch, verified |

### Hardik's lane
| # | Item | Status | Depends on | Notes |
|---|------|--------|-----------|-------|
| H1 | **Wire `requireRole` into mutating actions + flip `NEXT_PUBLIC_AUTH_ENABLED`** (M07) | ⬜ | Aman login UI (done) + role matrix (confirmed) | turns on the lockdown |
| H2 | **`updateUserRole` action** (M08) | ⬜ | pairs with A2 | small |
| H3 | **Soda GST rate reconcile** — live value vs client (5% vs 18%) | ⬜ | client Q4 | **affects invoice tax correctness — resolve before trusting demo invoices** |
| H4 | **Challan layout final** | 🟡 | client Q7 (filled sample, optional) | built to redesigned spec; polish on sample |
| H5 | **Seed real `users`** from driver directory | 🔒 | client Q19 consent + auth go-live | PII, off git |
| H6 | **Doc hygiene:** `STATUS.md` + `MODULE_OWNERSHIP.md` were stale (Aman refreshed on branch); keep updating at session end | 🟡 | — | `.xlsx` tracker abandoned → WORKLOG is the live tracker |

### Joint / go-live (blocked on client or config)
| # | Item | Status | Blocker |
|---|------|--------|---------|
| G1 | **Auth go-live** (login actually works + routes locked) | 🔒 | client Q17 SMS gateway **or** Q18 test numbers (OTP 1234) + H1 flip |
| G2 | **Real GST invoicing** (drop any provisional wording, correct seller block) | 🔒 | client Q1–Q4, Q6 (entity/GSTIN/Soda-rate/numbering) |
| G3 | **Real pilot on live data** (M35) | 🔒 | client Q15 retailer list + Q20 opening stock |
| G4 | **M09 acceptance** — each role sees only its screens | ⬜ | after G1 (AUTH_ENABLED on) |

---

## Dependency / critical path
```
Client Q17/Q18 (SMS gateway OR test numbers) ─┐
Aman login UI (✅) ───────────────────────────┼─► H1 flip AUTH_ENABLED ─► G4 role acceptance ─► auth go-live (G1)
Role matrix (✅ confirmed) ───────────────────┘
A2 user-mgmt UI ─► H2 updateUserRole ─────────► manage roles in-app

Client Q1–Q4/Q6 (entity/GSTIN/Soda/numbering) ─► G2 real invoicing
Client Q15 retailer list ┐
Client Q20 opening stock ┴─────────────────────► G3 pilot
```
**Nothing blocks the E2E demo (Phases 1–6 of `E2E_RUNBOOK.md`)** — everything there runs on current
build + safe defaults. The only pre-demo caution is **H3 (Soda rate)** so invoice tax is trustworthy.

---

## Explicitly OUT of MVP (log, don't build now)
- **Net-new scope S1–S5** (from BUILD_AUDIT): S1 admin panel gating · S2 schemes (✅ now built) ·
  S3 wholesale channel (✅ two price lists) · S4 dispatch edit-lock · S5 rep daily targets
  (client: **not enforced**).
- **Phase 2:** returnable bottle/crate **deposit ledger** (client Q24); browser-side realtime; WhatsApp ingestion.

---

## Immediate next actions
1. **Aman:** open PR `feat/aman-mvp-e2e → dev` (clean) → run `E2E_RUNBOOK.md` Phases 0–6.
2. **Hardik:** confirm **Soda rate** (H3) + finish **H1** once client sends SMS gateway/test numbers.
3. **Both:** send `CLIENT_QUESTIONS_OPEN.md` to the client; seed staff/retailers/opening-stock when data lands.

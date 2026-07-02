# Campa DMS — E2E testing (single source)

_2026-07-02. The one testing doc: **setup → role-based exact steps → chronological one-pass →
cross-role lifecycle → tracker → triage**. Every step is **do → expect** with the **literal
on-screen labels** (verified against the code). Supersedes the earlier E2E_RUNBOOK / E2E_TEST_PLAN /
E2E_TEST_ROLES._

Legend: 🟩 must pass · 🟦 cross-check (a side-effect) · ⚙️ prerequisite

---

## 0. Prerequisites (once, before anything)

⚙️ **P1** On the machine with `.env.local`: `git switch dev` (after the merge) → `npm install`.
⚙️ **P2** `node scripts/check-supabase.mjs` → **CONNECTION OK**.
⚙️ **P3** Migrations applied (done). If a submit throws `column/function does not exist`, re-run `supabase/_apply_pending.sql`.
⚙️ **P4** `npm run seed:demo` → creates: stock (3 SKUs), **"Demo Kirana Store"** (approved, ROUTE-3),
   one invoiced order, a 60% collection, one van load. (Re-runnable — adds a fresh set each run.)
⚙️ **P5** `npm run dev` → `http://localhost:3000`.

### How to "be" each role
Auth is **dormant** (`NEXT_PUBLIC_AUTH_ENABLED` unset), so **every screen is visible to everyone** today.

- **Mode A — Workflow (default, no setup):** ignore the login gate; perform each role's steps on the shared
  nav. Verifies each role's *functionality*. **Use this now.**
- **Mode B — Real lockdown (later):** Supabase → Auth → Phone: enable the provider + add **test numbers with
  fixed OTP `1234`**; seed `users` rows with roles; set `NEXT_PUBLIC_AUTH_ENABLED=true` (needs Hardik's
  `requireRole` wiring). Then each role logs in at `/login` and only sees its own screens (verify with §5).

### Known caveats (won't block Mode A)
- **Soda GST rate (5% vs 18%)** unresolved → treat invoice tax as provisional until Hardik confirms.
- **`/capture` + `/schemes`** aren't RBAC-listed yet → visible to all roles (cross-lane ask raised).
- **No logo asset** → the "C" fallback shows on shell + invoice (cosmetic; drop `public/brand/logo.png`).
- **OTP won't deliver** without the provider/test numbers (Mode B).

---

## 1. Role → screen access matrix (`src/lib/auth/rbac.ts`)

| Screen | Owner / Admin | Warehouse | Driver / Rep |
|--------|:---:|:---:|:---:|
| `/dashboard` | ✅ (full: revenue, charts) | ✅ (ops view) | ✅ (ops view) |
| `/catalog` | ✅ | ✅ | ✅ |
| `/inventory` (receive, count) | ✅ | ✅ | — |
| `/orders` (punch, approve) | ✅ | — | ✅ |
| `/vans` · `/vans/[id]` | ✅ | ✅ | ✅ |
| `/invoices` · payments | ✅ | ✅ | ✅ |
| `/retailers` (onboard, approve) | ✅ | — | ✅ |
| `/schemes` | ✅ _(intended; ungated now)_ | – | – |
| `/users` | ✅ | — | — |
| `/capture` | ✅ _(intended owner+rep; ungated now)_ | – | ✅ |

---

## 2. 👔 OWNER / ADMIN — exact steps

### 2A. Business dashboard (role-scoped) 🟩
1. **`/dashboard`** → subtitle shows **"live figures"** (not "seed workbook").
2. Owner tiles: **Revenue** (accent, ₹ + "N units"), **Collected** (₹ + "Outstanding ₹X" amber or
   "All collected" green), **Low stock** ("N SKUs"), **Vans active** (N).
3. **"Sales by route"** chart + **"Top SKUs"** ranked list + **"Low stock — reorder"** section.
🟦 These financial tiles/charts are **owner-only** — confirm hidden for other roles (§3A / Mode B).

### 2B. Manage users & roles (owner-only) 🟩
1. **`/users`** → staff table (Name · Phone · Role · Status).
2. Change a row's **Role** dropdown → **Owner / Warehouse / Driver / Rep** → toast **"{name} is now {role}"**.
3. Click the **Ban** icon → confirm **"Deactivate {name}?"** → **Deactivate** → toast **"User deactivated"**;
   row dims, Role dropdown disables.
4. Toggle **"Show inactive (N)"** → click **RotateCcw** on the user → **"User reactivated"**.
🟦 Writes `audit_log` (`user.role_update` / `user.deactivate`).

### 2C. Configure a scheme (buy-X-get-Y) 🟩
1. **`/schemes`** → **"New scheme"**.
2. **Name** ("10+1 Water") · **Buy (trigger SKU)** · **Trigger qty (cases)** = 10 · **Get free (SKU)** ·
   **Free qty (cases)** = 1 → **Create** → scheme appears **Active**.
3. **"Turn off"** → **Off** (dims); **"Turn on"** → **Active**.
🟦 A qualifying capture (§2F/§4B) auto-adds the free item as a **₹0 line** on the invoice.

### 2D. Approve / reject a below-list order 🟩
_(Prereq: a below-list order from §4C, or punch one.)_
1. **`/orders`** → find the order with status **pending_approval**.
2. **Approve** → status **confirmed**; **or** **Reject** → status **rejected**.
3. On the approved order → **"Confirm & invoice"** → navigates to **`/invoices/{id}`**.
🟦 A rejected order never produces an invoice.

### 2E. Approve a credit retailer (admin gate) 🟩
1. **`/retailers`** → **"Add retailer"** → **Customer type = Credit** → a **Credit limit (₹)** field appears →
   enter 1500 → **Onboard** → row shows **Pending** (amber).
2. **Approve** on that row → **Approved** (green).
🟦 A cash shop onboarded in `/capture` already reads **Approved** without this step.

### 2F. Catalog + full sale (admin can do everything) 🟩
1. **`/catalog`** → **"Add SKU"** (or **Edit**) → confirm the **MRP** column + **units/case** show.
2. Run a capture end-to-end exactly as **§4A**.

---

## 3. 📦 WAREHOUSE MANAGER — exact steps

### 3A. Ops dashboard (no financials) 🟩
1. **`/dashboard`** → non-owner tiles: **Orders to approve**, **Low stock**, **Vans active**.
2. **NO Revenue/Collected tiles and NO route chart** (in Mode A you'll still see them since role is null).

### 3B. Receive stock (atomic) 🟩
1. **`/inventory`** → **"Receive stock"** → **SKU** · **Batch number** ("B-2026-07") · **Quantity (cases)** (50) ·
   optional **Expiry date** / **Manufacture date** → **"Receive stock"**.
2. Expect green **"Received 50 into {code} · batch B-2026-07."**; by-SKU on-hand rises by 50.
🟦 Inward `stock_movements` row (audited).

### 3C. Physical count / wastage adjustment 🟩
1. **`/inventory`** → **"Physical count / adjustment"** → set **Counted** ≠ **System**, add **Reason** ("wastage") →
   **"Adjust"**.
2. Expect green **"Adjusted {code} batch {no} by ±{delta}."**; on-hand updates.
🟦 Blank counted → "Enter a counted quantity."; equal → "No change for that batch."

### 3D. Van load-out (FIFO, atomic) 🟩
1. **`/vans`** → **"Load van"** → **Route** (ROUTE-3) · **Vehicle** ("MH-04-AB-1234").
2. Add a line: **SKU** ("on hand: N") · **Qty**. Qty > on-hand → **"Only N on hand — reduce the quantity."**
   and **"Load van"** disables.
3. **"Add line"** for a 2nd SKU (each SKU once) → **"Load van"** → green **"Van loaded — {loadNo}."**
🟦 Warehouse on-hand drops by loaded qty (FIFO `van_out`).

### 3E. Returns + reconciliation 🟩
1. Open the load (**`/vans`** → click it, or **`/vans/{id}`**).
2. **"Record returns"** → set **Return now** (≤ "Still out") → **"Record returns"** → green **"Returns recorded."**
   (Over-return → "A return is more than what's still out on the van.")
3. **Reconciliation** → **"Reconcile"** → badge:
   **"Reconciled — within tolerance"** / **"Warning — variance in review band"** /
   **"Critical — variance over threshold"**, with **stock %** + **cash %**.
4. Grid: **Out / Returned / Invoiced / Stock variance / Cash expected / Cash collected / Cash variance**.

### 3F. Delivery challan 🟩
1. **`/vans/{id}`** → **DELIVERY CHALLAN** → columns **# · Item · Rate · Qty Out · Return · Qty Sale ·
   Discount · Amount** + total row. **Qty Sale = Qty Out − Return**. Print via browser.

---

## 4. 🚗 DRIVER / SALES-REP — exact steps

### 4A. Capture a retail sale — existing shop, cash (headline) 🟩
1. **`/capture`** → **Route** = ROUTE-3 → **Price list** = **Retail**.
2. **Shop** = **Existing shop** → type "Demo" in **"Search shop by name or phone…"** → pick **Demo Kirana Store**.
3. **Items:** pick a **SKU** → set **Qty** (stepper) → **line total** appears; **Subtotal** updates. **"Add item"** ×1.
4. **Payment** = **Cash** → **Amount collected** defaults to subtotal.
5. **"Review order"** → preview: shop, lines, **Total (GST-incl.)**, payment.
6. **"Confirm & invoice"** → **"Sale invoiced"** + **"View invoice"**.
🟦 **"View invoice"** → inclusive tax, HSN per line, seller entity by brand, CGST/SGST.
🟦 `/inventory` on-hand dropped by qty sold; invoice **Payments** = settled.

### 4B. Capture — new shop, inline onboard + GPS 🟩
1. **`/capture`** → Route → **Shop** = **New shop** → **Shop name** (req) + **Owner name** / **Owner phone** / **GSTIN** (opt).
2. **"Capture GPS"** → allow the prompt → **"Location captured ✓"** (button → **"Re-capture GPS"**).
3. Add items → **Payment = Cash** → **Review order** → **Confirm & invoice** → **"Sale invoiced"** (cash auto-approves).
🟦 `/retailers` shows the new shop: owner + phone + **Approved** + customer type **cash** + GPS set.
🟦 If a scheme (§2C) qualifies → the invoice has the **free ₹0 line**.

### 4C. Capture — below-list price → approval 🟩
1. **`/capture`** → existing shop → add SKU → set **Rate** **below** the placeholder → **"below list"** (amber) shows.
2. The button now reads **"Send for approval"** → click → **"Sent for approval"** (no invoice).
🟦 Appears in owner's **`/orders`** as **pending_approval** (→ §2D).

### 4D. Capture — on credit + brand-credit guard 🟩
1. **`/capture`** → existing **credit** shop (approved) → add a **Campa Sure / Falcon** SKU **within** ₹1,500.
2. **Payment** = **Credit** → info **"Billed to the shop's credit ledger — no payment captured now."** →
   **Review order** → **Confirm & invoice** → **"Sale invoiced"**.
🟦 Invoice **Payments** shows full **Outstanding** (no collection).
🟩 Push a credit sale **over ₹1,500** → **brand-credit guard blocks** (error on preview).
🟩 Try a **Campa Cola / Jaypee** SKU on credit → **blocked** (Cola brand = cash/UPI only).

### 4E. Order punch (alternative to capture) 🟩
1. **`/orders`** → **"Punch order"** → **Route** → line(s) (**SKU / Qty / Rate**) → **"Punch order"** →
   green **"Order {no} punched (₹X)."** (below list → **"...sent for admin approval."**).
2. On a draft → **"Confirm & invoice"** → the invoice.

### 4F. Onboard a retailer 🟩
1. **`/retailers`** → **"Add retailer"** → Name (req) + Owner/Shop/Phone/GSTIN/Route/Address → **Customer type** =
   Cash → **Onboard** → GPS auto-captured → row appears (cash → **Approved**).

### 4G. Record a collection 🟩
1. **`/invoices`** → open an invoice with **Outstanding** → **Payments** → **Amount** + **Mode** (Cash/UPI) +
   optional **Reference** → **"Record"** → collected rises, Outstanding falls; at 0 → **"Settled"** badge.
🟦 Can't over-collect beyond outstanding.

---

## 5. 🔗 Cross-role lifecycle (chronological one-pass)

One product's journey through all roles — also the fastest full-coverage order:
1. **Setup** §0 (P1–P5).
2. **Admin** — §2C scheme · §2E approve a credit shop · §2B set a user role · §2A confirm dashboard is "live".
3. **Warehouse** — §3B receive · §3C adjust · §3D load a van (ROUTE-3).
4. **Driver** — §4A cash sale · §4B new shop + GPS · §4C below-list · §4D credit (+ guard) · §4F onboard.
5. **Admin** — §2D approve the below-list order → **Confirm & invoice**.
6. **Driver/Admin** — §4G record a collection.
7. **Warehouse** — §3E returns → **Reconcile** → read stock + cash variance · §3F challan.
8. **Admin** — §2A dashboard reflects it all.
🟦 Spot-check `audit_log`: order, invoice, deduct, collection, approval, adjust, return, van-load rows present.

---

## 6. Pass / fail tracker

| Role | Section | Result | Notes |
|------|---------|:---:|-------|
| Setup | P1–P5 | ⬜ | |
| Owner | 2A dashboard | ⬜ | |
| Owner | 2B users | ⬜ | |
| Owner | 2C schemes | ⬜ | |
| Owner | 2D order approval | ⬜ | |
| Owner | 2E credit approval | ⬜ | |
| Owner | 2F catalog/sale | ⬜ | |
| Warehouse | 3B receive | ⬜ | |
| Warehouse | 3C adjust | ⬜ | |
| Warehouse | 3D load | ⬜ | |
| Warehouse | 3E returns+reconcile | ⬜ | |
| Warehouse | 3F challan | ⬜ | |
| Driver | 4A cash sale | ⬜ | |
| Driver | 4B new shop+GPS | ⬜ | |
| Driver | 4C below-list | ⬜ | |
| Driver | 4D credit+guard | ⬜ | |
| Driver | 4G collection | ⬜ | |
| Cross | 5 lifecycle | ⬜ | |

## 7. Failure triage
- **`column/function does not exist`** → migration missing → re-run `supabase/_apply_pending.sql`.
- **`/capture` "no priced SKUs"** → base prices missing → catalogue ingest / `seed_base_prices` didn't run.
- **Dashboard says "seed workbook"** → no live rows → `npm run seed:demo`.
- **GPS "Couldn't get location"** → allow browser location, or run on `localhost`/https.
- **Anything off** → note the exact screen + label + message; Aman traces it to file:line.

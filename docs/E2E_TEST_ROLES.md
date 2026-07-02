# E2E Testing — by role (driver · warehouse · admin)

_2026-07-02. The shared, exact-step test script for every role. Each step is **do → expect**,
using the **literal on-screen labels**. Companion to `docs/E2E_RUNBOOK.md` (chronological setup)
and `docs/E2E_TEST_PLAN.md` (journey-first). Tick the boxes as you go._

Legend: 🟩 must pass · 🟦 cross-check (verify a side-effect) · ⚙️ prerequisite

---

## 0. Prerequisites (do once, before any role)

⚙️ **P1** On the machine with `.env.local`: `git switch feat/aman-mvp-e2e` → `npm install`.
⚙️ **P2** `node scripts/check-supabase.mjs` → **CONNECTION OK**.
⚙️ **P3** Migrations applied (done). If a submit throws `column/function does not exist`, re-run `supabase/_apply_pending.sql`.
⚙️ **P4** `npm run seed:demo` → creates: stock (3 SKUs), **"Demo Kirana Store"** (approved, ROUTE-3),
   one invoiced order, a 60% collection, one van load. (Re-runnable.)
⚙️ **P5** `npm run dev` → `http://localhost:3000`.

### How to "be" each role
Auth is **dormant** (`NEXT_PUBLIC_AUTH_ENABLED` unset), so **every screen is visible to everyone** right now.
Two testing modes:

- **Mode A — Workflow (default, no setup):** ignore the login gate; just perform each role's steps below on
  the shared nav. This verifies the *functionality* of each role's journey. **Use this now.**
- **Mode B — Real role lockdown (later):** in Supabase → Auth → Phone: enable the provider + add **test numbers
  with fixed OTP `1234`**; seed `users` rows with roles; set `NEXT_PUBLIC_AUTH_ENABLED=true` (needs Hardik's
  `requireRole` wiring, H1). Then each role logs in via `/login` and only sees its own screens. Verify with §5.

### Known caveats (won't block Mode A)
- **Soda GST rate (5% vs 18%)** unresolved → treat invoice tax as provisional until Hardik confirms.
- **`/capture` + `/schemes`** aren't RBAC-listed yet → they show for all roles (cross-lane ask raised).
- **No logo asset** → the "C" fallback shows on shell + invoice (cosmetic).
- **OTP won't deliver** without the provider/test numbers (Mode B).

---

## 1. Role → screen access matrix (from `rbac.ts`)

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
1. Open **`/dashboard`** → subtitle shows **"live figures"** (not "seed workbook").
2. Expect the **owner** tiles: **Revenue** (accent, ₹ + "N units"), **Collected** (₹ + "Outstanding ₹X" amber
   or "All collected" green), **Low stock** ("N SKUs"), **Vans active** (N).
3. Expect **"Sales by route"** chart + **"Top SKUs"** ranked list + **"Low stock — reorder"** section.
🟦 These financial tiles/charts are **owner-only** — confirm they're hidden for other roles in §3A/§4A.

### 2B. Manage users & roles (owner-only) 🟩
1. **`/users`** → the staff table (Name · Phone · Role · Status).
2. On a row, change the **Role** dropdown → **Owner / Warehouse / Driver / Rep** → toast **"{name} is now {role}"**.
3. Click the **Ban** icon → confirm **"Deactivate {name}?"** → **Deactivate** → toast **"User deactivated"**,
   row dims, its Role dropdown disables.
4. Toggle **"Show inactive (N)"** → the deactivated user appears; click the **RotateCcw** icon → **"User reactivated"**.
🟦 Each change writes an `audit_log` row (`user.role_update` / `user.deactivate`).

### 2C. Configure a scheme (buy-X-get-Y) 🟩
1. **`/schemes`** → **"New scheme"**.
2. Fill **Name** ("10+1 Water"), **Buy (trigger SKU)**, **Trigger qty (cases)** = 10,
   **Get free (SKU)**, **Free qty (cases)** = 1 → **Create** → form closes, scheme appears **Active**.
3. Click **"Turn off"** → status → **Off** (row dims); **"Turn on"** → back to **Active**.
🟦 Later (§2F/§4B) a qualifying capture auto-adds the free item as a **₹0 line** on the invoice.

### 2D. Approve / reject a below-list order 🟩
_(Prereq: a driver created a below-list order — §4A step 3, or punch one here.)_
1. **`/orders`** → in the list, find the order with status **pending_approval**.
2. Click **Approve** → row refreshes → status **confirmed**; **or** **Reject** → status **rejected**.
3. On the approved order click **"Confirm & invoice"** → navigates to **`/invoices/{id}`** (invoice created).
🟦 A rejected order never produces an invoice.

### 2E. Approve a credit retailer (admin gate) 🟩
_(Prereq: a driver onboarded a credit shop, or do it here.)_
1. **`/retailers`** → **"Add retailer"** → set **Customer type = Credit** → a **Credit limit (₹)** field appears →
   enter 1500 → **Onboard** → row shows **Pending** (amber).
2. Click **Approve** on that row → status → **Approved** (green).
🟦 A cash shop onboarded in `/capture` should already read **Approved** without this step.

### 2F. Full sale + catalog (admin can do everything) 🟩
1. **`/catalog`** → **"Add SKU"** (or **Edit** a row) → confirm the **MRP** column + **units/case** now show.
2. Run a capture end-to-end exactly as **§4A** (owner may capture too).

---

## 3. 📦 WAREHOUSE MANAGER — exact steps

### 3A. Ops dashboard (no financials) 🟩
1. **`/dashboard`** → expect the **non-owner** tiles: **Orders to approve**, **Low stock**, **Vans active**.
2. Expect **NO Revenue/Collected tiles and NO route chart** (Mode B; in Mode A you'll see them since role is null).

### 3B. Receive stock (atomic) 🟩
1. **`/inventory`** → **"Receive stock"** form.
2. **SKU** (pick) · **Batch number** ("B-2026-07") · **Quantity (cases)** (50) · optional **Expiry date** /
   **Manufacture date** → **"Receive stock"**.
3. Expect green **"Received 50 into {code} · batch B-2026-07."**; the by-SKU table on-hand rises by 50.
🟦 Adds an inward `stock_movements` row (audited).

### 3C. Physical count / wastage adjustment 🟩
1. On **`/inventory`** → **"Physical count / adjustment"** table.
2. On a batch, set **Counted** to a number **different** from **System**, add a **Reason** ("wastage") →
   **"Adjust"**.
3. Expect green **"Adjusted {code} batch {no} by ±{delta}."**; on-hand updates.
🟦 Errors: blank counted → "Enter a counted quantity."; equal to system → "No change for that batch."

### 3D. Van load-out (FIFO, atomic) 🟩
1. **`/vans`** → **"Load van"** form → **Route** (ROUTE-3) · **Vehicle** ("MH-04-AB-1234").
2. Add a line: **SKU** (shows "on hand: N") · **Qty**. If Qty > on-hand → inline **"Only N on hand — reduce the quantity."**
   and **"Load van"** disables.
3. **"Add line"** for a 2nd SKU (each SKU once) → **"Load van"** → green **"Van loaded — {loadNo}."**
🟦 Warehouse on-hand drops by the loaded qty (FIFO `van_out`).

### 3E. Returns + reconciliation 🟩
1. Open the load (**`/vans`** → click the load, or **`/vans/{id}`**).
2. **"Record returns"** table → set **Return now** (≤ "Still out") on a line → **"Record returns"** →
   green **"Returns recorded."** (Over-return → "A return is more than what's still out on the van.")
3. **Reconciliation** panel → **"Reconcile"** → expect a status badge:
   **"Reconciled — within tolerance"** (ok) / **"Warning — variance in review band"** (warn) /
   **"Critical — variance over threshold"** (bad), with **stock %** + **cash %** subtext.
4. Read the grid: **Out / Returned / Invoiced / Stock variance / Cash expected / Cash collected / Cash variance**.

### 3F. Delivery challan 🟩
1. On **`/vans/{id}`** → the **DELIVERY CHALLAN** view → columns **# · Item · Rate · Qty Out · Return ·
   Qty Sale · Discount · Amount**, with a total row. **Qty Sale = Qty Out − Return**. (Print via browser.)

---

## 4. 🚗 DRIVER / SALES-REP — exact steps

### 4A. Capture a retail sale — existing shop, cash (headline) 🟩
1. **`/capture`** → **Route** = ROUTE-3 → **Price list** = **Retail**.
2. **Shop** toggle = **Existing shop** → type "Demo" in **"Search shop by name or phone…"** → pick
   **Demo Kirana Store** in the **Shop** dropdown.
3. **Items:** pick a **SKU** (shows price) → set **Qty** with the stepper → the **line total** appears;
   the running **Subtotal** updates. **"Add item"** for a 2nd SKU.
4. **Payment** = **Cash** → **Amount collected** defaults to subtotal.
5. **"Review order"** → preview lists shop, lines, **Total (GST-incl.)**, payment.
6. **"Confirm & invoice"** → success screen **"Sale invoiced"** + **"View invoice"**.
🟦 **"View invoice"** → invoice shows inclusive tax, HSN per line, seller entity by brand, CGST/SGST.
🟦 `/inventory` on-hand dropped by the qty sold; invoice **Payments** = settled.

### 4B. Capture — new shop, inline onboard + GPS 🟩
1. **`/capture`** → Route → **Shop** = **New shop** → **Shop name** (req) + **Owner name** / **Owner phone** / **GSTIN** (opt).
2. **"Capture GPS"** → allow the browser prompt → status **"Location captured ✓"** (button → **"Re-capture GPS"**).
3. Add items → **Payment = Cash** → **Review order** → **Confirm & invoice** → **"Sale invoiced"** (cash auto-approves).
🟦 `/retailers` shows the new shop: owner + phone + **Approved** + customer type **cash** + GPS set.
🟦 If a scheme (§2C) qualifies, the invoice has the **free ₹0 line**.

### 4C. Capture — below-list price → approval 🟩
1. **`/capture`** → existing shop → add a SKU → set **Rate** **below** the placeholder price → **"below list"** (amber) shows.
2. The confirm button now reads **"Send for approval"** → click → success screen **"Sent for approval"** (no invoice).
🟦 This order appears in the owner's **`/orders`** as **pending_approval** (→ §2D).

### 4D. Capture — on credit 🟩
1. **`/capture`** → existing **credit** shop (approved) → add a **Campa Sure / Falcon** SKU **within** the ₹1,500 cap.
2. **Payment** = **Credit** → info **"Billed to the shop's credit ledger — no payment captured now."** →
   **Review order** → **Confirm & invoice** → **"Sale invoiced"**.
🟦 Invoice **Payments** shows full **Outstanding** (no collection).
🟩 Push a credit sale **over ₹1,500** → expect the **brand-credit guard** to block (error on the preview).
🟩 Try a **Campa Cola / Jaypee** SKU on credit → expect **blocked** (Cola brand = cash/UPI only).

### 4E. Order punch (alternative to capture) 🟩
1. **`/orders`** → **"Punch order"** form → **Route** → add line(s) (**SKU / Qty / Rate**) → **"Punch order"** →
   green **"Order {no} punched (₹X)."** (below list → **"...sent for admin approval."**).
2. On a draft, **"Confirm & invoice"** → navigates to the invoice.

### 4F. Onboard a retailer 🟩
1. **`/retailers`** → **"Add retailer"** → Name (req) + Owner/Shop/Phone/GSTIN/Route/Address → **Customer type** =
   Cash → **Onboard** → GPS auto-captured → row appears (cash → **Approved**).

### 4G. Record a collection 🟩
1. **`/invoices`** → open an invoice with **Outstanding** → **Payments** panel → **Amount** + **Mode** (Cash/UPI) +
   optional **Reference** → **"Record"** → collected rises, **Outstanding** falls; when 0 → **"Settled"** badge.
🟦 Can't over-collect beyond outstanding.

---

## 5. 🔗 Cross-role end-to-end scenario (full lifecycle)

Run in order — this is one product's journey through all three roles:
1. **Admin** (§2C) creates a scheme; (§2E) approves a credit shop; (§2B) sets a user's role.
2. **Warehouse** (§3B) receives stock; (§3D) loads a van for ROUTE-3.
3. **Driver** (§4A) captures a cash sale; (§4B) onboards a new shop + sells; (§4C) makes a below-list sale;
   (§4D) makes a credit sale.
4. **Admin** (§2D) approves the below-list order → **Confirm & invoice**.
5. **Driver/Admin** (§4G) records a collection against an outstanding invoice.
6. **Warehouse** (§3E) records returns → **Reconcile** → read stock + cash variance.
7. **Admin** (§2A) opens the dashboard → revenue/collected/low-stock/vans reflect all of the above.
🟦 Spot-check `audit_log`: order, invoice, deduct, collection, approval, adjust, return, van-load rows all present.

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

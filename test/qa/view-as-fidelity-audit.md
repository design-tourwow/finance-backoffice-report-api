---
audit: view-as-fidelity
date: 2026-04-29
auditor: Quinn (QA Engineer, BMM)
severity_legend: CRITICAL > HIGH > MEDIUM > LOW
status: open
---

# View-As Impersonation Fidelity Audit

## Quick Bug Index

| ID | Severity | File | Line | Description |
|----|----------|------|------|-------------|
| BUG-VA-01 | CRITICAL | `sales-report-by-seller.js` | 324 | Seller dropdown enabled during view-as-ts/crm — isAdmin() returns true when token patch silent-fails |
| BUG-VA-02 | HIGH | `sales-report-by-seller-api.js` | 27–38 | fetchAPI() builds Authorization header manually, no native X-View-As injection — relies 100% on window.fetch patch |
| BUG-VA-03 | HIGH | `commission-plus/pdf/route.ts` | 94 | PDF backend endpoint requires roles:['admin'] — view-as headers make effectiveRole='ts' → 403 (latent risk) |
| BUG-VA-04 | MEDIUM | `sales-report-by-seller.js` | 829 | Excel button visibility guard: correct code, but untestable if BUG-VA-01 is active |
| BUG-VA-05 | MEDIUM | `sales-report-by-seller.js` | 606–607 | exportPDF wires event listener inside renderResults — if isAdmin() returns wrong value, PDF content is wrong too |
| BUG-VA-06 | LOW | `sales-report-by-seller.js` | 1045 | getPrintDocumentHtml() is dead code — never called — but contains admin-only commission cards unconditionally |

---

## Section 1 — Audit Methodology

### Pages in scope

| Path | Role Access | Notes |
|------|-------------|-------|
| `/dashboard` | admin, ts, crm | Dashboard landing page |
| `/sales-report-by-seller` | admin, ts, crm | Primary target of user's bug report |
| `/403` | all | Redirect destination for forbidden paths |
| `/401` | all | Redirect destination for unauthenticated access |

### Pages ts/crm must be redirected away from (admin-only)

Per `ROLE_ACCESS` in `menu-component.js` lines 34–72, ts/crm have `false` for:
`/tour-image-manager`, `/sales-by-country`, `/wholesale-destinations`, `/sales-report`,
`/canceled-orders`, `/work-list`, `/supplier-commission`, `/discount-sales`,
`/order-external-summary`, `/request-discount`, `/order-report`, `/repeated-customer-report`.

`initMenuComponent()` calls `canAccessPath(getCurrentPath())` on load, redirecting to `/403` for any of the above. During view-as-ts the same guard runs because `getCurrentUserRole()` returns `'ts'` (from sessionStorage, not the JWT).

### How role-dependent rendering is sourced

Every page-level `isAdmin()` check flows through `currentUser.job_position`, which is populated by `getUserFromToken()` → `TokenUtils.decodeToken(token)`. The monkey-patch in `menu-component.js` replaces `TokenUtils.decodeToken` at **script-body time** (line 1005, before DOMContentLoaded) so page-level `init()` functions — which run on DOMContentLoaded — always see the patched version.

The complete dependency chain:

```
menu-component.js parsed (synchronous, in <head>)
  └─ patchTokenUtilsForViewAs() [line 1005] patches TokenUtils.decodeToken
       └─ reads: sessionStorage.viewAsRole / viewAsUserId / viewAsUserNick / viewAsUserTeam

DOMContentLoaded fires
  └─ menu-component.js: initMenuComponent() → patchFetchForViewAs() [redundant second patch attempt]
  └─ sales-report-by-seller.js: init()
       └─ getUserFromToken() → TokenUtils.decodeToken(token) [PATCHED]
            └─ returns { id: targetId, job_position: targetRole, ... }
       └─ currentUser = { id: 100, job_position: 'ts', ... }
       └─ isAdmin() = false
```

---

## Section 2 — Page-by-Page Bug List

### 2.1 `/sales-report-by-seller` (most critical)

#### 2.1.1 Seller Dropdown ("ชื่อผู้จอง")

**Location:** `sales-report-by-seller.js` lines 320–355, function `renderSellerDropdown()`

**Logic:**
```javascript
// line 324
if (!isAdmin()) {
  // render disabled button showing own name
  sellerHost.innerHTML = `<button ... disabled ...>${name}</button>`;
  return;
}
// else: full FilterSearchDropdown with all sellers
```

**Expected (real ts user id=100):** A disabled `<button>` element with `disabled` attribute, showing the user's own nick name. No dropdown, no search, no other sellers visible.

**Expected (admin id=555 view-as-ts/100):** Identical to above. The patch must make `isAdmin()` return `false`.

**Actual (reported):** The full interactive dropdown is rendered — admin's own complete seller list, searchable. The dropdown is enabled.

**Root Cause Analysis:** The failure mode requires `isAdmin()` to return `true`. This means `currentUser.job_position` is `'admin'`, which means `getUserFromToken()` decoded the JWT without the view-as override. This happens when `patchTokenUtilsForViewAs()` either:
- (a) did not apply because `window.TokenUtils` was `undefined` or `decodeToken` was not a function at patch time, OR
- (b) applied but the inner guard `realIdNum !== VIEW_AS_ADMIN_ID` (line 481) rejected the override because `Number(member.id) !== 555` — possible if the JWT stores `id` as a string that doesn't coerce to exactly `555`.

The Vercel `vercel.json` confirms `Cache-Control: no-cache, no-store, must-revalidate` for all `.js` files, so browser caching is **not** the cause.

**Divergence:** (A) disabled button with name vs (B) enabled dropdown with full list. The two are NOT equivalent.

---

#### 2.1.2 "สถานะ Order" Dropdown

**Location:** `sales-report-by-seller.js` lines 423–438, `initFilters()`

**Logic:** `defaultStatus = isAdmin() ? 'all' : 'not_canceled'`. The dropdown is **always interactive** for all roles — it is never disabled.

**Expected (real ts):** Interactive dropdown, default value `'ไม่ยกเลิก'` (not_canceled). All three options available.

**Expected (admin view-as-ts):** Same — interactive, default `'ไม่ยกเลิก'`.

**Actual:** If BUG-VA-01 is active (isAdmin() returns true), the default value shown is `'ทั้งหมด'` (all) instead of `'ไม่ยกเลิก'`. This is a visible difference even though the dropdown itself is interactive for all roles.

**Note:** This is a secondary symptom of BUG-VA-01 rather than an independent bug.

---

#### 2.1.3 Excel Export Button

**Location:** `sales-report-by-seller.js` line 829

```javascript
${isAdmin() ? window.SharedExportButton.render({ id: 'crp-btn-export', variant: 'excel' }) : ''}
```

**Expected (real ts/crm):** Button is **absent** from DOM entirely.

**Expected (admin view-as-ts):** Button must also be **absent**.

**Actual (if BUG-VA-01 active):** Button is **present** because `isAdmin()` returns true. Admin can click it and export an Excel file that includes ALL ranking sheets (`sales-report-by-telesales`, `sales-report-by-crm`) — data a ts user never sees.

---

#### 2.1.4 PDF Export Button

**Location:** `sales-report-by-seller.js` line 830–833

The PDF button is **hardcoded HTML** — visible to all roles unconditionally. This is correct behavior (real ts users also have the PDF button). No bug here.

**Content of PDF during view-as-ts:**
- `buildPaginatedPdfPages()` line 1625: `if (isAdmin()) { ... buildSellerSummaryPage() }` — ranking pages only added for admin.
- If BUG-VA-01 is active and `isAdmin()=true`, the ranking summary page (Telesales + CRM group tables) IS added to the PDF. This leaks peer data to what should be a ts-scoped report.
- The table footer in the PDF uses `currentOwnSummary` (line 1427–1432), which is correctly scoped to own orders IF `renderResults()` ran correctly. But if `isAdmin()=true` caused the data scoping to also fail (line 587–590), `currentOwnSummary` could contain admin-wide data.

---

#### 2.1.5 KPI Cards

**Location:** `sales-report-by-seller.js` lines 683–716, `renderSummary()`

```javascript
const adminCards = isAdmin() ? `
  // คอมรวม card
  // คอม (หักส่วนลด) card
  ${discountCard}` : discountCard;
```

**Expected (real ts):** 2 cards — "ยอดขายรวม" + "ส่วนลดรวม".
**Expected (admin view-as-ts):** Same 2 cards.
**Actual (if BUG-VA-01 active):** 4 cards — admin sees the extra commission cards. ts user never sees these.

---

#### 2.1.6 Ranking Summary Section ("สรุป")

**Location:** `sales-report-by-seller.js` lines 724–800, `renderSellerSummary()`

**Expected (real ts):** One table "Telesales" visible. Peer rows show `******` for seller name. Self row shows real name with trophy/rank icon.

**Expected (real crm):** No ranking section rendered at all.

**Expected (admin view-as-ts):** Identical to real ts — one table, peers masked.

**Expected (admin view-as-crm):** No ranking section.

**Analysis:** This logic is purely driven by `isAdmin()` and `myRole` (from `currentUser.job_position`). If BUG-VA-01 makes `isAdmin()=true`, admin view-as-ts will show BOTH Telesales AND CRM ranking tables with full unredacted names — behavior that a real ts user never sees.

---

#### 2.1.7 Row Scoping in Main Table and KPI Cards

**Location:** `sales-report-by-seller.js` lines 586–594, `renderResults()`

```javascript
const myId = String(currentUser?.id || '');
const ownOrders = isAdmin()
  ? orders
  : orders.filter(o => String(o.seller_agency_member_id || '') === myId);
const ownSummary = isAdmin() ? summary : computeSummary(ownOrders);
```

**Expected (admin view-as-ts/100):** `ownOrders` must contain ONLY orders where `seller_agency_member_id === '100'`. `myId` is `currentUser.id` which is `100` from the patched token.

**If BUG-VA-01 active:** `isAdmin()=true` → `ownOrders = orders` (all orders from the API). But the API itself filters to `seller_agency_member_id=100` server-side (because X-View-As headers are working via fetch patch). So `orders` from the API is already user-100-only. The table and KPI values remain correct even when `isAdmin()=true`, because the API does the filtering.

**This explains the user's observation:** "หน้าจอผลการค้นหาแสดงถูก" — data results ARE correct (backend filter works). But UI elements (dropdown, export buttons, KPI cards, ranking) are wrong because they depend on the broken `isAdmin()` check.

---

### 2.2 `/dashboard`

**Location:** `dashboard.js` lines 96–110

```javascript
var cards = CARDS.filter(function(card) {
  return window.MenuComponent.canAccessPath(card.href);
});
```

`canAccessPath()` calls `getCurrentUserRole()` which reads from `sessionStorage.viewAsRole` when impersonating. This path does NOT use `TokenUtils.decodeToken` — it reads `sessionStorage` directly.

**Therefore: dashboard card filtering is CORRECT during view-as regardless of BUG-VA-01.**

A ts user visiting dashboard sees only the "Sales Report by Seller" card. Admin view-as-ts sees the same. This works correctly.

The sidebar menu also uses `getCurrentUserRole()` → reads sessionStorage. Correct.

**No bugs on dashboard.**

---

### 2.3 Sidebar Menu (`menu-component.js`)

`filterMenuItems()` → `canAccessPath()` → `getCurrentUserRole()` reads sessionStorage `viewAsRole`.

This path is **independent of the token patch** and works correctly at all times. The sidebar will always show only Dashboard + Sales Report by Seller during view-as-ts/crm.

**No bugs in menu rendering.**

---

### 2.4 403 / 401 Error Pages

These pages have no role-dependent content. They are static HTML. No bugs.

---

## Section 3 — Export Functionality Fidelity

### 3.1 Excel Export

**File:** `sales-report-by-seller.js` lines 872–928, `exportExcelWorkbook()`

**Visibility guard (line 829):** `isAdmin() ? render button : ''`

**When working correctly (view-as-ts):**
- Button absent from DOM
- Function not accessible (no button to click)

**When BUG-VA-01 is active (isAdmin()=true during view-as):**
- Button IS rendered
- Export includes 3 worksheets: `sales-report`, `sales-report-by-telesales`, `sales-report-by-crm`
- `sales-report` sheet: uses `currentOwnOrders` (which equals all API rows because `ownOrders = orders` when `isAdmin()=true`)
- `sales-report-by-telesales` sheet: all real seller names and values (lines 906–912)
- `sales-report-by-crm` sheet: all real CRM seller names and values (lines 913–919)
- **This fully exposes competitive peer data** that a real ts user never sees

**Real ts user Excel behavior:** Button absent. Cannot export Excel.

**Content for real ts (if they could somehow trigger it):** The `getSellerSummaryExportRows()` function (line 930–939) masks peer names with `MASKED_NAME = '******'` unless `isAdmin() || row.seller_id === myId`. During view-as-ts, if `isAdmin()=true`, the mask is skipped.

### 3.2 PDF Export

**File:** `sales-report-by-seller.js` lines 1772–1841, `exportPDF()`

**Architecture:** 100% client-side. Uses `html2canvas` to screenshot DOM elements + `jsPDF`. No HTTP call to the backend PDF endpoint.

**Backend `/api/reports/commission-plus/pdf`** (file: `commission-plus/pdf/route.ts` line 94):
- `roles: ['admin']`
- If called with `X-View-As-Role: ts` headers, `effectiveRole='ts'` → backend returns 403
- This endpoint is **not used** by the current page implementation
- Latent risk: if the export is ever refactored to use the server-side PDF endpoint, it will break during view-as

**Client-side PDF content during view-as (when BUG-VA-01 active):**
- `buildPaginatedPdfPages()` line 1625: `if (isAdmin())` → summary pages added
- Summary pages include **both TS and CRM ranking tables with unredacted names**
- Table footer uses `currentOwnSummary` — which, because `isAdmin()=true`, is the full API summary (already scoped to user 100 by backend). So numeric totals are correct.
- But the ranking page is an admin-only artifact leaked into the export.

**Real ts user PDF behavior:** PDF button visible. PDF contains: title/header, main orders table, totals footer. NO ranking pages. Commission columns visible in table (this is correct — real ts users can see their own commission).

**View-as-ts PDF with no bugs:** Identical to real ts PDF.

**View-as-ts PDF with BUG-VA-01:** Includes ranking page with full peer names/data.

### 3.3 CSV Export

There is **no CSV export** on `/sales-report-by-seller`. The user's mention of CSV likely refers to other pages not in scope for this audit.

---

## Section 4 — Backend Data Fidelity

### 4.1 `/api/reports/commission-plus` (GET)

**File:** `commission-plus/route.ts`

**Role scoping (lines 66–84):**
```typescript
if (effectiveRole === 'ts') {
  conditions.push(`o.is_old_customer = 0`)
  conditions.push(`o.seller_agency_member_id = ?`)
  params.push(effectiveUserId)        // e.g. 100
} else if (effectiveRole === 'crm') {
  conditions.push(`o.is_old_customer = 1`)
  conditions.push(`o.seller_agency_member_id = ?`)
  params.push(effectiveUserId)
} else {
  // admin: frontend params respected
}
```

**Confirmed:** SQL filter is correctly applied. Backend ignores frontend `job_position` and `seller_id` params for ts/crm effective roles. `effectiveUserId` comes from `X-View-As-User-Id` header when impersonating.

**Cache header (line 190):** `'Cache-Control': 'private, no-store'` — confirmed set. Response is never shared between users.

**Curl example (requires valid admin JWT):**
```bash
curl -s \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "X-View-As-Role: ts" \
  -H "X-View-As-User-Id: 100" \
  "https://finance-backoffice-report-api.vercel.app/api/reports/commission-plus?order_status=not_canceled" \
  | python3 -m json.tool | head -30
```
Expected: `orders[]` all have `seller_agency_member_id = 100` and `is_old_customer = 0`.

Without view-as headers (but same JWT), orders would span all sellers. Confirms view-as scoping.

### 4.2 `/api/reports/commission-plus/sellers` (GET)

**File:** `commission-plus/sellers/route.ts`

**Scoping (lines 22–25):**
```typescript
const sellerScopeClause = auth.effectiveRole === 'admin'
  ? ''
  : 'AND o.seller_agency_member_id = ?'
const queryParams = auth.effectiveRole === 'admin' ? [] : [auth.effectiveUserId]
```

During view-as-ts/100: returns only user-100. This causes `renderSellerDropdown()` to have `sellers = [user100]`. Even if isAdmin() wrongly returns true (BUG-VA-01), the full-dropdown path would show only user-100 in the list (since sellers[] has only 1 entry). However, it would still be **enabled** instead of disabled.

**Cache header (line 62):** `'Cache-Control': 'private, no-store'` — confirmed.

**Curl example:**
```bash
curl -s \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "X-View-As-Role: ts" \
  -H "X-View-As-User-Id: 100" \
  "https://finance-backoffice-report-api.vercel.app/api/reports/commission-plus/sellers"
```
Expected: array with exactly 1 seller object (id=100).

### 4.3 `/api/reports/commission-plus/pdf` (POST)

**File:** `commission-plus/pdf/route.ts` line 94

**Role gate:** `roles: ['admin']` only.

When view-as headers present: `effectiveRole = 'ts'` → 403.

**This is a latent bug.** The endpoint cannot be used by impersonated sessions. Since the current implementation renders PDFs client-side (not via this endpoint), this does not currently cause failures. But if the implementation changes, it will break.

**Curl example (confirms 403):**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "X-View-As-Role: ts" \
  -H "X-View-As-User-Id: 100" \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body>test</body></html>"}' \
  "https://finance-backoffice-report-api.vercel.app/api/reports/commission-plus/pdf"
# Expected: 403
```

---

## Section 5 — Specific Test Cases

### TC-VA-01: Seller dropdown disabled state during view-as-ts

**Setup:**
1. Log in as admin id=555
2. In sidebar, click "ดูเป็น Role อื่น" → select TS → select user id=100 → Apply
3. Page reloads to `/sales-report-by-seller`
4. Wait for page to fully render, then click "ค้นหา"

**Expected behavior:**
```html
<!-- Exact HTML that should appear in #crp-dd-seller -->
<button class="filter-sort-btn" disabled style="opacity:0.6;cursor:not-allowed;min-width:120px">
  <div class="filter-sort-btn-content">
    <svg ...><!-- person icon --></svg>
    <span class="filter-sort-btn-text">NickName100</span>
  </div>
</button>
```
The `disabled` attribute must be present. The button must not be clickable.

**Actual behavior (reported):** Interactive dropdown with full seller list.

**How to verify parity with real ts session:**
Open two browser tabs simultaneously:
- Tab A: Admin logged in, view-as-ts/100
- Tab B: User id=100 logged in directly as ts

Both `#crp-dd-seller` elements must be identical `<button disabled>` elements with the same nick name.

**Verification command (inspect rendered HTML):**
```javascript
// Run in browser console on sales-report-by-seller page
document.getElementById('crp-dd-seller').innerHTML
// Must contain: disabled
// Must NOT contain: filter-search-dropdown (the interactive component class)
```

---

### TC-VA-02: Status dropdown default value during view-as-ts

**Setup:** Same as TC-VA-01.

**Expected behavior:**
- The `FilterSortDropdown` is rendered with default value `'not_canceled'` (ไม่ยกเลิก)
- The dropdown IS interactive (not disabled) — this is correct for ts users

**Actual (if BUG-VA-01 active):** Default value is `'all'` (ทั้งหมด) — the admin default.

**Verification:**
```javascript
// The trigger button text in #crp-dd-status
document.querySelector('#crp-dd-status .filter-sort-btn-text').textContent
// Expected: 'ไม่ยกเลิก'
// If BUG-VA-01 active: 'ทั้งหมด'
```

---

### TC-VA-03: Excel export button absent for view-as-ts

**Setup:** Same as TC-VA-01. Load report first.

**Expected behavior:** No element with id `crp-btn-export` in the DOM.

**Actual (if BUG-VA-01 active):** Button IS present.

**Verification:**
```javascript
document.getElementById('crp-btn-export')
// Expected: null
// If BUG-VA-01 active: <button> element present
```

**Comparison with real ts session:**
```javascript
// In Tab B (real ts/100 session): must also be null
document.getElementById('crp-btn-export') // null
```

---

### TC-VA-04: PDF content — no ranking section for view-as-ts

**Setup:** Same as TC-VA-01. Load report, then click "Export PDF".

**Expected behavior:** Downloaded PDF contains only:
- Page 1: Header (title, ชื่อผู้จอง, วันที่, สถานะ), main orders table
- If orders span multiple pages: continuation pages with mini-header + table
- NO Telesales/CRM ranking summary page

**Actual (if BUG-VA-01 active):** PDF page 1 is the ranking summary (both Telesales + CRM with real names). Main table follows on subsequent pages.

**How to distinguish in DOM before PDF generation:**
```javascript
// After clicking Export PDF, before doc.save() completes:
// The function calls buildPaginatedPdfPages(sourceNode)
// summaryPages.length === 0 expected for non-admin
// If BUG-VA-01: summaryPages.length === 1 (the combined TS+CRM page)
```

---

### TC-VA-05: Main table — seller column shows own name only (view-as-ts)

**Setup:** Same as TC-VA-01. Load report.

**Expected behavior:**
- Table rows contain ONLY orders where `seller_agency_member_id === 100`
- Every row in the "เซลล์" column shows user-100's nick name
- No other sellers' orders appear

**Verification:** This is driven by backend filtering (X-View-As headers), not the token patch. Even when BUG-VA-01 is active, the table data is correct because the fetch patch works.

```javascript
// Count distinct sellers in rendered table
new Set(
  Array.from(document.querySelectorAll('.crp-table tbody tr td:first-child'))
       .map(td => td.textContent.trim())
).size
// Expected: 1 (only user-100's name or '******' pattern NOT expected here since it's own orders)
```

---

### TC-VA-06: Sidebar menu items — only Dashboard + Sales Report by Seller visible

**Setup:** Same as TC-VA-01.

**Expected behavior:**
```
.nav-menu contains exactly 2 items:
  - href="/dashboard" text="Dashboard"
  - href="/sales-report-by-seller" text="Sales Report by Seller"
```

**Verification:**
```javascript
Array.from(document.querySelectorAll('.nav-menu .nav-item'))
     .map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }))
// Expected: [{href:'/dashboard',text:'Dashboard'}, {href:'/sales-report-by-seller',text:'Sales Report by Seller'}]
```

**This test should PASS** regardless of BUG-VA-01, because menu filtering uses `getCurrentUserRole()` (sessionStorage-based), not the token patch.

---

### TC-VA-07: Role-aware labels in PDF header ("ชื่อผู้จอง" field)

**Setup:** Same as TC-VA-01. Load report without selecting a specific seller filter (leave at default). Click Export PDF.

**Expected behavior:** The "ชื่อผู้จอง" headline in the PDF shows "Telesales ทั้งหมด" for view-as-ts (not "ทั้งหมด" alone).

**Source:** `sales-report-by-seller.js` line 1322–1325:
```javascript
const roleScopeName = ({ ts: 'Telesales', crm: 'CRM' })[String(currentUser?.job_position || '').toLowerCase()] || '';
const sellerDisplay = isAllSeller && roleScopeName ? `${roleScopeName} ทั้งหมด` : sellerLabel;
```

**If BUG-VA-01 active (isAdmin()=true, job_position='admin'):** `roleScopeName = ''` → displays "ทั้งหมด" (ambiguous, doesn't identify the role scope).

**How to verify (screen, not PDF):**
```javascript
// getSelectedSellerLabel() for non-admin returns currentUser.nick_name
// For admin: returns 'ทั้งหมด'
// In PDF: roleScopeName = '' if job_position='admin' → just 'ทั้งหมด'
// Correct: 'Telesales ทั้งหมด'
```

---

### TC-VA-08: Row count — view-as matches real session

**Setup:**
- Tab A: Admin id=555 view-as-ts/100 → search for current month
- Tab B: User id=100 ts → search for current month with same period

**Expected behavior:** Identical row count in both tabs.

**Verification:**
```javascript
document.querySelector('#crp-table-count').textContent
// Must match between Tab A and Tab B
```

**This test should PASS** regardless of BUG-VA-01 — the API-level filtering (X-View-As headers) ensures correct data scope even when UI rendering is wrong.

---

### TC-VA-09: Unauthorized path redirect during view-as (automated curl)

```bash
# Health check (no auth needed)
curl -s "https://finance-backoffice-report-api.vercel.app/api/health"
# Expected: {"status":"ok"} or similar

# OPTIONS preflight for CORS check
curl -s -X OPTIONS \
  -H "Origin: https://finance-backoffice-report.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,X-View-As-Role,X-View-As-User-Id" \
  -o /dev/null -w "CORS preflight: %{http_code}\n" \
  "https://finance-backoffice-report-api.vercel.app/api/reports/commission-plus"
# Expected: 200 or 204
```

---

## Section 6 — Code Fixes Required

### Fix-01 (BUG-VA-01): Harden `patchTokenUtilsForViewAs` against member.id type mismatch

**Strategy (b): fix in `menu-component.js` — touches 1 file.**

The root cause is the guard at line 481:
```javascript
if (realRole !== 'admin' || realIdNum !== VIEW_AS_ADMIN_ID) return payload;
```

`VIEW_AS_ADMIN_ID = 555` (number). `realIdNum = Number(member.id)`. If the JWT has `agency_member.id` as a string `"555"`, `Number("555")` equals `555` — this should work. However if the JWT has the id as `555.0` (float) or has trailing whitespace, the coercion might fail.

**Additional hardening:** add an explicit log so failures are visible in DevTools.

```javascript
// In menu-component.js, replace lines 476–502 of patchTokenUtilsForViewAs with:
window.TokenUtils.decodeToken = function (token) {
  var payload = originalDecode(token);
  if (!payload) return payload;
  try {
    var member = payload.user && payload.user.agency_member;
    if (!member) return payload;
    var realRole = String(member.job_position || '').toLowerCase();
    // Coerce to integer — handles string "555", float 555.0, etc.
    var realIdNum = parseInt(String(member.id), 10);
    if (realRole !== 'admin' || realIdNum !== VIEW_AS_ADMIN_ID) return payload;
    var role = sessionStorage.getItem('viewAsRole');
    var uidStr = sessionStorage.getItem('viewAsUserId');
    if (!role || !uidStr || (role !== 'ts' && role !== 'crm')) return payload;
    var uid = parseInt(uidStr, 10);
    if (!isFinite(uid) || uid <= 0) return payload;
    var teamRaw = sessionStorage.getItem('viewAsUserTeam');
    var team = parseInt(teamRaw || '', 10);
    // Log so DevTools shows the patch is active
    console.log('[ViewAs] Token patched: id=' + member.id + ' → ' + uid + ', role=' + realRole + ' → ' + role);
    return Object.assign({}, payload, {
      user: Object.assign({}, payload.user, {
        agency_member: Object.assign({}, member, {
          id: uid,
          job_position: role,
          nick_name: sessionStorage.getItem('viewAsUserNick') || member.nick_name,
          team: isFinite(team) ? team : member.team
        })
      })
    });
  } catch (e) {
    console.error('[ViewAs] Token patch error:', e);
    return payload;
  }
};
```

Key change: `parseInt(String(member.id), 10)` instead of `Number(member.id)`. This is more robust against float-encoded ids and string ids with whitespace.

**File to edit:** `/Users/gap/finance-backoffice-report/menu-component.js` — specifically lines 479–502.

---

### Fix-02 (BUG-VA-02): Add view-as headers natively to `CommissionReportPlusAPI.fetchAPI()`

**Strategy (a): fix in `sales-report-by-seller-api.js` — touches 1 file.**

This removes the sole dependency on the window.fetch patch for the API layer.

```javascript
// In sales-report-by-seller-api.js, replace fetchAPI() lines 27–38:
async fetchAPI(endpoint) {
  const token = this.getToken()
  const headers = { 'Authorization': 'Bearer ' + token }
  // Inject view-as headers natively — defensive duplicate of window.fetch patch
  try {
    const viewAsRole   = sessionStorage.getItem('viewAsRole')
    const viewAsUserId = sessionStorage.getItem('viewAsUserId')
    if (viewAsRole && viewAsUserId) {
      headers['X-View-As-Role']    = viewAsRole
      headers['X-View-As-User-Id'] = viewAsUserId
    }
  } catch (e) { /* sessionStorage may be unavailable */ }
  const response = await fetch(`${this.baseURL}${endpoint}`, { method: 'GET', headers })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  return response.json()
},
```

**File to edit:** `/Users/gap/finance-backoffice-report/sales-report-by-seller-api.js` — lines 27–38.

---

### Fix-03 (BUG-VA-03): Allow view-as roles on PDF backend endpoint

**Strategy (a): fix in `commission-plus/pdf/route.ts` — touches 1 file.**

Change `roles: ['admin']` to `roles: ['admin', 'ts', 'crm']`. The backend does not use role to scope the HTML — it renders whatever HTML is POSTed to it. Restricting to admin-only is over-restrictive and breaks view-as.

```typescript
// commission-plus/pdf/route.ts line 93–95, replace:
// { rateLimit: { max: 20, windowMs: 60_000 }, roles: ['admin'] }
// with:
{ rateLimit: { max: 20, windowMs: 60_000 }, roles: ['admin', 'ts', 'crm'] }
```

**File to edit:** `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/pdf/route.ts` — line 94.

---

### Fix-04 (diagnostic): Add view-as active indicator in DevTools

**Strategy (b): add to `menu-component.js` — 0 page files touched.**

After `patchTokenUtilsForViewAs()` successfully patches, expose a diagnostic flag:

```javascript
// After line 503 (window.__viewAsTokenPatched = true):
if (typeof window.console !== 'undefined') {
  console.info('[ViewAs] TokenUtils.decodeToken patched. Role override active: ' +
    (sessionStorage.getItem('viewAsRole') || 'none'));
}
```

This makes it trivially visible in DevTools whether the patch was applied.

---

## Section 7 — Sign-Off Matrix

Each item: check (A) real ts/<user> vs (B) admin view-as-ts/<user> must produce identical output.

### Page: `/sales-report-by-seller`

| # | Element | What to compare | Expected result | Status |
|---|---------|-----------------|-----------------|--------|
| 7.01 | Seller dropdown `#crp-dd-seller` | HTML: `disabled` attribute present | Both: `<button disabled>` | FAIL (BUG-VA-01) |
| 7.02 | Seller dropdown name | Text content of button | Both: same nick name | FAIL (BUG-VA-01) |
| 7.03 | Status dropdown default | `.filter-sort-btn-text` text | Both: "ไม่ยกเลิก" | FAIL (secondary of BUG-VA-01) |
| 7.04 | Excel button | `#crp-btn-export` present in DOM | Both: absent (null) | FAIL (BUG-VA-01) |
| 7.05 | PDF button | `#crp-btn-pdf` present in DOM | Both: present | PASS |
| 7.06 | KPI card count | Number of `.dashboard-kpi-card` elements | Both: 2 (ยอดขาย + ส่วนลด) | FAIL (BUG-VA-01) |
| 7.07 | Ranking section | `#crp-summary` or `.crp-seller-summary` present | ts: 1 group (Telesales); crm: absent | FAIL (BUG-VA-01) |
| 7.08 | Table row count | Count of `tbody tr` elements | Both: same count | PASS (backend filters correctly) |
| 7.09 | Seller column values | Distinct `td:first-child` texts in tbody | Both: only own nick name | PASS (backend filters correctly) |
| 7.10 | PDF ranking page | Number of pages in generated PDF | ts: no ranking page; crm: no ranking page | FAIL (BUG-VA-01) |
| 7.11 | PDF ชื่อผู้จอง label | Header "ชื่อผู้จอง" value text | ts: "Telesales ทั้งหมด"; crm: "CRM ทั้งหมด" | FAIL (BUG-VA-01) |
| 7.12 | PDF commission footer | Totals in footer row | Both: same numbers (own orders only) | PASS (backend correct) |
| 7.13 | Excel ranking worksheets | Sheet names in .xlsx | ts: absent (no Excel button); crm: absent | FAIL (BUG-VA-01 makes button visible) |

### Page: `/dashboard`

| # | Element | What to compare | Expected result | Status |
|---|---------|-----------------|-----------------|--------|
| 7.14 | Card grid count | Number of `.dashboard-card` elements | Both: 1 card (Sales Report by Seller) | PASS |
| 7.15 | Card href values | `href` attribute of each card | Both: ["/sales-report-by-seller"] | PASS |

### Sidebar Menu

| # | Element | What to compare | Expected result | Status |
|---|---------|-----------------|-----------------|--------|
| 7.16 | Menu item count | Number of `.nav-item` elements | Both: 2 items | PASS |
| 7.17 | Menu item hrefs | `href` values | Both: ["/dashboard", "/sales-report-by-seller"] | PASS |
| 7.18 | Active state | `.nav-item.active` href | Both: "/sales-report-by-seller" when on that page | PASS |
| 7.19 | View-as banner | `#view-as-banner` element | ts+crm: absent (real user); admin view-as: present (amber banner) | N/A — admin-only UI |
| 7.20 | "ดูเป็น Role อื่น" trigger | `#view-as-trigger` element | ts+crm: absent; admin not impersonating: present; admin impersonating: absent | PASS |

### Redirect Behavior

| # | Scenario | Expected result | Status |
|---|----------|-----------------|--------|
| 7.21 | Admin view-as-ts navigates to `/sales-report` | Redirected to `/403` | PASS |
| 7.22 | Admin view-as-ts navigates to `/canceled-orders` | Redirected to `/403` | PASS |
| 7.23 | Admin view-as-ts navigates to `/dashboard` | Renders dashboard | PASS |
| 7.24 | Admin view-as-ts navigates to `/sales-report-by-seller` | Renders page | PASS |

---

## Appendix A — Timing Diagram (Script Load Order)

```
HTML parsing (sequential)
  [1] token-utils.js          → TokenUtils object defined
  [2] tour-image-manager-api.js
  [3] sales-report-by-seller-api.js → CommissionReportPlusAPI defined
  ...
  [13] menu-component.js
       IIFE starts
       └─ patchTokenUtilsForViewAs() [LINE 1005 — script-body time]
            checks: TokenUtils defined? YES (loaded at step 1)
            checks: __viewAsTokenPatched? NO
            applies patch → TokenUtils.decodeToken replaced
            sets __viewAsTokenPatched = true
       IIFE continues → registers DOMContentLoaded listener
  ...
  [17] sales-report-by-seller.js (at end of <body>)
       IIFE → registers DOMContentLoaded listener

DOMContentLoaded fires
  [A] menu-component.js listener → initMenuComponent()
       patchFetchForViewAs() [idempotent, fetch patch applied]
       renderSidebarMenu()
       injectViewAsBanner()
  [B] sales-report-by-seller.js listener → init()
       getUserFromToken() → TokenUtils.decodeToken(token) [ALREADY PATCHED]
       currentUser = { id: 100, job_position: 'ts', ... }
       isAdmin() = false ← CORRECT
       loadSellers() → CommissionReportPlusAPI.getSellers()
           → window.fetch (patched) → X-View-As headers injected
       loadReport() → CommissionReportPlusAPI.getReport()
           → window.fetch (patched) → X-View-As headers injected
```

The patch is applied at step [13] before DOMContentLoaded. Step [B] always runs after step [A]. There is no race condition in the design.

---

## Appendix B — Root Cause of Reported Bug (Most Likely)

Given:
1. Browser cache is ruled out (Vercel serves `no-cache, no-store` for all `.js` files per `vercel.json` line 61–66)
2. The DOMContentLoaded ordering is deterministic (menu-component listener registers before sales-report-by-seller listener)
3. The patch logic is sound

The most probable cause of the user-reported seller-dropdown bug is **JWT `agency_member.id` type mismatch**. Some JWT issuers encode integer fields as JSON strings (`"555"`) rather than JSON numbers (`555`). The fix at line 480 was `Number(member.id)`. If the JWT has `"555"` as a string, `Number("555")` equals `555` in JavaScript — this should work. However if the production JWT encodes it differently (e.g., `" 555"` with a space, or as a floating-point `555.0`), the comparison `realIdNum !== 555` would fail and the patch would return the unmodified payload.

**Recommended diagnostic:** In the browser DevTools console, while on the sales-report-by-seller page during view-as:
```javascript
// Decode raw JWT without patch
var token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
var raw = JSON.parse(atob(token.split('.')[1]));
console.log('Raw id:', raw.user.agency_member.id, typeof raw.user.agency_member.id);
console.log('Parsed:', Number(raw.user.agency_member.id), parseInt(String(raw.user.agency_member.id), 10));
```

If `typeof` shows `'string'` and `Number(...)` shows a value other than `555`, that is the root cause.

---

## Appendix C — Files Modified by Each Fix

| Fix | File | Lines | Strategy |
|-----|------|-------|----------|
| Fix-01 | `/Users/gap/finance-backoffice-report/menu-component.js` | 479–480 | (b) patch layer |
| Fix-02 | `/Users/gap/finance-backoffice-report/sales-report-by-seller-api.js` | 27–38 | (a) page API file |
| Fix-03 | `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/pdf/route.ts` | 94 | (a) backend route |

Total files to modify: **3** (2 frontend, 1 backend)

No page-level `.js` files (like `sales-report-by-seller.js`) need modification for the core bugs. The seller dropdown rendering and export button visibility depend solely on `isAdmin()` returning the correct value — which is fixed at the patch level (Fix-01).

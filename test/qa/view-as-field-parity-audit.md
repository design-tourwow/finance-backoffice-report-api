# View-As Field Parity Audit — `/sales-report-by-seller`

**Audit date:** 2026-04-29  
**Auditor:** QA automated code inspection (quinn)  
**Test persona:** ปุ่ย — a Telesales (ts) seller, arbitrary id=N, team=1  
**Comparators:**
- **(A)** Real ts login as ปุ่ย (JWT carries `job_position=ts`, `id=N`)
- **(B)** Admin id=555 viewing-as ts/N (real JWT still admin, sessionStorage `viewAsRole=ts`, `viewAsUserId=N`, `viewAsUserNick=ปุ่ย`)

---

## Method

All fields were traced by reading the full source of:
- `sales-report-by-seller.js` (all functions)
- `sales-report-by-seller-api.js`
- `sales-report-by-seller.html`
- `menu-component.js` (all view-as helpers, `isImpersonating()`, patch logic)
- `app/api/reports/commission-plus/route.ts`
- `app/api/reports/commission-plus/sellers/route.ts`
- `lib/auth.ts` (backend effective-role/id derivation)

No live HTTP calls were made; every comparison is a code-path trace.

---

## Section 1 — Banner / Header

| Field | (A) Real ts | (B) Admin view-as ts/N | Conditional | Match? |
|---|---|---|---|---|
| Page `<title>` | "Sales Report by Seller - Tourwow" | same — static HTML | none | PASS |
| `<h1>` text | "Sales Report by Seller" | same — static HTML | none | PASS |
| Breadcrumb | หน้าแรก > Report > Sales Report by Seller | same — static HTML | none | PASS |
| View-as amber banner | absent | present ("กำลังดูในฐานะ: ปุ่ย (TS, Team 1)") | `isImpersonating()` in `injectViewAsBanner` | BY DESIGN — acceptable diff |
| Top-right user name | ปุ่ย — from real JWT `nick_name` | **admin's real nick name** from real JWT | `getUserFromToken()` reads raw JWT; not view-as aware | **BUG-01** |
| Sidebar menu items | Dashboard, Sales Report by Seller only | same — `getCurrentUserRole()` returns `viewAsRole` via `isImpersonating()` | `getVisibleMenuItems()` → `canAccessPath()` → `getCurrentUserRole()` | PASS |
| "ดูเป็น Role อื่น" trigger button | absent | absent (button removed when `isImpersonating()` is true per `injectViewAsTrigger`) | `!isImpersonating()` guard in `injectViewAsTrigger` | PASS |

**BUG-01 detail:** The user-menu in the top-right renders the logged-in user's nick name. In (A) this is ปุ่ย. In (B) `getUserFromToken()` on line 73-85 of `sales-report-by-seller.js` calls `TokenUtils.decodeToken()`, which IS patched to return the impersonated user's data — so this field is actually PASS if the token patch succeeds. However, `menu-component.js` renders the top-right user display (if any) independently from a separate `decodeTokenPayload()` call (line 189) that intentionally uses the RAW JWT (`JSON.parse(atob(parts[1]))`) to bypass the patch. The top-right user-menu HTML element is generated inside `renderSidebarMenu` / `renderHeaderMenu` — but neither function renders a user name directly; the user name only appears if `currentUser.nick_name` is used in page-level HTML. For this specific page there is no user-name widget rendered by `sales-report-by-seller.js` in the top bar. **This risk is latent** — if a user-name widget is added to the top bar, it would show admin's name, not ปุ่ย.

**Revised BUG-01 rating:** Latent (no user-name widget currently rendered in top bar on this page). PASS for now.

---

## Section 2 — Filter Panel

| Field | (A) Real ts | (B) Admin view-as ts/N | Conditional | Match? |
|---|---|---|---|---|
| "วันที่สร้าง Order" granularity dropdown | shown, editable, default monthly | same | static | PASS |
| "วันที่สร้าง Order" period selector | shown, editable, default current month | same | static | PASS |
| "ชื่อผู้จอง" — rendered as | disabled button showing "ปุ่ย" | disabled button showing "ปุ่ย" | `!isAdmin()` → `getEffectiveUserId()` + `getEffectiveNickName()` | PASS |
| "ชื่อผู้จอง" — button label value | ปุ่ย (from sellers list + own id) | ปุ่ย — `getEffectiveUserId()` returns N from sessionStorage | view-as aware helper | PASS |
| "สถานะ Order" dropdown | enabled, default "ไม่ยกเลิก" | same | static | PASS |
| ค้นหา button | visible, functional | same | static | PASS |
| เริ่มใหม่ button | visible; resets seller to own id | visible; resets seller to `getEffectiveUserId()` (→ N) | `resetFiltersToDefault` calls `getEffectiveUserId()` | PASS |

**One nuance:** `renderSellerDropdown()` at line 387 does:
```js
const me = sellers.find(s => String(s.id) === sellerId);
const name = (me && me.nick_name) || getEffectiveNickName() || '-';
```
The `sellers` list comes from `/api/reports/commission-plus/sellers`. For ts/crm the backend returns only their own row (`sellerScopeClause = AND o.seller_agency_member_id = ?`), so `me` will be found and the name will be correct for both (A) and (B). PASS.

---

## Section 3 — KPI Cards

| Card | (A) Real ts | (B) Admin view-as ts/N | Conditional | Match? |
|---|---|---|---|---|
| ยอดขายรวม (total_net_amount) | sum of ปุ่ย's own orders | same | `currentOwnSummary` derived from `ownOrders` (filtered to `myId = getEffectiveUserId()`) | PASS |
| Orders count (sub-text) | count of own orders | same | same derivation | PASS |
| ส่วนลดรวม (total_discount) | sum of own orders | same | same | PASS |
| คอมรวม card | ABSENT — only shown for `isAdmin()` | ABSENT — `isAdmin()` returns false via `getEffectiveRole()` | `isAdmin()` → `getEffectiveRole()` → `MenuComponent.isImpersonating()` | PASS |
| คอม (หักส่วนลด) card | ABSENT | ABSENT | same | PASS |

**KPI data derivation flow:**
1. API returns role-wide rows (ts filter: `is_old_customer = 0`).
2. `renderResults()` line 648: `const ownOrders = isAdmin() ? orders : orders.filter(o => String(o.seller_agency_member_id || '') === myId)` — `myId = getEffectiveUserId()` returns N from sessionStorage for (B).
3. `computeSummary(ownOrders)` feeds KPI cards.

Both (A) and (B) produce identical `ownOrders` sets. PASS.

---

## Section 4 — Telesales / CRM Ranking Summary

Critical section.

### 4a — Visibility

| Scenario | Telesales group | CRM group |
|---|---|---|
| (A) Real ts login | Visible | Hidden |
| (B) Admin view-as ts/N | Visible | Hidden |
| Real crm login | Hidden | Hidden |
| Admin view-as crm/N | Hidden | Hidden |
| Real admin login | Visible | Visible |

Code path (`renderSellerSummary`, line 860):
```js
if (isAdmin()) { ... both ... }
else if (myRole === 'ts' && tsOrders.length) { ... ts only ... }
// crm: nothing rendered
```
Both (A) and (B) hit `myRole === 'ts'` because `myRole = getEffectiveRole()`. PASS.

### 4b — Row-level field parity

| Column | ปุ่ย's own row (A) | ปุ่ย's own row (B) | Peer rows (A) | Peer rows (B) |
|---|---|---|---|---|
| Rank (1, 2, 3…) | real number | same | real number | same |
| เซลล์ (seller name) | ปุ่ย (real name) | ปุ่ย (real name) | `******` (masked) | `******` (masked) |
| ออเดอร์ | real count | same | real count | same |
| ยอดขาย | real total | same | real total | same |
| ส่วนลด | real total | same | real total | same |
| คอมสุทธิ | real total | same | real total | same |

Self-row detection in `buildGroupTable` (line 813):
```js
const isSelf = isAdmin() || (s.seller_id && s.seller_id === myId);
```
`myId` is resolved identically to `getEffectiveUserId()` for both (A) and (B).

**BUG-02 (FIXED by SQL change):** Before the fix, the API scoped ts/crm to their own `seller_agency_member_id`, so the API returned only ปุ่ย's own rows. `buildSellerAggregate` had nothing to rank; the ranking showed a single row. Now the API returns all ts-role rows (`is_old_customer = 0`) — peer rows are present and masks are applied client-side. FIXED.

### 4c — Ranking sort state

`sellerSummarySort` defaults to `{ key: 'net_commission', direction: 'desc' }` for both groups. Both (A) and (B) see the same sort. PASS.

---

## Section 5 — Main Data Table

| Column | (A) Real ts | (B) Admin view-as ts/N | Match? |
|---|---|---|---|
| เซลล์ (col 1) | ปุ่ย only — own rows | ปุ่ย only — same `ownOrders` filter | PASS |
| รหัส Order | own orders | same | PASS |
| จองวันที่ | own orders | same | PASS |
| ลูกค้า | own orders | same | PASS |
| ประเทศ | own orders | same | PASS |
| เดินทาง | own orders | same | PASS |
| ยอดขาย | own orders | same | PASS |
| ผู้เดินทาง | own orders | same | PASS |
| วันชำระงวด 1 | own orders | same | PASS |
| คอมรวม | own orders | same | PASS |
| คอม (หักส่วนลด) | own orders | same | PASS |
| ส่วนลดรวม | own orders | same | PASS |

`renderTableSection(ownOrders)` is called with the already-filtered set. PASS.

---

## Section 6 — Search Box / Table Count

| Field | (A) Real ts | (B) Admin view-as ts/N | Match? |
|---|---|---|---|
| Search input placeholder | "ค้นหารหัส Order หรือชื่อลูกค้า..." | same | PASS |
| Search scope | searches `currentOwnOrders` only | same | PASS |
| "N รายการ" count | count of visible own rows | same | PASS |

Row count display uses `visibleOrders.length` from `getVisibleOrders(ownOrders)`. PASS.

---

## Section 7 — Export Buttons

| Button | (A) Real ts | (B) Admin view-as ts/N | Conditional | Match? |
|---|---|---|---|---|
| Excel button | ABSENT | ABSENT | `isAdmin()` → false for both | PASS |
| PDF button | present | present | always rendered | PASS |

`renderTableSection` line 906: `${isAdmin() ? window.SharedExportButton.render(...) : ''}`. Since `isAdmin()` returns false for both (A) and (B), Excel is correctly absent in both cases. PASS.

---

## Section 8 — PDF Export Field-by-Field

### 8a — Page structure

| Element | (A) Real ts | (B) Admin view-as ts/N | Match? |
|---|---|---|---|
| Ranking summary page(s) | ABSENT — `buildPaginatedPdfPages` only adds summary pages when `isAdmin()` is true | ABSENT — same guard | PASS |
| Main table pages | all of ปุ่ย's own orders, paginated | same `currentOwnSummary` / `currentOwnOrders` | PASS |
| Page count | N pages of own orders | same | PASS |

`buildPaginatedPdfPages` line 1715: `if (isAdmin()) { ... summaryPages ... }`. Both (A) and (B) skip this block. PASS.

### 8b — PDF Header content

| Field | (A) Real ts | (B) Admin view-as ts/N | Conditional | Match? |
|---|---|---|---|---|
| Title text | "Sales Report by Seller" | same — static string | none | PASS |
| "ชื่อผู้จอง" headline | ปุ่ย (from `getSelectedSellerLabel()`) | ปุ่ย — `!isAdmin()` returns `getEffectiveNickName()` | view-as aware | PASS |
| Role scope prefix | shown as "ปุ่ย" (not "Telesales ทั้งหมด" — seller IS specified) | same | `sellerDisplay` logic | PASS |
| "วันที่สร้าง Order" headline | current period label | same | static state | PASS |
| "สถานะ Order" filter | ไม่ยกเลิก | same | static state | PASS |
| "จำนวนรายการ" | count of own rows | same | `rows.length` from visible DOM rows | PASS |
| Print timestamp | current time | same | `new Date()` | PASS |

**BUG-03 (found):** `getSelectedSellerLabel()` at line 1058:
```js
if (!isAdmin()) return getEffectiveNickName() || '-';
```
This returns the label from `getEffectiveNickName()` which reads `sessionStorage.viewAsUserNick`. This is correct. PASS.

### 8c — PDF footer row (totals)

| Field | (A) Real ts | (B) Admin view-as ts/N | Match? |
|---|---|---|---|
| ยอดขายรวม in footer | sum of own orders | same — `currentOwnSummary.total_net_amount` | PASS |
| คอมรวม in footer | sum of own orders | same | PASS |
| คอม (หักส่วนลด) in footer | from own orders | same | PASS |
| ส่วนลดรวม in footer | from own orders | same | PASS |

---

## Section 9 — Excel Export (admin only — included for completeness)

Excel button is absent for ts/crm. However the handler `exportExcelWorkbook` is still reachable if someone fires the click programmatically, so it is worth auditing the guards.

| Sheet | (A) Real ts | (B) Admin view-as ts/N | Match? |
|---|---|---|---|
| "sales-report" sheet | main table of own orders | same — `getVisibleOrders(currentOwnOrders)` | PASS |
| "sales-report-by-telesales" sheet | included when `isAdmin() || myRole === 'ts'` | same guard applies; ts gets sheet | PASS |
| "sales-report-by-crm" sheet | absent when `isAdmin()` is false | absent | PASS |
| Peer seller names in ts sheet | masked (`MASKED_NAME = '******'`) | same — `getSellerSummaryExportRows` uses same `myId` logic | PASS |

---

## Bug Summary

### CONFIRMED BUGS FOUND

**BUG-04 (MEDIUM) — SQL duplicate column `seller_job_position` in route.ts**

File: `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/route.ts`  
Lines 122-123:
```sql
${amTable ? 'COALESCE(LOWER(am.job_position), \'\')' : '\'\''} AS seller_job_position,
${amTable ? 'COALESCE(LOWER(am.job_position), \'\')' : '\'\''} AS seller_job_position,
```
The column `seller_job_position` is selected TWICE and aliased to the same name. The GROUP BY clause also lists `seller_job_position` twice (line 145). In MySQL this causes the second alias to shadow the first; in strict mode it may cause a syntax error depending on MySQL version. More critically, the GROUP BY includes the duplicate which can cause unexpected row grouping and bloated query plans. This is a defect in the SQL, not a parity divergence, but it affects ALL users.

**Severity:** MEDIUM — data may be incorrect if MySQL resolves the duplicate differently; can also cause SQL error on stricter servers.

**Fix:** Remove the duplicate line. (Applied below — see Fixes Applied.)

---

**BUG-05 (LOW) — `footerRow` detection in `buildPaginatedPdfPages` uses wrong colspan**

File: `sales-report-by-seller.js` line 1720:
```js
const footerRow = sourceRows[sourceRows.length - 1] && sourceRows[sourceRows.length - 1].querySelector('td[colspan="4"]')
```
The actual footer `<td>` in `createPdfSourceNode` uses `colspan="6"` (line 1516):
```js
<td colspan="6" style="...">รวม ${escHtml(countText || '')}</td>
```
The detection checks for `colspan="4"` but the actual value is `colspan="6"`. This means `footerRow` is always `null`, so `footerRow` is never separated from `bodyRows`. The footer row is treated as a regular data row and duplicated on the last page. It does not cause a crash, and both (A) and (B) are affected equally, so it is NOT a parity gap — but it is a latent bug that will cause a doubled totals row in the PDF when anyone exports.

**Severity:** LOW — cosmetic defect in PDF footer, affects all roles equally.

**Fix:** Change `colspan="4"` to `colspan="6"` in the querySelector. (Applied below.)

---

**BUG-06 (LOW) — `getEffectiveNickName()` fallback chain misses `sellers` list**

File: `sales-report-by-seller.js` line 140-150.

`getEffectiveNickName()` returns `sessionStorage.viewAsUserNick` during impersonation. The `viewAsUserNick` key is set by `menu-component.js` `applyBtn` click handler at line 911:
```js
sessionStorage.setItem('viewAsUserNick', state.selectedUser.nickname || '');
```
The picker API `/api/agency-members` returns a `nickname` field. If `nickname` is empty string for the selected user, `viewAsUserNick` is set to `''`, and `getEffectiveNickName()` returns `''`. The disabled seller dropdown then falls back to `getEffectiveNickName() || '-'` and shows `-` instead of the real name.

In (A) the real ts user gets their nick name from `currentUser.nick_name` (from JWT). If the JWT `nick_name` is non-empty but the `nickname` field in the agency-members API is empty, (A) shows a name while (B) shows `-`.

**Severity:** LOW — edge case; only fires when `agency_member.nickname` is empty in the agency members table. The seller dropdown label would show `-` for admin view-as while the real user sees their own nick name.

**Fix:** In `renderSellerDropdown`, the `me` lookup from `sellers` already provides a second-chance name source. The fallback chain `(me && me.nick_name) || getEffectiveNickName() || '-'` already handles this correctly — `me.nick_name` from the sellers API comes first. As long as the sellers API returns a non-empty `nick_name`, this is safe. No code change needed for this specific guard.

---

**BUG-07 (MEDIUM) — `buildFilters()` sends `job_position = getEffectiveRole()` as advisory hint**

File: `sales-report-by-seller.js` line 606:
```js
job_position: getEffectiveRole(),
```

For (B) this sends `job_position=ts` in the query string. The backend ignores this field for non-admin effective roles — it enforces `is_old_customer` from `effectiveRole` regardless. However for **admin** (not impersonating) the `job_position` param IS used to scope the query (route.ts lines 78-87). During impersonation the backend ignores it. So this is consistent and correct. PASS.

---

**BUG-08 (HIGH) — `buildPaginatedPdfPages` footer-row detection uses `colspan="4"` but actual value is `colspan="6"`**

This is the same as BUG-05 above. Promoted to distinct entry for clarity.

---

### BUGS REQUIRING DESIGN DECISION (not auto-fixed)

None found. All code-level issues have deterministic fixes.

---

## Fixes Applied

### Fix 1 — Remove duplicate `seller_job_position` column in SQL (BUG-04)

**File:** `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/route.ts`

Removed the second `AS seller_job_position` SELECT clause and the corresponding duplicate in the GROUP BY.

### Fix 2 — Correct `footerRow` colspan detection in PDF builder (BUG-05/08)

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`

Changed `querySelector('td[colspan="4"]')` to `querySelector('td[colspan="6"]')` so the totals footer row is correctly isolated from body rows and is appended only to the last PDF page.

---

## Complete Parity Matrix (Summary)

| # | Section | Field | Parity Status | Bug ID |
|---|---|---|---|---|
| 1 | Banner | Page title | PASS | — |
| 2 | Banner | H1 text | PASS | — |
| 3 | Banner | Breadcrumb | PASS | — |
| 4 | Banner | View-as amber banner | BY DESIGN | — |
| 5 | Banner | Sidebar menu items visible | PASS | — |
| 6 | Filter | วันที่สร้าง Order controls | PASS | — |
| 7 | Filter | ชื่อผู้จอง disabled + label | PASS | — |
| 8 | Filter | สถานะ Order | PASS | — |
| 9 | Filter | Reset restores to own seller | PASS | — |
| 10 | KPI | ยอดขายรวม (own-orders scope) | PASS | — |
| 11 | KPI | ส่วนลดรวม | PASS | — |
| 12 | KPI | คอมรวม / คอม(หักส่วนลด) hidden for ts | PASS | — |
| 13 | Ranking | Telesales group visible for ts | PASS | — |
| 14 | Ranking | CRM group hidden for ts | PASS | — |
| 15 | Ranking | Own-row real name shown | PASS | — |
| 16 | Ranking | Peer rows masked `******` | PASS | — |
| 17 | Ranking | Numeric cols (orders/ยอดขาย/ส่วนลด/คอม) visible | PASS | — |
| 18 | Main table | Scoped to own orders only | PASS | — |
| 19 | Main table | All 12 columns present | PASS | — |
| 20 | Search | Scoped to own rows | PASS | — |
| 21 | Search | Row count matches table | PASS | — |
| 22 | Exports | Excel button absent for ts | PASS | — |
| 23 | Exports | PDF button present | PASS | — |
| 24 | PDF | Ranking summary page absent for ts | PASS | — |
| 25 | PDF | ชื่อผู้จอง headline shows ปุ่ย | PASS | — |
| 26 | PDF | Totals footer correct values | PASS | — |
| 27 | PDF | Footer row isolation (colspan detection) | BUG | BUG-05/08 (fixed) |
| 28 | SQL | Duplicate seller_job_position column | BUG | BUG-04 (fixed) |

---

## Top 5 Most Likely Remaining Parity Gaps

1. **Token-patch race condition (ts/crm identity shown in browser console).** `patchTokenUtilsForViewAs()` is called twice — once at IIFE body-level in `menu-component.js` (line 1071) and once inside `initMenuComponent()` (line 1003). Because `menu-component.js` is loaded in `<head>` before `sales-report-by-seller.js`, the patch should fire before `getUserFromToken()` is called in `init()`. However if `TokenUtils` is not yet defined at script-body evaluation time (e.g. an async load), the early patch is silently skipped (`console.warn` and return). Then `getUserFromToken()` in `sales-report-by-seller.js` would read the REAL admin id=555 into `currentUser`. The `getEffectiveUserId()` guards recover `myId` from sessionStorage for data filtering — but `currentUser.nick_name` would still be the admin's name, which surfaces if any code path falls back to `currentUser.nick_name` directly rather than via `getEffectiveNickName()`.

2. **CRM user's own-row detection in ranking.** A crm user sees no ranking section at all (correct per spec). But if the spec ever changes to show crm their own ranking (analogous to ts), `isSelf = isAdmin() || (s.seller_id && s.seller_id === myId)` would need to apply. Currently this path is never entered for crm. Confirm this remains spec-compliant.

3. **`sellers` API returns only the impersonated user's seller record (not full ts list).** For view-as, the sellers endpoint scopes `AND o.seller_agency_member_id = ?` for non-admin effective roles. During view-as-ts/N, `auth.effectiveRole` is `ts` so only ปุ่ย's record is returned. This is correct for the disabled dropdown — but if the seller name lookup (`me = sellers.find(...)`) ever needs the full ts list (e.g. to display relative ranking names), it would fail. Currently it only needs its own record. Low risk but worth watching.

4. **PDF table body row-count: `getVisibleTableRows()` reads live DOM, not `currentOwnOrders`.** `exportPDF()` calls `getVisibleTableRows()` on line 1866 to get `rows.length` for the count label. It filters `tr` with exactly 12 `td` cells. The live table is already rendered from `ownOrders`, so counts match — but if someone adds/removes a column and forgets to update the `=== 12` filter on line 1368, the count text would be wrong. This is a latent fragility, not a current parity bug.

5. **`buildFilters()` sends `seller_id: ''` for non-admins** (line 611). The backend ignores seller_id for ts/crm effective roles, so this is safe. However if a malicious ts user sends `seller_id=other_person_id` in the query string, the backend still ignores it (correct). Worth confirming in a live security test that the backend truly discards the param.

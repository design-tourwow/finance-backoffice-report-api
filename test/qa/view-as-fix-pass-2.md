---
audit: view-as-fidelity-fix-pass-2
date: 2026-04-29
auditor: Quinn (QA Engineer, BMM)
pass: 2
status: complete
---

# View-As Fix Pass 2 — Summary

## Quick Index

| ID | Severity | Status | File | Line | Description |
|----|----------|--------|------|------|-------------|
| BUG-VA-P2-01 | CRITICAL | FIXED | `sales-report-by-seller.js` | 88–119 | `isAdmin()` not view-as aware — bypassed by introducing `getEffectiveRole()` |
| BUG-VA-P2-02 | HIGH | FIXED | `sales-report-by-seller.js` | 739 | `myRole` in `renderSellerSummary` read from `currentUser` directly — now uses `getEffectiveRole()` |
| BUG-VA-P2-03 | HIGH | FIXED | `sales-report-by-seller.js` | 976 | `myId` in `renderSellerSummary` read from `currentUser` — now falls back to `sessionStorage.viewAsUserId` |
| BUG-VA-P2-04 | HIGH | FIXED | `sales-report-by-seller.js` | 912 | Same `myId` fallback for `getSellerSummaryExportRows()` |
| BUG-VA-P2-05 | MEDIUM | FIXED | `sales-report-by-seller.js` | 913 | `myRole` in `exportExcelWorkbook()` read from `currentUser` — now uses `getEffectiveRole()` |
| BUG-VA-P2-06 | MEDIUM | FIXED | `sales-report-by-seller.js` | 1356 | `roleScopeName` for PDF header read from `currentUser.job_position` — now uses `getEffectiveRole()` |
| BUG-VA-P2-07 | MEDIUM | FIXED | `sales-report-by-seller.js` | 577 | `job_position` param sent to API read from `currentUser` — now uses `getEffectiveRole()` |
| BUG-VA-P2-08 | LOW | FIXED | `menu-component.js` | 1012–1060 | No diagnostic log to confirm view-as patch state in DevTools |
| BUG-VA-P2-09 | LOW | VERIFIED-OK | `sales-report-by-seller.js` | 785 | `renderSellerSummary` `else if` branch — initially flagged but code was already correct (`else if (myRole === 'ts' && tsOrders.length)`) |

---

## Root Cause Confirmed

The user-reported symptoms (seller dropdown enabled, Excel button visible, both ranking boxes shown for crm) are all downstream of a single structural problem:

**`isAdmin()` was not view-as aware.** It read `currentUser.job_position` — set by `getUserFromToken()` → `TokenUtils.decodeToken`. The token patch in `menu-component.js` rewrites the decoded payload correctly, but if the patch fires after `getUserFromToken()` (race) or is silently skipped (guard mismatch on `member.id`), `currentUser.job_position` remains `'admin'` and every `isAdmin()` call returns `true`.

**The old design had a single point of failure** — the token patch. If it failed for any reason, all 12+ downstream UI guards failed simultaneously with no fallback.

**The new design** adds a second, independent path via `MenuComponent.isImpersonating()` which reads `sessionStorage.viewAsRole` and validates the real JWT directly (not the patched one). This is inherently immune to token-patch issues.

---

## Changes Applied

### 1. `getEffectiveRole()` — new function (CRITICAL)

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** lines 88–110 (inserted before `isAdmin()`)

**What it does:**
- Calls `MenuComponent.isImpersonating()` — this reads `sessionStorage.viewAsRole` and validates that the real JWT user is admin id=555. It does NOT rely on the token patch.
- If impersonation is confirmed active, returns `sessionStorage.getItem('viewAsRole')` directly.
- Falls back to `currentUser.job_position` (the possibly-patched token value) if not impersonating.
- Falls back to `'admin'` if `currentUser` is null.

**Why this is the correct fix:**
`MenuComponent.isImpersonating()` is already used by the sidebar menu and page-access guard (both work correctly per the existing audit). By reusing the same mechanism in `getEffectiveRole()`, page-level role logic joins the same trusted path.

---

### 2. `isAdmin()` — rewritten to use `getEffectiveRole()`

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** lines 112–119

Old:
```javascript
function isAdmin() {
  return !currentUser || currentUser.job_position === 'admin';
}
```

New:
```javascript
function isAdmin() {
  const role = getEffectiveRole();
  return role !== 'ts' && role !== 'crm';
}
```

**Impact:** All existing callers of `isAdmin()` now automatically get view-as-correct behavior. No caller changes required. Callers include:
- `renderSellerDropdown()` — seller dropdown disabled/enabled
- `initFilters()` — status dropdown default value, selectedSellerId default
- `resetFiltersToDefault()` — same
- `renderResults()` — ownOrders / ownSummary scoping
- `renderSummary()` — admin-only KPI cards
- `renderTableSection()` — Excel export button visibility
- `buildPaginatedPdfPages()` — ranking page in PDF
- `getSellerSummaryExportRows()` — peer name masking in Excel
- `getSelectedSellerLabel()` — seller label for PDF header

---

### 3. `renderSellerSummary()` — `myRole` migrated to `getEffectiveRole()`

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** line ~752 (was `const myRole = String(currentUser?.job_position || '').toLowerCase()`)

**Why:** When the token patch fails, `currentUser.job_position = 'admin'`. The `else if (myRole === 'ts' && tsOrders.length)` branch would then be false — admin view-as-ts would see NO ranking section (wrong behavior; ts should see Telesales ranking). Now `myRole = getEffectiveRole()` returns `'ts'` reliably.

---

### 4. `renderSellerSummary()` — `myId` sessionStorage fallback

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** line ~738 (inside `renderSellerSummary`)

**Why:** `isSelf = isAdmin() || (s.seller_id === myId)`. With `isAdmin()` now returning false during view-as, `myId` must correctly be the impersonated user's id (e.g., 100) — not admin id=555. When the token patch fails, `currentUser.id` is still 555. The fallback reads `parseInt(sessionStorage.getItem('viewAsUserId'), 10)` when impersonation is confirmed.

---

### 5. `getSellerSummaryExportRows()` — same `myId` fallback

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** line ~975

Same rationale — Excel export row masking uses `isSelf` check; needed same fallback.

---

### 6. `exportExcelWorkbook()` — `myRole` migrated

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** line ~913

`const myRole = getEffectiveRole()` (was `currentUser?.job_position`). Used for the `if (isAdmin() || myRole === 'ts')` worksheet-inclusion check. Since the Excel button itself is now hidden for ts via the fixed `isAdmin()`, this is defense-in-depth — if somehow the button becomes accessible, the ts-ranking sheet mask logic still works.

---

### 7. PDF `roleScopeName` — migrated to `getEffectiveRole()`

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** line ~1356

`const roleScopeName = ({ ts: 'Telesales', crm: 'CRM' })[getEffectiveRole()] || ''`

Previously read `currentUser?.job_position`. When patch fails, this was `'admin'` → `roleScopeName = ''` → PDF header shows "ทั้งหมด" instead of "Telesales ทั้งหมด". Now fixed.

---

### 8. `buildFilters()` — `job_position` param migrated

**File:** `/Users/gap/finance-backoffice-report/sales-report-by-seller.js`  
**Location:** line ~577

`job_position: getEffectiveRole()` (was `currentUser?.job_position || 'admin'`). Advisory parameter sent to the API. Backend enforces scoping via `X-View-As-*` headers regardless, but fixing this removes a confusing discrepancy between what the API receives and what the UI shows.

---

### 9. `console.table` diagnostic in `menu-component.js`

**File:** `/Users/gap/finance-backoffice-report/menu-component.js`  
**Location:** lines 1012–1060, inside `initMenuComponent()` after `injectViewAsBanner()`

**What it logs (every page load):**

| field | meaning |
|-------|---------|
| `real_role` | Role from raw JWT (bypasses patch) |
| `real_id` | ID from raw JWT (bypasses patch) |
| `effective_role` | Role as `getCurrentUserRole()` sees it (sessionStorage when impersonating) |
| `is_impersonating` | Whether `isImpersonating()` returns true |
| `viewAs_role_ss` | Raw `sessionStorage.viewAsRole` |
| `viewAs_userId_ss` | Raw `sessionStorage.viewAsUserId` |
| `__viewAsTokenPatched` | Whether token patch was installed |
| `__viewAsFetchPatched` | Whether fetch patch was installed |
| `decoded_id_after_patch` | `agency_member.id` from `TokenUtils.decodeToken()` AFTER patch |
| `decoded_role_after_patch` | `agency_member.job_position` from `TokenUtils.decodeToken()` AFTER patch |

If `is_impersonating=true` but `decoded_role_after_patch !== effective_role`, a `console.warn` is emitted:
```
[ViewAs] MISMATCH: token patch may have failed. Expected job_position="ts" but decoded "admin".
isAdmin() will still return false via MenuComponent.isImpersonating() guard.
```

This means even when the mismatch is logged, the page will render correctly because of the `getEffectiveRole()` fallback. The warning is purely informational so the team knows the token patch needs investigation.

---

## Bugs Verified Correct (No Change Needed)

### `renderSellerSummary()` else branch for crm (line 785)
**Task description said:** "the else branch ALWAYS builds Telesales table even for crm"  
**Actual current code:**
```javascript
} else if (myRole === 'ts' && tsOrders.length) {
  groupsHtml = buildGroupTable('Telesales', 'ts', tsOrders);
}
```
The `else if` condition was already added in a previous pass. CRM users fall through both branches → `groupsHtml = ''` → returns `''` → no ranking section rendered. **Per spec: correct.**  
The fix in Pass 2 to use `getEffectiveRole()` for `myRole` means this branch also works correctly during view-as-ts (whereas before, if the token patch failed, `myRole` would be `'admin'` and the ts ranking would incorrectly not appear).

---

## Bugs Still Pending (User Decision Required)

### BUG-VA-P2-PENDING-01 (LOW): Backend PDF endpoint role gate

**File:** `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/pdf/route.ts` line 94  
**Issue:** `roles: ['admin']` — if the PDF export is ever refactored to use the server-side rendering endpoint (instead of the current client-side html2canvas approach), view-as sessions will receive a 403.  
**Current risk:** None (client-side PDF generation does not call this endpoint).  
**Recommended fix:** Change to `roles: ['admin', 'ts', 'crm']` — backend does not use role to scope the HTML content.  
**Requires backend change — deferred to user decision.**

---

## Files Modified

| File | Lines changed | Pass |
|------|--------------|------|
| `/Users/gap/finance-backoffice-report/sales-report-by-seller.js` | 88–119, 577, 739–752, 913, 975–984, 1356 | Pass 2 |
| `/Users/gap/finance-backoffice-report/menu-component.js` | 1012–1060 | Pass 2 |

No backend files modified. No HTML files modified.

---

## Fidelity Sign-Off (expected after these fixes)

| # | Element | Before Pass 2 (view-as broken) | After Pass 2 |
|---|---------|--------------------------------|--------------|
| 1 | Seller dropdown | Enabled dropdown (admin view) | Disabled button with target nick name |
| 2 | Status default | "ทั้งหมด" | "ไม่ยกเลิก" |
| 3 | Excel button | Visible | Hidden |
| 4 | KPI cards | 4 cards (admin) | 2 cards (ts/crm) |
| 5 | Ranking section (ts) | Both TS+CRM boxes | Only Telesales box |
| 6 | Ranking section (crm) | Both TS+CRM boxes | No ranking section |
| 7 | Ranking self-row | All rows masked (id mismatch) | Self row shows real name; peers masked |
| 8 | PDF ranking page | Included (admin artifact) | Absent |
| 9 | PDF header "ชื่อผู้จอง" | "ทั้งหมด" | "Telesales ทั้งหมด" / "CRM ทั้งหมด" |
| 10 | DevTools diagnostic | No visibility | console.table on every page load |

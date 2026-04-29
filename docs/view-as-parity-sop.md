# View-As Parity SOP — Standard Operating Procedure

**Status:** ACTIVE — canonical reference for view-as quality gate
**Version:** 1.0 (established post-FE v1.1.0 / API v1.2.0 ship)
**Owner:** Dev team lead
**Referenced by:** `docs/architecture-rbac-view-as.md`, `docs/test-strategy-rbac-view-as.md`, `docs/prd-rbac-view-as.md`

> **User mandate (April 2026):** "เรื่องการทำ view as เพื่ออัปเดตของหน้าเก่าและหน้าใหม่แบบ field-by-field ทุกครั้งถ้ามีการพัฒนาหรือแก้ไขหน้านั้น"
>
> Translation: Every time we develop or modify a page (old or new), do field-by-field parity verification between real ts/crm login and admin view-as-ts/crm.

---

## 1. Why This SOP Exists

Every page accessible to `ts` or `crm` users must render **byte-equivalently** between two sessions:

- **(A)** A real `ts` or `crm` user logged in directly
- **(B)** Admin id=555 viewing-as that same `ts` or `crm` user

The view-as feature works by patching `TokenUtils.decodeToken`, wrapping `window.fetch`, and injecting `X-View-As-*` headers on API calls. Any code path that bypasses these mechanisms — reading `currentUser.*` directly, calling `fetch()` without going through `SharedHttp`, rendering based on a hardcoded role string — will produce a visible discrepancy between (A) and (B).

**The dominant bug class is not privilege escalation. It is silent parity divergence**: a KPI card shows the wrong number, a button is hidden when it should be visible (or visible when it should be hidden), a seller name is shown unmasked. These bugs escape casual smoke tests because the admin tester is not comparing side-by-side; they assume the view-as session is correct.

The only reliable defense is a mandatory field-by-field checklist completed by the developer for every relevant change, before merge.

---

## 2. When This SOP Applies

This SOP is **mandatory** for any change that touches any of the following:

### 2a. Pages accessible to ts or crm

Currently:
- `/dashboard`
- `/sales-report-by-seller`

Any new page granted to ts or crm automatically becomes subject to this SOP from the moment the `ROLE_ACCESS` entry is added in `menu-component.js`.

### 2b. Shared components used by those pages

- Filter dropdowns and period selectors (any shared filter UI)
- Table renderers and column builders
- KPI card renderers
- Export button generators (Excel, PDF)
- `menu-component.js` — any function
- `shared-http.js` — any function
- `token-utils.js` — `decodeToken`, `getToken`

### 2c. Auth and role helpers (any repo)

**Backend:**
- `lib/auth.ts` (`requireRole`, `getEffectiveRole`, `getEffectiveUserId`, `getRealRole`)
- `lib/api-guard.ts` (`withApiGuard`, `roles` option)

**Frontend:**
- `menu-component.js` view-as functions (`isImpersonating`, `isViewAsEligible`, `patchTokenUtilsForViewAs`, `patchFetchForViewAs`, `getCurrentUserRole`, `getEffectiveRole`, `getEffectiveUserId`)
- `sales-report-by-seller.js` `getEffectiveRole`, `getEffectiveUserId`, `getEffectiveNickName`, `isAdmin`

### 2d. Any API endpoint role gate

Adding or changing the `roles` option in `withApiGuard`, or adding a new `requireRole` call, changes what requests are allowed — which can break or restore parity.

---

## 3. Field-by-Field Checklist Template

Copy this table into your PR description or a linked `test/qa/` file. Every row must show PASS or a documented intentional difference before merge.

### How to use

1. Test in **real ts session** (login directly as a ts user, referred to as user N).
2. Test in **admin view-as session** (login as admin id=555, activate view-as → ts → user N).
3. For each row: compare what you see in (A) vs (B). Note the actual value in both columns.
4. Mark Match? as PASS, FAIL, or BY DESIGN (with explanation).

### Checklist table

```
Page: [page name and URL]
Date: [YYYY-MM-DD]
Tester: [name or handle]
Test persona: [nick name of ts/crm user used for comparison, id=N]
Real session browser: [browser + tab description]
View-as session browser: [browser + tab description — DIFFERENT tab or incognito]

┌──────────────────────────────────────┬──────────────────────┬──────────────────────┬──────────┐
│ Field / Element                      │ (A) Real ts/crm (N)  │ (B) View-as ts/crm(N)│ Match?   │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ BANNER / HEADER                      │                      │                      │          │
│ Page <title>                         │                      │                      │          │
│ <h1> text                            │                      │                      │          │
│ Breadcrumb                           │                      │                      │          │
│ View-as amber banner                 │ absent               │ present (BY DESIGN)  │ BY DESIGN│
│ Sidebar menu items visible           │                      │                      │          │
│ "ดูเป็น Role อื่น" trigger button    │ absent               │ absent               │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ FILTER PANEL                         │                      │                      │          │
│ วันที่สร้าง Order controls           │                      │                      │          │
│ ชื่อผู้จอง — rendered as             │ disabled btn "N"     │ disabled btn "N"     │          │
│ ชื่อผู้จอง — label value             │                      │                      │          │
│ สถานะ Order dropdown                 │                      │                      │          │
│ ค้นหา button                         │                      │                      │          │
│ เริ่มใหม่ button — resets to         │ own seller (N)       │ own seller (N)       │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ KPI CARDS                            │                      │                      │          │
│ ยอดขายรวม (total_net_amount)         │                      │                      │          │
│ ส่วนลดรวม (total_discount)           │                      │                      │          │
│ Orders count sub-text                │                      │                      │          │
│ คอมรวม card — visibility             │ ABSENT (ts)          │ ABSENT (ts)          │          │
│ คอม (หักส่วนลด) card — visibility   │ ABSENT (ts)          │ ABSENT (ts)          │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ RANKING SECTION                      │                      │                      │          │
│ Telesales group visible (for ts)     │                      │                      │          │
│ CRM group visible (for ts)           │ ABSENT               │ ABSENT               │          │
│ Own-row seller name                  │ real name (N)        │ real name (N)        │          │
│ Peer rows seller name                │ ****** (masked)      │ ****** (masked)      │          │
│ Peer rows numeric columns visible    │                      │                      │          │
│ Row count in ranking group           │                      │                      │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ MAIN DATA TABLE                      │                      │                      │          │
│ Table scoped to own orders only      │                      │                      │          │
│ All expected columns present         │                      │                      │          │
│ Row count display ("N รายการ")       │                      │                      │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ SEARCH BOX                           │                      │                      │          │
│ Search scope (own orders only)       │                      │                      │          │
│ Placeholder text                     │                      │                      │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ EXPORT BUTTONS                       │                      │                      │          │
│ Excel button — visibility            │ ABSENT (ts)          │ ABSENT (ts)          │          │
│ PDF button — visibility              │ present              │ present              │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ PDF EXPORT CONTENT                   │                      │                      │          │
│ Ranking summary pages in PDF         │ ABSENT (ts)          │ ABSENT (ts)          │          │
│ ชื่อผู้จอง headline in PDF header   │ user N's nick        │ user N's nick        │          │
│ Page count                           │                      │                      │          │
│ Totals footer values                 │                      │                      │          │
├──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────┤
│ CONSOLE                              │                      │                      │          │
│ [ViewAs] God-mode active log         │ absent               │ present              │ BY DESIGN│
│ [ViewAs Diagnostic] table            │ absent               │ present              │ BY DESIGN│
│ Any new console errors               │ none                 │ none                 │          │
│ X-Effective-Role mismatch warning    │ absent               │ absent (if correct)  │          │
└──────────────────────────────────────┴──────────────────────┴──────────────────────┴──────────┘
```

**Add rows** for any new field, button, card, column, or section introduced by the change being tested. The table above is the baseline for `/sales-report-by-seller`. New pages start with a blank table and fill it in from scratch.

---

## 4. Process — Step by Step

For each change that triggers this SOP:

### Step 1 — Identify the change

Describe:
- What was added / changed / removed
- Which page(s) it affects
- Which shared components are involved

### Step 2 — List affected fields

From the checklist template above, identify which rows are likely to be affected by this change. Add new rows for any new UI element introduced.

### Step 3 — Set up two sessions

Open two separate browser environments (e.g. Chrome normal + Chrome incognito, or two different browsers):

- **Session A:** Login as the actual ts or crm user (id=N) whose data you will compare.
- **Session B:** Login as admin id=555, then activate view-as → ts → user N.

Apply the same filter settings (date range, order status) in both sessions before comparing.

### Step 4 — Compare field by field

Work through every row in the checklist. For each row:
- Record the actual value / state observed in (A).
- Record the actual value / state observed in (B).
- Mark Match? as:
  - **PASS** — identical
  - **BY DESIGN** — intentionally different (the view-as amber banner, the diagnostic console output)
  - **FAIL** — differs and is not intentional

### Step 5 — Sign off

Every row must be PASS or BY DESIGN before merge. For BY DESIGN entries, write a one-line explanation in the Match? column.

If any row is FAIL:

1. Fix the disparity in code.
2. Re-test both sessions.
3. If the disparity cannot be fixed without a larger refactor, document it as a known issue, get explicit approval from the user (product owner), and mark it BY DESIGN with that approval noted.

### Step 6 — Attach to PR

Paste the completed checklist table in the PR description, or link to a file in `test/qa/` named `view-as-parity-[page]-[YYYY-MM-DD].md`.

---

## 5. Common Patterns That Break Parity

These are the pitfalls most likely to introduce a parity divergence. Check your diff for any of these before running the parity test.

### 5a. Reading `currentUser.*` directly instead of helpers

```js
// WRONG — currentUser is populated from TokenUtils.decodeToken which may or
// may not have been patched in time. This is Layer 2 only — unreliable fallback.
if (currentUser.job_position === 'ts') { ... }

// CORRECT — uses three-layer chain (sessionStorage → patched token → default)
if (getEffectiveRole() === 'ts') { ... }
```

```js
// WRONG
const myId = currentUser.id;

// CORRECT
const myId = getEffectiveUserId();
```

```js
// WRONG
const myName = currentUser.nick_name;

// CORRECT
const myName = getEffectiveNickName();
```

### 5b. Using `getCurrentUserRole()` from MenuComponent instead of page helpers

`MenuComponent.getCurrentUserRole()` IS view-as aware (it calls `isImpersonating()` first). But it returns the effective role for **menu visibility** decisions. Page-level scripts should use their own `getEffectiveRole()` which also checks `MenuComponent.isImpersonating()` as Layer 1. Do not chain `MenuComponent.getCurrentUserRole()` inside page business logic — it creates a coupling that is hard to maintain.

### 5c. Page-level scripts that decode JWT bypassing TokenUtils

```js
// WRONG — reads raw JWT, not the patched version
const payload = JSON.parse(atob(token.split('.')[1]));
const role = payload.user.agency_member.job_position;

// CORRECT — goes through the patched TokenUtils.decodeToken
const payload = TokenUtils.decodeToken(token);
const member = payload && payload.user && payload.user.agency_member;
const role = member && member.job_position;
// Then call getEffectiveRole() which adds Layer 1 on top
```

### 5d. API services that call `fetch()` without going through SharedHttp

```js
// WRONG — bypasses patchFetchForViewAs() if the patch hasn't fired yet,
// and bypasses SharedHttp's native X-View-As-* header injection
fetch(apiUrl, { headers: { Authorization: 'Bearer ' + token } })

// CORRECT — SharedHttp.buildHeaders() injects X-View-As-* natively
SharedHttp.get('/api/reports/commission-plus', { params: filters })

// Also acceptable — fetch() is patched globally by patchFetchForViewAs()
// but SharedHttp is preferred because it also handles 401/403 redirects
```

### 5e. Cache-Control absent on user-scoped responses

Any API endpoint that returns data scoped to a specific user (by role or by user id) **must** include:

```
Cache-Control: private, no-store
```

Without this, a Vercel edge cache or browser back/forward cache can serve one user's response to another. The commission-plus endpoint already sets this. Any new user-scoped endpoint must too.

### 5f. PDF / Excel generators that include admin-only content unconditionally

```js
// WRONG — always includes ranking summary
function buildPdfPages(orders) {
  const summaryPages = buildRankingSummary(orders);
  return [...summaryPages, ...dataPages];
}

// CORRECT — gate on effective role
function buildPdfPages(orders) {
  const summaryPages = isAdmin() ? buildRankingSummary(orders) : [];
  return [...summaryPages, ...dataPages];
}
```

### 5g. Column count changes without updating DOM selectors

The PDF builder detects the footer row using a colspan value. If columns are added or removed, the colspan in the `createPdfSourceNode` HTML must match the `querySelector` in `buildPaginatedPdfPages`. Mismatches cause doubled footer rows in the PDF (BUG-05/08 from the original audit — already fixed, but a fragile pattern).

### 5h. Hardcoded role strings in comparisons

```js
// WRONG — brittle; doesn't account for view-as
if (currentUser.job_position === 'admin') { ... }

// CORRECT — isAdmin() uses getEffectiveRole() which is view-as aware
if (isAdmin()) { ... }
```

---

## 6. Pre-Merge Checklist

Copy this block into your PR description and check every item before requesting review.

```
## View-As Parity Verification

- [ ] Field-by-field parity table completed and attached (or linked) to this PR
- [ ] Real ts session vs admin viewing-as-ts session compared field by field
- [ ] Real crm session vs admin viewing-as-crm session compared (if page is accessible to crm)
- [ ] No new direct `currentUser.job_position` reads — use `getEffectiveRole()` or `isAdmin()`
- [ ] No new direct `currentUser.id` reads — use `getEffectiveUserId()`
- [ ] No new direct `currentUser.nick_name` reads — use `getEffectiveNickName()`
- [ ] No new `fetch()` calls that bypass SharedHttp and bypass patchFetchForViewAs targets
- [ ] PDF export verified in both sessions: correct content, no extra/missing sections
- [ ] Excel export verified in both sessions (if applicable)
- [ ] Console checked in view-as session: `[ViewAs] God-mode active` log is present
- [ ] Console checked in both sessions: no new errors
- [ ] X-Effective-Role mismatch warning absent in view-as session (confirm in Network tab)
- [ ] Any new API endpoint that returns user-scoped data has `Cache-Control: private, no-store`
- [ ] Any new page accessible to ts/crm has been added to this SOP's "Pages accessible" list in Section 2a
```

If any item cannot be checked (e.g. the change does not affect PDF export), mark it N/A with a one-line explanation.

---

## 7. Where This SOP Lives

This document is the canonical reference for view-as parity verification:

```
/Users/gap/finance-backoffice-report-api/docs/view-as-parity-sop.md
```

All other docs point here:
- `docs/architecture-rbac-view-as.md` — Section 3e references this SOP
- `docs/test-strategy-rbac-view-as.md` — Section 10 references this SOP
- `docs/prd-rbac-view-as.md` — Maintenance Contract section references this SOP

Historical audit artifacts (read-only, do not update):
- `test/qa/view-as-field-parity-audit.md` — original full audit for `/sales-report-by-seller`
- `test/qa/view-as-fidelity-audit.md` — pre-fix fidelity audit
- `test/qa/view-as-fix-pass-2.md` — fix verification pass

When a new page is added to ts/crm access, create a new audit file at:
```
test/qa/view-as-parity-[page-slug]-[YYYY-MM-DD].md
```
and link it from this SOP in Section 2a.

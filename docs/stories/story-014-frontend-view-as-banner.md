# Story 014 — Frontend: Sticky View-As Banner

**Phase:** 3 (View-As)
**Type:** Frontend
**Complexity:** M

---

## User Story

As admin id=555 in view-as mode,
I always see a persistent amber banner at the top of every page identifying who I am impersonating,
So that I cannot accidentally forget I'm in view-as mode and mistake impersonated data for real admin data.

---

## Background

UX spec Section 4 fully specifies the banner. The architecture decision (Q2 resolved) is that the banner renders from the `X-Effective-Role` response header echoed by the backend — not from sessionStorage alone. This means the banner only appears after at least one API call has been made and the response confirms the server is actually applying the impersonation. The banner reads the target user's display name and team from `sessionStorage` (stored during picker apply flow — Story 013) to avoid an extra API call on every page load.

Banner is injected by `menu-component.js` as the **first child of `main.main-content`**, before `nav.top-bar`.

---

## Acceptance Criteria

1. On every page load where `sessionStorage.viewAsUserId` is set, `menu-component.js` injects `.va-banner` as the first child of `main.main-content`.
2. Banner text format: `[WARN icon] ดูในฐานะ: [nick] ([role], Team [N])  |  คุณคือ: Admin (id 555)  |  [เปลี่ยน]  [ออกจากโหมดดูเป็น]`
3. If `viewAsUserTeam` is null/empty, the team suffix is omitted: `[nick] ([role])`.
4. `body.va-impersonating` class is added to `<body>` when the banner is injected.
5. Banner is `position: sticky; top: 0; z-index: 1100` (UX spec Section 4.1).
6. Banner uses amber palette: `background: #FEF3C7`, `border-left: 4px solid #F59E0B`, `color: #92400E` (UX spec Section 4.3).
7. [เปลี่ยน] button calls `openViewAsPickerDialog()` (same function as Story 013 trigger).
8. [ออกจากโหมดดูเป็น] button implements the exit flow (Story 015).
9. Banner uses `role="alert"` and `aria-live="polite"` for screen reader announcement.
10. Banner is non-dismissible — no close button.
11. On mobile (< 768px), banner stacks vertically per UX spec Section 7.2.
12. The banner does NOT appear on the `/403` page (no `main.main-content` present — graceful no-op if the element is missing).

**Resolving the Q2 decision in practice:**

The banner renders immediately from sessionStorage on page load (provides instant feedback before any API call). The `X-Effective-Role` response header serves as a **verification signal** — if the echoed role does not match `sessionStorage.viewAsRole`, log a warning (`console.warn('[ViewAs] Effective role mismatch...')`) but do not remove the banner. The banner's source of truth for display is sessionStorage (pre-loaded data from picker); the response header confirms server agreement.

---

## Implementation Notes

**File to change:** `/Users/gap/finance-backoffice-report/menu-component.js`

**CSS to add:** `.va-banner`, `.va-banner__left`, `.va-banner__center`, `.va-banner__right`, `.va-banner__target`, `.va-banner__self`, `.va-btn-switch`, `.va-btn-exit`, `body.va-impersonating` — to `/Users/gap/finance-backoffice-report/menu-component.css`

**`injectViewAsBanner()` function to add in `menu-component.js`:**

Called from `initMenuComponent()` when `sessionStorage.viewAsUserId` is set:

```javascript
function injectViewAsBanner() {
  var mainContent = document.querySelector('main.main-content');
  if (!mainContent) return;  // /403 page etc. — safe no-op

  var role     = sessionStorage.getItem('viewAsRole')     || '';
  var nick     = sessionStorage.getItem('viewAsUserNick') || sessionStorage.getItem('viewAsUserId') || '?';
  var team     = sessionStorage.getItem('viewAsUserTeam') || '';
  var roleLabel = role.toUpperCase();
  var teamLabel = team ? ', Team ' + team : '';

  var banner = document.createElement('div');
  banner.id = 'view-as-banner';
  banner.className = 'va-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <div class="va-banner__left">
      <span>&#9888;</span>
      <strong class="va-banner__target">ดูในฐานะ: ${nick} (${roleLabel}${teamLabel})</strong>
    </div>
    <div class="va-banner__center">
      <span class="va-banner__self">คุณคือ: Admin (id 555)</span>
    </div>
    <div class="va-banner__right">
      <button class="va-btn-switch" type="button">เปลี่ยน</button>
      <button class="va-btn-exit" type="button">ออกจากโหมดดูเป็น</button>
    </div>
  `;

  banner.querySelector('.va-btn-switch').addEventListener('click', function() {
    openViewAsPickerDialog();
  });
  banner.querySelector('.va-btn-exit').addEventListener('click', function() {
    exitViewAs();  // Story 015
  });

  mainContent.insertBefore(banner, mainContent.firstChild);
  document.body.classList.add('va-impersonating');
}
```

**Call site in `initMenuComponent()`:**

```javascript
// After renderSidebarMenu() and injectViewAsTrigger() calls:
if (sessionStorage.getItem('viewAsUserId')) {
  injectViewAsBanner();
}
```

**X-Effective-Role verification hook** (Q2 resolved — echo from backend):

In `shared-http.js` `runRequest`, after a successful response, add (only if impersonating):

```javascript
var effectiveRole = response.headers.get('X-Effective-Role');
var expectedRole  = sessionStorage.getItem('viewAsRole');
if (expectedRole && effectiveRole && effectiveRole !== expectedRole) {
  console.warn('[ViewAs] X-Effective-Role mismatch. Expected: ' + expectedRole + ', Got: ' + effectiveRole);
}
```

This is a non-blocking check — it never hides the banner or changes behavior, only logs a warning.

**Responsive CSS (< 768px):**

```css
@media (max-width: 767px) {
  .va-banner {
    flex-direction: column;
    gap: 6px;
  }
  .va-banner__right {
    justify-content: flex-start;
  }
}
```

---

## Test Cases

- Manual: log in as admin id=555, set sessionStorage with all view-as keys, reload any page → amber banner appears immediately, shows correct nickname and role.
- Manual: banner appears on `/sales-report-by-seller` → confirms `main.main-content` selector works.
- Manual: navigate to `/403` → no banner, no JS error.
- Manual: [เปลี่ยน] → picker opens pre-populated.
- Manual: [ออกจากโหมดดูเป็น] → banner gone after reload (Story 015).
- Screen reader: banner announced on page load (verify `role="alert"` fires).
- **R-06** mitigation: banner is visible in every test session during phase 3 sign-off.

**Must pass before merge:** banner appears on page load with correct content; [เปลี่ยน] opens picker; [ออกจากโหมดดูเป็น] triggers exit flow.

---

## Dependencies

- Story 012 (trigger button — shares `openViewAsPickerDialog` call)
- Story 013 (picker modal — provides `openViewAsPickerDialog`)
- Story 015 (exit flow — provides `exitViewAs`)
- All four stories 012-015 should be developed as a unit and merged together

---

## Definition of Done

- [ ] Banner injected on every page with active impersonation sessionStorage
- [ ] Banner not injected when sessionStorage is empty or on `/403`
- [ ] `body.va-impersonating` class added correctly
- [ ] Amber styling matches UX spec (colors verified)
- [ ] `position: sticky; top: 0; z-index: 1100` applied
- [ ] [เปลี่ยน] and [ออกจากโหมดดูเป็น] buttons functional
- [ ] `role="alert"` and `aria-live="polite"` present
- [ ] Mobile stacking layout implemented
- [ ] X-Effective-Role mismatch warning logged (non-blocking)
- [ ] Code merged to frontend repo main
- [ ] Frontend deployed to staging; banner visible to admin id=555 on all pages during impersonation

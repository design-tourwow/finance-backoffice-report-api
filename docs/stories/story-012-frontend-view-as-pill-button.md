# Story 012 — Frontend: View-As Pill Button in Sidebar (admin id=555 only)

**Phase:** 3 (View-As)
**Type:** Frontend
**Complexity:** S

---

## User Story

As admin id=555,
I want to see a "ดูเป็น..." pill button at the bottom of the sidebar navigation,
So that I have a visible, accessible entry point to activate view-as mode on any page.

---

## Background

UX spec Section 2 defines the trigger button: a pill-shaped element labelled "ดูเป็น..." injected below the last `.nav-item` in the sidebar, visible only to the user whose `agency_member.id === 555`. During impersonation the button changes to an amber variant showing the target user's nickname. `menu-component.js` already owns the sidebar DOM — this is a single-file change.

`token-utils.js` needs one new helper: `getAgencyMemberId()` that reads `payload.user.agency_member.id` from the stored token (architecture Section 8d).

---

## Acceptance Criteria

1. When the authenticated user has `agency_member.id === 555`, a `.va-trigger-wrap` div is injected below `.nav-menu` inside `aside.sidebar` during `initMenuComponent()`.
2. The wrapper contains a `<button class="va-trigger-btn">ดูเป็น...</button>`.
3. The button is not rendered for any other user (admin id ≠ 555, ts, crm).
4. The button is keyboard-focusable (`<button>` element, naturally in tab order).
5. When `sessionStorage.viewAsUserId` is set (impersonation active), the button receives the class `va-trigger-btn--active` and its text changes to the target user's nickname (read from `sessionStorage.viewAsUserNick`).
6. Clicking the button opens the picker modal (Story 013).
7. A thin top border separates the button wrapper from the last menu item above it (UX spec Section 2.2).
8. `TokenUtils.getAgencyMemberId()` is added to `token-utils.js` and used by `menu-component.js`.
9. The existing `getCurrentUserRole()` fallback to `'admin'` (line 212) is preserved and documented with a comment.

**CSS classes** (UX spec Section 9):

```
.va-trigger-wrap   — wrapper div
.va-trigger-btn    — the pill button (inactive state)
.va-trigger-btn--active  — modifier during impersonation
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report/token-utils.js`
- `/Users/gap/finance-backoffice-report/menu-component.js`
- `/Users/gap/finance-backoffice-report/menu-component.css` (or shared CSS file — add `.va-trigger-*` styles)

**token-utils.js — add `getAgencyMemberId()`:**

```javascript
getAgencyMemberId() {
  const token = this.getToken();
  const payload = this.decodeToken(token);
  const member = payload && payload.user && payload.user.agency_member;
  const id = member && member.id;
  return (id && typeof id === 'number') ? id : null;
}
```

**menu-component.js — `initMenuComponent()` addition:**

After `renderSidebarMenu()` is called, add:

```javascript
// Inject view-as trigger for admin id=555 only
var adminId = window.TokenUtils && window.TokenUtils.getAgencyMemberId
  ? window.TokenUtils.getAgencyMemberId()
  : null;
var VIEW_AS_ADMIN_ID = 555; // matches backend VIEW_AS_ADMIN_ID env default
if (adminId === VIEW_AS_ADMIN_ID) {
  injectViewAsTrigger();
}
```

`injectViewAsTrigger()` function:

```javascript
function injectViewAsTrigger() {
  var sidebar = document.querySelector('aside.sidebar');
  if (!sidebar) return;

  var wrap = document.createElement('div');
  wrap.className = 'va-trigger-wrap';

  var btn = document.createElement('button');
  btn.className = 'va-trigger-btn';
  btn.type = 'button';

  var isImpersonating = !!sessionStorage.getItem('viewAsUserId');
  if (isImpersonating) {
    btn.classList.add('va-trigger-btn--active');
    var nick = sessionStorage.getItem('viewAsUserNick') || 'ดูเป็น...';
    btn.textContent = nick;
  } else {
    btn.textContent = 'ดูเป็น...';
  }

  btn.addEventListener('click', function() {
    openViewAsPickerDialog();  // Story 013
  });

  wrap.appendChild(btn);
  sidebar.appendChild(wrap);
}
```

**CSS (add to menu-component.css or a shared CSS file):**

```css
.va-trigger-wrap {
  padding: 8px 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: 4px;
}
.va-trigger-btn {
  width: 100%;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 13px;
  text-align: center;
}
.va-trigger-btn--active {
  background: #F59E0B;
  color: #1a1a1a;
  border-color: #D97706;
}
```

**`getCurrentUserRole()` fallback comment (line 212 in menu-component.js):**

```javascript
// Falls back to 'admin' for unrecognized job_position values.
// This mirrors the backend getRealRole() fallback and is intentional —
// unknown roles get maximum access rather than being silently blocked.
// Do not change this without updating getRealRole() in lib/auth.ts.
if (role === 'admin' || role === 'ts' || role === 'crm') return role;
return 'admin';
```

---

## Test Cases

- Manual: log in as admin id=555 → sidebar shows "ดูเป็น..." button.
- Manual: log in as admin id=999 → no button visible.
- Manual: log in as ts user → no button visible.
- Manual: set `sessionStorage.viewAsUserId = '100'` and `sessionStorage.viewAsUserNick = 'KK'`, reload → button shows "KK" in amber style.
- Keyboard: tab to button → focus ring visible; Enter → picker opens.

**Must pass before merge:** all manual checks above on staging.

---

## Dependencies

- Story 003 (confirms the `agency_member.id` path in JWTPayload — `getAgencyMemberId` reads the same field)
- Story 013 (picker modal — must be implemented before clicking the button does anything visible, but can be developed on the same branch)

---

## Definition of Done

- [ ] `TokenUtils.getAgencyMemberId()` added and working
- [ ] Pill button injected for admin id=555 only
- [ ] Button reflects active impersonation state (amber + nickname)
- [ ] Existing `getCurrentUserRole()` fallback documented with comment
- [ ] CSS classes added
- [ ] Keyboard accessibility confirmed
- [ ] Code merged to frontend repo main
- [ ] Frontend deployed to staging

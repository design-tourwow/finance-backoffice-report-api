# Story 013 — Frontend: View-As Picker Modal

**Phase:** 3 (View-As)
**Type:** Frontend
**Complexity:** L

---

## User Story

As admin id=555,
When I click "ดูเป็น...",
I want a two-step modal that lets me pick a role (TS or CRM) then a specific user from a searchable, team-grouped list,
So that I can precisely select whose perspective I want to adopt.

---

## Background

UX spec Section 3 fully specifies the two-step picker flow. This is the most complex frontend story in Phase 3 — it involves a modal with focus trapping, a role card selector, a searchable list with team grouping, accessibility attributes, error and empty states, and the apply/cancel flow. The user list is fetched from `GET /api/agency-members?roles=ts,crm`.

---

## Acceptance Criteria

**Structure:**
1. Clicking `.va-trigger-btn` (Story 012) or `.va-btn-switch` (Story 014) calls `openViewAsPickerDialog()` which injects `.va-dialog-overlay` and `.va-dialog` into `document.body`.
2. Dialog has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="view-as-dialog-title"`.
3. Focus traps inside the dialog on open; first focus goes to the close button `[X]`.
4. Escape key closes the dialog without changes (same as [ยกเลิก]).

**Step 1 — Role selector:**
5. Two role cards (`.va-role-card`): TS and CRM, styled as large toggle cards.
6. Role cards use `role="radio"` within `role="radiogroup"` labelled "เลือก Role".
7. Default selection: `sessionStorage.viewAsLastRole` if set, otherwise TS.
8. Selecting a role filters the user list to that role's members and resets the user selection.

**Step 2 — User picker:**
9. On dialog open, `GET /api/agency-members?roles=ts,crm` is fetched once. All members are held in memory; no subsequent API calls for search or role switching.
10. User list rendered in `.va-user-list`, grouped by `team_number` ascending. Group headers labelled "Team 1", "Team 2", etc. Null team → "ไม่ระบุทีม" group, sorted last.
11. Each option shows nickname prominently + team number + full name (UX spec Q9 format: "NN (Team N) — Nick Surname"). Q9 resolution: `id` shown in picker list, not in banner.
12. Search input `.va-user-search` filters by `first_name`, `last_name`, `nickname` case-insensitively, client-side, on every keystroke.
13. Pre-select current `sessionStorage.viewAsUserId` if already impersonating.
14. Apply button `.va-btn-apply` is disabled until both a role and a user are selected.
15. Apply button label updates to "เริ่มดูเป็น [nickname]" once a user is selected.

**Apply flow (UX spec Section 3.4 / 10.6):**
16. On apply:
    - `sessionStorage.setItem('viewAsRole', selectedRole)`
    - `sessionStorage.setItem('viewAsUserId', selectedUserId)`
    - `sessionStorage.setItem('viewAsUserNick', selectedUserNick)`
    - `sessionStorage.setItem('viewAsUserTeam', selectedUserTeam)`
    - `sessionStorage.setItem('viewAsLastRole', selectedRole)`
    - Remove `.va-dialog-overlay` and `.va-dialog` from DOM
    - `window.location.reload()`

**Cancel / Escape (UX spec Section 10.7):**
17. Cancel or Escape: remove dialog from DOM, return focus to `.va-trigger-btn`, no sessionStorage changes, no reload.

**Error states (UX spec Section 6.1, 6.2):**
18. If API call fails: both role cards disabled, `.va-dialog__error` shows message with `.va-btn-retry` button. Retry re-fetches without closing dialog.
19. If a role has no members: its role card is shown but disabled (`cursor: not-allowed`), tooltip "ไม่พบพนักงาน [role] ในระบบ".
20. If search produces no results: show "ไม่พบผลลัพธ์" in the list (non-selectable).

**Responsive:**
21. Dialog width: `min(480px, 95vw)`; `max-height: 90vh; overflow-y: auto`.
22. Tab order: close [X] → TS card → CRM card → search input → user list → Apply → Cancel.

---

## Implementation Notes

**File to change:** `/Users/gap/finance-backoffice-report/menu-component.js`

**CSS to add:** `/Users/gap/finance-backoffice-report/menu-component.css` (all `.va-dialog*`, `.va-role-*`, `.va-user-*`, `.va-btn-*` classes from UX spec Section 9)

**Core function to add in `menu-component.js`:**

```javascript
function openViewAsPickerDialog() {
  // 1. Build and inject overlay + dialog DOM
  // 2. Fetch /api/agency-members?roles=ts,crm via SharedHttp.get
  // 3. On success: populate role cards and user list
  // 4. On error: show error state
  // 5. Attach role card click handlers
  // 6. Attach search input handler (client-side filter)
  // 7. Attach user list click handlers
  // 8. Attach Apply button handler (writes sessionStorage + reload)
  // 9. Attach Cancel + close [X] handlers (remove dialog, restore focus)
  // 10. Attach Escape keydown listener on document
  // 11. Trap focus inside dialog
}
```

**Agency members API call:**

```javascript
SharedHttp.get('/api/agency-members', { params: { roles: 'ts,crm' } })
  .then(function(data) { populatePicker(data.data || []); })
  .catch(function() { showPickerError(); });
```

The endpoint returns an array of members. Confirm the response shape from `agency-members/route.ts` — expected fields: `id`, `nick_name`, `first_name`, `last_name`, `job_position`, `team_number` (or equivalent team field). If the team field name differs, adapt the grouping logic.

**sessionStorage keys written (UX spec Section 11):**

| Key | Written on apply |
|-----|-----------------|
| `viewAsRole` | selected role string |
| `viewAsUserId` | selected user id as string |
| `viewAsUserNick` | nickname for banner display |
| `viewAsUserTeam` | team number string (for banner display) |
| `viewAsLastRole` | selected role (UI persistence) |

**Focus trap implementation:**

Use a lightweight focus trap: on `keydown Tab`, collect all focusable elements inside `.va-dialog`, wrap focus at both ends.

```javascript
var focusable = dialog.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
// on Tab: if focus is on last element, redirect to first; on Shift+Tab: if first, redirect to last
```

---

## Test Cases

- Manual (Q9 resolution): user list shows "NN (Team 3) — Nick Surname" format.
- Manual: TS selected → only TS members visible in list.
- Manual: search "nut" → filters list to matching members.
- Manual: apply → sessionStorage has all 5 keys, page reloads.
- Manual: cancel → sessionStorage unchanged, focus returns to trigger.
- Manual: Escape → same as cancel.
- Manual: API error → error state with retry button; retry re-fetches.
- Manual: empty role → that card is disabled.
- Keyboard: tab through all dialog elements in specified order.
- **TC-03** (end-to-end): picker selects ts/100, page reloads, commission-plus returns only seller_id=100 rows.

**Must pass before merge:** apply flow end-to-end (TC-03), cancel flow, error state with retry, keyboard tab order.

---

## Dependencies

- Story 012 (pill button — provides the `openViewAsPickerDialog` call site)
- Story 011 (shared-http injects headers — needed for end-to-end TC-03)
- Story 010 (backend honors headers — needed for end-to-end TC-03)

---

## Definition of Done

- [ ] Modal opens from `.va-trigger-btn` click
- [ ] Two-step role → user flow works
- [ ] Search filters client-side
- [ ] Team grouping renders correctly
- [ ] All 5 sessionStorage keys written on apply
- [ ] Page reloads on apply
- [ ] Cancel/Escape: no changes, focus restored
- [ ] Error state with retry implemented
- [ ] All ARIA attributes in place (`role="dialog"`, `role="radio"`, `aria-modal`, `aria-labelledby`)
- [ ] Focus trap implemented
- [ ] Responsive sizing: `min(480px, 95vw)`
- [ ] CSS classes matching UX spec Section 9 fully styled
- [ ] Code merged to frontend repo main
- [ ] Frontend deployed to staging; admin id=555 smoke test passes

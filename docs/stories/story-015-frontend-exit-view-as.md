# Story 015 — Frontend: Exit View-As Flow

**Phase:** 3 (View-As)
**Type:** Frontend
**Complexity:** S

---

## User Story

As admin id=555 in view-as mode,
When I click [ออกจากโหมดดูเป็น],
The impersonation session ends immediately, the banner disappears, and I am returned to my full admin experience,
So that I can exit view-as mode cleanly without requiring a re-login.

---

## Background

UX spec Section 5 specifies the exit flow as single-click, no confirmation dialog, immediate sessionStorage clear + page reload. The exit flow is implemented as the `exitViewAs()` function in `menu-component.js`, called by the banner's exit button (Story 014) and also available as a standalone function for any other future trigger points.

---

## Acceptance Criteria

1. Clicking [ออกจากโหมดดูเป็น] calls `exitViewAs()`.
2. `exitViewAs()` removes all 4 active view-as keys from sessionStorage: `viewAsRole`, `viewAsUserId`, `viewAsUserNick`, `viewAsUserTeam`. It does NOT remove `viewAsLastRole` (this persists as a UI hint for the next picker session).
3. Immediately after clearing sessionStorage, `window.location.reload()` is called.
4. After reload: no banner appears (sessionStorage is empty).
5. After reload: sidebar menu re-expands to full admin view (all menu items visible for admin role).
6. After reload: the next API request from `shared-http.js` carries no view-as headers.
7. No confirmation dialog is shown — the click is immediate (UX spec Section 5.1).
8. No stale view-as data is visible after exit (the page reload guarantees a fresh state).

**Gherkin:**

```
Scenario: exit view-as mode
  Given admin id=555 is in view-as mode (sessionStorage has all view-as keys)
  When the user clicks [ออกจากโหมดดูเป็น]
  Then sessionStorage no longer contains viewAsRole, viewAsUserId, viewAsUserNick, viewAsUserTeam
  And the page reloads
  And after reload the banner is not present
  And after reload the full admin menu is visible

Scenario: viewAsLastRole is preserved after exit
  Given sessionStorage.viewAsLastRole = 'ts'
  When exitViewAs() is called
  Then sessionStorage.viewAsLastRole is still 'ts'
```

---

## Implementation Notes

**File to change:** `/Users/gap/finance-backoffice-report/menu-component.js`

**`exitViewAs()` function:**

```javascript
function exitViewAs() {
  sessionStorage.removeItem('viewAsRole');
  sessionStorage.removeItem('viewAsUserId');
  sessionStorage.removeItem('viewAsUserNick');
  sessionStorage.removeItem('viewAsUserTeam');
  // viewAsLastRole is intentionally NOT removed — preserved for UX convenience
  window.location.reload();
}
```

This function is called by the banner's [ออกจากโหมดดูเป็น] button (Story 014).

**Expose as module-level function** so it can be called from the banner's click handler injected by `injectViewAsBanner()`. Since everything is inside the `menu-component.js` IIFE, `exitViewAs` is accessible within the same closure scope.

**No changes to `shared-http.js`** are needed here — once sessionStorage keys are removed, `buildHeaders()` (Story 011) will not add the view-as headers on the next request (it reads sessionStorage at call time).

**No changes to the backend** — the backend already treats absent view-as headers as a normal authenticated request.

**sessionStorage keys table (cross-reference with UX spec Section 11):**

| Key | Action on exit |
|-----|----------------|
| `viewAsRole` | Removed |
| `viewAsUserId` | Removed |
| `viewAsUserNick` | Removed |
| `viewAsUserTeam` | Removed |
| `viewAsLastRole` | Preserved |

---

## Test Cases

- Manual: click [ออกจากโหมดดูเป็น] → page reloads, banner gone, full admin menu visible.
- Manual: after exit, check `sessionStorage` in browser devtools → only `viewAsLastRole` may remain; all other `viewAs*` keys absent.
- Manual: after exit, trigger a commission-plus API call → response spans all sellers (admin scope restored).
- Manual: verify `viewAsLastRole` persists → open picker again → last used role pre-selected.
- **N-10**: two tabs open simultaneously. Exit in Tab A → Tab B is unaffected (sessionStorage is tab-scoped — this is the native behavior, just verify no localStorage was accidentally used).

**Must pass before merge:** manual exit flow on staging; banner absent after reload; full admin menu confirmed.

---

## Dependencies

- Story 014 (banner provides the exit button that calls `exitViewAs`)
- Story 011 (shared-http reads sessionStorage at call time — exit works because keys are removed before reload)
- Stories 012, 013, 014, 015 should all be deployed as a single frontend release

---

## Definition of Done

- [ ] `exitViewAs()` implemented in `menu-component.js`
- [ ] Exactly 4 keys removed (5th key `viewAsLastRole` preserved)
- [ ] `window.location.reload()` called after clearing
- [ ] Post-reload state verified: no banner, full admin menu, no view-as headers in subsequent API calls
- [ ] `viewAsLastRole` confirmed preserved across exit
- [ ] No localStorage used for any view-as state
- [ ] Code merged to frontend repo main
- [ ] Frontend deployed to staging

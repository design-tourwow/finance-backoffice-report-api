# Story 008 — Frontend 403 Handling

**Phase:** 1 (Backend RBAC)
**Type:** Frontend
**Complexity:** S

---

## User Story

As a ts or crm user,
When I navigate to a URL or trigger an API call that returns 403,
I want to see a meaningful error page instead of a blank screen or unhandled JavaScript exception,
So that the application remains usable and I understand I don't have access.

---

## Background

After Phase 1 ships, ts/crm users hitting admin-only endpoints will receive 403 instead of 200. The frontend currently handles 401 (via `handleUnauthorized` in `shared-http.js`) but does not explicitly handle 403 — it falls into the generic `!response.ok` error path which throws a raw error string. This creates a blank-page or unhandled-exception experience when, for example, a ts user bookmarks a direct URL to an admin page.

The fix has two parts:
1. `shared-http.js` must catch 403 and call `TokenUtils.redirectToForbiddenPage()` (which already exists in `token-utils.js`).
2. Verify the `/403` page exists and renders a human-readable message.

---

## Acceptance Criteria

1. When any API call from `shared-http.js` receives HTTP 403, `TokenUtils.redirectToForbiddenPage()` is called. The page navigates to `/403`.
2. The redirect is non-blocking (same pattern as the existing 401 handler — fire redirect, throw an error so awaiters don't hang).
3. The thrown error has `name = 'SharedHttpForbiddenError'` and `status = 403`.
4. The `/403` page exists and displays a Thai-language message indicating the user does not have access (e.g., "คุณไม่มีสิทธิ์เข้าถึงหน้านี้").
5. `menu-component.js` `canAccessPath()` already gates route access by role — confirm this redirects to `/403` correctly for ts/crm on admin-only paths. No change needed if it already works; just verify and document.
6. No existing 401 handling is broken.

**Gherkin:**

```
Scenario: ts user triggers admin API call
  Given a ts user is logged in
  When an API call returns HTTP 403
  Then the browser navigates to /403
  And the page displays a human-readable access-denied message

Scenario: missing token still triggers 401 redirect, not 403
  Given no auth token is present
  When an API call returns HTTP 401
  Then the browser navigates to /401 (existing behaviour unchanged)
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report/shared-http.js` — add 403 handling in `runRequest`

**shared-http.js — `runRequest` function:**

Add a 403 branch immediately after the existing 401 branch (around line 139):

```javascript
if (response.status === 401) {
  return handleUnauthorized();
}

// NEW: 403 Forbidden — user is authenticated but lacks permission
if (response.status === 403) {
  return handleForbidden();
}
```

Add the `handleForbidden` function (modeled on `handleUnauthorized`):

```javascript
function handleForbidden() {
  console.warn('[SharedHttp] 403 Forbidden — redirecting to /403');
  if (window.TokenUtils && typeof window.TokenUtils.redirectToForbiddenPage === 'function') {
    window.TokenUtils.redirectToForbiddenPage();
  }
  var err = new Error('SharedHttp forbidden (403) — insufficient permissions');
  err.name = 'SharedHttpForbiddenError';
  err.status = 403;
  throw err;
}
```

**Verify `/403` page:** Check that `/Users/gap/finance-backoffice-report/403.html` (or `403/index.html`) exists and has a user-facing message. If the page exists but shows only an HTTP status code without a message, add a Thai-language explanation.

**TokenUtils.redirectToForbiddenPage** already exists in `token-utils.js` (line 140-142 — calls `redirectToErrorPage('403')`). No change needed there.

**menu-component.js `canAccessPath`:** The existing function already returns `false` for paths in `ROLE_ACCESS` marked as `false` for the current role. Verify that a ts user navigating directly to `/sales-report` is redirected to `/403` (not silently shown a broken page). If the redirect is already wired, document it. If not, wire it in `initMenuComponent`.

---

## Test Cases

- Manual test: log in as ts user, navigate directly to `/sales-report` URL → should land on `/403` page.
- Manual test: log in as ts user, trigger a page action that calls an admin endpoint → should redirect to `/403` (not blank or error in console).
- TC-01 end-to-end: ts JWT + admin endpoint → frontend shows `/403` page (not blank).

**Must pass before merge:** manual smoke of both scenarios above on staging.

---

## Dependencies

- Story 004 (admin-only endpoints must be locked before this can be tested end-to-end)
- Stories 001-003 can be merged independently

---

## Definition of Done

- [ ] `handleForbidden()` function added to `shared-http.js`
- [ ] 403 branch added to `runRequest` in `shared-http.js`
- [ ] `/403` page verified to exist with human-readable Thai message
- [ ] `canAccessPath` redirect to `/403` verified working for ts/crm on admin paths
- [ ] No regression on 401 handling
- [ ] Manual smoke test on staging: ts user → admin URL → `/403` page
- [ ] Code merged to frontend repo main
- [ ] Frontend deployed to staging

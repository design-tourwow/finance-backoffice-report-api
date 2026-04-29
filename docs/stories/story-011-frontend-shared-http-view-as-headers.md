# Story 011 — Frontend: shared-http.js Injects View-As Headers

**Phase:** 3 (View-As)
**Type:** Frontend
**Complexity:** S

---

## User Story

As admin id=555 in view-as mode,
Every API call my browser makes automatically includes X-View-As-Role and X-View-As-User-Id headers,
So that I don't need to manually add headers and every page I visit reflects the impersonated user's data.

---

## Background

`shared-http.js` is the single HTTP client used by all frontend pages. Architecture doc Section 8e and the header contract in Section 5 specify that `buildHeaders()` is the injection point. When `sessionStorage.viewAsRole` and `sessionStorage.viewAsUserId` are both set, every request must include the two view-as headers. No per-page code change is needed — this single change covers all 14+ pages.

---

## Acceptance Criteria

1. When `sessionStorage.viewAsRole` and `sessionStorage.viewAsUserId` are both set, every request built by `SharedHttp.get()` and `SharedHttp.post()` includes `X-View-As-Role` and `X-View-As-User-Id` headers.
2. When either key is absent or empty, neither header is added (partial state is not sent — matches backend requirement from architecture Section 5).
3. When both keys are cleared (exit flow), subsequent requests have no view-as headers.
4. The injection is in `buildHeaders()` only — no per-page change is made.
5. View-as headers do not interfere with any other header (no overwrite of `Authorization` or `Content-Type`).
6. The function reads `sessionStorage` at call time (not at module load time) so the state is always current within the same tab.

**Gherkin:**

```
Scenario: view-as active
  Given sessionStorage has viewAsRole='ts' and viewAsUserId='100'
  When SharedHttp.get('/api/reports/commission-plus', {}) is called
  Then the fetch options headers include X-View-As-Role='ts'
  And headers include X-View-As-User-Id='100'

Scenario: view-as not active (only one key set)
  Given sessionStorage has viewAsRole='ts' but no viewAsUserId
  When SharedHttp.get('/api/reports/commission-plus', {}) is called
  Then neither X-View-As-Role nor X-View-As-User-Id is in headers

Scenario: view-as cleared after exit
  Given sessionStorage had both keys but both are now removed
  When SharedHttp.get('/api/...', {}) is called
  Then neither view-as header is present
```

---

## Implementation Notes

**File to change:** `/Users/gap/finance-backoffice-report/shared-http.js`

**Modify `buildHeaders` function** (lines 70-86). Add after the Authorization header block:

```javascript
// Inject view-as headers when an active impersonation session exists.
// Both keys must be present — partial state is not sent (backend requires both).
var viewAsRole   = sessionStorage.getItem('viewAsRole');
var viewAsUserId = sessionStorage.getItem('viewAsUserId');
if (viewAsRole && viewAsUserId) {
  headers['X-View-As-Role']    = viewAsRole;
  headers['X-View-As-User-Id'] = viewAsUserId;
}
```

This block must come BEFORE the `extraHeaders` merge so that a caller cannot accidentally override the view-as headers via `opts.headers`.

**sessionStorage keys** (UX spec Section 11):

| Key | Used here |
|-----|-----------|
| `viewAsRole` | Yes |
| `viewAsUserId` | Yes |
| `viewAsUserNick` | No — banner only |
| `viewAsUserTeam` | No — banner only |

Only the two header keys are read in `shared-http.js`.

**No changes to `SharedHttp` public API surface** — `get`, `post`, `buildQuery`, `getAuthHeader` remain identical.

---

## Test Cases

- Manual test: log in as admin id=555, open browser dev tools, set `sessionStorage.viewAsRole = 'ts'` and `sessionStorage.viewAsUserId = '100'` manually, then trigger a commission-plus API call — verify request headers in network tab include both view-as headers.
- Manual test: remove `viewAsUserId` from sessionStorage, re-trigger — verify neither header is sent.
- **TC-03** (integration): frontend in view-as mode + commission-plus → rows scoped to user 100.
- **R-06** mitigation: with view-as active, `X-Effective-Role: ts` is echoed in the response header — confirm banner (Story 014) reads this correctly.

**Must pass before merge:** manual header injection verification; TC-03 on staging.

---

## Dependencies

- Story 010 (backend view-as header handling verified working before frontend sends them)
- Stories 012-015 can be developed in parallel on the same feature branch

---

## Definition of Done

- [ ] `buildHeaders` injects view-as headers when both sessionStorage keys are set
- [ ] Partial state (only one key) sends no headers
- [ ] `Authorization` header unaffected
- [ ] Network tab verification on staging: headers present when sessionStorage is set
- [ ] Code merged to frontend repo main
- [ ] Frontend deployed to staging

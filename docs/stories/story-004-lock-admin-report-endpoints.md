# Story 004 — Lock Admin-Only Report Endpoints

**Phase:** 1 (Backend RBAC)
**Type:** Backend
**Complexity:** M

---

## User Story

As the platform security owner,
I want every admin-only report endpoint to return 403 when called by a ts or crm user,
So that role-restricted business intelligence data is never accessible below the admin tier regardless of how requests are crafted.

---

## Background

The following 17 endpoint route files currently have no role check. Any valid JWT holder can call them. This story adds `requireRole(['admin'])` at the top of each handler.

Architecture doc Section 6a lists these as the admin-only report group.

---

## Acceptance Criteria

1. Each of the 17 endpoints listed below returns HTTP 403 with body `{ "success": false, "error": "Forbidden", "required_roles": ["admin"], "your_role": "<caller's role>" }` when called with a valid `ts` or `crm` JWT.
2. Each endpoint returns HTTP 200 (or its normal non-error status) when called with a valid `admin` JWT.
3. The 403 is returned before any database query executes.
4. API key callers still receive 200 (bypass is preserved — architecture Section 2 flow).
5. Response header `X-Effective-Role: admin` is present on 200 responses.
6. No change in response shape for admin — existing admin consumers see identical data.

**Endpoints covered (relative to `/api/`):**

```
reports/by-country
reports/by-supplier
reports/by-created-date
reports/by-travel-start-date
reports/by-travel-date
reports/by-booking-date
reports/summary
reports/lead-time-analysis
reports/repeat-customers
reports/countries
reports/wholesale-by-country
reports/supplier-performance
reports/sales-discount
reports/order-external-summary
reports/order-has-discount
reports/repeated-customer-report
reports/work-list
reports/commission-plus/pdf
```

---

## Implementation Notes

**Files to change:** One route file per endpoint. All route files live at:
`/Users/gap/finance-backoffice-report-api/app/api/reports/<name>/route.ts`
and
`/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/pdf/route.ts`

**Pattern to apply to each handler** (architecture doc Section 4d):

```typescript
import { verifyJWT } from '@/lib/jwt'
import { requireRole } from '@/lib/auth'

export const GET = withApiGuard('/api/reports/<name>', async (request) => {
  const payload = verifyJWT(request)
  const guard = requireRole(['admin'], request, payload)
  if (!guard.ok) return guard.response

  // existing handler body unchanged below this line
  // add X-Effective-Role header to the final response
})
```

**How to add the response header without touching every return statement:**

Wrap the existing handler body in a helper or, simpler, post-process the response after the existing logic:

```typescript
const response = await existingHandlerLogic(request, guard.auth)
response.headers.set('X-Effective-Role', guard.auth.effectiveRole)
return response
```

The cleanest approach is to extract the existing handler body into an inner async function, call it, then attach the header before returning.

**Import change:** Add `import { verifyJWT } from '@/lib/jwt'` and `import { requireRole } from '@/lib/auth'` at the top of each file. `withApiGuard` import already exists.

**Static lint check:** After this story, a CI grep command should confirm every route file in `/app/api/reports/` contains `requireRole(` — except routes that are intentionally public (none in this group). Add this grep to the CI pipeline (story 016 will run it as part of the test matrix).

---

## Test Cases

- **TC-01**: ts user denied on `GET /api/reports/by-country` → 403 (representative test; apply same assertion to all 17 endpoints in the smoke script).
- **TC-02**: admin regression sweep — admin hits all 50 endpoints, including these 17 → 200.
- **TC-13**: API key bypass → 200 on any of these endpoints.
- **TC-06, TC-07, TC-08**: 401 cases (no JWT, expired, tampered) → 401 on these endpoints.

**Must pass before merge:** TC-01, TC-02 (admin sweep for all 17 listed endpoints), TC-13.

---

## Dependencies

- Story 003 (auth helpers must exist before they can be called)

---

## Definition of Done

- [ ] All 17 route files contain `requireRole(['admin'], ...)` call at the top of the handler body
- [ ] `X-Effective-Role` response header present on 200 responses from each endpoint
- [ ] Admin smoke test passes on staging (TC-02 subset)
- [ ] ts/crm JWT returns 403 on each endpoint (manual curl or integration test)
- [ ] CI grep check: no route file in the admin group is missing `requireRole(`
- [ ] Code merged to main
- [ ] Deployed to staging; zero unexpected 403/401 spikes in admin sessions for 30 minutes post-deploy

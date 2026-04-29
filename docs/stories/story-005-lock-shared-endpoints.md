# Story 005 — Lock Admin + ts + crm Shared Endpoints

**Phase:** 1 (Backend RBAC)
**Type:** Backend
**Complexity:** S

---

## User Story

As the platform security owner,
I want the shared endpoints accessible to all three roles to require a valid JWT,
So that unauthenticated callers are rejected and the role tier is formally declared even for endpoints that don't restrict by role.

---

## Background

Architecture doc Section 6b lists five endpoints that all three roles may access. These already require authentication via `withApiGuard`, but they have no explicit `requireRole` call declaring their access tier. Adding `requireRole(['admin','ts','crm'])` makes the intent explicit, ensures the `AuthContext` is available for Phase 2 SQL filtering, and echoes `X-Effective-Role` so the frontend banner can trust the server's decision.

Note: `reports/commission-plus` and `reports/commission-plus/sellers` are included here but will receive SQL filter logic in Story 009 (Phase 2). This story only adds the role gate.

---

## Acceptance Criteria

1. Each of the 5 endpoints below accepts requests from `admin`, `ts`, and `crm` JWTs (HTTP 200).
2. Requests with no JWT, expired JWT, or tampered JWT return 401.
3. API key callers receive 200 (bypass preserved).
4. Response header `X-Effective-Role: <role>` is present on 200 responses.
5. No change in response data for any existing caller.

**Endpoints covered (relative to `/api/`):**

```
reports/commission-plus
reports/commission-plus/sellers
available-periods
customers/search
agency-members
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/sellers/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/available-periods/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/customers/search/route.ts` (if exists, otherwise the customers route)
- `/Users/gap/finance-backoffice-report-api/app/api/agency-members/route.ts`

**Pattern to apply** (same as Story 004, different allowed list):

```typescript
const payload = verifyJWT(request)
const guard = requireRole(['admin', 'ts', 'crm'], request, payload)
if (!guard.ok) return guard.response
// guard.auth is now available for Phase 2 SQL filtering
```

For `commission-plus` and `commission-plus/sellers`: the guard is added now; the `guard.auth` values are not yet used to filter SQL (that is Story 009). Do not remove or change the existing `jobPosition` / `sellerId` param reading logic in this story — leave it intact for Phase 2 to override.

For `available-periods`, `customers/search`, and `agency-members`: no SQL filter is needed — all roles see the same data. Just add the gate and the response header.

---

## Test Cases

- TC-11 (ts JWT on commission-plus) → 200 (will return all data at this phase; SQL filter comes in Story 009 — this is expected interim behavior).
- TC-16 (crm JWT on commission-plus) → 200.
- TC-06, TC-07, TC-08 → 401 on commission-plus.
- TC-13 → 200 with API key.

**Must pass before merge:** TC-06, TC-07, TC-13 on all 5 endpoints; 200 for admin/ts/crm JWTs.

---

## Dependencies

- Story 003 (auth helpers)
- Story 004 can be developed in parallel; no ordering constraint between 004 and 005

---

## Definition of Done

- [ ] `requireRole(['admin','ts','crm'], ...)` added to all 5 route handlers
- [ ] `X-Effective-Role` response header on 200 responses
- [ ] ts/crm users can still access commission-plus (200) — no regressions
- [ ] No admin regressions on these endpoints
- [ ] Code merged to main
- [ ] Deployed to staging

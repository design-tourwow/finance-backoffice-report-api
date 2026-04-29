# Story 006 — Lock High-Risk Admin Tools

**Phase:** 1 (Backend RBAC)
**Type:** Backend
**Complexity:** S

---

## User Story

As the platform security owner,
I want the raw database access and user management endpoints locked to admin before any other RBAC change ships,
So that the highest-risk attack surface is eliminated first and no ts/crm user can execute arbitrary SQL or enumerate the schema.

---

## Background

Architecture doc Section 6c classifies these endpoints as the highest-risk group. `database/query` allows arbitrary SQL execution. `database/schema` and `database/tables` expose full schema introspection. `tables/*` allows raw table access. `users` exposes user management. These must be locked to admin even if nothing else in Phase 1 is complete.

---

## Acceptance Criteria

1. All endpoints listed below return HTTP 403 for valid `ts` or `crm` JWTs.
2. All endpoints return HTTP 200 for valid `admin` JWT.
3. All endpoints return HTTP 401 for missing, expired, or tampered JWT.
4. API key callers receive 200 (bypass preserved — these may be used by internal tooling).
5. The 403 is returned before any database operation executes.
6. Response header `X-Effective-Role: admin` on 200 responses.

**Endpoints covered (relative to `/api/`):**

```
database/query
database/schema
database/tables
tables/*   (wildcard — all routes under /api/tables/)
users
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report-api/app/api/database/query/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/database/schema/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/database/tables/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/tables/[...slug]/route.ts` (or however the wildcard route is structured — verify actual file path)
- `/Users/gap/finance-backoffice-report-api/app/api/users/route.ts`

Before writing code, verify that the `tables/*` wildcard route exists and find its actual file path. Run a directory listing under `/app/api/tables/` to confirm.

**Pattern** (identical to Story 004):

```typescript
const payload = verifyJWT(request)
const guard = requireRole(['admin'], request, payload)
if (!guard.ok) return guard.response
```

**Priority note:** This group should be deployed to production FIRST within Phase 1, ideally as a separate micro-deploy, because the risk of leaving these unguarded during Phase 1 rollout is unacceptable. Coordinate with deploy story (Story 017).

---

## Test Cases

- TC-01 variant: ts JWT on `GET /api/database/query` → 403.
- TC-02: admin regression sweep includes all endpoints in this group → 200.
- TC-13: API key on `database/query` → 200.
- TC-06, TC-07, TC-08: 401 cases on `database/query`.

**Must pass before merge:** ts/crm → 403 on every endpoint in this group; admin → 200; no 500s.

---

## Dependencies

- Story 003 (auth helpers)
- No dependency on Stories 004 or 005 — this story should be merged and deployed independently as the highest-priority Phase 1 item

---

## Definition of Done

- [ ] `requireRole(['admin'], ...)` in every listed route handler
- [ ] `tables/*` wildcard file located and locked (file path verified before coding)
- [ ] ts/crm → 403 confirmed with curl on staging
- [ ] Admin → 200 confirmed with curl on staging
- [ ] Code merged to main
- [ ] Deployed to staging (and prioritized for early production deploy)

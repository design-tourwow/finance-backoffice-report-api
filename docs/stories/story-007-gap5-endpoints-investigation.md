# Story 007 — Investigate and Lock gap-5 Endpoints (chat-history, docs/tables)

**Phase:** 1 (Backend RBAC)
**Type:** Backend
**Complexity:** S

---

## User Story

As the platform security owner,
I want to determine whether `chat-history` and `docs/tables` endpoints are actively used by any frontend page, and then either classify them correctly or lock them to admin,
So that potential live vulnerabilities are not left open while Phase 1 ships.

---

## Background

Architecture doc Section 6e and OQ-4 flag these two endpoints as "investigate before locking." The test strategy Section 3 (matrix) places them in the G-ADMIN group (admin-only), suggesting they are dev/internal tools. However, this must be confirmed before locking, because locking an endpoint that a ts/crm page legitimately calls would cause a regression.

This is the only Phase 1 story that requires an investigation step before writing code.

---

## Acceptance Criteria

**Investigation criteria (must be documented before any code change):**

1. Code search across all frontend JS files in `/Users/gap/finance-backoffice-report` for calls to `chat-history` and `docs/tables`.
2. Code search across all backend route files for any internal server-side calls to these endpoints.
3. Document findings: "active use found" or "no active use found" for each endpoint.

**Based on investigation findings:**

4a. If no active use is found: add `requireRole(['admin'], ...)` to both route handlers (same pattern as Story 006). Document that these are admin-only dev tools.

4b. If active use by ts/crm is found: add `requireRole(['admin','ts','crm'], ...)` and flag a follow-up story to remove or redesign the dependency.

5. Regardless of outcome: the implementation decision and rationale are committed as a comment in each route file.

6. Both endpoints return 401 for unauthenticated requests (this is true regardless of role classification).

---

## Implementation Notes

**Files to investigate:**
- `/Users/gap/finance-backoffice-report-api/app/api/chat-history/route.ts` (verify path exists)
- `/Users/gap/finance-backoffice-report-api/app/api/docs/tables/route.ts` (verify path exists)

**Frontend search commands (run before coding):**
```bash
grep -r "chat-history" /Users/gap/finance-backoffice-report --include="*.js" --include="*.html"
grep -r "docs/tables" /Users/gap/finance-backoffice-report --include="*.js" --include="*.html"
```

**Expected outcome:** Both are dev/internal tools with no active frontend use. Lock to admin. This is the assumption — the investigation may override it.

**Pattern if locking to admin:**
```typescript
const payload = verifyJWT(request)
const guard = requireRole(['admin'], request, payload)
if (!guard.ok) return guard.response
```

Add this comment above the guard:
```typescript
// Locked to admin: investigation on 2026-04-29 found no active frontend use.
// This is an internal dev/diagnostic tool. See story-007 for details.
```

---

## Test Cases

- TC-01 variant: ts JWT on `GET /api/chat-history` → 403 (if locked to admin).
- TC-02: admin regression sweep includes these endpoints.
- If active ts/crm use found: TC-11 variant on `chat-history` → 200 with ts JWT.

**Must pass before merge:** admin → 200; unauthenticated → 401; investigation findings documented.

---

## Dependencies

- Story 003 (auth helpers)
- No ordering constraint relative to Stories 004-006 for the code change; investigation should happen early in Phase 1 planning

---

## Definition of Done

- [ ] Investigation completed and findings documented in a code comment in each route file
- [ ] `requireRole(...)` applied based on investigation result
- [ ] Frontend search shows no broken pages after locking
- [ ] Code merged to main
- [ ] Deployed to staging; manual check that no frontend page throws errors related to these endpoints

---

## Flagged for Clarification

This story requires a pre-code investigation that may change the acceptance criteria. If active ts/crm use is found for either endpoint, a new story must be created to handle the dependency (either redesign the endpoint or reclassify it). Flag this to the team before starting implementation.

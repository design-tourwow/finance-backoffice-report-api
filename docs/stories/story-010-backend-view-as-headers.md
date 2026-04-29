# Story 010 — Backend Honors View-As Headers (Phase 3)

**Phase:** 3 (View-As)
**Type:** Backend
**Complexity:** S

---

## User Story

As admin id=555,
When I send X-View-As-Role and X-View-As-User-Id request headers,
The backend applies SQL filters as if the request came from the target user,
So that I can verify exactly what data that user sees without logging out.

---

## Background

The auth helper functions `getEffectiveRole` and `getEffectiveUserId` implemented in Story 003 already fully implement the view-as logic — they read and validate the headers, check the caller is admin id=555, log the impersonation event, and return the effective identity. Story 009 already wires these into the commission-plus SQL filter.

This story is therefore primarily a **validation and documentation story** rather than a net-new code story. Its purpose is to confirm the end-to-end backend path works correctly for the view-as use case, add the `X-Effective-Role` response echo to all relevant endpoints (ensuring it is present even on endpoints added in Stories 004-007), and verify the console.log impersonation audit trail.

---

## Acceptance Criteria

1. `GET /api/reports/commission-plus` with admin id=555 JWT + `X-View-As-Role: ts` + `X-View-As-User-Id: 100` returns rows where `seller_agency_member_id = 100` and `is_old_customer = 0`.
2. `GET /api/reports/commission-plus` with admin id=555 JWT + `X-View-As-Role: ts` + `X-View-As-User-Id: 100` returns HTTP 403 when called against an admin-only endpoint (e.g., `by-country`) — effective role is ts, which is blocked.
3. `X-Effective-Role` response header is present on every endpoint response, including 403 responses. Value reflects the effective role (not the real role when impersonating).
4. Sending `X-View-As-Role: admin` is silently ignored — effective role remains admin, no escalation.
5. Sending only one of the two view-as headers is silently ignored (both required together).
6. Sending `X-View-As-User-Id: abc` (non-numeric) falls back to real user id.
7. A `console.log` entry is emitted when impersonation is activated: `[ViewAs] Admin id=555 impersonating role=ts userId=100`.
8. No admin user other than id=555 can activate view-as — their headers are silently discarded (TC-04).

---

## Implementation Notes

**No new code is required** if Stories 003 and 009 are complete. This story's implementation work is:

1. Audit all endpoints added in Stories 004, 005, 006, 007 to confirm they attach `X-Effective-Role` to the response. If any are missing the header, add it.
2. Verify the console.log in `getEffectiveRole` (Story 003 spec) is present and fires with the correct format.
3. Run TC-03, TC-04, TC-09 manually via curl against staging.

**Files to audit (add X-Effective-Role header if missing):**

All route files touched in Stories 004, 005, 006, 007. Cross-check with this pattern in each handler:

```typescript
const response = NextResponse.json({ ... })
response.headers.set('X-Effective-Role', guard.auth.effectiveRole)
return response
```

If a handler has multiple return points, ensure all of them attach the header. The simplest approach is a post-processing wrapper.

**Validation for invalid X-View-As-Role values (N-01):**

Confirm `getEffectiveRole` (Story 003) already handles: null bytes, oversized strings, non-ascii values, `ADMIN` (uppercase), `ts ts` (with spaces). These should all fall back to the real role. Add a test case if Story 003 unit tests didn't cover the full fuzz range.

---

## Test Cases

- **TC-03**: admin id=555 + view-as ts/100 on commission-plus → 200, all rows seller_id=100, `X-Effective-Role: ts` in response header.
- **TC-04**: admin id=999 + view-as headers → 200 admin scope, `X-Effective-Role: admin`.
- **TC-09**: admin id=555 + view-as ts + admin-only endpoint → 403, `X-Effective-Role: ts`.
- **TC-20**: admin id=555 + view-as ts/100 + commission-plus/pdf → 200, PDF content reflects ts/100 data.
- **N-01**: fuzz X-View-As-Role with random strings → never 500, never role elevation.
- **N-02**: fuzz X-View-As-User-Id with non-integers → sanitized or 400.
- **N-11**: lowercase `x-view-as-role` header → accepted (HTTP case-insensitive; confirm Next.js normalizes).

**Must pass before merge:** TC-03, TC-04, TC-09.

---

## Dependencies

- Story 003 (auth helpers — view-as logic lives here)
- Story 009 (SQL filter — commission-plus already filtered by effectiveUserId)
- Stories 004, 005, 006, 007 (all endpoints must be locked before this can be end-to-end tested)

---

## Definition of Done

- [ ] `X-Effective-Role` response header confirmed present on all gated endpoints (audit complete)
- [ ] console.log impersonation event confirmed firing in server logs during staging test
- [ ] TC-03, TC-04, TC-09 pass via curl against staging
- [ ] TC-20 passes (PDF endpoint reflects view-as data scope)
- [ ] N-01 fuzz — no 500s observed
- [ ] Code merged to main (if any audit fixes were needed)
- [ ] Deployed to staging

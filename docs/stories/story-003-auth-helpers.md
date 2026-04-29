# Story 003 — Auth Helpers: getRealRole, getEffectiveRole, getEffectiveUserId, requireRole

**Phase:** 1 (Backend RBAC)
**Type:** Backend
**Complexity:** M

---

## User Story

As a backend developer,
I want a set of typed auth helper functions that derive the effective role and user id from a request,
So that every route handler can gate access with a single `requireRole()` call and the view-as logic is centralized in one place.

---

## Background

Today `lib/auth.ts` has no concept of role. This story implements the four functions specified in architecture doc Section 4 and extends `lib/jwt.ts` with the typed `AgencyMember` / `JWTPayload` interfaces from architecture Section 4a. After this story these functions exist but are not yet wired to any route — they are dead code until Stories 004-007.

The backend also echoes `X-Effective-Role` as a response header (architecture Section 5 / PRD Q2 resolved) so the frontend banner can read the server's actual decision. This echo is applied inside `requireRole`.

---

## Acceptance Criteria

1. `lib/jwt.ts` exports `AgencyMember` and a typed `JWTPayload` interface that includes `user.agency_member` with `id: number`, `job_position: string`, and `roles_slug?: string`. The canonical source-of-truth comment is present.
2. `getRealRole(payload)` returns `'admin' | 'ts' | 'crm'`. Falls back to `'admin'` for unrecognized values (matches existing `getCurrentUserRole()` behaviour in `menu-component.js:212`). Returns `'admin'` if `agency_member` is missing.
3. `getEffectiveRole(request, payload)` honors `X-View-As-Role` only when `getRealRole(payload) === 'admin'` AND `payload.user.agency_member.id === 555`. Any other caller: headers silently ignored.
4. `getEffectiveRole` rejects `X-View-As-Role: admin` — only `ts` and `crm` are valid view-as roles; anything else is ignored with a `console.warn`.
5. If only one of `X-View-As-Role` / `X-View-As-User-Id` is present, both are treated as absent (logged as warning, not error).
6. `getEffectiveUserId(request, payload)` returns the view-as user id (parsed as positive integer) when impersonation is active; otherwise returns `payload.user.agency_member.id`.
7. Non-numeric, zero, or negative `X-View-As-User-Id` values fall back to the real user id.
8. `requireRole(allowed, request, payload)` returns `{ ok: true, auth: AuthContext }` when the effective role is in `allowed`. Returns `{ ok: false, response: Response(403) }` otherwise.
9. 403 response body shape: `{ "success": false, "error": "Forbidden", "required_roles": [...], "your_role": "..." }`.
10. When `payload` is `null` (API key path), `requireRole` returns `{ ok: true, auth: { effectiveRole: 'admin', effectiveUserId: 0, realRole: 'admin', realUserId: 0, isImpersonating: false } }` — service account is treated as admin.
11. `requireRole` adds the response header `X-Effective-Role: <effectiveRole>` to the 403 response. Route handlers that pass the guard must add this header to their own 200 response (see Usage pattern in architecture doc Section 4d).
12. Unit tests cover all branches listed in test strategy Section 2 (Unit layer).

**Gherkin (selected scenarios):**

```
Scenario: admin id=555 with valid view-as headers
  Given payload has job_position=admin, agency_member.id=555
  And request has X-View-As-Role: ts, X-View-As-User-Id: 123
  When getEffectiveRole is called
  Then it returns 'ts'
  And getEffectiveUserId returns 123

Scenario: admin id=999 with view-as headers
  Given payload has job_position=admin, agency_member.id=999
  And request has X-View-As-Role: ts, X-View-As-User-Id: 123
  When getEffectiveRole is called
  Then it returns 'admin' (headers ignored)
  And getEffectiveUserId returns 999

Scenario: ts user with escalation attempt
  Given payload has job_position=ts, agency_member.id=999
  And request has X-View-As-Role: admin, X-View-As-User-Id: 555
  When requireRole(['admin','ts','crm'], request, payload) is called
  Then it returns { ok: true } with effectiveRole='ts', effectiveUserId=999

Scenario: ts user hits admin-only endpoint
  Given payload has job_position=ts
  When requireRole(['admin'], request, payload) is called
  Then it returns { ok: false, response: 403 }
  And the response body contains required_roles=['admin'], your_role='ts'

Scenario: API key caller (null payload)
  When requireRole(['admin'], request, null) is called
  Then it returns { ok: true, auth.effectiveRole='admin' }
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report-api/lib/jwt.ts` — extend `JWTPayload` interface (do not change logic)
- `/Users/gap/finance-backoffice-report-api/lib/auth.ts` — add four new exports

**lib/jwt.ts additions** (architecture doc Section 4a):

Add `AgencyMember` interface and update `JWTPayload` — replace the generic `[key: string]: unknown` on the `user` field with the typed sub-interface. Preserve all existing exports; no logic changes.

**lib/auth.ts additions** (architecture doc Section 4b):

```typescript
export type Role = 'admin' | 'ts' | 'crm'

export interface AuthContext {
  effectiveRole: Role
  effectiveUserId: number
  realRole: Role
  realUserId: number
  isImpersonating: boolean
}

export type RoleGuardResult =
  | { ok: true;  auth: AuthContext }
  | { ok: false; response: Response }

export function getRealRole(payload: JWTPayload): Role { ... }
export function getEffectiveRole(request: NextRequest, payload: JWTPayload): Role { ... }
export function getEffectiveUserId(request: NextRequest, payload: JWTPayload): number { ... }
export function requireRole(allowed: Role[], request: NextRequest, payload: JWTPayload | null): RoleGuardResult { ... }
```

The `VIEW_AS_ADMIN_ID` should be read from `process.env.VIEW_AS_ADMIN_ID` with a fallback of `555` — this addresses architecture OQ-1 without requiring a code deploy to change the id. Add a comment documenting this.

**`requireRole` usage pattern** (architecture doc Section 4d):

```typescript
export const GET = withApiGuard('/api/reports/by-country', async (request) => {
  const payload = verifyJWT(request)
  const guard = requireRole(['admin'], request, payload)
  if (!guard.ok) return guard.response

  const { auth } = guard
  // build response, then attach header:
  const resp = NextResponse.json({ ... })
  resp.headers.set('X-Effective-Role', auth.effectiveRole)
  return resp
})
```

**`console.log` for impersonation events** (Q7 resolved — DB audit deferred):

Inside `getEffectiveRole`, when impersonation is activated add:
```typescript
console.log(`[ViewAs] Admin id=555 impersonating role=${viewAsRole} userId=${viewAsUserId}`)
```

---

## Test Cases

Unit tests to write in `lib/__tests__/auth.test.ts` (create file):

| Test | Expected |
|------|----------|
| `getRealRole` with `job_position=admin` | `'admin'` |
| `getRealRole` with `job_position=ts` | `'ts'` |
| `getRealRole` with `job_position=crm` | `'crm'` |
| `getRealRole` with unknown `job_position` | `'admin'` (fallback) |
| `getRealRole` with missing `agency_member` | `'admin'` (fallback) |
| `getRealRole` with `roles_slug=admin, job_position=ts` | `'ts'` (TC-19) |
| `getEffectiveRole` id=555 admin + valid view-as | impersonated role |
| `getEffectiveRole` id=999 admin + view-as headers | real role `'admin'` |
| `getEffectiveRole` ts + view-as headers | real role `'ts'` |
| `getEffectiveRole` id=555 + `X-View-As-Role: admin` | real role `'admin'` (rejected) |
| `getEffectiveRole` id=555 + only one header present | real role (both required) |
| `getEffectiveUserId` non-numeric user id | real user id |
| `requireRole` pass | `{ ok: true }` |
| `requireRole` fail | `{ ok: false }`, response status 403 |
| `requireRole` null payload | `{ ok: true, auth.effectiveRole='admin' }` |

**Must pass before merge:** all unit tests above. TC-19 is the key regression guard.

---

## Dependencies

- Story 001 (JWT_SECRET guard in place)
- Story 002 (strict Bearer / x-api-key separation)

---

## Definition of Done

- [ ] `AgencyMember` and updated `JWTPayload` exported from `lib/jwt.ts`
- [ ] All four helper functions exported from `lib/auth.ts`
- [ ] `VIEW_AS_ADMIN_ID` reads from env with default 555
- [ ] Impersonation activation logged via `console.log`
- [ ] Unit tests written and passing
- [ ] No existing test regressions
- [ ] Code merged to main
- [ ] Deployed to staging (functions are dead code at this point — no endpoint changes yet)

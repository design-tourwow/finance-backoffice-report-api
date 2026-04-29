# Story 002 — Strict Bearer / x-api-key Separation

**Phase:** 0 (Preparation)
**Type:** Backend
**Complexity:** S

---

## User Story

As the platform security owner,
I want `Authorization: Bearer` to be treated exclusively as a JWT and `x-api-key` to be treated exclusively as an API key,
So that a leaked API key placed in the Bearer header cannot masquerade as a JWT caller, and the two auth paths are cleanly separated.

---

## Background

Current `lib/auth.ts:14` strips the `Bearer ` prefix when checking for an API key:
```
const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
```

This means a valid API key sent as `Authorization: Bearer <api-key>` would first fail JWT verification, then succeed as an API key fallback (TC-14 in the test strategy). The architecture decision (locked) is: **Bearer = JWT only; x-api-key = API key only — strict separation, no cross-fallback**.

Additionally, `lib/jwt.ts` currently falls through to try `x-api-key` as a JWT token. That path must be removed once strict separation is in place.

---

## Acceptance Criteria

1. `validateApiKey(request)` reads **only** `x-api-key` header. It never reads `Authorization` header.
2. `verifyJWT(request)` reads **only** `Authorization: Bearer <token>`. It does not fall through to `x-api-key`.
3. A request with `Authorization: Bearer <valid-api-key>` returns 401 (JWT verification fails; no fallback to API key check).
4. A request with `x-api-key: <valid-api-key>` and no `Authorization` header authenticates as `method: 'api_key'`.
5. A request with `Authorization: Bearer <valid-jwt>` authenticates as `method: 'jwt'` (no regression).
6. Existing behaviour of `authenticate()` for the happy paths (valid JWT, valid API key in correct header) is unchanged.

**Gherkin:**

```
Scenario: API key in wrong header
  Given a valid API key
  When the request sends Authorization: Bearer <api-key>
  Then authenticate() returns { authenticated: false }
  And the response status is 401

Scenario: API key in correct header
  Given a valid API key
  When the request sends x-api-key: <api-key>
  Then authenticate() returns { authenticated: true, method: 'api_key' }

Scenario: JWT in correct header
  Given a valid signed JWT
  When the request sends Authorization: Bearer <jwt>
  Then authenticate() returns { authenticated: true, method: 'jwt' }
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report-api/lib/auth.ts`
- `/Users/gap/finance-backoffice-report-api/lib/jwt.ts`

**lib/auth.ts — `validateApiKey` function (lines 13-21):**

```typescript
// Before
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  ...
}

// After
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')  // x-api-key ONLY — no Bearer fallback
  if (!apiKey) return false
  return VALID_API_KEYS.has(apiKey)
}
```

**lib/jwt.ts — `verifyJWT` function (lines 29-48):**

Remove the `else if (apiKeyHeader)` branch entirely. The function should only look at `Authorization: Bearer ...`:

```typescript
// After — simplified header reading
const authHeader = request.headers.get('authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  console.log('[JWT] No Bearer token provided')
  return null
}
const token = authHeader.substring(7)
```

The `apiKeyHeader` variable and its associated branch are deleted.

Note: TC-14 in the test strategy (`Authorization: Bearer <valid-api-key>` → 200 via existing fallback) explicitly documents the current fallback behaviour. After this story, TC-14 must be **updated** to expect 401 — the test strategy document should be noted as requiring this test case revision.

---

## Test Cases

- **TC-13**: valid API key in `x-api-key` header → 200 (must still pass).
- **TC-14** (revised): valid API key in `Authorization: Bearer` → 401 (test case expected outcome flips from 200 to 401).
- **TC-06, TC-07, TC-08**: JWT failure paths → 401 (regression, must still pass).

**Must pass before merge:** TC-13, revised TC-14, TC-06, TC-07.

---

## Dependencies

- Story 001 should be merged first (JWT_SECRET guard ensures a clean jwt.ts before modifying token reading logic), but this story can proceed in parallel on a separate branch if needed.

---

## Definition of Done

- [ ] `validateApiKey` reads only `x-api-key` header
- [ ] `verifyJWT` reads only `Authorization: Bearer` header
- [ ] Unit tests updated: TC-14 expectation flipped to 401
- [ ] TC-13 still passes
- [ ] Code merged to main
- [ ] Deployed to staging; smoke test: API key in `x-api-key` works, API key in `Authorization: Bearer` returns 401

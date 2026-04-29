# Story 001 — Remove JWT_SECRET Fallback

**Phase:** 0 (Preparation)
**Type:** Backend
**Complexity:** S

---

## User Story

As the platform security owner,
I want the API to throw a hard error on boot if JWT_SECRET is missing from the environment,
So that a misconfigured deployment can never silently use the hardcoded fallback secret and accept forged tokens.

---

## Background

`lib/jwt.ts:6` currently reads:

```
const JWT_SECRET = process.env.JWT_SECRET || 'pRAe68l7ZW8S+3ZIph3qcxFIIaaZeY+SSQ3wwRIrbAg='
```

If the Vercel env var is accidentally unset, every deployment accepts tokens signed with the known fallback secret — a published hardcoded string visible in the repo. This is Risk R-02 in the test strategy (score 15 — release blocker).

---

## Acceptance Criteria

1. If `process.env.JWT_SECRET` is falsy at module load time, the module throws an `Error` with the message `"FATAL: JWT_SECRET environment variable is not set"` before any export is evaluated.
2. The hardcoded fallback string `'pRAe68l7ZW8S+3ZIph3qcxFIIaaZeY+SSQ3wwRIrbAg='` is removed from `lib/jwt.ts` entirely.
3. A valid `JWT_SECRET` env var causes normal startup with no error.
4. Unit test: calling `verifyJWT` in a test environment where `JWT_SECRET` is set passes; calling it with a tampered payload still returns `null` (existing behaviour).
5. The same boot-time guard covers `verifyJWTToken` — both functions use the same module-level constant.

**Gherkin:**

```
Scenario: missing JWT_SECRET at boot
  Given JWT_SECRET env var is not set
  When the module lib/jwt.ts is imported
  Then the process throws Error("FATAL: JWT_SECRET environment variable is not set")

Scenario: present JWT_SECRET at boot
  Given JWT_SECRET = "some-real-secret"
  When the module lib/jwt.ts is imported
  Then no error is thrown and verifyJWT is callable
```

---

## Implementation Notes

**File to change:** `/Users/gap/finance-backoffice-report-api/lib/jwt.ts`

Replace lines 5-6:
```typescript
// Before
const JWT_SECRET = process.env.JWT_SECRET || 'pRAe68l7ZW8S+3ZIph3qcxFIIaaZeY+SSQ3wwRIrbAg='
```
```typescript
// After
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set')
}
const JWT_SECRET: string = process.env.JWT_SECRET
```

The throw at module load time is intentional — it makes Vercel's function cold start fail fast and visibly, preventing any request from being served with a missing secret.

No other files need changes for this story alone.

---

## Test Cases

- **N-09** (from test strategy): assert prod env throws on missing JWT_SECRET — this story implements the guard that makes N-09 pass.
- **TC-08**: tampered signature still returns 401 (regression — existing behaviour unchanged).
- Add unit test: import `lib/jwt.ts` with `JWT_SECRET` unset in process.env, expect thrown error.

**Must pass before merge:** N-09 equivalent unit test, TC-08.

---

## Dependencies

None. This is a standalone preparation story — no other story depends on it being first, but it should be merged before any Phase 1 story because Phase 1 deployment relies on a secure JWT verification path.

---

## Definition of Done

- [ ] `lib/jwt.ts` no longer contains the hardcoded fallback string
- [ ] Boot-time throw is in place and covered by a unit test
- [ ] `npx vercel --prod` deploy to staging succeeds (JWT_SECRET is set in Vercel env)
- [ ] Manual smoke: a request with a valid JWT returns 200; a request with a tampered JWT returns 401
- [ ] Code merged to main

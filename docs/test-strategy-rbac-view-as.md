# Test Strategy & Risk Assessment: Backend RBAC + View-As Impersonation

**Author:** Murat (Test Architect)
**Date:** 2026-04-29
**Initiative:** 3-phase backend authorization hardening
**Codebase scope:**
- API: `/Users/gap/finance-backoffice-report-api` (Next.js + MySQL, Vercel)
- Frontend: `/Users/gap/finance-backoffice-report` (vanilla JS, Vercel)
- Existing auth: `lib/jwt.ts` (HS256), `lib/auth.ts` (JWT-or-API-key)
- Endpoint surface (counted): **50 route files** (initiative quoted "~30+" — actual is larger; matrix sized accordingly).

---

## 0. Phase recap (locked decisions)

| Phase | Change | Risk class |
|-------|--------|-----------|
| 1 | `requireRole(['admin'\|'ts'\|'crm'])` wrapper on every endpoint | Authorization regression |
| 2 | SQL filter on `/api/reports/commission-plus*` — ts/crm see own seller_id only | Data-leak / over-redaction |
| 3 | View-as: admin id=555 only; honors `X-View-As-Role` + `X-View-As-User-Id` | Privilege escalation |

Decisions:
- Source of role truth: `agency_member.job_position`
- 401 = unauthorized (no/bad/expired JWT). 403 = forbidden (good JWT, wrong role).
- View-as is admin-id=555-only. Option B (see target's filtered data).
- API key bypasses role check.

---

## 1. Risk Register

Scoring: **Impact 1–5**, **Likelihood 1–5**, **Score = I × L**. Anything ≥ 12 is a release blocker until mitigated.

| ID | Risk | Phase | Impact | Likelihood | Score | Mitigation / Test signal |
|----|------|-------|--------|-----------|-------|--------------------------|
| R-01 | Privilege escalation via `X-View-As-*` header injection by non-admin or admin id ≠ 555 | 3 | 5 | 4 | **20** | Hard guard: extract real user from JWT, then `if (real.id !== 555 || real.role !== 'admin') ignore headers`. Test: every non-555 user sending headers must get their own role behavior. |
| R-02 | JWT signature bypass — fallback secret `pRAe68l7ZW8S+...` hard-coded in `lib/jwt.ts:6` is shipped if `process.env.JWT_SECRET` unset | All | 5 | 3 | **15** | Add boot-time assert: throw if `JWT_SECRET` falsy in prod. Test: tampered payload + correct fallback secret must NOT verify in prod env. |
| R-03 | SQL filter bypass on `commission-plus` (wrong column, missing JOIN, OR-condition swallows filter) leaks all sellers' data to ts/crm | 2 | 5 | 3 | **15** | Integration test against seeded DB: ts user must receive **only** rows where `seller_id = self`. Negative test: row count for ts < row count for admin. |
| R-04 | Regression on existing admin endpoints — wrapper rejects valid admin tokens (wrong default, role-not-found, case-sensitivity on `job_position`) | 1 | 4 | 4 | **16** | Smoke matrix: admin must hit 200 on every one of the 50 endpoints. Run before any phase-1 ship. |
| R-05 | API-key bypass leaked / abused — full-role bypass with no audit trail | All | 5 | 3 | **15** | Log every API-key request with route + IP. Rotate keys post-launch. Test: key in `x-api-key` AND in `Authorization: Bearer` both work and both log. |
| R-06 | Frontend forgets to send view-as headers in some pages → admin tester sees normal admin view and **falsely concludes the feature works** | 3 | 4 | 4 | **16** | Add a UI banner "VIEWING AS: ts (user_id=100)" tied to actual response echo header `X-Effective-Role`. Tester checklist requires banner visibility. |
| R-07 | Stale impersonation across tabs/sessions — view-as state in one tab leaks to another, or persists past logout | 3 | 3 | 4 | **12** | View-as state stored per-request in headers only (stateless). No localStorage/cookies. Test: open tab A in view-as, open tab B normally — B must show admin view. |
| R-08 | 401 vs 403 confusion — wrapper returns 403 for missing token (should be 401), or 401 for valid-token-wrong-role (should be 403) | 1 | 3 | 3 | **9** | Status-code assertion table in integration tests (see §3). |
| R-09 | Role mismatch: `job_position` vs `roles_slug` disagree (e.g., `roles_slug=admin` but `job_position=ts`) — wrapper picks wrong source | 1 | 4 | 2 | **8** | Locked decision: **`job_position` wins**. Add test fixture with mismatched user, assert `job_position` is used. |
| R-10 | Malformed JWT payload (missing `agency_member.id` / null id / unexpected shape) crashes wrapper instead of returning 401 | 1 | 3 | 3 | **9** | Defensive parsing — null/undefined → 401. Fuzz test with empty/malformed payloads. |
| R-11 | View-as `X-View-As-User-Id` SQL injection (header value flows into seller-id filter) | 3 | 5 | 2 | **10** | Parameterized queries only. Test with `1; DROP TABLE x` and `1 OR 1=1` — must reject or sanitize to integer. |
| R-12 | `REQUIRE_JWT=false` env flag accidentally set in prod disables auth entirely | All | 5 | 1 | **5** | Boot-time assert: in prod, `REQUIRE_JWT` must be `true` or unset. Logs warn loudly. |
| R-13 | View-as honored on write endpoints (if any are added later) → admin id=555 acts as another user destructively | 3 | 5 | 2 | **10** | Phase 3 scope: read-only endpoints only. Add lint/test asserting view-as wrapper is not applied to POST/PUT/DELETE in this phase. |
| R-14 | Caching layer (Vercel edge / browser) caches admin response and serves it to ts user | 1+2 | 4 | 2 | **8** | `Cache-Control: private, no-store` on all role-gated endpoints. Test via two parallel curls with different tokens. |

**Top-3 ranked: R-01 (20), R-04 (16), R-06 (16).** R-02 and R-03 tied at 15 right behind.

---

## 2. Test Layers

### Unit (fast, mock-heavy)
- `verifyJWT()` — already exists; add cases: expired, tampered signature, missing `agency_member`, null payload.
- `requireRole()` wrapper (new) — pure function tests:
  - real role admin, no view-as → effective role = admin
  - real role ts, view-as headers present → headers IGNORED, effective role = ts
  - real role admin id=555, view-as ts/100 → effective role = ts, effective user_id = 100
  - real role admin id=999, view-as ts/100 → effective role = admin (headers ignored)
  - role mismatch (`roles_slug`=admin, `job_position`=ts) → effective role = ts (job_position wins)
- SQL filter builder for `commission-plus` — given (effective_role, effective_user_id), returns expected `WHERE` fragment.

### Integration (real DB, in-process Next.js handler)
- One seeded MySQL test DB with the test-data fixture in §6.
- For each role × each endpoint group: hit the handler, assert status + row count + (where applicable) seller_id distribution.
- Auth-failure modes: missing/expired/tampered JWT all return 401.
- View-as combinatorics: see test cases §4.

### E2E (browser, optional)
- Playwright **recommended**, **not currently installed** — flagged. If not installed, defer to manual UI walkthrough with a curl-based smoke harness (§7).
- Coverage if Playwright is added: login as admin id=555 → toggle view-as → confirm UI banner appears, dashboard data narrows to target seller, logout clears view-as.

### Layer split (rule of thumb)
- ~70% integration (this is an authorization problem — depends on real handler + DB)
- ~20% unit (wrapper logic, role resolution)
- ~10% E2E (UI banner, session-clear)

---

## 3. Test Matrix — Role × Endpoint Group

Endpoint groups (from `/app/api`):

| Group | Routes | Allowed roles (locked) |
|-------|--------|-----------------------|
| **G-AUTH** | `/api/auth/login`, `/api/auth/check`, `/api/auth/logout`, `/api/health` | public (skip wrapper) |
| **G-ADMIN** | `/api/database/*`, `/api/tables/*`, `/api/users`, `/api/agency-members`, `/api/teams`, `/api/job-positions`, `/api/suppliers`, `/api/customers*`, `/api/bookings`, `/api/orders`, `/api/order-items`, `/api/installments`, `/api/chat-history`, `/api/docs/*` | admin only |
| **G-REPORTS-ADMIN** | `/api/reports/by-country`, `/api/reports/wholesale-by-country`, `/api/reports/by-supplier`, `/api/reports/supplier-performance`, `/api/reports/sales-discount`, `/api/reports/work-list`, `/api/reports/repeat-customers`, `/api/reports/repeated-customer-report`, `/api/reports/order-has-discount`, `/api/reports/order-external-summary`, `/api/reports/lead-time-analysis`, `/api/reports/by-booking-date`, `/api/reports/by-travel-start-date`, `/api/reports/by-travel-date`, `/api/reports/by-created-date`, `/api/reports/summary`, `/api/reports/countries`, `/api/reports/available-periods` | admin only |
| **G-COMMISSION** | `/api/reports/commission-plus`, `/api/reports/commission-plus/sellers` | admin, ts, crm (filtered) |
| **G-COMMISSION-ADMIN** | `/api/reports/commission-plus/pdf` | admin only — PDF export is an admin-grade tool, not a tester report |
| **G-LOCATIONS** | `/api/locations/*` | admin, ts, crm (lookup, no PII) |

| Caller | G-AUTH | G-ADMIN | G-REPORTS-ADMIN | G-COMMISSION | G-LOCATIONS |
|--------|--------|---------|-----------------|--------------|-------------|
| No JWT, no API key | 200 (auth/health), 401 elsewhere | 401 | 401 | 401 | 401 |
| Expired JWT | 401 | 401 | 401 | 401 | 401 |
| Tampered JWT (bad signature) | 401 | 401 | 401 | 401 | 401 |
| Valid JWT, role=admin (id≠555) | 200 | 200 | 200 | 200 (ALL sellers) | 200 |
| Valid JWT, role=admin id=555 (no view-as) | 200 | 200 | 200 | 200 (ALL sellers) | 200 |
| Valid JWT, role=ts | 200 (auth/health) | **403** | **403** | 200 (own seller_id only) | 200 |
| Valid JWT, role=crm | 200 (auth/health) | **403** | **403** | 200 (own seller_id only) | 200 |
| Valid API key (no JWT) | 200 | 200 | 200 | 200 (ALL — bypass) | 200 |
| admin id=555 + `X-View-As-Role: ts` + `X-View-As-User-Id: 100` | 200 | **403** (effective=ts) | **403** (effective=ts) | 200 (only seller_id=100) | 200 |
| admin id=555 + `X-View-As-Role: admin` + any user_id | 200 | 200 | 200 | 200 (ALL — view-as admin is a no-op) | 200 |
| admin id=999 + `X-View-As-Role: ts` + `X-View-As-User-Id: 100` | 200 | 200 | 200 | 200 (ALL — headers ignored) | 200 |
| ts user + `X-View-As-Role: admin` + `X-View-As-User-Id: 555` | 200 (auth/health) | **403** | **403** | 200 (own seller_id only — headers ignored) | 200 |

---

## 4. Concrete Test Cases

Numbered TC-NN. Each is one curl-able assertion; all run in CI integration suite.

| # | Title | Setup | Action | Expected |
|---|-------|-------|--------|----------|
| TC-01 | ts denied on admin report | ts user JWT | `GET /api/reports/by-country` | 403 |
| TC-02 | Admin regression sweep | admin JWT (id≠555) | `GET` every 50 endpoints | every endpoint 200 (or 200/expected) |
| TC-03 | View-as activates (admin 555 → ts 100) | admin id=555 JWT, headers `X-View-As-Role: ts`, `X-View-As-User-Id: 100` | `GET /api/reports/commission-plus` | 200; all rows have `seller_id=100`; response header `X-Effective-Role: ts` |
| TC-04 | View-as denied for non-555 admin | admin id=999 JWT, same view-as headers | `GET /api/reports/commission-plus` | 200; admin scope (all sellers); `X-Effective-Role: admin` |
| TC-05 | View-as denied for ts user | ts JWT, `X-View-As-Role: admin` | `GET /api/reports/by-country` | 403 (still ts) |
| TC-06 | Expired JWT → 401 | JWT with `exp` in past | `GET /api/reports/commission-plus` | 401 |
| TC-07 | Missing JWT → 401 | no auth headers | `GET /api/reports/commission-plus` | 401 |
| TC-08 | Tampered signature → 401 | JWT with payload modified, signature unchanged | `GET /api/reports/commission-plus` | 401 |
| TC-09 | View-as ts hits admin-only endpoint | admin id=555 + `X-View-As-Role: ts` + `X-View-As-User-Id: 100` | `GET /api/reports/by-country` | 403 (effective role gated) |
| TC-10 | Admin sees all on commission-plus | admin JWT, no view-as | `GET /api/reports/commission-plus` | 200; rows span ≥2 distinct seller_ids |
| TC-11 | ts sees only own on commission-plus | ts JWT (user_id=100, has data) | `GET /api/reports/commission-plus` | 200; all rows `seller_id=100` |
| TC-12 | Admin viewing-as-ts-100 matches ts-100's view | admin id=555 + view-as ts/100 | `GET /api/reports/commission-plus` | response body equals TC-11 result byte-for-byte (canonical comparison after sort) |
| TC-13 | API key bypass | `x-api-key: <valid>`, no JWT | `GET /api/reports/by-country` | 200 |
| TC-14 | API key in Bearer header | `Authorization: Bearer <valid-api-key>` | `GET /api/reports/by-country` | **401** — Story 002 enforces strict separation: Bearer = JWT only; API key MUST use `x-api-key` header. |
| TC-15 | ts user with no data | ts JWT (user_id=200, no orders) | `GET /api/reports/commission-plus` | 200; empty result set; not 403, not 500 |
| TC-16 | crm user filtered correctly | crm JWT (user_id=300) | `GET /api/reports/commission-plus` | 200; all rows `seller_id=300` |
| TC-17 | View-as headers present but malformed user_id | admin id=555 + `X-View-As-User-Id: abc` | `GET /api/reports/commission-plus` | 400 (or 403); never 500; headers rejected |
| TC-18 | View-as user_id SQL injection | `X-View-As-User-Id: 1; DROP TABLE orders--` | `GET /api/reports/commission-plus` | 400; DB unchanged (verify orders count post-test) |
| TC-19 | Role mismatch — job_position wins | user with `roles_slug=admin`, `job_position=ts` | `GET /api/reports/by-country` | 403 (treated as ts) |
| TC-20 | View-as PDF endpoint | admin id=555 + view-as ts/100 | `POST /api/reports/commission-plus/pdf` | **403** — PDF endpoint is admin-only (G-COMMISSION-ADMIN). When admin views as ts the effective role is `ts`, which is not in `['admin']`. Confirms `requireRole` gate works correctly across view-as. |

---

## 5. Negative / Security Tests

| # | Scenario | Expected |
|---|----------|----------|
| N-01 | Fuzz `X-View-As-Role: <random 100 strings>` (admin, ADMIN, ts ts, "', null bytes, 10KB string) | always either ignored (real role used) or 400; never 500; never role-elevation |
| N-02 | Fuzz `X-View-As-User-Id` (negative ints, floats, hex, scientific notation, unicode) | sanitized to int or 400 |
| N-03 | SQL injection via user_id (`1 OR 1=1`, `1 UNION SELECT *`) | 400 or sanitized; DB integrity preserved |
| N-04 | JWT with missing `agency_member` claim | 401 (defensive null check) |
| N-05 | JWT with `agency_member.id = null` | 401 |
| N-06 | JWT with `job_position` empty string | 401 or 403 (no implicit admin) |
| N-07 | JWT signed with wrong secret | 401 |
| N-08 | JWT signed with `none` algorithm | 401 (HS256-only — verify `algorithms: ['HS256']` in `lib/jwt.ts:54` blocks this) |
| N-09 | JWT with `alg: HS256` but verified against fallback secret in non-prod env (env leak check) | document the risk; assert prod env throws on missing JWT_SECRET |
| N-10 | Concurrent requests: admin tab view-as ts/100, admin tab view-as crm/300 | each request returns its own filtered scope; no cross-talk |
| N-11 | View-as headers via lowercase / mixed case (`x-view-as-role`) | accepted (HTTP headers are case-insensitive — confirm Next.js normalizes) |
| N-12 | Replay an old JWT collected from logs | 401 if expired, 200 if still in window (acceptable — token-lifetime is the control) |

---

## 6. Test Data Needs

Confirmed required fixtures (seeded into a dedicated test schema):

| Fixture | Why |
|---------|-----|
| 1 × admin user, **id = 555** | View-as activator |
| ≥1 × admin user, **id ≠ 555** (e.g., id=999) | Negative test for view-as gate (TC-04) |
| ≥2 × ts users **with commission data** (e.g., id=100, id=101, each with ≥3 orders) | Filtered-data assertions, multi-user isolation |
| ≥1 × ts user **without data** (e.g., id=200) | Empty-state test (TC-15) |
| ≥1 × crm user with data (e.g., id=300) | Crm role coverage |
| 1 × user with **role mismatch** (`roles_slug=admin`, `job_position=ts`) | TC-19 — confirms job_position wins |
| 1 × disabled / suspended agency_member | Confirms wrapper rejects (if scope includes "active" check — flag if not) |
| Order data spread across ≥3 seller_ids, ≥2 countries, ≥2 suppliers | Lets admin "all rows" vs ts "filtered rows" diverge measurably |

Test JWT signer: a small helper `tests/helpers/sign-jwt.ts` using the same secret as `lib/jwt.ts` to mint tokens for the above users.

---

## 7. Tooling

| Layer | Recommendation | State today |
|-------|----------------|-------------|
| API smoke | **curl scripts** (`tests/smoke/*.sh`) — fast, CI-friendly, readable diffs | Not present — needs scaffolding |
| Integration | **Vitest or Jest** with `supertest` against the Next.js handler, using a dedicated MySQL test schema | Not present — flag |
| E2E | **Playwright** for the view-as UI banner + session-clear flow | **Not installed in either repo — flag.** Defer to manual walkthrough until added. |
| Manual UI | Checklist (login as 555 → toggle view-as ts/100 → confirm banner + commission-plus shows only seller_id=100 → logout → re-login → confirm banner gone) | Required for phase 3 sign-off regardless of automation |
| Static | grep for `requireRole(` on every `route.ts` — assertion that no route is unwrapped | Add as CI step |

Recommendation: ship phases 1 and 2 with **curl smoke + integration tests**. Add Playwright **before** phase 3 release if budget allows; otherwise gate phase 3 on signed-off manual checklist.

---

## 8. Quality Gate

Each phase ships only if **all** boxes below are green.

### Phase 1 gate (`requireRole` wrapper)
- [ ] TC-02 passes — admin hits 200 on every one of the 50 endpoints
- [ ] TC-01, TC-05, TC-19 pass (ts/crm denied on admin endpoints; job_position wins)
- [ ] TC-06, TC-07, TC-08 pass (401 cases)
- [ ] N-04, N-05, N-06, N-07, N-08 pass
- [ ] R-08 verified — status codes match table in §3
- [ ] No route file in `/app/api/**/route.ts` is missing `requireRole(` (static check) — except G-AUTH allowlist
- [ ] R-12 boot-time assert added: prod throws if `REQUIRE_JWT === 'false'` or `JWT_SECRET` unset

### Phase 2 gate (commission-plus SQL filter)
- [ ] TC-10, TC-11, TC-15, TC-16 pass (admin sees all; ts/crm sees own; empty case OK)
- [ ] N-03 passes (SQL injection rejected, DB integrity preserved)
- [ ] Row-count delta verified: `count(admin) >= count(ts) + count(crm) + count(other_ts_users)` at minimum
- [ ] No regressions on G-AUTH, G-LOCATIONS

### Phase 3 gate (view-as)
- [ ] TC-03, TC-04, TC-05, TC-09, TC-12, TC-20 pass
- [ ] N-01, N-02, N-10 pass
- [ ] Frontend renders `X-Effective-Role` banner (R-06 mitigation)
- [ ] Manual checklist signed off (logout clears view-as; tab isolation OK)
- [ ] Logging in place for every view-as activation (audit trail)
- [ ] R-13: confirmed scope is read-only; no POST/PUT/DELETE wrapped with view-as

---

## 9. Rollback Signals

Revert immediately if any of these symptoms appear in production within 24h of release:

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Admin user reports 403 on previously-working endpoint | R-04 — wrapper misreading job_position, or case mismatch | Revert phase 1; re-test with real prod tokens |
| ts/crm user sees another user's commission data (any single report) | R-03 — SQL filter bypass | Revert phase 2 immediately; data-leak severity |
| Any non-555 user sees view-as effect (UI banner appears, or scope changes) | R-01 — privilege escalation | Revert phase 3 immediately; rotate JWT secret if exploit observed |
| 5xx error rate spike on any wrapped endpoint | R-10 — defensive parsing missed a payload shape | Revert; add fixture for the new shape |
| Admin id=555 reports view-as not taking effect (sees admin data instead of target's) | R-06 false negative — frontend not sending headers, or backend not reading them | Hold release; verify request/response with curl before frontend re-tests |
| Cache returns wrong-role response | R-14 — `Cache-Control` missing | Hot-fix headers; do not need full revert |
| Auth completely disabled (no 401s being returned) | R-12 — env flag flipped | Revert env immediately; rotate keys |

---

## Appendix A — Code observations from review

From `lib/jwt.ts` and `lib/auth.ts`:

1. **`lib/jwt.ts:6`** — `JWT_SECRET` has a hardcoded fallback. Acceptable for dev, **dangerous in prod** if env is missing. Phase 1 should add a boot-time assert.
2. **`lib/jwt.ts:54`** — Already pins `algorithms: ['HS256']`. Good. Confirm tests cover `alg: none` rejection (N-08).
3. **`lib/jwt.ts:38`** — `Authorization: <token>` (no Bearer prefix) is accepted. `lib/auth.ts:14` strips Bearer when checking API key. The two paths overlap — a valid API key in `Authorization: Bearer X` would be tried as JWT first, fail, then fall back. Verify this fallback path is reached (TC-14).
4. **`lib/auth.ts:42-72`** — JWT-first, API-key-fallback only if `REQUIRE_API_KEY === 'true'`. Document this in operational runbook.
5. **`JWTPayload`** does not currently expose `agency_member.job_position` typed. Phase 1 must add a typed extraction helper (e.g., `extractRole(payload): 'admin'|'ts'|'crm'|null`) to centralize the decision and make it unit-testable.

---

**End of strategy doc.**

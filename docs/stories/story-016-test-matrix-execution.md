# Story 016 — Execute Test Matrix on Staging

**Phase:** QA and Deploy
**Type:** Cross-Cutting
**Complexity:** M

---

## User Story

As the QA lead,
I want to execute the full test matrix from the test strategy against the staging environment,
So that every TC-01 through TC-20 and all 12 negative tests are formally signed off before production deploy.

---

## Background

Test strategy doc Sections 3, 4, and 5 define the full matrix. This story is the formal QA execution story — it produces a signed-off test report that is the go/no-go gate for Story 017 (production deploy). It requires the staging environment to have all of Stories 001-015 deployed and the test data fixture from test strategy Section 6 seeded.

---

## Acceptance Criteria

1. Test data fixture seeded in staging MySQL per test strategy Section 6:
   - admin id=555
   - admin id=999 (id ≠ 555)
   - ts user id=100 with ≥3 orders
   - ts user id=101 with ≥3 orders
   - ts user id=200 with no orders
   - crm user id=300 with ≥3 orders
   - user with `roles_slug=admin, job_position=ts` (for TC-19)
   - Orders spread across ≥3 distinct seller_ids, ≥2 countries, ≥2 suppliers
   - Test JWTs signed with staging JWT_SECRET (use `tests/helpers/sign-jwt.ts` helper)

2. All TC-01 through TC-20 executed and results documented:

| TC | Title | Result | Notes |
|----|-------|--------|-------|
| TC-01 | ts denied on admin report | PASS / FAIL | |
| TC-02 | Admin regression sweep (all 50 endpoints) | PASS / FAIL | |
| TC-03 | View-as activates (admin 555 → ts 100) | PASS / FAIL | |
| TC-04 | View-as denied for non-555 admin | PASS / FAIL | |
| TC-05 | View-as denied for ts user | PASS / FAIL | |
| TC-06 | Expired JWT → 401 | PASS / FAIL | |
| TC-07 | Missing JWT → 401 | PASS / FAIL | |
| TC-08 | Tampered signature → 401 | PASS / FAIL | |
| TC-09 | View-as ts hits admin-only endpoint | PASS / FAIL | |
| TC-10 | Admin sees all on commission-plus | PASS / FAIL | |
| TC-11 | ts sees only own on commission-plus | PASS / FAIL | |
| TC-12 | Admin viewing-as-ts-100 matches ts-100's view | PASS / FAIL | |
| TC-13 | API key bypass | PASS / FAIL | |
| TC-14 | API key in Bearer header → 401 | PASS / FAIL | Note: expected outcome changed by Story 002 |
| TC-15 | ts user with no data → 200 empty | PASS / FAIL | |
| TC-16 | crm user filtered correctly | PASS / FAIL | |
| TC-17 | View-as headers malformed user_id | PASS / FAIL | |
| TC-18 | View-as user_id SQL injection | PASS / FAIL | |
| TC-19 | Role mismatch — job_position wins | PASS / FAIL | |
| TC-20 | View-as PDF endpoint | PASS / FAIL | |

3. All 12 negative tests executed (N-01 through N-12):
   - N-01: fuzz X-View-As-Role
   - N-02: fuzz X-View-As-User-Id
   - N-03: SQL injection via user_id
   - N-04: JWT missing agency_member claim
   - N-05: JWT with agency_member.id = null
   - N-06: JWT with job_position empty string
   - N-07: JWT signed with wrong secret
   - N-08: JWT with alg:none
   - N-09: prod env throws on missing JWT_SECRET
   - N-10: concurrent requests across tabs
   - N-11: lowercase view-as header names
   - N-12: replay old JWT

4. Static CI check passes: no route file in `/app/api/**/route.ts` is missing `requireRole(` (except G-AUTH allowlist: `auth/*`, `health`).

5. Phase quality gates from test strategy Section 8 are all green:
   - Phase 1 gate: TC-02, TC-01, TC-05, TC-19, TC-06, TC-07, TC-08, N-04 through N-08
   - Phase 2 gate: TC-10, TC-11, TC-15, TC-16, N-03
   - Phase 3 gate: TC-03, TC-04, TC-05, TC-09, TC-12, TC-20, N-01, N-02, N-10

6. Manual UI checklist signed off:
   - Login as admin id=555 → view-as ts user → banner visible → commission-plus shows only ts user's data → exit → full admin data
   - Login as admin id=999 → no view-as button visible
   - Login as ts user → hitting admin URL → redirected to /403
   - Cross-tab: view-as active in Tab A → open Tab B → Tab B shows admin view (sessionStorage isolation)

7. R-08 verified: status code table in test strategy Section 3 matches actual responses for all caller × endpoint group combinations.

---

## Implementation Notes

**Test infrastructure to create:**

- `tests/helpers/sign-jwt.ts` — JWT signer for test tokens. Reads `JWT_SECRET` from env (staging). Signs payloads with the `agency_member` structure matching architecture Section 4a.
- `tests/smoke/` directory — curl scripts for TC-01 through TC-20. Each script file is a standalone bash script returning exit 0 on pass, 1 on fail.
- `tests/smoke/run-all.sh` — runs all smoke scripts and reports summary.

**TC-02 admin regression sweep helper:**

A script that iterates all 50 endpoint paths and asserts 200 for an admin JWT. Endpoint list sourced from test strategy Section 3 (G-AUTH, G-ADMIN, G-REPORTS-ADMIN, G-COMMISSION, G-LOCATIONS).

**TC-12 canonical comparison:**

Run TC-11 (ts/100's own call), save response body. Run TC-03 (admin 555 view-as ts/100). Sort both `orders` arrays by `o.id`. Assert field-by-field equality.

**TC-18 injection test:**

After running `X-View-As-User-Id: 1; DROP TABLE orders--`, query `SELECT COUNT(*) FROM v_Xqc7k7_orders` in the test DB and assert the count matches the pre-test count.

**Static CI check command:**

```bash
# Should return 0 matching files (all routes have requireRole)
grep -rL "requireRole(" /path/to/app/api --include="route.ts" | \
  grep -v "auth\|health\|locations\|countries\|suppliers\|teams\|job-positions"
```

---

## Test Cases

This story IS the test execution story — it runs all TCs and negative tests. No recursive self-reference.

**Go/No-Go decision:** All TC-01..TC-20 must be PASS. Any FAIL blocks Story 017. N-series: any finding of privilege escalation (N-01, N-02, N-03, N-04, N-05) blocks Story 017. Other N-series failures require PM sign-off before proceeding.

---

## Dependencies

- Stories 001-015 all deployed to staging
- Test data fixture seeded
- Test JWT signer helper available

---

## Definition of Done

- [ ] Test data fixture seeded in staging DB
- [ ] `tests/helpers/sign-jwt.ts` created and functional
- [ ] `tests/smoke/*.sh` scripts written for all 20 TCs
- [ ] TC-01 through TC-20 all PASS
- [ ] N-01 through N-12 all PASS (or documented with PM sign-off for non-critical)
- [ ] Static CI check passes (no unwrapped routes)
- [ ] Manual UI checklist signed off by admin id=555 account holder
- [ ] Phase quality gate table from test strategy Section 8 fully green
- [ ] Test report produced and attached to this story (linked in PR or saved to `docs/`)
- [ ] Story 017 unblocked

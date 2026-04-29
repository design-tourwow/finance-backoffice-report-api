# Deploy Runbook — RBAC + View-As Impersonation
**Initiative:** 3-phase backend authorization hardening (Stories 001–015)
**Author:** Bob (Scrum Master)
**Date:** 2026-04-29
**Status:** Code-complete. Story 016 (QA sign-off) must be complete before Section 3 (Production).

---

## Quick Reference

| Repo | Path | Deploy command |
|------|------|----------------|
| Backend API | `/Users/gap/finance-backoffice-report-api` | `npx vercel --prod` |
| Frontend | `/Users/gap/finance-backoffice-report` | `npx vercel --prod` |

**Rule:** Backend deploys first, always. Frontend second, always.

**STOP conditions** (abort immediately if any are true):
- `JWT_SECRET` is not set in the target environment
- Story 016 QA sign-off is not complete (for production only)
- Any Phase 1 quality gate item is failing (see test-strategy §8)

---

## Section 1 — Pre-Deploy Checklist

Complete every item before issuing the first `vercel --prod` command. Initial each item and record the time.

### 1.1 Code Readiness

- [ ] All 15 story ACs (001–015) reviewed in PR / merge commit and confirmed merged to main in both repos
- [ ] Backend type-check passes with zero errors:
  ```
  cd /Users/gap/finance-backoffice-report-api
  npx tsc --noEmit
  ```
  Expected output: no output, exit code 0. Any TypeScript error is a hard stop.
- [ ] Frontend syntax check passes (no console errors on local `index.html` open, or run `npx eslint` if configured):
  ```
  cd /Users/gap/finance-backoffice-report
  # Check for any obvious syntax errors — open in browser locally, confirm no red console errors
  ```
- [ ] Static route coverage check: every `route.ts` under `/app/api/` (except G-AUTH allowlist: `auth/login`, `auth/check`, `auth/logout`, `health`) contains a `requireRole(` call. Verify with:
  ```
  cd /Users/gap/finance-backoffice-report-api
  grep -rL "requireRole(" app/api --include="route.ts" | grep -v "auth/" | grep -v "health"
  ```
  Expected: empty output (no unwrapped routes).

### 1.2 Environment Variables

**This is the single most common source of boot failure. Do not skip.**

- [ ] `JWT_SECRET` confirmed set in Vercel **staging** project environment variables
  - Log into Vercel dashboard → staging project → Settings → Environment Variables
  - Confirm `JWT_SECRET` key exists and value is non-empty
  - Note: backend will throw at boot and refuse all traffic if this is missing (Story 001 fail-fast)
- [ ] `JWT_SECRET` confirmed set in Vercel **production** project environment variables
  - Same verification step as above for prod project
- [ ] `VIEW_AS_ADMIN_ID` optionality noted: defaults to `555` if unset. Confirm whether your staging/prod admin user has id=555 or if you need to explicitly set this env var.
  - If admin's id is not 555, set `VIEW_AS_ADMIN_ID=<correct-id>` in Vercel env before deploy.
- [ ] `REQUIRE_JWT` is NOT set to `false` in either staging or production (would disable auth entirely — Risk R-12).

### 1.3 External API Consumer Audit

**Story 002 is a breaking change for any caller using `Authorization: Bearer <api-key>`.** That pattern now returns 401 instead of 200.

- [ ] Identify all external service callers of this API (review API key issuance records, or grep application logs for `Authorization: Bearer` requests that are not JWT tokens)
- [ ] Confirm each external caller has switched (or will switch before deploy) to `x-api-key: <api-key>` header
- [ ] If any caller cannot switch in time, document them here and decide: delay their migration, or accept a 401 window and notify them
- [ ] API key rotation post-launch is planned (per Risk R-05 — rotate keys after initial release)

### 1.4 Test Data — Staging Database

The following users must exist in the staging MySQL database before running Quinn's test scripts:

| Fixture | Required for |
|---------|-------------|
| 1 × admin user, id = 555 | TC-03, TC-09, TC-12, TC-20; view-as smoke |
| ≥1 × admin user, id ≠ 555 (e.g., id=999) | TC-04 (non-555 admin cannot activate view-as) |
| ≥2 × ts users WITH commission data (e.g., id=100, id=101; each ≥3 orders) | TC-11, TC-12; multi-user isolation |
| ≥1 × ts user WITHOUT data (e.g., id=200) | TC-15 (empty-state must be 200, not 500) |
| ≥1 × crm user with data (e.g., id=300) | TC-16 |
| 1 × user with role mismatch (`roles_slug=admin`, `job_position=ts`) | TC-19 (job_position wins) |
| Order data spread across ≥3 seller_ids, ≥2 countries, ≥2 suppliers | TC-10 admin-vs-ts row count delta |

- [ ] All fixtures confirmed present in staging DB
- [ ] `tests/helpers/sign-jwt.ts` (or equivalent) can mint test JWTs for each fixture user using the staging `JWT_SECRET`

### 1.5 Quinn's QA Scripts

- [ ] Review `/test/qa/api-tests.sh` — confirm `BASE_URL`, `ADMIN_JWT`, `TS_JWT`, `CRM_JWT`, `API_KEY` variables are set for staging
- [ ] Review `/test/qa/browser-smoke.md` — confirm tester is briefed on the view-as flow steps
- [ ] Confirm TC-01 through TC-20 and N-01 through N-12 are covered by Quinn's scripts
- [ ] Phase quality gates from `docs/test-strategy-rbac-view-as.md` §8 reviewed: know which TCs gate each phase

### 1.6 Docs / Endpoint Tombstone

- [ ] Confirm `docs/tables` endpoint is deleted in the merged code (Story 007). It will return 404 post-deploy. If any internal tooling calls it, remove that dependency now.
- [ ] Note for ops: `chat-history` and `users` (Supabase-backed) endpoints are intentionally NOT touched by this release — they retain their existing auth behavior.

---

## Section 2 — Staging Deploy Sequence

Execute steps in order. Do not skip ahead.

---

### Step S-1: Deploy backend to staging

```bash
cd /Users/gap/finance-backoffice-report-api
git status          # must be clean / on main
git log --oneline -3  # confirm correct commit is HEAD
npx vercel --prod
```

**Expected output:**
- Vercel CLI prints a deployment URL (e.g., `https://finance-backoffice-report-api-<hash>.vercel.app`)
- Final line: `Production: https://...` with a green checkmark
- Status shows as `Ready`

**Watch for:**
- "Canceled" status — this is a known Vercel flakiness issue (see Section 7). Re-run `npx vercel --prod` immediately.
- Any build error mentioning `JWT_SECRET` → environment variable is missing. Stop. Add it in Vercel dashboard and redeploy.
- TypeScript build errors in Vercel build logs → code was not type-checked locally. Stop. Fix errors, then redeploy.

**Failure indicator:** Deployment URL returns 500 on any request, or Vercel function logs show `FATAL: JWT_SECRET not set`.

---

### Step S-2: Backend smoke — admin JWT curl

Verify the backend is alive and role-gating is functional before running the full test suite.

```bash
# Set these variables first
STAGING_API="https://<your-staging-api-url>"
ADMIN_JWT="<jwt-for-admin-id-not-555>"

# Health check (public endpoint — should always 200)
curl -s -o /dev/null -w "%{http_code}" $STAGING_API/api/health
# Expected: 200

# Admin on a G-ADMIN endpoint
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  $STAGING_API/api/reports/by-country
# Expected: 200

# ts user on the same endpoint (should be blocked)
TS_JWT="<jwt-for-ts-user>"
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TS_JWT" \
  $STAGING_API/api/reports/by-country
# Expected: 403 (not 200, not 500)

# Missing JWT (should be 401)
curl -s -o /dev/null -w "%{http_code}" \
  $STAGING_API/api/reports/commission-plus
# Expected: 401
```

**Expected output:** Three status codes printed: `200`, `403`, `401` in sequence.

**Watch for:** Any 500 means a runtime error — check Vercel function logs immediately. A 200 on the ts request means requireRole is not applied — stop, do not proceed to S-3.

**Failure indicator:** ts user receives 200 on `/api/reports/by-country`, or any endpoint returns 500.

---

### Step S-3: Run Quinn's api-tests.sh against staging

```bash
cd /Users/gap/finance-backoffice-report-api
# Ensure env vars are set in the script or exported
export BASE_URL="https://<your-staging-api-url>"
export ADMIN_JWT="<admin-555-jwt>"
export ADMIN_NON555_JWT="<admin-999-jwt>"
export TS_JWT_100="<ts-user-100-jwt>"
export TS_JWT_200="<ts-user-200-no-data-jwt>"
export CRM_JWT="<crm-user-300-jwt>"
export API_KEY="<valid-api-key>"

bash test/qa/api-tests.sh
```

**Expected output:** All TC-01 through TC-20 PASS. Script prints a summary line with 0 failures.

**Watch for:**
- TC-02 failure (admin regression) — a route is missing requireRole or the wrapper rejects valid admin tokens (Risk R-04). Hard stop.
- TC-14 failure — api-key-in-Bearer still returning 200 instead of 401. Story 002 not deployed correctly.
- TC-18 failure — SQL injection not rejected. Hard stop on Phase 3.
- Any N-0x failure that corresponds to Risk R-01 (privilege escalation) — hard stop.

**Failure indicator:** Any FAIL line in the output. Proceed only when the script reports 0 failures.

---

### Step S-4: Deploy frontend to staging

Only execute after S-3 passes with 0 failures.

```bash
cd /Users/gap/finance-backoffice-report
git status          # must be clean / on main
git log --oneline -3
npx vercel --prod
```

**Expected output:** Same as S-1 — `Production: https://...` with green checkmark.

**Watch for:** "Canceled" status — re-run `npx vercel --prod`.

**Failure indicator:** Frontend deployment URL returns a blank page or JavaScript error in browser console.

---

### Step S-5: Browser smoke per Quinn's browser-smoke.md

Open the staging frontend URL in a browser. Follow every step in `/test/qa/browser-smoke.md`.

Key assertions (minimum, even if browser-smoke.md has more):

1. Login as ts user (id=100) → `/sales-report-by-seller` loads with data → `/sales-report` returns `/403` redirect (not blank page, not console error)
2. Login as crm user → same `/sales-report` behavior
3. Login as admin (id≠555) → `/sales-report` loads → `/sales-report-by-seller` loads → no view-as pill visible in sidebar
4. Login as admin (id=555) → view-as pill visible in sidebar

**Watch for:** ts or crm user landing on a blank screen instead of `/403`. This means the frontend 403 handler (Story 008) is not working. Stop frontend deploy; backend can stay (it is just returning the correct 403; the issue is the frontend).

**Failure indicator:** Any blank screen for ts/crm on admin routes. Any JavaScript console error reading "Uncaught" or "TypeError" on page load.

---

### Step S-6: View-As flow smoke as admin id=555

Execute manually in the staging browser:

1. Login as admin id=555
2. Confirm view-as pill button is visible in the sidebar
3. Click the pill — the picker modal opens listing available ts users
4. Select ts user id=100 → modal closes
5. Confirm sticky banner appears at top reading "VIEWING AS: ts (user_id=100)" (or equivalent)
6. Navigate to `/sales-report-by-seller` → confirm data is filtered to seller_id=100 only (spot-check: row count should be less than admin's unfiltered view)
7. Navigate to `/sales-report` → confirm redirect to `/403` (effective role is ts)
8. Click "Exit View-As" in the banner
9. Confirm banner disappears
10. Confirm `/sales-report` is accessible again (full admin view)
11. Open a second browser tab (same session) → confirm view-as banner does NOT appear in the new tab (sessionStorage is per-tab — this is intentional behavior, not a bug)

**Expected:** All 11 steps pass without errors.

**Watch for:** Banner not appearing after selecting a user (Risk R-06 — frontend not sending headers, or backend not echoing `X-Effective-Role`). Banner appearing in the second tab (Risk R-07 — state leak across tabs; would be a bug if sessionStorage was accidentally replaced with localStorage).

**Failure indicator:** Step 5 — banner never appears. Step 11 — banner appears in new tab.

---

## Section 3 — Production Deploy Sequence

**Gate:** Story 016 (Quinn's full test matrix on staging: TC-01–TC-20 + N-01–N-12) must be signed off before proceeding. No exceptions.

**Maintenance window:** No downtime maintenance window is required for this release, provided staging soak (P-1 below) is clean. The changes are additive (new 403 responses instead of leaked data) — a brief mixed state during deploy is acceptable because:
- Backend enforcing 403 is correct behavior
- Frontend handling 403 gracefully is already deployed before this step

If the soak reveals issues, re-evaluate before promoting.

---

### Step P-0: 30-minute staging soak

After S-6 completes successfully, wait 30 minutes with staging active and monitored.

During soak:
- Leave the staging frontend open in a browser, logged in as multiple roles in different tabs
- Monitor Vercel function logs on the staging project for any 5xx errors or unexpected 401/403 spikes
- Check Vercel logs with:
  ```
  # In Vercel dashboard: Functions tab → filter by status >= 400
  # Or via Vercel CLI:
  npx vercel logs <staging-deployment-url> --output raw | grep -E "(4[0-9]{2}|5[0-9]{2})"
  ```
- Acceptable during soak: 403 on ts/crm hitting admin routes (expected), 401 on unauthenticated hits (expected)
- Not acceptable: 500s on any endpoint, 403 on admin users hitting their own endpoints, auth completely missing (no 401s being returned at all)

If soak is clean → proceed to P-1.
If soak reveals issues → treat as staging failure; rollback per Section 4 before touching production.

---

### Step P-1: Deploy backend to production

```bash
cd /Users/gap/finance-backoffice-report-api
git status          # must be clean / on main
git log --oneline -3  # confirm this is the same commit as staging
npx vercel --prod
```

**Expected output:** Same as S-1 — production URL goes live, status `Ready`.

**Watch for:**
- "Canceled" status → re-run `npx vercel --prod`
- Build log line `FATAL: JWT_SECRET not set` → stop immediately. Add `JWT_SECRET` to production Vercel env, then redeploy.
- Any 5xx on the health endpoint within the first 2 minutes:
  ```bash
  PROD_API="https://<your-production-api-url>"
  curl -s -o /dev/null -w "%{http_code}" $PROD_API/api/health
  # Expected: 200
  ```

**Failure indicator:** Health check returns anything other than 200 within 60 seconds of deployment completing.

---

### Step P-2: Production backend smoke

```bash
PROD_API="https://<your-production-api-url>"
PROD_ADMIN_JWT="<prod-admin-jwt>"
PROD_TS_JWT="<prod-ts-jwt>"

# Admin regression spot-check (TC-02 abbreviated)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PROD_ADMIN_JWT" \
  $PROD_API/api/reports/by-country
# Expected: 200

# ts denied on admin report (TC-01)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PROD_TS_JWT" \
  $PROD_API/api/reports/by-country
# Expected: 403

# ts allowed on commission-plus (TC-11 abbreviated)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PROD_TS_JWT" \
  $PROD_API/api/reports/commission-plus
# Expected: 200
```

**Failure indicator:** Admin gets 403, or ts gets 200 on `/by-country`, or any 500.

---

### Step P-3: Deploy frontend to production

Only after P-2 passes.

```bash
cd /Users/gap/finance-backoffice-report
git status          # must be clean / on main
npx vercel --prod
```

**Expected output:** Production frontend URL updated, status `Ready`.

**Failure indicator:** Frontend production URL returns blank page or JS console error.

---

### Step P-4: Production browser smoke

Repeat the abbreviated version of S-5 and S-6 on the production URL:

1. Login as ts user → confirm `/sales-report` redirects to `/403` (not blank, not 500)
2. Login as admin id=555 → confirm view-as pill → select a ts user → confirm banner → confirm filtered data → exit view-as → confirm full admin view restored

Time budget: 10 minutes maximum. This is a confidence check, not a full regression.

**Failure indicator:** Any blank screen for ts/crm, missing banner, or data not narrowing during view-as.

---

### Step P-5: Post-deploy 30-minute monitoring window

Stay at the keyboard for 30 minutes after frontend deploy. Monitor:

**Vercel function log queries (run every ~5 minutes):**

```bash
# Unexpected 5xx spike
npx vercel logs <prod-deployment-url> --output raw | grep -c "\"status\":5"

# Unexpected 403 on admin endpoints (would indicate R-04 regression)
# Pattern: 403 on /by-country, /wholesale-by-country, /by-supplier, etc.
npx vercel logs <prod-deployment-url> --output raw | grep "403" | grep -v "commission-plus"

# 401 spike from service-to-service callers (would indicate broken Bearer/x-api-key migration)
npx vercel logs <prod-deployment-url> --output raw | grep "401"

# Confirm view-as audit log is firing (should see [ViewAs] entries when admin uses the feature)
npx vercel logs <prod-deployment-url> --output raw | grep "\[ViewAs\]"

# Boot error tombstone (should be empty — means JWT_SECRET was missing at boot)
npx vercel logs <prod-deployment-url> --output raw | grep "FATAL"
```

**Thresholds for escalation during monitoring window:**
- More than 5 × 5xx errors → investigate immediately
- Any 403 on a known-admin user endpoint → rollback trigger (see Section 4, R-04)
- More than 10 × unexpected 401s within 5 minutes from the same caller IP → likely a service caller that hasn't migrated from `Authorization: Bearer` (Story 002 break) → contact that team, do not roll back unless they escalate
- Any line containing `FATAL` → rollback trigger (JWT_SECRET issue)

---

## Section 4 — Rollback Procedure

### 4.1 Rollback Triggers

Initiate rollback immediately (do not wait for more data) if any of these appear in production:

| Symptom | Likely cause | Rollback target |
|---------|-------------|-----------------|
| Admin user reports 403 on a previously-working endpoint (e.g., `/reports/by-country`) | R-04 — requireRole wrapper misreading `job_position`, case mismatch, or JWT field name wrong | Phase 1 backend rollback |
| Spike of unexpected 401s from a service-to-service caller (not a browser user) | Story 002 break — caller still sending `Authorization: Bearer <api-key>` | Contact caller first; if urgent, Phase 0 rollback |
| Boot failure — Vercel function returning 500 on all routes, logs show `FATAL: JWT_SECRET` | `JWT_SECRET` env var dropped from Vercel | Env fix (no code rollback needed); set var and redeploy |
| ts or crm user sees a blank screen on any page (not a `/403` page) | Story 008 frontend 403 handler not working | Frontend rollback |
| Any non-555 user's UI shows a view-as banner, or their data scope changes unexpectedly | R-01 — privilege escalation, headers not guarded | Phase 3 backend rollback immediately; rotate JWT_SECRET if exploit is suspected |
| ts/crm user can see another user's commission data | R-03 — SQL filter bypass | Phase 2 backend rollback immediately |
| Auth entirely disabled (no 401s being returned on unauthenticated requests) | R-12 — `REQUIRE_JWT=false` accidentally set | Fix env immediately; no code rollback needed |

---

### 4.2 Phase 1 Rollback (requireRole wrapper — Stories 001–008)

Phase 1 is the backend RBAC layer. The frontend 403 handler (Story 008) is forward-compatible: if the backend rolls back to returning 200 on those endpoints, the frontend never reaches the 403 handler — harmless.

**Backend rollback:**
```bash
cd /Users/gap/finance-backoffice-report-api
# Option A — Vercel instant rollback to previous deployment
npx vercel rollback

# Option B — if vercel rollback is unavailable or the previous deployment was also bad
git log --oneline   # find the last known-good commit (before Story 001 merge)
git checkout <known-good-sha>
npx vercel --prod
git checkout main   # return to main after deploy
```

**Frontend:** No rollback required. The `/403` page handler does nothing harmful if the backend returns 200.

**Post-rollback verification:**
```bash
# Admin must hit 200 again on previously-403d endpoints
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PROD_ADMIN_JWT" \
  $PROD_API/api/reports/by-country
# Expected: 200 (same as pre-release behavior)
```

---

### 4.3 Phase 2 Rollback (SQL filter on commission-plus — Story 009)

Phase 2 touches only the SQL query in `/api/reports/commission-plus*`. The rollback is a backend code revert; the frontend has no corresponding change.

**Backend rollback:**
```bash
cd /Users/gap/finance-backoffice-report-api
# Revert Story 009 commit
git log --oneline | grep -i "commission\|sql filter\|seller"
# Identify the Story 009 commit SHA, then:
git revert <story-009-sha> --no-commit
git commit -m "revert: Story 009 SQL filter (emergency rollback)"
npx vercel --prod
```

**Frontend:** No rollback required.

**Post-rollback verification:**
```bash
# ts user hitting commission-plus — should now see ALL rows (pre-filter behavior)
# This is a data-exposure trade-off accepted during rollback; document and re-fix quickly
curl -s -H "Authorization: Bearer $PROD_TS_JWT" $PROD_API/api/reports/commission-plus | jq '.data | length'
```

---

### 4.4 Phase 3 Rollback (View-As — Stories 010–015)

Phase 3 spans both backend (Story 010) and frontend (Stories 011–015).

**Key fact:** The backend view-as logic is stateless and passive — it only activates when `X-View-As-Role` and `X-View-As-User-Id` headers are present in a request. If the frontend never sends those headers (because the frontend is rolled back), the backend behaves exactly like Phase 2. There is no "mode switch" to flip.

This means: **if the view-as issue is UI-only** (e.g., banner not appearing, picker modal broken), rollback the frontend only. The backend does not need to move.

**Frontend-only rollback (preferred for UI bugs):**
```bash
cd /Users/gap/finance-backoffice-report
npx vercel rollback
# or
git revert <frontend-view-as-merge-sha> --no-commit
git commit -m "revert: view-as frontend (emergency rollback)"
npx vercel --prod
```

**Full Phase 3 rollback (use if privilege escalation is suspected — R-01):**
```bash
# Step 1: Rollback frontend first (stops new view-as header injection immediately)
cd /Users/gap/finance-backoffice-report
npx vercel rollback

# Step 2: Rollback backend Story 010 (removes view-as header processing)
cd /Users/gap/finance-backoffice-report-api
git revert <story-010-sha> --no-commit
git commit -m "revert: Story 010 view-as backend (emergency rollback)"
npx vercel --prod
```

**If privilege escalation (R-01) is confirmed or strongly suspected:**
- Rotate `JWT_SECRET` in Vercel production env immediately after backend rollback
- All existing JWTs are invalidated — users will be forced to re-login (acceptable)
- Alert the team before rotating so support is ready for re-login requests

**Post-rollback verification:**
```bash
# Admin id=555 must NOT get view-as effect after rollback
curl -s -H "Authorization: Bearer $PROD_ADMIN_555_JWT" \
  -H "X-View-As-Role: ts" \
  -H "X-View-As-User-Id: 100" \
  $PROD_API/api/reports/commission-plus | jq '.data | map(.seller_id) | unique | length'
# Expected post-rollback: more than 1 unique seller_id (admin sees all, headers ignored)
```

---

## Section 5 — Communication Plan

### 5.1 Who to Notify

| Audience | Channel | When |
|----------|---------|------|
| Operations team | Line / internal chat | 30 min before staging deploy begins |
| External API consumers (service accounts using API key) | Email or direct contact | 24 hours before production deploy — warn about `Authorization: Bearer` → `x-api-key` migration |
| Customer-facing teams (support, sales ops) | Line / internal chat | 15 min before production deploy |
| All stakeholders | Line / internal chat | Immediately on successful production deploy |
| All stakeholders | Line / internal chat | Immediately if rollback is triggered |

### 5.2 Message Templates (Thai)

**เริ่ม deploy (Starting deploy):**
> กำลังเริ่ม deploy ระบบ RBAC + View-As สู่ production ช่วงนี้ระบบยังใช้งานได้ปกติ แต่หากพบปัญหาใดๆ กรุณาแจ้งทีม IT ทันที คาดว่าจะ deploy เสร็จภายใน 15 นาที

**deploy สำเร็จ (Deploy successful):**
> Deploy สำเร็จแล้ว ระบบ RBAC + View-As พร้อมใช้งาน ทีม ts และ crm จะเข้าถึงหน้ารายงานได้เฉพาะที่ได้รับสิทธิ์เท่านั้น Admin id=555 สามารถใช้ฟีเจอร์ View-As ได้แล้ว หากพบปัญหาให้แจ้ง IT ด่วน

**เกิดปัญหา กำลัง rollback (Issue detected, rolling back):**
> พบปัญหาหลัง deploy กำลัง rollback ระบบกลับสู่สถานะก่อนหน้า ระบบจะกลับมาใช้งานได้ตามปกติในไม่กี่นาที ทีม IT กำลังตรวจสอบสาเหตุอยู่ จะแจ้งความคืบหน้าอีกครั้ง

---

## Section 6 — Post-Deploy Verification

Execute within the first 2 hours after production deploy.

### 6.1 Vercel Log Queries

Run these from the Vercel CLI or the dashboard Functions tab. Replace `<prod-url>` with the production deployment URL.

```bash
PROD_URL="<your-prod-deployment-url>"

# 1. Confirm no FATAL boot errors (should be empty)
npx vercel logs $PROD_URL --output raw | grep "FATAL"
# Expected: no output

# 2. Count of unexpected 401s (service callers that haven't migrated Bearer → x-api-key)
npx vercel logs $PROD_URL --output raw | grep '"status":401' | wc -l
# Baseline: some 401s are normal (unauthenticated browser hits). Spike > 20 in 10 min = investigate.

# 3. 403 distribution — confirm ts/crm are hitting 403 on admin routes (expected) vs admin hitting 403 (not expected)
npx vercel logs $PROD_URL --output raw | grep '"status":403'
# Expected: all 403 lines should be from non-admin users on G-ADMIN / G-REPORTS-ADMIN routes

# 4. View-As audit log — confirm view-as activations are being logged
npx vercel logs $PROD_URL --output raw | grep "\[ViewAs\]"
# Expected: entries appear when admin 555 uses the view-as feature

# 5. Deleted endpoint tombstone — confirm docs/tables returns 404, not 200
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $PROD_ADMIN_JWT" \
  https://<prod-api-url>/api/docs/tables
# Expected: 404 (endpoint was deleted in Story 007)

# 6. Endpoint-by-endpoint 403/401 breakdown (run against staging first to validate query)
npx vercel logs $PROD_URL --output raw | grep -E '"status":(401|403)' | \
  sed 's/.*"path":"\([^"]*\)".*/\1/' | sort | uniq -c | sort -rn
# Expected: admin endpoints (by-country, etc.) show 403s only from ts/crm; commission-plus shows 200s for ts/crm
```

### 6.2 Manual View-As Smoke (Admin id=555 Full Flow)

This is the definitive post-deploy verification for Phase 3. Assign a specific named person to execute and sign off.

1. Open production frontend in a fresh browser (no cached state)
2. Login as admin id=555 using production credentials
3. Confirm: sidebar shows view-as pill button
4. Click pill → picker modal opens → ts users are listed
5. Select a specific ts user (confirm you know their seller_id from the DB)
6. Confirm: sticky banner appears — "VIEWING AS: ts (user_id=X)"
7. Navigate to `/sales-report-by-seller`
8. Confirm: data is filtered — only rows for the selected seller_id appear
9. Confirm: response header `X-Effective-Role: ts` is present (check in browser DevTools → Network tab → response headers for the `/api/reports/commission-plus` request)
10. Navigate to `/sales-report` (admin-only)
11. Confirm: redirected to `/403` (admin's own access is gated by the effective ts role)
12. Click "Exit View-As" in the banner
13. Confirm: banner disappears
14. Navigate to `/sales-report` again
15. Confirm: full admin report loads (admin view restored)
16. Open a second browser tab to the same production URL
17. Confirm: new tab has NO view-as banner (sessionStorage is per-tab — this is correct behavior)
18. Sign off with name, date, and time

---

## Section 7 — Known Gotchas

**Vercel "Canceled" deploy status**
Vercel occasionally marks a deploy as "Canceled" even when it hasn't actually failed. This is a known flakiness issue with this project. If you see it: wait 30 seconds, then run `npx vercel --prod` again. Do not assume the previous deploy is live; verify with the health check curl.

**sessionStorage is per-tab (intentional behavior)**
The view-as state is stored in sessionStorage, not localStorage. Opening a new browser tab starts a fresh admin session with no view-as active. This is correct and intentional (per Risk R-07 — prevents state leaking across tabs). Testers who open a new tab during smoke testing may think the feature isn't working — brief Quinn and any testers on this before they start.

**chat-history and users endpoints are intentionally untouched**
These endpoints use a separate Supabase auth path and are outside the scope of this initiative. Do not add `requireRole()` to them during this release. Any 401/403 behavior on those endpoints is pre-existing and unrelated.

**docs/tables endpoint is deleted**
Story 007 removed this endpoint. It previously leaked the database schema. Post-deploy it returns 404. If any internal tooling or documentation references `/api/docs/tables`, update those references now. The 404 is correct; do not treat it as a bug.

**API key callers on Authorization: Bearer will break (Story 002)**
This is intentional. If a service caller reports sudden 401s after deploy, the fix is on their side: change `Authorization: Bearer <key>` to `x-api-key: <key>`. Do not roll back Story 002 for this reason alone unless the caller is business-critical and cannot be fixed quickly.

**VIEW_AS_ADMIN_ID defaults to 555 if unset**
If you haven't set `VIEW_AS_ADMIN_ID` in Vercel env, the system defaults to user id=555. This is acceptable. However, if the production admin account has a different id, the view-as feature will silently not activate for them. Verify the admin id before deploy.

**lib/auth.ts JWT-first, API-key-fallback behavior**
Per the code review note in `docs/test-strategy-rbac-view-as.md` Appendix A: authentication tries JWT first, then falls back to API key check only if `REQUIRE_API_KEY === 'true'`. If you are troubleshooting a service caller getting unexpected 401s, check this env var in addition to the header format.

**Role source of truth is job_position, not roles_slug**
If a user has mismatched fields (e.g., `roles_slug=admin` but `job_position=ts`), the system treats them as `ts`. This is by design (TC-19). If a user reports unexpected access denial, check `job_position` in the DB, not `roles_slug`.

---

*End of runbook. Total numbered deploy steps: 10 (S-1 through S-6 for staging; P-0 through P-5 for production).*

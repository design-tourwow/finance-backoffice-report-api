# QA Gates — RBAC + View-As Deploy Checklist

Referenced by the deploy runbook. This is the QA sign-off list only.
The full deploy sequence and rollback steps live in the runbook.

---

## Pre-deploy gates (must be green before any deploy)

- [ ] `test/qa/api-tests.sh` runs to completion with 0 failures against the staging URL
- [ ] No route file in `app/api/**/route.ts` is missing `requireRole(` (run: `grep -rL "requireRole" app/api --include="route.ts"` — output must list only the G-AUTH allowlist routes: auth/*, health)
- [ ] `JWT_SECRET` is set in the Vercel staging env (lib/jwt.ts boot-assert must not throw on deploy)
- [ ] `REQUIRE_JWT` is NOT set to `'false'` in the staging env
- [ ] `VIEW_AS_ADMIN_ID` env var is set to the correct admin id in staging (or absent, defaulting to 555)
- [ ] Browser smoke checklist sections A–D completed and signed off on staging

## Phase-specific gates

### Phase 1 (requireRole wrapper)
- [ ] TC-01: ts → 403 on /api/reports/by-country
- [ ] TC-02: admin → 200 on all 40+ sampled endpoints
- [ ] TC-06, TC-07, TC-08: expired/missing/tampered JWT → 401
- [ ] N-07, N-08: wrong-secret JWT, alg:none JWT → 401
- [ ] 403 response body contains `required_roles` and `your_role` fields

### Phase 2 (commission-plus SQL filter)
- [ ] TC-10: admin sees >=2 distinct seller_ids
- [ ] TC-11: ts/100 sees only seller_id=100
- [ ] TC-15: ts with no data returns 200 + empty orders array
- [ ] TC-16: crm/300 sees only seller_id=300
- [ ] N-03: SQL injection via X-View-As-User-Id does not return 500 and DB is intact after
- [ ] `Cache-Control: private, no-store` present on commission-plus response

### Phase 3 (view-as impersonation)
- [ ] TC-03: admin-555 + view-as ts/100 → X-Effective-Role: ts, data scoped to seller=100
- [ ] TC-04: admin-999 + view-as headers → headers ignored, effective role = admin
- [ ] TC-05: ts user + X-View-As-Role: admin → 403 on admin-only endpoint
- [ ] TC-09: admin-555 view-as-ts → 403 on admin-only endpoint
- [ ] TC-12: admin-as-ts/100 data matches ts/100 direct data (same order count, same seller_ids)
- [ ] N-01: fuzz X-View-As-Role — no 500 responses
- [ ] N-10: concurrent view-as requests return independent scoped results
- [ ] N-11: lowercase view-as headers honored
- [ ] Browser smoke B-01 – D-02 signed off (picker, banner, exit, tab isolation)
- [ ] Logging confirmed: every view-as activation writes `[ViewAs] Admin id=555 impersonating...` to Vercel function logs

## Post-deploy smoke (run within 10 minutes of each prod deploy)

- [ ] `BASE_URL=<prod_url> ./test/qa/api-tests.sh` — 0 failures
- [ ] Admin id=555 login on prod: view-as banner activates and clears correctly (manual, 2 min)
- [ ] ts user on prod: commission-plus returns only own seller_id (manual, 1 min)
- [ ] No spike in 403 errors on previously-working admin endpoints (check Vercel logs)
- [ ] No spike in 500 errors on any endpoint (check Vercel logs)

## Rollback triggers (escalate immediately if any are observed in prod within 24h)

- Admin user reports 403 on a previously-working endpoint → revert Phase 1
- ts/crm user sees another user's commission data → revert Phase 2 immediately
- Non-555 user sees view-as effect or banner → revert Phase 3 immediately, rotate JWT secret if exploit confirmed
- 5xx rate spike on any wrapped endpoint → revert
- `X-Effective-Role` header absent from commission-plus responses → frontend-backend header wiring broken

# Story 017 — Production Deploy Coordination

**Phase:** QA and Deploy
**Type:** Cross-Cutting
**Complexity:** S

---

## User Story

As the release coordinator,
I want a clear phased production deploy sequence for all three phases,
So that at no point during the rollout is the system in an inconsistent state that breaks existing users or creates a security window.

---

## Background

PRD Section 9 and architecture Section 10 specify the rollout plan. Project memory notes that Vercel auto-deploys are unreliable — all production deploys must be executed manually with `npx vercel --prod --yes`. The API must always be deployed before the frontend within each phase. Story 016 (staging sign-off) is the gate for this story.

---

## Acceptance Criteria

**Pre-deploy checklist (all phases):**
1. Story 016 test report is signed off — all TCs green.
2. Both repos are on the `main` branch with the correct commit SHA verified.
3. Vercel project names confirmed: backend = `finance-backoffice-report-api`, frontend = `finance-backoffice-report`.
4. A 30-minute maintenance window is communicated to all admin users (notify that ts/crm endpoints will begin returning 403 on admin paths starting with Phase 1 deploy).

**Phase 0 + Phase 1 backend deploy:**

5. Deploy backend (Stories 001-009 code) to production:
   ```bash
   cd /Users/gap/finance-backoffice-report-api
   npx vercel --prod --yes
   ```
6. Smoke test admin endpoints immediately after deploy:
   - `GET /api/reports/by-country` with admin JWT → 200
   - `GET /api/reports/commission-plus` with admin JWT → 200, multi-seller data
   - `GET /api/database/query` with ts JWT → 403
   - `GET /api/reports/by-country` with ts JWT → 403
   - `GET /api/reports/commission-plus` with ts JWT → 200 (own data only)
7. Monitor error logs for 30 minutes. If any unexpected 403 spikes on admin endpoints → rollback immediately (see rollback signals below).

**Phase 3 frontend deploy:**

8. Deploy frontend (Stories 008, 011-015) to production:
   ```bash
   cd /Users/gap/finance-backoffice-report
   npx vercel --prod --yes
   ```
9. Smoke test frontend immediately after deploy:
   - Login as admin id=555 → "ดูเป็น..." button visible in sidebar
   - Select a ts user → banner appears → commission-plus shows only that user's data
   - Exit view-as → banner disappears → full admin data visible
   - Login as admin id=999 → no view-as button visible
   - Login as ts user → navigate to `/sales-report` URL → `/403` page displayed (not blank)
10. Monitor for 30 minutes.

**Rollback procedures (per test strategy Section 9):**

| Symptom | Action |
|---------|--------|
| Admin users report 403 on previously-working endpoints | Immediately revert backend deploy: `npx vercel rollback` or redeploy last-known-good SHA |
| ts/crm user sees another seller's commission data | Revert backend deploy immediately (data leak severity) |
| Any non-555 user sees view-as banner or view-as effect | Revert frontend deploy immediately; rotate JWT secret if exploit observed |
| 5xx error rate spike on wrapped endpoints | Revert backend deploy |
| Auth completely disabled (no 401s returned) | Revert env immediately; rotate API keys |
| Cache returns wrong-role response | Hot-fix `Cache-Control: private, no-store` header without full revert |

**Post-deploy 24-hour monitoring:**
11. Check Vercel function logs every 4 hours for the first 24 hours.
12. Watch for: unexpected 403 counts on admin-role endpoints, any 500 errors on commission-plus endpoints, any `[ViewAs]` console.log entries from users other than admin id=555.

---

## Implementation Notes

**No code changes in this story.** This is a coordination and execution story.

**Deploy commands (both repos):**

```bash
# Backend
cd /Users/gap/finance-backoffice-report-api
npx vercel --prod --yes

# Frontend (after backend smoke test passes)
cd /Users/gap/finance-backoffice-report
npx vercel --prod --yes
```

**Smoke test curl commands (backend):**

```bash
# Admin regression — expect 200
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  https://finance-backoffice-report-api.vercel.app/api/reports/by-country

# ts on admin-only — expect 403
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TS_JWT" \
  https://finance-backoffice-report-api.vercel.app/api/reports/by-country

# ts on commission-plus — expect 200
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TS_JWT" \
  https://finance-backoffice-report-api.vercel.app/api/reports/commission-plus
```

**Phase sequencing summary:**

| Step | Repo | Content | Before step |
|------|------|---------|-------------|
| 1 | API | Stories 001-007 (JWT guard, auth helpers, all role locks) | Story 016 signed off |
| 2 | API smoke test | Admin regression, ts/crm 403 spot-check | Step 1 deployed |
| 3 | API | Story 009 (SQL filter) | Step 2 clean |
| 4 | API smoke test | ts commission-plus returns own data only | Step 3 deployed |
| 5 | Frontend | Stories 008, 011-015 (403 handling, view-as UI) | Step 4 clean |
| 6 | Frontend smoke test | Admin 555 view-as end-to-end | Step 5 deployed |
| 7 | Monitor | 24 hours | Step 6 complete |

Note: Steps 1 and 3 can be combined into a single backend deploy if the team is confident in the staging sign-off. Separating them gives an intermediate rollback point between Phase 1 and Phase 2 in production.

---

## Test Cases

This story executes abbreviated production smoke tests. The full matrix was run in Story 016.

**Must pass in production:**
- Admin → 200 on `by-country` and `commission-plus`
- ts → 403 on `by-country`
- ts → 200 on `commission-plus` with own data only
- Admin id=555 → view-as flow end-to-end in browser

---

## Dependencies

- Story 016 (full test matrix sign-off — hard gate)
- All code stories 001-015 merged to main

---

## Definition of Done

- [ ] Backend deployed to production with `npx vercel --prod --yes`
- [ ] Backend smoke tests pass immediately post-deploy
- [ ] Frontend deployed to production with `npx vercel --prod --yes`
- [ ] Frontend smoke tests pass (view-as end-to-end, 403 redirect)
- [ ] 24-hour monitoring period completed with no rollback signals observed
- [ ] Deployment SHA recorded (for rollback reference)
- [ ] All admin users notified of successful rollout

# Pre-Deploy Checks — RBAC + View-As Release

Run **all** of these before kicking off the staging deploy in
`docs/deploy-runbook-rbac-view-as.md` Step S-1.

---

## 1. DB hygiene — `job_position` integrity

ts/crm checks rely on `agency_member.job_position`. Anyone whose value is
not exactly `admin`, `ts`, or `crm` falls back to **admin** (matches frontend
`getCurrentUserRole` behavior). If you didn't intend that, fix the data first.

Run on **staging** and **production** DB:

```sql
SELECT id, first_name, last_name, nick_name, job_position, team_number
FROM v_6kMWFc_agcy_agency_members
WHERE job_position IS NULL
   OR TRIM(job_position) = ''
   OR LOWER(TRIM(job_position)) NOT IN ('admin','ts','crm');
```

**Action:**
- Empty result → ✅ proceed
- Rows returned → decide per-row: assign correct `job_position` OR confirm the admin fallback is desired

---

## 2. Role mismatch users — `roles_slug` vs `job_position`

The token in our reference example had `roles_slug=admin` AND `job_position=ts`.
This is treated as **ts** by the new code (we use `job_position` only).
Verify whether any production user is in this state and that the new behavior
is acceptable for them.

```sql
SELECT id, first_name, last_name, nick_name, roles_slug, job_position
FROM v_6kMWFc_agcy_agency_members
WHERE LOWER(TRIM(roles_slug)) <> LOWER(TRIM(job_position))
  AND roles_slug IS NOT NULL
  AND job_position IS NOT NULL;
```

**Action:** if any rows returned, message those users to confirm they're OK
seeing only `job_position`-scoped access after the deploy.

---

## 3. Vercel environment variables

### Backend (`finance-backoffice-report-api`)

| Var | Required? | Notes |
|---|---|---|
| `JWT_SECRET` | **YES** | Backend boot **fails fast** if missing — this is intentional. Set in BOTH staging AND production envs. |
| `VIEW_AS_ADMIN_ID` | optional | Defaults to `555` if unset. Set explicitly to override. |
| `API_KEY_PRODUCTION` | as-is | Used by `validateApiKey`. |
| `API_KEY_STAGING` | as-is | Used by `validateApiKey`. |
| `REQUIRE_API_KEY` | as-is | If `'true'`, API key fallback is allowed when JWT auth fails. |
| `REQUIRE_JWT` | as-is | If `'false'`, disables JWT (do **not** disable in production). |

Run before deploy:
```bash
vercel env ls
```

Confirm `JWT_SECRET` is present for both `staging` and `production`. If not:
```bash
vercel env add JWT_SECRET production
vercel env add JWT_SECRET staging
```

### Frontend (`finance-backoffice-report`)

No new env vars in this release.

---

## 4. External API consumer audit

After this deploy, any caller using `Authorization: Bearer <api-key>` will
get **401**. Identify them now and migrate to `x-api-key: <api-key>`.

**Vercel log search** (run the following on the API project):

```bash
# Find any caller using Bearer with a non-JWT-shaped value over the last 7 days
vercel logs --output raw \
  | grep -E 'authorization.*Bearer [^.]+\s*$' \
  | sort -u | head -50
```

Or in the Vercel dashboard:
- Search logs for: `authorization Bearer`
- Filter to non-JWT-looking values (JWTs are 3 base64 segments separated by dots)

**Common consumers to verify manually:**
- Any internal cron jobs / serverless functions hitting this API
- Mobile app or partner integrations
- Webhooks

For each found caller, instruct: switch from `Authorization: Bearer XXX` to
`x-api-key: XXX`.

---

## 5. Test user provisioning

QA scripts (`api-tests.sh`) need these JWT env vars set before run:

| Env var | User profile required |
|---|---|
| `ADMIN_JWT` | any admin (id ≠ 555 OK) |
| `ADMIN_555_JWT` | admin id = 555 (the view-as tester) |
| `OTHER_ADMIN_JWT` | admin with id ≠ 555 (for impersonation rejection test) |
| `TS_JWT` | ts user with ≥1 commission-plus order in staging DB |
| `TS_USER_NO_DATA_JWT` | ts user with 0 orders (TC-15 empty case) |
| `CRM_JWT` | crm user with ≥1 order |
| `API_KEY` | any value in `API_KEY_PRODUCTION` or `API_KEY_STAGING` |

Generate the JWTs by logging in as each user via the real login flow (or
sign manually with the same `JWT_SECRET`). Export them in your shell:

```bash
export BASE_URL="https://<staging-api-url>"
export ADMIN_JWT="eyJ..."
export ADMIN_555_JWT="eyJ..."
# etc.
```

If staging doesn't have the right test users, provision them first via the
existing user-management UI before running `api-tests.sh`.

---

## 6. Type-check + syntax-check

Run from each repo root:

```bash
# Backend
cd /Users/gap/finance-backoffice-report-api
npx tsc --noEmit

# Frontend (no TS, but parse-check the changed files)
node -e "new Function(require('fs').readFileSync('/Users/gap/finance-backoffice-report/menu-component.js','utf-8'))" \
  && echo "menu-component.js OK"
node -e "new Function(require('fs').readFileSync('/Users/gap/finance-backoffice-report/shared-http.js','utf-8'))" \
  && echo "shared-http.js OK"
```

Both must succeed silently before deploy.

---

## 7. Sign-off gate

Before proceeding to `deploy-runbook` Step S-1, the deploying engineer
confirms (in writing or chat):

- [ ] Section 1 DB hygiene query returned empty (or exceptions are documented)
- [ ] Section 2 role mismatch users handled
- [ ] Section 3 `JWT_SECRET` confirmed in Vercel for both envs
- [ ] Section 4 external API consumer audit complete; consumers migrated
- [ ] Section 5 test users + JWTs prepared
- [ ] Section 6 type-check + syntax-check passed

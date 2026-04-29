# PRD: RBAC Enforcement + View-As Impersonation
**Product**: Finance Backoffice Report  
**Author**: John (PM)  
**Status**: Draft v1.0  
**Date**: 2026-04-29  
**Phases**: 3

---

## 1. Problem Statement

The Finance Backoffice has three user roles — `admin`, `ts` (sales), and `crm` — whose permissions are enforced today only at the frontend (menu visibility). The backend API performs no role checks: any user holding a valid JWT can call any endpoint, regardless of role. This means a `ts` or `crm` user who knows an endpoint URL — or who manipulates frontend requests — can access admin-only data without any server-side resistance.

Additionally, on the `sales-report-by-seller` page, data isolation between peers depends entirely on frontend redaction. The API returns all rows and the UI hides what it shouldn't show. A network-layer inspection or a direct API call bypasses this completely.

This initiative closes both gaps in three coordinated phases, and adds a controlled view-as testing tool for a single designated admin.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Every API endpoint enforces role authorization server-side; forbidden requests return 403. |
| G2 | `ts` and `crm` users receive only their own rows from the `sales-report-by-seller` endpoint, regardless of how the request is made. |
| G3 | Admin user id=555 can impersonate a specific `ts` or `crm` user to verify data isolation is working correctly. |
| G4 | Zero regressions on existing `admin` workflows after enforcement is added. |
| G5 | View-as state is always visually surfaced to the acting user via a persistent banner. |

## 2.1 Non-Goals

- Building a general-purpose impersonation framework for any admin user.
- Audit logging of view-as sessions (noted as Phase 4 / future work).
- A backend admin UI for managing roles (roles come from `agency_member.job_position`).
- Changing or migrating the role source of truth.
- Any customer-facing or external-user permission system.

---

## 3. User Personas

| Persona | Description | Expected Experience |
|---------|-------------|---------------------|
| **Admin** | Full-access internal operator. Any admin except id=555. | All endpoints accessible. No view-as capability. |
| **Admin id=555** | Designated QA/testing admin. Same full access as any admin, plus view-as capability. | Can switch to view-as TS or CRM user; persistent banner; can exit at any time. |
| **ts (Sales)** | Salesperson. Sees only their own booking/sales data. | Blocked from admin-only endpoints (403). On `sales-report-by-seller`, sees only own rows. |
| **crm** | CRM operator. Same data isolation rules as `ts`. | Blocked from admin-only endpoints (403). On `sales-report-by-seller`, sees only own rows. |

---

## 4. User Stories and Acceptance Criteria

### Phase 1 — Backend Role Enforcement

---

**Story 1.1 — Admin retains full access (regression safety)**  
_As an admin, I can access all endpoints I used before this change, so my existing workflows are unaffected._

Acceptance Criteria:
- All endpoints currently accessible to admin remain accessible post-Phase 1 deploy.
- Admin requests with a valid JWT and `job_position = 'admin'` receive the same response shapes as before.
- No new 403 or 401 errors appear in admin sessions.

---

**Story 1.2 — ts/crm blocked from admin-only endpoints**  
_As a ts or crm user, when I request an admin-only endpoint, I receive a 403 with a clear error message._

Acceptance Criteria:
- A request with a valid `ts` or `crm` JWT to an admin-only endpoint returns HTTP 403.
- Response body includes `{ "error": "Forbidden", "message": "<human-readable reason>" }`.
- The 403 is returned before any database query executes.
- Frontend surfaces a meaningful error state (not a blank page or unhandled exception).

---

**Story 1.3 — Invalid or expired JWT returns 401**  
_As any user, if my token is expired or invalid, I receive a 401._

Acceptance Criteria:
- Requests with no JWT, an expired JWT, or a malformed JWT return HTTP 401.
- Response body: `{ "error": "Unauthorized" }`.
- 401 is distinct from 403 — no valid identity was established.

---

**Story 1.4 — Service-to-service API key bypass**  
_As a backend service using an API key, I can call internal endpoints without a user JWT._

Acceptance Criteria:
- Requests presenting a valid API key header bypass JWT/role checks.
- API key validation occurs before role checks; invalid API keys still return 401.
- API key bypass is not available to browser clients (key is never exposed to frontend).

---

### Phase 2 — SQL-Level Data Filter

---

**Story 2.1 — ts/crm see only their own data on sales-report-by-seller**  
_As a ts or crm user, the sales-report-by-seller endpoint returns only rows belonging to me, regardless of what query parameters I send._

Acceptance Criteria:
- The SQL query includes a `WHERE seller_id = <authenticated user id>` clause (or equivalent) applied on the server, not filtered post-fetch.
- Sending another user's `seller_id` in query params does not override the server-enforced filter.
- Response rows contain no data belonging to other sellers.
- Admin users are unaffected — they continue to receive all rows.

---

**Story 2.2 — Admin continues to see all seller data**  
_As an admin, the sales-report-by-seller endpoint returns data for all sellers._

Acceptance Criteria:
- Admin JWT requests return the full unfiltered dataset.
- No regression in aggregations, totals, or row counts for admin.

---

### Phase 3 — View-As Impersonation (admin id=555 only)

---

**Story 3.1 — Admin id=555 can activate view-as mode**  
_As admin id=555, I can select a specific ts or crm user from a dropdown and switch into view-as mode for that user._

Acceptance Criteria:
- A "View As" control is present in the UI only when the authenticated user is admin id=555.
- The dropdown sources from `GET /api/agency-members?roles=ts,crm` and lists real names.
- Selecting a user stores `{ role, userId }` in `sessionStorage` and sets `X-View-As-Role` and `X-View-As-User-Id` headers on all subsequent API requests.
- The view-as selection persists across page navigation within the same tab (sessionStorage scope).
- No view-as control is visible to any other admin or to ts/crm users.

---

**Story 3.2 — View-as banner is always visible**  
_As admin id=555 in view-as mode, I always see a persistent banner identifying the active impersonated user._

Acceptance Criteria:
- A banner appears on every page (rendered by `menu-component.js`) when `sessionStorage` contains an active view-as state.
- Banner text clearly states: the role being viewed and the name/id of the target user (e.g., "Viewing as: ts — Somchai (id: 123)").
- Banner includes an "Exit View-As" button.
- Banner is visually distinct (e.g., warning color) and cannot be dismissed except via the exit button.
- If the user navigates to a new page while in view-as mode, the banner reappears immediately on load.

---

**Story 3.3 — Backend honors view-as headers only from admin id=555**  
_As admin id=555, the backend applies the impersonated user's data filter when I send view-as headers._

Acceptance Criteria:
- When `X-View-As-Role` and `X-View-As-User-Id` headers are present and the authenticated JWT belongs to admin id=555, the backend applies SQL filters as if the request came from the target user.
- The real user's identity (id=555) remains in server logs; the view-as user id is used only for data scoping.
- Response data matches exactly what the target user would see under Phase 2 enforcement.

---

**Story 3.4 — View-as headers from non-admin users are ignored**  
_As a ts or crm user, sending X-View-As-* headers in my request has no effect._

Acceptance Criteria:
- If the authenticated JWT is `ts` or `crm` (any user, any id), view-as headers are silently ignored.
- The server applies normal role-based filtering as if the headers were absent.
- No error is returned for the presence of the headers — they are simply discarded.
- An admin with id ≠ 555 sending view-as headers also has them ignored.

---

**Story 3.5 — Admin id=555 can exit view-as and return to full admin experience**  
_As admin id=555, clicking "Exit View-As" restores my full admin access without requiring a page reload or re-login._

Acceptance Criteria:
- Clicking "Exit" clears the view-as state from `sessionStorage`.
- The banner disappears immediately.
- The next API request carries no view-as headers and returns full admin data.
- No stale view-as data is visible after exit.

---

**Story 3.6 — sessionStorage does not leak between tabs**  
_As admin id=555, view-as mode in one tab does not activate in another tab._

Acceptance Criteria:
- Opening a new tab (same browser, same session) starts with no view-as state.
- This is the native behavior of `sessionStorage` — confirm no use of `localStorage` for view-as state.

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Unauthorized data access via role header manipulation | 0 incidents post-Phase 2 |
| Admin id=555 smoke test time (activate view-as, verify data, exit) per role | < 2 minutes |
| Admin workflow regressions reported after Phase 1 deploy | 0 |
| ts/crm users receiving another seller's rows from the API | 0 |
| Frontend pages showing unhandled errors due to new 403/401 responses | 0 |

---

## 6. Out of Scope

- Multi-user impersonation list (more than one designated view-as account).
- Audit logging of view-as sessions — **noted as Phase 4 / future work**.
- Backend admin UI for role management.
- Role assignment or mutation via API.
- Any permission changes to `/api/agency-members` beyond the requirement that it remain accessible to admin.
- Rate limiting or brute-force protection (separate initiative).

---

## 7. Dependencies

| Dependency | Notes |
|-----------|-------|
| `GET /api/agency-members?roles=ts,crm` | Must remain accessible to admin; provides the user picker list for view-as dropdown. |
| `agency_member.job_position` | Source of truth for role. No schema changes required. |
| `menu-component.js` (frontend) | Must be modified to render view-as banner and control. Single shared component covers all pages. |
| Both repos deploy coordinately | Frontend (Vercel) and API (Vercel) must be deployed in the order: API first, then frontend, per phase. |

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing admin workflows when enforcement is added | Medium | High | Phase 1 includes explicit regression test pass on all admin-accessible endpoints before merging. |
| Header injection — non-admin sends `X-View-As-*` to escalate | Low | High | Backend checks real JWT identity before honoring view-as headers; non-admin headers silently discarded (Story 3.4). |
| sessionStorage leaks across tabs | Low | Low | sessionStorage is per-tab by spec — confirmed non-issue. Do not use localStorage. |
| Admin id=555 confusion about active role during view-as | Medium | Medium | Persistent banner (Story 3.2) with explicit user name + role text. Banner cannot be dismissed without exiting. |
| Partial deploy window (API enforces, frontend not yet updated) | Low | Medium | Deploy API first; frontend degrades gracefully on 403 (shows error state, not crash). Coordinate deploy window. |

---

## 9. Rollout Plan

### Phase 1 — Backend Role Enforcement
1. Implement `requireRole([...])` middleware wrapper.
2. Annotate every existing endpoint with its required roles.
3. Deploy API to staging; run full regression pass on admin workflows.
4. Deploy API to production. Frontend deploy not required.
5. Monitor error logs for unexpected 403/401 spikes for 24 hours.

### Phase 2 — SQL-Level Data Filter
1. Modify `sales-report-by-seller` query to inject `seller_id` filter from JWT when role is `ts` or `crm`.
2. Deploy API to staging; verify ts/crm test accounts see only own data.
3. Verify admin test account still sees all rows.
4. Deploy API to production.

### Phase 3 — View-As Impersonation
1. Add view-as header handling to API middleware (only for id=555).
2. Implement view-as UI in `menu-component.js` (dropdown + banner + exit).
3. Deploy API to staging, then frontend to staging.
4. Admin id=555 performs smoke test: select ts user, verify filtered data, exit, verify full admin data.
5. Deploy API to production, then frontend to production.

Both repositories use `npx vercel --prod` for deploy (not git-push auto-deploy).

---

## 10. Approval Gates

| Gate | Required Before | Criteria |
|------|----------------|----------|
| **Phase 1 Go** | Phase 1 production deploy | All admin endpoints verified on staging with no regressions; 403/401 shapes confirmed by frontend team. |
| **Phase 2 Go** | Phase 2 production deploy | ts/crm test account returns only own rows from staging API; admin test account returns full dataset; no frontend crashes on scoped response. |
| **Phase 3 Go** | Phase 3 production deploy | Admin id=555 smoke test passes on staging (both ts and crm view-as); non-555 admin confirmed cannot see view-as control; ts/crm confirmed view-as headers are ignored; banner displays and exits correctly. |

---

## 11. Maintenance Contract — Field-by-Field Parity (Standing Policy)

### 11.1 The contract

Every future change to a page accessible by ts/crm — or to any shared
component, helper, or API endpoint that those pages depend on — **must**
include a field-by-field parity verification before merge. This is the
standing product policy for the view-as feature, owned by the product
manager and enforced at PR review time.

### 11.2 Why this is non-negotiable

The view-as feature's value proposition is "God mode 100%": admin id=555
sees and behaves exactly like the impersonated user. The dominant bug
class observed during initial development was **subtle UI leaks** — a
single hardcoded `isAdmin()` guard, a direct `currentUser.nick_name`
read, an unguarded export button — any one of which silently breaks the
parity guarantee while everything else looks fine. These bugs are hard
to spot in passive code review and require explicit comparison against
a real ts/crm session to catch. A formal SOP makes verification a
non-skippable gate rather than developer judgment.

### 11.3 Scope of the policy

The verification is mandatory whenever a PR modifies any of:

| Surface | Examples |
|---------|----------|
| ts/crm-accessible routes | `/dashboard`, `/sales-report-by-seller`, plus any future routes whose `ROLE_ACCESS` entry grants ts or crm access |
| Shared UI components | filter dropdowns, KPI cards, table renderers, export buttons, search boxes, period selectors, sortable header, trophy rank, table search, table count, filter actions |
| Shared frontend helpers | `menu-component.js`, `shared-http.js`, `token-utils.js`, `shared-filter-service.js`, `shared-export-button.js`, `shared-trophy-rank.js`, `shared-utils.js` |
| Auth/role helpers | `lib/auth.ts`, `lib/jwt.ts`, `lib/api-guard.ts`, `middleware.js` |
| API endpoints reachable by ts/crm | `/api/reports/commission-plus`, `/api/reports/commission-plus/sellers`, `/api/agency-members`, `/api/customers/search`, `/api/reports/available-periods`, `/api/reports/commission-plus/pdf` |

### 11.4 Sign-off criteria

A PR is mergeable only when **every** condition below is met:

1. The pre-merge checklist in `view-as-parity-sop.md` Section 6 is
   filled out and attached to the PR description.
2. Every row in the field-by-field checklist for the affected page(s)
   is marked ✓ (match) — or marked ✗ with an explicit note that the
   product owner has approved the divergence as intentional.
3. Both axes were tested:
   - Real ts user logged in directly vs admin id=555 viewing-as-ts/<same id>
   - Real crm user logged in directly vs admin id=555 viewing-as-crm/<same id>
4. Console verification: a single `[ViewAs] God-mode active` log appears
   when impersonating; no warnings about token-patch failures or
   `X-Effective-Role` mismatch are present.
5. Network verification: every `/api/*` request during impersonation
   carries both `X-View-As-Role` and `X-View-As-User-Id` headers; every
   response carries `X-Effective-Role` matching the impersonated role.
6. Export verification: PDF and Excel files were generated in both
   modes and compared (file content, not just buttons).

### 11.5 Roles

| Role | Responsibility |
|------|----------------|
| **Author of the change** | Fills out the parity checklist; runs both modes; attaches comparison evidence (screenshots / file diffs) to PR |
| **Reviewer** | Refuses to approve a PR that lacks a completed checklist; spot-checks at least one row by re-running the test independently |
| **Product owner** (admin id=555) | Final sign-off on any ✗ rows that author and reviewer agree are intentional divergences; veto authority on parity disputes |

### 11.6 Where the SOP lives

`docs/view-as-parity-sop.md` is the canonical procedural reference. It
contains:

- Full field-by-field checklist template (pre-filled from
  `test/qa/view-as-field-parity-audit.md`)
- The six-step process for running the verification
- Common patterns that break parity (with code examples for each)
- Copy-paste pre-merge form

The SOP is cross-referenced from this PRD, the architecture document
(`architecture-rbac-view-as.md`), the test strategy
(`test-strategy-rbac-view-as.md`), the stories index, and the API
repository README so it cannot be missed during onboarding.

### 11.7 Failure mode

A merge that lands without this verification is a regression by
definition. The owning team (FE + API maintainers) is responsible for
opening a follow-up PR within **one business day** to:

- (a) Run the missed verification.
- (b) Fix any divergences uncovered.
- (c) Update the SOP to add a new "common pattern" entry if the missed
  bug represents a class of mistake worth flagging for future authors.

The retrospective entry should also surface in the next sprint's "what
slipped through" review so the team can adjust review processes.

---

_End of PRD v1.1 — Maintenance Contract section expanded 2026-04-29 alongside SOP publication_

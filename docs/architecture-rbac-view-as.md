# Architecture: RBAC + View-As Impersonation

**Status:** Design — not yet implemented  
**Author:** Winston (architect)  
**Date:** 2026-04-29  
**Repos in scope:**
- Frontend: `finance-backoffice-report` (vanilla JS, Vercel)
- Backend: `finance-backoffice-report-api` (Next.js App Router, TypeScript, MySQL, Vercel)

---

## 1. Overview

### Current State

- `lib/jwt.ts` verifies the HS256 signature and decodes the token. That is the entirety of auth today.
- `lib/api-guard.ts` wraps every report route with rate-limiting + `authenticate()`, but `authenticate()` only checks that a valid JWT or API key is present. Role is never inspected.
- Any user with a valid JWT — regardless of `job_position` — can call any endpoint, including admin-only reports and the raw `database/query` endpoint.
- The frontend (`menu-component.js`) enforces route visibility by role, but this is pure UI theater: the underlying API endpoints are unguarded.
- There is no impersonation capability. Admins cannot preview what a ts/crm user would see.

### Target State

- Every API endpoint is classified into a role tier. `requireRole()` is called at the top of each route handler and short-circuits with 403 if the caller's role is insufficient.
- Role is derived from `payload.user.agency_member.job_position` (the authoritative field — see Section 4 for the reasoning comment to be added to `lib/jwt.ts`).
- A single designated admin (agency_member.id === 555) can impersonate any ts or crm user by sending `X-View-As-Role` and `X-View-As-User-Id` request headers. The backend honours these only when the real caller is that admin.
- SQL data filters on commission-plus endpoints scope results to the effective user id — so impersonation shows exactly what that user would see.
- The frontend renders an impersonation banner and injects view-as headers on every API call while a view-as session is active.

### What Is Not Changing

- Token issuance and signing remain in the upstream Finance Backoffice system.
- `withApiGuard` wrapper stays. `requireRole` will be called from inside the handler body, not as a second wrapper layer.
- The `x-api-key` service-to-service bypass stays. Role checks are skipped for API key requests (they already bypass JWT entirely in `authenticate()`).

---

## 2. Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND  finance-backoffice-report (Vercel)                │
│                                                              │
│  token-utils.js         — decode/validate JWT in browser    │
│  menu-component.js      — ROLE_ACCESS table, route guard,   │
│                           view-as banner, user picker        │
│  shared-http.js         — injects Authorization header +    │
│                           X-View-As-Role / X-View-As-User-Id │
│  per-page *-api.js      — call SharedHttp.get/post          │
└──────────────────────┬───────────────────────────────────────┘
                       │  HTTPS  (Authorization: Bearer <jwt>)
                       │         (X-View-As-Role: ts)
                       │         (X-View-As-User-Id: 123)
┌──────────────────────▼───────────────────────────────────────┐
│  BACKEND  finance-backoffice-report-api (Vercel / Next.js)   │
│                                                              │
│  app/api/**             — route handlers                     │
│    └─ withApiGuard()    — rate-limit + authenticate()        │
│         └─ requireRole(['admin'])   ← NEW, called inside     │
│              └─ getEffectiveRole()  ← NEW                    │
│                   └─ getRealRole()  ← NEW                    │
│                                                              │
│  lib/api-guard.ts       — existing wrapper (unchanged)       │
│  lib/auth.ts            — gains requireRole, getEffective*   │
│  lib/jwt.ts             — JWTPayload gains agency_member     │
│  lib/db.ts              — MySQL pool (unchanged)             │
└──────────────────────────────────────────────────────────────┘
```

**Auth flow per request:**

1. `withApiGuard` calls `authenticate(request)` → returns `AuthResult` (method: jwt | api_key | none).
2. If `method === 'api_key'`: role checks are skipped entirely. Handler runs as service account.
3. If `method === 'jwt'`: handler calls `requireRole(['admin'])` (or whichever tier).
4. `requireRole` calls `getEffectiveRole(request, payload)`.
5. `getEffectiveRole` calls `getRealRole(payload)`. If real role is admin AND real id === 555, it checks `X-View-As-Role`; otherwise returns real role.
6. If effective role is in the allowed list → `{ok: true, auth: {effectiveRole, effectiveUserId, realRole, realUserId}}`.
7. If not → `{ok: false, response: 403 JSON}`. Handler returns this response immediately.

---

## 3. Data Flow Sequences

### 3a. Normal authenticated request (admin)

```
Browser → GET /api/reports/by-country
         Authorization: Bearer <jwt>

withApiGuard:
  authenticate() → { authenticated: true, method: 'jwt', user: payload }

route handler:
  const guard = requireRole(['admin'], request, payload)
  if (!guard.ok) return guard.response   // ← skipped; admin passes

  getRealRole(payload) → 'admin'
  getEffectiveRole(request, payload) → 'admin'  // no view-as headers
  getEffectiveUserId(request, payload) → 555

  // SQL: no seller_id filter for admin
  query MySQL → rows
  return 200 JSON
```

### 3b. View-as request (admin id=555 impersonating ts user id=123)

```
Browser → GET /api/reports/commission-plus
         Authorization: Bearer <jwt_of_admin_555>
         X-View-As-Role: ts
         X-View-As-User-Id: 123

withApiGuard:
  authenticate() → { authenticated: true, method: 'jwt', user: payload }
  // payload.user.agency_member.id === 555
  // payload.user.agency_member.job_position === 'admin'

route handler (commission-plus — allowed: admin | ts | crm):
  const guard = requireRole(['admin','ts','crm'], request, payload)

  getRealRole(payload) → 'admin'
  getEffectiveRole(request, payload):
    realRole = 'admin', realId = 555
    realId === 555 → read X-View-As-Role header → 'ts'
    validate 'ts' is in ['admin','ts','crm'] → ok
    → returns 'ts'
  guard.ok = true
  guard.auth.effectiveRole = 'ts'
  guard.auth.effectiveUserId = 123   // from X-View-As-User-Id

  // SQL: conditions.push(`o.seller_agency_member_id = ?`, 123)
  //      conditions.push(`o.is_old_customer = 0`)  // ts rule
  query MySQL → rows scoped to user 123
  return 200 JSON
```

### 3c. Non-admin attempting view-as (blocked)

```
Browser → GET /api/reports/commission-plus
         Authorization: Bearer <jwt_of_ts_user_999>
         X-View-As-Role: admin       // attacker trying to escalate
         X-View-As-User-Id: 555

getEffectiveRole():
  getRealRole(payload) → 'ts'        // real role is ts
  realId === 555? → NO (id=999)
  → X-View-As-* headers ignored
  → returns 'ts'

requireRole(['admin','ts','crm']):
  effectiveRole = 'ts' → in list → ok
  effectiveUserId = 999  // always real id when not impersonating
  // SQL filters to user 999 — no escalation occurred
```

### 3d. ts user hitting admin-only endpoint

```
GET /api/reports/by-country
    Authorization: Bearer <jwt_of_ts_user>

requireRole(['admin'], request, payload):
  effectiveRole = 'ts'
  'ts' not in ['admin'] → guard.ok = false
  → return 403 { success:false, error:'Forbidden',
                 required_roles:['admin'], your_role:'ts' }
```

---

## 4. Auth Helpers Spec

**File:** `lib/auth.ts` (extend existing file)

### 4a. JWTPayload extension

`lib/jwt.ts` currently uses a generic `[key: string]: unknown` for extra fields. The `JWTPayload` interface must be extended (or an `AgencyMemberPayload` sub-interface added) to type the agency member fields that RBAC depends on:

```typescript
// IMPORTANT — canonical role source: agency_member.job_position
// Do NOT use roles_slug. job_position is the field verified against
// the Finance Backoffice agency system and is the single source of truth
// for role decisions in this API. roles_slug is legacy and may diverge.
export interface AgencyMember {
  id: number
  job_position: string    // 'admin' | 'ts' | 'crm'
  roles_slug?: string     // do NOT use for role checks — see note above
  team?: string | number
  [key: string]: unknown
}

export interface JWTPayload {
  sub?: string
  username?: string
  email?: string
  role?: string
  iat?: number
  exp?: number
  user?: {
    agency_member?: AgencyMember
    [key: string]: unknown
  }
  [key: string]: unknown
}
```

### 4b. Core helper signatures

All new functions live in `lib/auth.ts`.

```typescript
/** Allowed role values */
export type Role = 'admin' | 'ts' | 'crm'

/** Returned by requireRole when check passes */
export interface AuthContext {
  effectiveRole: Role
  effectiveUserId: number
  realRole: Role
  realUserId: number
  isImpersonating: boolean
}

/** Returned by requireRole */
export type RoleGuardResult =
  | { ok: true;  auth: AuthContext }
  | { ok: false; response: Response }

/**
 * Extract the real role from a decoded JWT payload.
 * Uses agency_member.job_position — never roles_slug.
 * Falls back to 'admin' for unrecognized values (matches existing
 * frontend getCurrentUserRole() behaviour — see menu-component.js:212).
 */
export function getRealRole(payload: JWTPayload): Role

/**
 * Return the effective role for this request.
 * Impersonation is honoured ONLY when:
 *   - getRealRole(payload) === 'admin'
 *   - payload.user.agency_member.id === 555
 *   - X-View-As-Role header is present and value is 'ts' | 'crm'
 * In all other cases, returns getRealRole(payload).
 */
export function getEffectiveRole(request: NextRequest, payload: JWTPayload): Role

/**
 * Return the effective user id for SQL data filtering.
 * Impersonation honoured under same conditions as getEffectiveRole.
 * Falls back to real agency_member.id if X-View-As-User-Id is absent,
 * non-numeric, or <= 0.
 */
export function getEffectiveUserId(request: NextRequest, payload: JWTPayload): number

/**
 * Role gate — call at the top of a route handler (after withApiGuard).
 * Returns {ok:true, auth} on pass, {ok:false, response} on fail.
 * API-key requests are identified by auth.method === 'api_key';
 * callers may pass null payload in that case — requireRole skips the
 * role check and returns ok:true with a synthetic AuthContext.
 */
export function requireRole(
  allowed: Role[],
  request: NextRequest,
  payload: JWTPayload | null
): RoleGuardResult
```

### 4c. 403 response shape

```json
{
  "success": false,
  "error": "Forbidden",
  "required_roles": ["admin"],
  "your_role": "ts"
}
```

HTTP status: `403`. This is distinct from the existing 401 shape (`{ success:false, error:'Unauthorized', message:... }`).

### 4d. Usage pattern in a route handler

```typescript
export const GET = withApiGuard('/api/reports/by-country', async (request) => {
  const payload = verifyJWT(request)   // already verified by withApiGuard; re-read for role
  const guard = requireRole(['admin'], request, payload)
  if (!guard.ok) return guard.response

  const { auth } = guard
  // ... use auth.effectiveUserId for SQL if needed
})
```

Note: `withApiGuard` already calls `authenticate()` which calls `verifyJWT()`. The route handler can either re-call `verifyJWT()` (cheap; idempotent decode) or `withApiGuard` can be extended to pass the payload through. Re-calling is simpler — no API surface change needed for Phase 1. Revisit if profiling shows overhead.

---

## 5. Header Contract

### Headers sent by frontend → backend

| Header | Format | Example |
|---|---|---|
| `X-View-As-Role` | string literal, lowercase | `ts` or `crm` |
| `X-View-As-User-Id` | numeric string, positive integer | `123` |

**Rules:**

- Both headers must be present together. If only one is present, the backend treats it as if neither were present (logs a warning; does not 400).
- Permitted values for `X-View-As-Role`: `ts`, `crm`. Any other value (including `admin`) is rejected — the backend silently falls back to the real role and logs a warning.
- `X-View-As-User-Id` must parse to a positive integer. Non-numeric or zero values are ignored.
- Headers are only honoured when the real authenticated user is `agency_member.id === 555`. For any other user, the headers are read and discarded without error.
- `X-Api-Key` requests: headers are read and discarded (API key callers are not real users; impersonation is meaningless).

### Frontend responsibility

`shared-http.js` `buildHeaders()` is the single injection point. It will read `viewAsRole` and `viewAsUserId` from `sessionStorage` and add the headers when both are set. No per-page code should add these headers manually.

---

## 6. Endpoint × Role Matrix

Route paths are relative to `/api/`. All endpoints require a valid JWT or API key; the table shows the minimum **role** required when authenticated via JWT.

### 6a. Admin-only

These endpoints expose aggregate business intelligence across all sellers and all customers. ts and crm users have no legitimate need.

| Endpoint | Notes |
|---|---|
| `reports/by-country` | |
| `reports/by-supplier` | |
| `reports/by-created-date` | |
| `reports/by-travel-start-date` | |
| `reports/by-travel-date` | |
| `reports/by-booking-date` | |
| `reports/summary` | |
| `reports/lead-time-analysis` | |
| `reports/repeat-customers` | |
| `reports/countries` | |
| `reports/wholesale-by-country` | |
| `reports/supplier-performance` | |
| `reports/sales-discount` | |
| `reports/order-external-summary` | |
| `reports/order-has-discount` | |
| `reports/repeated-customer-report` | |
| `reports/work-list` | |
| `reports/commission-plus/pdf` | PDF generation; same data scope as commission-plus but admin-only render |

### 6b. Admin + ts + crm (with SQL data filter in Phase 2)

| Endpoint | SQL filter behaviour |
|---|---|
| `reports/commission-plus` | admin: no filter; ts/crm: filter by effectiveUserId |
| `reports/commission-plus/sellers` | admin: all sellers; ts/crm: filter to own id |
| `available-periods` | no per-user data; all roles see same list |
| `customers/search` | no per-user data |
| `agency-members` | no per-user data; used for view-as user picker |

### 6c. Admin-only (high risk — raw DB access)

Must be locked to admin before any other change ships. These expose arbitrary SQL execution or full schema introspection.

| Endpoint | Risk |
|---|---|
| `database/query` | arbitrary SQL execution |
| `database/schema` | full schema dump |
| `database/tables` | table enumeration |
| `tables/*` | raw table access |
| `users` | user management |

### 6d. Login-only (valid JWT, no role check)

Any authenticated user may call these. No role gate needed.

| Endpoint | Notes |
|---|---|
| `auth/*` | login/refresh |
| `health` | |
| `countries` | |
| `locations/*` | |
| `job-positions` | |
| `teams` | |
| `suppliers` | |

### 6e. Investigate before locking

| Endpoint | Action required |
|---|---|
| `chat-history` | Determine if any frontend page uses this. If yes, classify. If no active use, lock to admin-only or add deprecation notice. |
| `docs/tables` | Same as above. Likely a dev tool — lock to admin-only. |

---

## 7. SQL Filter Spec — commission-plus Family

### Current state

`commission-plus/route.ts` accepts `job_position` and `seller_id` as query parameters passed in by the frontend. There is no server-side enforcement that the caller is only requesting their own data.

### Target state

The backend derives identity from the token (and view-as headers for admin id=555). The frontend still passes `job_position` and `seller_id` as query params for backwards compatibility, but the backend **overrides** them with the effective identity when the caller is ts or crm.

### Filter logic by role

**Column references:**
- `o.seller_agency_member_id` — links an order to the seller (agency member id)
- `o.is_old_customer` — `0` for ts (new customers), `1` for crm (repeat customers)

| Effective Role | seller filter | is_old_customer filter |
|---|---|---|
| `admin` (not impersonating) | none — see all sellers | none — respect frontend `job_position` param OR show all |
| `admin` impersonating ts user 123 | `o.seller_agency_member_id = 123` | `o.is_old_customer = 0` |
| `admin` impersonating crm user 456 | `o.seller_agency_member_id = 456` | `o.is_old_customer = 1` |
| `ts` (real user, id=789) | `o.seller_agency_member_id = 789` | `o.is_old_customer = 0` |
| `crm` (real user, id=321) | `o.seller_agency_member_id = 321` | `o.is_old_customer = 1` |

**Empty result is correct:** if admin impersonates user 123 and user 123 has no orders, the response is an empty orders array. This is intentional — it faithfully represents what user 123 sees.

### commission-plus/sellers filter

When a ts or crm user (real or impersonated) requests the sellers list, they should see only themselves — the dropdown serves as a confirmation display, not a multi-seller picker. Implementation: `WHERE o.seller_agency_member_id = <effectiveUserId>`.

For admin (not impersonating), no filter is applied and all sellers are returned.

### Implementation note

The route currently reads `jobPosition` and `sellerId` from `searchParams`. In Phase 2 the handler should call `getEffectiveRole` and `getEffectiveUserId`, then **ignore** the frontend's `job_position` and `seller_id` params when the effective role is ts or crm (they are overridden by the server-derived values). For admin not impersonating, the frontend params are still respected as they are today.

---

## 8. Frontend Changes

### 8a. `lib/jwt.ts` (backend)

- Extend `JWTPayload` interface to include `user.agency_member` with typed `id`, `job_position`, `roles_slug` fields.
- Add the canonical source-of-truth comment above `agency_member.job_position`.

### 8b. `lib/auth.ts` (backend)

New functions: `getRealRole`, `getEffectiveRole`, `getEffectiveUserId`, `requireRole`. See Section 4 for signatures.

### 8c. `menu-component.js` (frontend)

Three additions:

1. **View-as state management** — `setViewAs(role, userId)` and `clearViewAs()` functions that write/clear `sessionStorage.viewAsRole` and `sessionStorage.viewAsUserId`.
2. **View-as banner** — rendered below the nav when `sessionStorage.viewAsRole` is set. Shows: "Viewing as [role] · User [id] · [Exit button]". Exit button calls `clearViewAs()` and reloads.
3. **Admin-only user picker** — rendered only when `getCurrentUserRole() === 'admin'` AND `agency_member.id === 555`. Fetches `/api/agency-members?roles=ts,crm` to populate a dropdown. On selection, calls `setViewAs()`.
4. `getCurrentUserRole()` currently falls back to `'admin'` for unrecognised values (line 212). This behaviour must be preserved — document it with a comment.

No change to `ROLE_ACCESS` table itself — menu visibility is determined by the **real** role, not the view-as role. Admin always sees the full menu.

### 8d. `token-utils.js` (frontend)

No structural changes required. May add helper methods:
- `getAgencyMemberId()` — reads `payload.user.agency_member.id` from the stored token. Used by `menu-component.js` to gate the user picker to id=555.

### 8e. `shared-http.js` (frontend)

Modify `buildHeaders()`:

```
if sessionStorage.viewAsRole && sessionStorage.viewAsUserId:
    headers['X-View-As-Role']    = sessionStorage.viewAsRole
    headers['X-View-As-User-Id'] = sessionStorage.viewAsUserId
```

This is the single injection point. No per-page changes needed to transmit the headers.

### 8f. Per-page files that call `getCurrentUserRole()`

Audit required. Any page that reads the current role to filter its own data display (e.g. hiding/showing columns, sending `job_position` to the API) must be reviewed:

- `sales-report-by-seller.js` (and its `-api.js`) — sends `job_position` param to `commission-plus`. In Phase 2, server will override this; frontend param becomes advisory.
- Any page that locally decides what data to show based on role must switch to trusting the server response, not the client-side role — otherwise the view-as banner would lie (admin would see filtered server data but admin-scoped UI).

---

## 9. Security Analysis

### Threat 1: Non-admin sends X-View-As-* headers

**Attack:** A ts or crm user adds `X-View-As-Role: admin` to their request, hoping to escalate privilege.

**Defense:** `getEffectiveRole()` checks `getRealRole(payload) === 'admin'` AND `payload.user.agency_member.id === 555` before reading the headers. For any other caller the headers are silently discarded. The effective role returned is always the real role. No escalation is possible.

**Residual risk:** None — the check is on the verified JWT payload, not on any client-supplied value.

### Threat 2: Admin with id != 555 tries view-as

**Attack:** A legitimate admin user (id=999) sends view-as headers.

**Defense:** `getEffectiveRole()` hard-checks `id === 555`. User 999 gets their real admin role. They see all data as admin, not as a narrowed ts/crm user. This is not a privilege escalation — they already have admin access. The net effect is their headers are ignored.

**Residual risk:** None for data confidentiality. If the constraint is ever changed (e.g. a list of admin ids), the check in `getEffectiveRole()` is the single place to update.

### Threat 3: x-api-key is leaked

**Attack:** Someone exfiltrates an API key from Vercel env vars and calls admin-only endpoints.

**Defense:**
- API keys are service-to-service credentials. They must be rotated immediately if leaked (change `API_KEY_PRODUCTION` / `API_KEY_STAGING` in Vercel env and redeploy).
- API key requests bypass role checks by design — they are trusted service accounts. If this risk profile is unacceptable, the `REQUIRE_API_KEY` mechanism can be disabled entirely and all service calls migrated to JWT.
- Rate limiting (100 req/60s per key) limits blast radius for enumeration attacks.

**Residual risk:** Medium if a key leaks. Mitigation: short-lived keys via rotation policy; Vercel env access is limited to project members.

### Threat 4: JWT payload tampering

**Attack:** A user decodes their JWT, modifies `job_position` to `admin`, re-signs with a guessed key.

**Defense:** `verifyJWT()` uses `jwt.verify()` with `algorithms: ['HS256']`. Tampering breaks the signature; verification returns null; the request gets 401. The secret is only in Vercel env vars.

**Residual risk:** Low. Risk scales with secret strength. The current secret is a 44-char base64 string (~264 bits entropy) which is adequate.

### Threat 5: View-as session leaks across browser tabs

**Attack:** Admin starts a view-as session in Tab A. Tab B (same origin) inherits `sessionStorage` — wait, it does not. `sessionStorage` is per-tab.

**Defense:** `sessionStorage` is scoped to the browser tab; it is not shared across tabs. Opening a new tab starts a clean session. The banner will only appear in tabs where the admin explicitly activated view-as.

**Residual risk:** None from cross-tab leakage. The admin must be careful not to leave a view-as tab open where others can use their machine.

### Threat 6: 403 response information leakage

The 403 body includes `required_roles` and `your_role`. This tells an attacker which roles exist and what role they have.

**Assessment:** Acceptable. Role names (`admin`, `ts`, `crm`) are not secret — they are in the frontend JS source. The information helps legitimate users understand why access was denied.

---

## 10. Rollout Plan

### Phase 0 — Preparation (no production impact)

1. Extend `JWTPayload` in `lib/jwt.ts` with `AgencyMember` sub-interface + canonical source comment.
2. Implement `getRealRole`, `getEffectiveRole`, `getEffectiveUserId`, `requireRole` in `lib/auth.ts`.
3. Write unit tests for all four functions covering: admin pass, ts/crm pass, ts on admin-only (fail), impersonation pass, impersonation by non-555 (blocked), invalid X-View-As-Role value.
4. Deploy to staging. No existing endpoint changes yet — new functions are dead code at this point.

**Rollback:** Delete the four new functions. No breakage possible.

### Phase 1 — Lock high-risk endpoints (backend-only)

1. Add `requireRole(['admin'])` to the high-risk group: `database/query`, `database/schema`, `database/tables`, `tables/*`, `users`.
2. Add `requireRole(['admin'])` to all admin-only report endpoints (see Section 6a).
3. Deploy backend to production.

**Frontend impact:** None. Pages that ts/crm users can already access (`/sales-report-by-seller`) hit only `commission-plus` and `commission-plus/sellers` — which are not being locked in this phase. The admin-only pages are already hidden in the menu for ts/crm users.

**Rollback:** Revert the `requireRole()` calls. The four helper functions remain — they are harmless if unused.

### Phase 2 — SQL data filter for commission-plus

1. Modify `commission-plus/route.ts`: call `getEffectiveRole` + `getEffectiveUserId`, override `job_position` and `seller_id` params when effective role is ts or crm.
2. Modify `commission-plus/sellers/route.ts`: same pattern.
3. Deploy backend.

**Frontend impact:** ts/crm users' experience is unchanged — the backend now enforces what the frontend was already sending. The change only matters if a ts/crm user was manually crafting requests with a different `seller_id`. Legitimate frontend traffic is unaffected.

**Rollback:** Revert commission-plus route changes.

### Phase 3 — View-as feature (frontend + backend coordinated)

Deploy order matters here. Backend must be deployed before or simultaneously with frontend.

**Backend changes:**
- `getEffectiveRole` and `getEffectiveUserId` already honour view-as headers (from Phase 0/1 implementation).
- No additional backend changes needed in Phase 3 — the view-as logic is already live but harmless until the frontend sends the headers.

**Frontend changes (deploy as a unit):**
1. `shared-http.js`: inject `X-View-As-*` headers from `sessionStorage`.
2. `menu-component.js`: add view-as banner, user picker (admin id=555 only), `setViewAs()`/`clearViewAs()`.
3. `token-utils.js`: add `getAgencyMemberId()` helper.

**Deploy sequence:**
1. Deploy backend (already done in Phase 1/2; no new backend code for Phase 3).
2. Deploy frontend.
3. Smoke test: login as admin id=555, select a ts user from picker, verify banner appears, verify commission-plus returns that user's orders, verify admin-only menu items remain visible.

**Rollback:** Revert frontend changes. Removing the `X-View-As-*` headers from `shared-http.js` disables the feature entirely. Backend continues to work normally.

---

## 11. Open Questions and Risks

### OQ-1: Real agency_member.id for admin

The view-as gate is hard-coded to `agency_member.id === 555`. This must be verified against the live JWT payload for the designated admin user before coding starts. If the id is different, or if multiple admins need the capability, the constant needs adjustment. Recommended: add a `VIEW_AS_ADMIN_ID` environment variable rather than hard-coding, so it can be changed without a code deploy.

### OQ-2: commission-plus/sellers scope for ts/crm

Currently the sellers endpoint returns all sellers from `v_Xqc7k7_orders`. If a ts user should only see themselves in the dropdown (not other ts users), the filter must be applied. The spec says "filter to own id" — but this means the dropdown has exactly one entry, which makes it a display widget, not a real picker. Confirm with the product owner whether ts/crm users need a dropdown at all on the commission-plus page, or whether the seller filter should just be hidden and the data auto-scoped.

### OQ-3: JWTPayload field names vs. actual token

`lib/jwt.ts` currently uses `[key: string]: unknown` for the `user.agency_member` subtree. The exact field name for the member id in the live token must be confirmed by inspecting a real token from the Finance Backoffice system. The architecture assumes `payload.user.agency_member.id` — if the real token uses a different key (e.g. `ID` or `member_id`), the `AgencyMember` interface and all three helper functions need to reflect that. **This must be confirmed before Phase 0 is complete.**

### OQ-4: chat-history and docs/tables endpoints

These endpoints are listed as "investigate" in the classification. If either is reachable without admin role and exposes sensitive data, it is a live vulnerability today. A code search for calls to these endpoints from the frontend should be done before Phase 1 ships. If no legitimate frontend use is found, add `requireRole(['admin'])` in Phase 1 alongside the other high-risk endpoints.

### OQ-5: withApiGuard does not expose payload to handler

`withApiGuard` calls `authenticate()` internally and discards the result except for the boolean. Route handlers that need the payload currently re-call `verifyJWT()`. This is safe (cheap, idempotent) but slightly redundant. If the auth call pattern becomes a maintenance concern, `withApiGuard` can be updated in a future phase to pass `AuthResult` to the handler. Out of scope for this RBAC rollout.

### OQ-6: Frontend role guard vs. backend role check divergence

`menu-component.js` uses `getCurrentUserRole()` which reads the **real** JWT role (not the view-as role) for menu visibility. This is correct — admins always see the full menu. However, pages that use `getCurrentUserRole()` to decide what UI to render (columns to show, filters to expose) may behave inconsistently during a view-as session: the admin sees admin-scoped UI but ts-scoped server data. A full audit of `getCurrentUserRole()` call sites across all page JS files is needed before Phase 3 to decide which UI elements should respect view-as role vs. always use real role.

### Risk: Vercel deployment coordination

The project memory notes that Vercel auto-deploys are unreliable. Phase 3 requires a coordinated frontend + backend deploy. Use `npx vercel --prod --yes` explicitly in both repos in sequence. Do not rely on git-push triggers for coordinated changes.

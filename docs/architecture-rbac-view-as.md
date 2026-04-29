# Architecture: RBAC + View-As Impersonation

**Status:** SHIPPED — reflects production reality as of FE v1.1.0 / API v1.2.0
**Pre-feature snapshots:** FE v1.0.18 / API v1.1.3
**Author:** Winston (architect)
**Date:** 2026-04-29 (updated 2026-04-29 post-ship)
**Parity SOP:** `docs/view-as-parity-sop.md` — required reading before any page change
**Repos in scope:**
- Frontend: `finance-backoffice-report` (vanilla JS, Vercel)
- Backend: `finance-backoffice-report-api` (Next.js App Router, TypeScript, MySQL, Vercel)

---

## 1. Overview

### Shipped State (production)

- `lib/jwt.ts` verifies HS256 signatures and decodes tokens. It **fails fast at boot** if `JWT_SECRET` is missing — the file throws at module-load time if the env var is absent (Story 001).
- `lib/api-guard.ts` wraps every report route with rate-limiting + `authenticate()`. `withApiGuard` now also calls `requireRole` via the `roles` option and **auto-sets `X-Effective-Role`** on every 200 response so the frontend banner reflects the server's actual decision.
- Every API endpoint is classified by role tier. `requireRole()` short-circuits with 403 before any DB query runs.
- Role is derived from `payload.user.agency_member.job_position`. **Never use `roles_slug`** — the two fields can disagree (see `lib/jwt.ts` for the canonical comment).
- A single designated admin (`agency_member.id === 555`, env-overridable via `VIEW_AS_ADMIN_ID`) can impersonate any ts or crm user by sending `X-View-As-Role` and `X-View-As-User-Id` request headers.
- The commission-plus SQL filter applies the `is_old_customer` role gate **but returns role-wide rows** — not just the impersonated user's own rows. The frontend masks peer names client-side. See Section 7 for the full rationale.
- The frontend (`menu-component.js`) patches `TokenUtils.decodeToken` and `window.fetch` at script-body time (before any page script runs) so every page-level role decision sees the impersonated identity without needing per-page changes.

### What Did Not Change

- Token issuance and signing remain in the upstream Finance Backoffice system.
- The `x-api-key` service-to-service bypass stays. Role checks are skipped for API key callers (treated as admin equivalent).
- `withApiGuard` wrapper stays. `requireRole` is called inside the wrapper via the `roles` option, not as a second outer wrapper.

---

## 1a. Deployed Versions

| Component | Version | Tag / notes |
|-----------|---------|-------------|
| Frontend (`finance-backoffice-report`) | **v1.1.0** | RBAC + view-as complete |
| Backend API (`finance-backoffice-report-api`) | **v1.2.0** | RBAC + view-as complete |
| Frontend pre-feature snapshot | v1.0.18 | git tag `v1.0.18` |
| Backend pre-feature snapshot | v1.1.3 | git tag `v1.1.3` |

---

## 2. Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND  finance-backoffice-report (Vercel)                │
│                                                              │
│  token-utils.js         — decode/validate JWT in browser    │
│  menu-component.js      — ROLE_ACCESS table, route guard,   │
│                           view-as banner, user picker,       │
│                           patchTokenUtilsForViewAs(),        │
│                           patchFetchForViewAs()              │
│  shared-http.js         — injects Authorization header +    │
│                           X-View-As-Role / X-View-As-User-Id │
│                           + handleForbidden(403) redirect    │
│                           + X-Effective-Role mismatch warn   │
│  per-page *-api.js      — call SharedHttp.get/post          │
│  sales-report-by-seller.js — getEffectiveRole/UserId/Nick   │
│                              mid-page helpers (sessionStorage │
│                              authoritative; token-patch is   │
│                              a fallback)                     │
└──────────────────────┬───────────────────────────────────────┘
                       │  HTTPS  (Authorization: Bearer <jwt>)
                       │         (X-View-As-Role: ts)
                       │         (X-View-As-User-Id: 123)
                       │  ← response carries X-Effective-Role →
┌──────────────────────▼───────────────────────────────────────┐
│  BACKEND  finance-backoffice-report-api (Vercel / Next.js)   │
│                                                              │
│  middleware.js          — CORS: allow X-View-As-*, expose    │
│                           X-Effective-Role                   │
│  app/api/**             — route handlers                     │
│    └─ withApiGuard(routeName, handler, { roles: [...] })     │
│         ├─ rate-limit                                        │
│         ├─ authenticate()  (JWT or x-api-key)                │
│         ├─ requireRole(roles, request, payload)              │
│         │    ├─ getRealRole(payload)                         │
│         │    ├─ getEffectiveRole(request, payload)           │
│         │    └─ getEffectiveUserId(request, payload)         │
│         └─ auto-sets X-Effective-Role on response            │
│                                                              │
│  lib/auth.ts            — requireRole, getEffective*,        │
│                           AuthContext, VIEW_AS_ADMIN_ID      │
│  lib/jwt.ts             — typed JWTPayload + AgencyMember;   │
│                           fail-fast on JWT_SECRET            │
│  lib/api-guard.ts       — withApiGuard + roles option        │
│  lib/db.ts              — MySQL pool (unchanged)             │
└──────────────────────────────────────────────────────────────┘
```

**Auth flow per request (production):**

1. `middleware.js` handles CORS preflight; attaches `Access-Control-Expose-Headers: X-Effective-Role`.
2. `withApiGuard` calls `authenticate(request)` → `AuthResult` (method: jwt | api_key | none).
3. If `method === 'api_key'`: role check uses `roles` option but payload is null → `requireRole` returns `ok:true` with synthetic admin `AuthContext`.
4. If `method === 'jwt'`: `requireRole(roles, request, payload)` is called.
5. `getEffectiveRole(request, payload)` — if real role is admin AND real id === `VIEW_AS_ADMIN_ID` (default 555, env-overridable), it reads `X-View-As-Role`; otherwise returns real role.
6. If effective role is in the `roles` list → `{ok: true, auth: AuthContext}`.
7. If not → `{ok: false, response: 403 JSON}` with `X-Effective-Role` header.
8. `withApiGuard` auto-sets `X-Effective-Role` on every successful response (unless handler already set it).

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

route handler (commission-plus — roles: ['admin','ts','crm']):
  getRealRole(payload) → 'admin'
  getEffectiveRole(request, payload):
    realRole = 'admin', realId = 555
    realId === VIEW_AS_ADMIN_ID (555) → read X-View-As-Role header → 'ts'
    'ts' is valid and not 'admin' → ok
    → returns 'ts'
  guard.ok = true
  guard.auth.effectiveRole = 'ts'
  guard.auth.effectiveUserId = 123   // from X-View-As-User-Id

  // SQL: conditions.push(`o.is_old_customer = 0`)   ← ts role gate (APPLIED)
  //      seller_agency_member_id filter: NOT applied ← ROLE-WIDE ROWS returned
  //      (frontend masks peer names client-side with '******')
  query MySQL → ALL ts-role rows (is_old_customer=0)
  return 200 JSON  { headers: { 'Cache-Control': 'private, no-store',
                                'X-Effective-Role': 'ts' } }
```

**Why role-wide rows?** The page-level ranking summary needs all peers in the role to compute relative rankings. The frontend filters `ownOrders = orders.filter(o => String(o.seller_agency_member_id) === myId)` for KPI cards and the main data table, while the ranking section shows all rows but masks peer seller names as `'******'`. This design was finalized during implementation; the original spec described per-user SQL scoping which was revised. See Section 7 for details.

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

## 3e. Defense in Depth — 3 Sources of Truth

The view-as feature is intentionally redundant. Three independent layers must all agree that impersonation is active before any role-sensitive decision is made. If any layer disagrees, the safer outcome (deny impersonation, fall back to real role) wins.

| Layer | Source | Authority | When it wins |
|-------|--------|-----------|--------------|
| **Layer 1 — sessionStorage** | `sessionStorage.viewAsRole` + `viewAsUserId` read via `MenuComponent.isImpersonating()` | Most reliable for UI decisions | Always checked first in `getEffectiveRole()` / `getEffectiveUserId()` / `getEffectiveNickName()` in page scripts |
| **Layer 2 — patched TokenUtils** | `TokenUtils.decodeToken(token)` — overridden by `patchTokenUtilsForViewAs()` to return impersonated identity | UI fallback for any page code that reads JWT directly | Fires when Layer 1 returns a value but a code path calls `TokenUtils.decodeToken` instead of the helpers |
| **Layer 3 — backend JWT** | `requireRole()` reading `X-View-As-*` headers against the real JWT | Canonical for data access | Every API response; fronts all SQL data |

### The Patch Chain

`menu-component.js` installs two global patches **synchronously at script-body evaluation time** (before `DOMContentLoaded`), so they are in place before any page-level script runs:

```
1. patchTokenUtilsForViewAs()   ← called at IIFE body level (menu-component.js line 1071)
   → wraps window.TokenUtils.decodeToken
   → reads sessionStorage.viewAsRole / viewAsUserId / viewAsUserNick / viewAsUserTeam
   → returns a synthetic agency_member object with impersonated id + job_position
   → idempotent: guarded by window.__viewAsTokenPatched flag

2. patchFetchForViewAs()        ← called from initMenuComponent() on DOMContentLoaded
   → wraps window.fetch
   → injects X-View-As-Role / X-View-As-User-Id headers on any /api/ call
   → idempotent: guarded by window.__viewAsFetchPatched flag
```

**Why the early synchronous patch (line 1071)?** `sales-report-by-seller.js` calls `getUserFromToken()` → `TokenUtils.decodeToken()` during its own `DOMContentLoaded` handler. If `menu-component.js` only patched in its own `DOMContentLoaded` handler, the order of listener registration would determine which fires first — a race condition. The early body-level patch eliminates the race: the patch is installed the moment `menu-component.js` is parsed, which happens before any page script's `DOMContentLoaded` listener.

**Guard flag:** `window.__viewAsLogged` prevents the `[ViewAs] God-mode active` console line from printing on every `decodeToken()` call. `window.__viewAsTokenPatched` prevents double-patching if `patchTokenUtilsForViewAs()` is called twice.

### Why Layer 1 (sessionStorage) Is Authoritative for UI

`MenuComponent.isImpersonating()` reads the raw JWT directly from storage — bypassing the patched `TokenUtils.decodeToken` — to confirm the real user is admin id=`VIEW_AS_ADMIN_ID`. It then checks `sessionStorage.viewAsRole` and `viewAsUserId`. This means even if the token patch failed (e.g. `TokenUtils` was not yet loaded at patch time), page-level helpers like `getEffectiveRole()` still return the correct impersonated role because Layer 1 does not depend on the patch.

---

## 3f. Frontend Patches Detail

### `patchTokenUtilsForViewAs()`

**File:** `menu-component.js`
**When it runs:** Synchronously at IIFE body evaluation (script parse time). Also called again inside `initMenuComponent()` for safety.
**What it does:**

```js
window.TokenUtils.decodeToken = function(token) {
  var payload = originalDecode(token);        // real JWT payload
  if (!impersonationActive()) return payload; // not impersonating → no-op
  // Validate: real user must be admin id=VIEW_AS_ADMIN_ID
  // Synthesize: replace agency_member.{id, job_position, nick_name, team}
  //             with values from sessionStorage
  return patchedPayload;
};
window.__viewAsTokenPatched = true;
```

Pages that call `TokenUtils.decodeToken()` to populate a `currentUser` object will see the impersonated identity as if they had logged in as that user.

### `patchFetchForViewAs()`

**File:** `menu-component.js`
**When it runs:** Inside `initMenuComponent()` on `DOMContentLoaded`.
**What it does:**

```js
window.fetch = function(input, init) {
  if (isApiCall(url) && sessionStorage.viewAsRole && sessionStorage.viewAsUserId) {
    headers.set('X-View-As-Role',    sessionStorage.viewAsRole);
    headers.set('X-View-As-User-Id', sessionStorage.viewAsUserId);
  }
  return originalFetch(input, init);
};
window.__viewAsFetchPatched = true;
```

Matching URLs: `/api/` path prefix, `finance-backoffice-report-api.vercel.app`, `financebackoffice.tourwow.com`. Third-party requests are untouched.

This is a safety net for pages that call `fetch()` directly instead of going through `SharedHttp`. `SharedHttp.buildHeaders()` already injects the headers natively; the fetch patch covers the remaining cases.

### Page-Level Helpers (`sales-report-by-seller.js`)

These three functions are the primary entry points for all role-sensitive UI decisions on the page. They are not exported globally — they live inside the page IIFE.

```js
function getEffectiveRole() {
  // Priority 1: sessionStorage via MenuComponent.isImpersonating() (Layer 1)
  // Priority 2: currentUser.job_position from patched TokenUtils (Layer 2)
  // Priority 3: 'admin' default
}

function getEffectiveUserId() {
  // Priority 1: sessionStorage.viewAsUserId when isImpersonating()
  // Priority 2: currentUser.id from patched TokenUtils
}

function getEffectiveNickName() {
  // Priority 1: sessionStorage.viewAsUserNick when isImpersonating()
  // Priority 2: currentUser.nick_name from patched TokenUtils
}
```

**All callers** in `sales-report-by-seller.js` that previously read `currentUser.job_position` / `currentUser.id` / `currentUser.nick_name` directly have been migrated to these helpers. Any new code on this page **must** use these helpers — reading `currentUser.*` directly is a parity bug.

---

## 3g. View-As Eligibility Chain

Eligibility is checked independently in frontend and backend. Both must agree.

### Frontend (`menu-component.js`)

```js
function isViewAsEligible() {
  return getRealUserRole() === 'admin'      // raw JWT, not patched
      && getRealUserId() === VIEW_AS_ADMIN_ID;  // default 555
}

function isImpersonating() {
  if (!isViewAsEligible()) return false;
  var role = sessionStorage.getItem('viewAsRole');
  var uid  = sessionStorage.getItem('viewAsUserId');
  return !!(role && uid && VIEW_AS_ROLES.indexOf(role) !== -1);
}
```

`getRealUserMember()` inside these functions reads the raw JWT (`atob(token.split('.')[1])`) — it explicitly bypasses the patched `TokenUtils.decodeToken` so the eligibility check is always based on the real identity.

### Backend (`lib/auth.ts`)

```typescript
// VIEW_AS_ADMIN_ID reads process.env.VIEW_AS_ADMIN_ID; defaults to 555
export function getEffectiveRole(request, payload): Role {
  const realRole = getRealRole(payload);     // from agency_member.job_position
  const realId   = getRealUserId(payload);   // from agency_member.id
  if (realRole !== 'admin' || realId !== VIEW_AS_ADMIN_ID) return realRole;
  // Only here: read X-View-As-Role + X-View-As-User-Id
  // Both headers must be present; 'admin' value is rejected; invalid id is rejected
}
```

**Key invariant:** `VIEW_AS_ADMIN_ID` is resolved once at module load from `process.env.VIEW_AS_ADMIN_ID`. Changing the env var requires a redeploy. The frontend `VIEW_AS_ADMIN_ID` constant is hardcoded to `555` in `menu-component.js` — if the env var is changed on the API side, the frontend constant must also be updated and redeployed.

---

## 3h. CORS Contract

**File:** `middleware.js`

| CORS dimension | Value |
|----------------|-------|
| Allowed origins | `http://localhost:3000`, `http://localhost:3001`, `https://staging-finance-backoffice-report.vercel.app`, `https://finance-backoffice-report.vercel.app`, `https://financebackoffice.tourwow.com`, `https://financebackoffice-staging2.tourwow.com` |
| `Access-Control-Allow-Headers` | `authorization, x-api-key, Content-Type, Accept, X-Requested-With, X-View-As-Role, X-View-As-User-Id` |
| `Access-Control-Expose-Headers` | `X-Effective-Role` |
| `Access-Control-Allow-Credentials` | `true` |
| Preflight max-age | `86400` (24h) |

`X-View-As-Role` and `X-View-As-User-Id` must appear in `Allow-Headers` or the browser will strip them from CORS preflight and the backend will never receive them. `X-Effective-Role` must appear in `Expose-Headers` or JS cannot read it from `response.headers.get('X-Effective-Role')`.

`SharedHttp` reads `X-Effective-Role` from every response and emits a console warning if it disagrees with `sessionStorage.viewAsRole` — this is the R-06 mitigation (frontend not sending headers → admin sees admin data but thinks they see ts data).

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

## 7. SQL Filter Spec — commission-plus Family (PRODUCTION)

### Actual shipped behavior

The original spec described per-user SQL scoping (`seller_agency_member_id = effectiveUserId`) for ts/crm. **This was revised during implementation.** The final production behavior is:

- The `is_old_customer` role gate IS applied (ts→0, crm→1).
- The `seller_agency_member_id = effectiveUserId` clause is **NOT applied** for ts/crm effective roles.
- The backend returns **all rows** for the effective role group.
- The frontend applies own-row filtering client-side for KPI cards and the main data table.
- Peer seller names are masked client-side (`'******'`); peer numeric values (orders, sales, commission) remain visible for ranking.

### Why role-wide rows?

The ranking summary section must show a seller's position relative to all peers in their role group. If the API scoped to own rows only, the ranking would show a single row (rank 1 of 1), which is meaningless. Returning role-wide rows gives the frontend enough data to compute rankings while the frontend enforces data isolation for non-ranking elements.

**Security note:** `seller_nick_name` for peer rows is masked by the frontend, not the backend. The raw API response contains peer names. This is acceptable because: (a) the API endpoint is authenticated and role-gated; (b) peers within the same role group (all ts, or all crm) have no confidentiality expectation toward each other within the company context; (c) the masking is a UX courtesy, not a security boundary.

### Column references

- `o.seller_agency_member_id` — links an order to its seller
- `o.is_old_customer` — `0` for ts (new customers), `1` for crm (repeat customers)
- `ci.ordinal = 1` + `LOWER(ci.status) = 'paid'` — installment gate (first installment, paid status, case-insensitive)

### Filter logic by effective role

| Effective Role | `seller_agency_member_id` filter | `is_old_customer` filter | Returns |
|---|---|---|---|
| `admin` (not impersonating) | none, OR `= sellerId` if frontend sends it | none, OR respects frontend `job_position` param | all sellers, or scoped by params |
| `admin` impersonating ts/N | **NOT applied** | `= 0` | all ts-role rows |
| `admin` impersonating crm/N | **NOT applied** | `= 1` | all crm-role rows |
| `ts` (real user) | **NOT applied** | `= 0` | all ts-role rows |
| `crm` (real user) | **NOT applied** | `= 1` | all crm-role rows |

### Frontend client-side filtering

After receiving role-wide rows, `sales-report-by-seller.js` applies:

```js
const myId = getEffectiveUserId();  // sessionStorage.viewAsUserId or currentUser.id
const ownOrders = isAdmin()
  ? orders
  : orders.filter(o => String(o.seller_agency_member_id || '') === myId);
```

`ownOrders` feeds: KPI cards, main data table, search, row count, PDF export, Excel export.

The full `orders` array feeds: ranking summary builder (`buildSellerAggregate`), which masks peer names but shows peer numbers.

### Cache-Control

Every commission-plus response carries `Cache-Control: private, no-store`. This prevents Vercel edge cache or browser back/forward cache from serving one user's role-scoped response to another user.

### commission-plus/sellers filter (unchanged from spec)

For ts/crm effective roles: `WHERE o.seller_agency_member_id = <effectiveUserId>`. Returns only the user's own seller record. The dropdown is a display widget confirming identity, not a picker.

For admin (not impersonating): no filter — all sellers returned.

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

## 11. Resolved Questions and Standing Risks

The original open questions (OQ-1 through OQ-6) were resolved during implementation. The decisions are captured here for reference.

| OQ | Resolution |
|----|-----------|
| OQ-1 (id=555 verification) | Confirmed against live JWT. `VIEW_AS_ADMIN_ID` is env-overridable (`process.env.VIEW_AS_ADMIN_ID`). Default 555. |
| OQ-2 (sellers scope) | ts/crm users see only themselves in the dropdown (`seller_agency_member_id = effectiveUserId` on the sellers endpoint). Dropdown is a display widget. Confirmed with user. |
| OQ-3 (JWTPayload field names) | Confirmed `payload.user.agency_member.id` (lowercase `id`). `lib/jwt.ts` now has the typed `AgencyMember` interface. |
| OQ-4 (chat-history, docs/tables) | Both locked to admin via `requireRole(['admin'])`. No ts/crm pages call them. |
| OQ-5 (withApiGuard payload) | Resolved: `withApiGuard` now accepts `roles` option and passes `AuthContext` to the handler. Route handlers no longer need to re-call `requireRole` manually. |
| OQ-6 (role guard divergence) | Resolved: `menu-component.js` `getCurrentUserRole()` returns the **effective** role (view-as role when impersonating) for menu visibility. `ROLE_ACCESS` table for ts/crm is used. Per-page helpers (`getEffectiveRole()`, `isAdmin()`) use the three-layer chain (see Section 3e). |

### Standing Risks (post-ship)

| Risk | Status | Mitigation |
|------|--------|------------|
| Token-patch race (TokenUtils not loaded at patch time) | Low — `menu-component.js` body-level patch fires at parse time, before `DOMContentLoaded`; page scripts use `getEffectiveRole()` Layer 1 as primary | Layer 1 (sessionStorage) does not depend on the patch; race only affects Layer 2 fallback |
| `VIEW_AS_ADMIN_ID` frontend/backend drift | Low | If env var changes, both FE constant and API env var must be updated in tandem and both repos redeployed |
| Peer name exposure in raw API response | Accepted | Within-role peers have no confidentiality expectation in this context; masking is UX, not security |
| New page added for ts/crm without parity audit | **ACTIVE** | See `docs/view-as-parity-sop.md` — mandatory SOP for all future page changes |
| Vercel auto-deploy unreliable | Known | Use `npx vercel --prod --yes` explicitly; never rely on git-push auto-deploy for coordinated FE+API changes |

---

## 12. Parity Discipline as an Architectural Concern

### 12.1 Why parity is structural

The architecture supports view-as via a *defense-in-depth chain* (see
Section 3e). Each layer adds a fallback for when the layer above fails
silently, but the chain only works if every page-level consumer uses
the helpers we provide rather than reading state directly. A single
direct read of `currentUser.id` or `payload.user.agency_member.job_position`
breaks the parity guarantee for that surface, even if every other
layer is correctly wired.

This is therefore not just a code-style preference — it is an
architectural invariant. The system as designed delivers parity only
when consumer code adheres to the contract.

### 12.2 The contract for code that reads identity/role

Every line of frontend code that reads identity or role must use the
appropriate helper. Direct reads from `currentUser` or from the JWT
are forbidden in any role-aware UI path:

| Need to read… | Use this helper | Defined in |
|---------------|-----------------|------------|
| Effective role (view-as aware) | `getEffectiveRole()` | `sales-report-by-seller.js`; pattern duplicates in any future role-aware page |
| Effective user id | `getEffectiveUserId()` | `sales-report-by-seller.js`; pattern duplicates likewise |
| Effective nick name | `getEffectiveNickName()` | `sales-report-by-seller.js`; pattern duplicates likewise |
| Whether impersonating | `MenuComponent.isImpersonating()` | `menu-component.js` (window-exposed) |
| isAdmin (effective) | `isAdmin()` derived from `getEffectiveRole()` | `sales-report-by-seller.js`; pattern duplicates likewise |
| Real (non-impersonated) role/id — only for the eligibility check | `MenuComponent.getRealUserRole()`, `MenuComponent.getRealUserId()` | `menu-component.js` (bypasses all patches) |

### 12.3 The contract for code that issues API calls

Every line of frontend code that issues an HTTP request to `/api/*`
must ensure `X-View-As-Role` and `X-View-As-User-Id` are sent when
impersonation is active. Three correct paths:

1. Use `SharedHttp.get` / `SharedHttp.post` — `buildHeaders` injects
   the headers automatically.
2. Use the page's API service (e.g. `CommissionReportPlusAPI`) which
   has a native `buildHeaders` helper that reads sessionStorage.
3. Call `window.fetch` directly — the global `patchFetchForViewAs`
   wrapper injects view-as headers for `/api/*` URLs. (Slightly less
   reliable than 1 or 2 because it depends on the patch being applied
   before the call; prefer 1 or 2 for new code.)

Any new API service that builds its own headers must mirror the
`buildHeaders` pattern. Code review must reject services that hand-roll
`Authorization` without view-as injection.

### 12.4 The contract for backend route handlers

Every route handler reachable by ts/crm must derive identity and role
from `auth: AuthContext` (passed as the second argument by
`withApiGuard`) — never from query params or request body fields. The
SQL filter pattern is documented in Section 7.

Routes that bypass `withApiGuard` (e.g. `agency-members` which uses
`authenticate()` + manual `requireRole()`) must include `Cache-Control:
private, no-store` on user-scoped responses to prevent edge cache
contamination.

### 12.5 How parity is enforced

Code-level discipline alone is not sufficient — humans miss things.
The PR review process is the second line of defense:

- **Pre-merge checklist**: every PR that touches the surfaces listed
  in PRD §11.3 must include the field-by-field parity checklist from
  `docs/view-as-parity-sop.md` Section 6, completed and attached.
- **Reviewer responsibility**: refuse approval without the checklist;
  spot-check one row by independent verification.
- **Product owner sign-off**: required for any intentional parity
  divergence (✗ rows that author and reviewer agree are by design).

This three-tier enforcement (architecture → code review → product
sign-off) is the standing answer to the question "how do we keep this
feature working as the codebase evolves?"

### 12.6 Anti-patterns to flag in code review

The seven recurring patterns that have broken parity during initial
development, all documented in `docs/view-as-parity-sop.md` Section 5
with code examples:

1. Reading `currentUser.id` / `currentUser.nick_name` /
   `currentUser.job_position` directly instead of via helpers.
2. Page-level scripts that decode the JWT bypassing
   `TokenUtils.decodeToken` (e.g. `JSON.parse(atob(token.split('.')[1]))`).
3. API services that hand-roll `Authorization` headers without
   reading `viewAsRole` / `viewAsUserId` from sessionStorage.
4. Hardcoded UI elements (e.g. an unconditional "Export Excel" button)
   instead of `${isAdmin() ? render() : ''}` guards.
5. PDF/Excel generators that include admin-only content
   unconditionally (e.g. ranking pages, peer breakdown sheets).
6. Cache-Control absent on user-scoped API responses — leads to one
   user's data being served to another via Vercel edge cache.
7. New role-aware string literal comparisons (`role === 'admin'`)
   that don't go through the effective-role helper.

When any of these appear in a PR, the reviewer should require the
author to use the helper, then re-run the parity check.

### 12.7 Documentation cross-references

The parity discipline is documented in multiple places, each from a
different angle:

| Doc | Angle |
|-----|-------|
| `docs/prd-rbac-view-as.md` §11 | Product policy + sign-off criteria + roles |
| `docs/architecture-rbac-view-as.md` §12 (this section) | Architectural rationale + code contracts |
| `docs/view-as-parity-sop.md` | Operational procedure + checklist + anti-patterns |
| `docs/test-strategy-rbac-view-as.md` §10 | Test layer that catches parity drift |
| `test/qa/view-as-field-parity-audit.md` | Concrete reference audit (the original parity comparison) |
| `test/qa/view-as-fidelity-audit.md` | First-pass audit that uncovered the dominant bug class |
| `README.md` | Quick reference link from project root |

If a future maintainer adds a new doc that touches parity, it must
appear in this cross-reference table and link back to the SOP.

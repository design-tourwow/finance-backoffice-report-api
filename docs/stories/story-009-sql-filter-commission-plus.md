# Story 009 — SQL Filter on commission-plus Endpoints (Phase 2)

**Phase:** 2 (SQL Data Filter)
**Type:** Backend
**Complexity:** M

---

## User Story

As a ts or crm user,
When I call the commission-plus endpoints,
The API returns only rows belonging to my own seller id regardless of what query parameters I send,
So that I cannot view another seller's data by crafting a different request.

---

## Background

`commission-plus/route.ts` currently reads `job_position` and `seller_id` from query params passed by the frontend. A ts/crm user can pass `seller_id=<someone_else>` and receive that person's orders. Phase 2 closes this by making the backend derive identity from the JWT (and view-as headers for admin id=555), then overriding any frontend-supplied params when the effective role is ts or crm.

Architecture doc Section 7 fully specifies the SQL filter logic. Story 005 already added the role gate; this story adds the data scoping.

---

## Acceptance Criteria

1. For `ts` effective role: adds `WHERE o.seller_agency_member_id = <effectiveUserId>` AND `o.is_old_customer = 0`. The frontend's `seller_id` param is silently ignored.
2. For `crm` effective role: adds `WHERE o.seller_agency_member_id = <effectiveUserId>` AND `o.is_old_customer = 1`. The frontend's `seller_id` param is silently ignored.
3. For `admin` (not impersonating): no seller filter applied; `job_position` and `seller_id` query params are respected as before. No regression.
4. For `admin id=555` impersonating `ts` user id=123: same filter as ts with `effectiveUserId = 123`.
5. For `admin id=555` impersonating `crm` user id=456: same filter as crm with `effectiveUserId = 456`.
6. `commission-plus/sellers` endpoint: for ts/crm effective role, returns only the row matching `seller_agency_member_id = effectiveUserId`. For admin (not impersonating), returns all sellers as before.
7. A ts user with no orders receives `{ data: { orders: [], summary: { total_orders: 0 } } }` — empty result is correct, not a 403 or 500.
8. The response for a ts user matches byte-for-byte (after sorting) what an admin sees when impersonating that same ts user (TC-12).
9. Frontend `job_position` and `seller_id` params continue to be sent by the frontend; the backend now ignores them for ts/crm but this does not break the frontend (it reads the response, not its own params).

**Gherkin:**

```
Scenario: ts user cannot receive another seller's data
  Given ts user id=100 has 5 orders
  And ts user id=101 has 3 orders
  When ts id=100 calls GET /api/reports/commission-plus?seller_id=101
  Then all returned orders have seller_agency_member_id=100
  And no orders with seller_agency_member_id=101 are returned

Scenario: admin sees all sellers
  Given multiple sellers have orders
  When admin calls GET /api/reports/commission-plus
  Then returned orders span at least 2 distinct seller_agency_member_ids

Scenario: admin impersonating ts/100 matches ts/100's own view
  Given admin id=555 sends X-View-As-Role: ts, X-View-As-User-Id: 100
  When admin calls GET /api/reports/commission-plus
  Then the result is identical to ts user id=100's own call (TC-12)
```

---

## Implementation Notes

**Files to change:**
- `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/route.ts`
- `/Users/gap/finance-backoffice-report-api/app/api/reports/commission-plus/sellers/route.ts`

**commission-plus/route.ts changes:**

After the `requireRole` guard (added in Story 005), extract effective identity:

```typescript
const { auth } = guard
const effectiveRole = auth.effectiveRole
const effectiveUserId = auth.effectiveUserId
```

Then replace the existing `job_position` / `seller_id` conditional block:

```typescript
// Before (reads from query params, trusts frontend)
if (jobPosition === 'ts') { conditions.push(`o.is_old_customer = 0`) }
else if (jobPosition === 'crm') { conditions.push(`o.is_old_customer = 1`) }
if (sellerId) { conditions.push(`o.seller_agency_member_id = ?`); params.push(parseInt(sellerId, 10)) }

// After (derived from JWT / view-as headers — overrides frontend params for ts/crm)
if (effectiveRole === 'ts') {
  conditions.push(`o.is_old_customer = 0`)
  conditions.push(`o.seller_agency_member_id = ?`)
  params.push(effectiveUserId)
} else if (effectiveRole === 'crm') {
  conditions.push(`o.is_old_customer = 1`)
  conditions.push(`o.seller_agency_member_id = ?`)
  params.push(effectiveUserId)
} else {
  // admin (not impersonating) — respect frontend params as before
  if (jobPosition === 'ts') { conditions.push(`o.is_old_customer = 0`) }
  else if (jobPosition === 'crm') { conditions.push(`o.is_old_customer = 1`) }
  if (sellerId) {
    conditions.push(`o.seller_agency_member_id = ?`)
    params.push(parseInt(sellerId, 10))
  }
}
```

**commission-plus/sellers/route.ts changes:**

Add the same guard and effective identity extraction, then:

```typescript
// For ts/crm: filter sellers list to own id only
if (effectiveRole === 'ts' || effectiveRole === 'crm') {
  query = `... WHERE o.seller_agency_member_id = ? AND o.seller_agency_member_id IS NOT NULL`
  // bind effectiveUserId as the parameter
}
// For admin: existing query unchanged (returns all sellers)
```

**Security note (R-11 / TC-18):** `effectiveUserId` is derived from `getEffectiveUserId()` which already validates it is a positive integer (Story 003). The value reaching the SQL layer is a typed `number`, not a raw string — parameterized queries prevent injection. Do not parse the header value again in this file.

**Cache-Control header:** Add `Cache-Control: private, no-store` to the response from both endpoints to prevent Vercel edge caching from returning one user's data to another user (R-14).

---

## Test Cases

- **TC-10**: admin JWT, commission-plus → 200, rows span ≥2 distinct seller_ids.
- **TC-11**: ts JWT (user_id=100) → 200, all rows `seller_id=100`.
- **TC-12**: admin id=555 view-as ts/100 → response equals TC-11 result (byte-for-byte after sort).
- **TC-15**: ts JWT (user_id=200, no orders) → 200, empty orders array.
- **TC-16**: crm JWT (user_id=300) → 200, all rows `seller_id=300`.
- **TC-18**: SQL injection via `X-View-As-User-Id` → 400 or safely parsed; DB unchanged.
- **N-03**: SQL injection via query params → sanitized or 400.

**Must pass before merge:** TC-10, TC-11, TC-12, TC-15, TC-16 must all pass. TC-18 must not cause 500 or DB mutation.

---

## Dependencies

- Story 003 (auth helpers — provides `getEffectiveRole`, `getEffectiveUserId`)
- Story 005 (role gate on commission-plus endpoints — the `guard` object must already exist)

---

## Definition of Done

- [ ] SQL filter applied for ts and crm effective roles on both commission-plus endpoints
- [ ] Admin receives unfiltered data (no regression)
- [ ] `Cache-Control: private, no-store` header present on both responses
- [ ] TC-10, TC-11, TC-12, TC-15, TC-16 pass against seeded test DB
- [ ] TC-18 injection test passes (no 500, no DB mutation)
- [ ] Code merged to main
- [ ] Deployed to staging; ts/crm test accounts verified to see only own data

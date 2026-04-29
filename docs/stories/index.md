# Stories Index — RBAC + View-As Impersonation Initiative

**Total stories:** 17 (all SHIPPED) + 1 standing process story
**Generated:** 2026-04-29
**Status update:** 2026-04-29 — All 17 initiative stories shipped to production (FE v1.1.0 / API v1.2.0)

---

## Story Table

| ID | Title | Phase | Type | Complexity | Dependencies | Status |
|----|-------|-------|------|------------|--------------|--------|
| 001 | Remove JWT_SECRET Fallback | 0 — Preparation | Backend | S | — | **SHIPPED** |
| 002 | Strict Bearer / x-api-key Separation | 0 — Preparation | Backend | S | 001 (recommended) | **SHIPPED** |
| 003 | Auth Helpers: getRealRole, getEffectiveRole, getEffectiveUserId, requireRole | 1 — Backend RBAC | Backend | M | 001, 002 | **SHIPPED** |
| 004 | Lock Admin-Only Report Endpoints (17 routes) | 1 — Backend RBAC | Backend | M | 003 | **SHIPPED** |
| 005 | Lock Admin + ts + crm Shared Endpoints (5 routes) | 1 — Backend RBAC | Backend | S | 003 | **SHIPPED** |
| 006 | Lock High-Risk Admin Tools (database/*, tables/*, users) | 1 — Backend RBAC | Backend | S | 003 | **SHIPPED** |
| 007 | Investigate and Lock gap-5 Endpoints (chat-history, docs/tables) | 1 — Backend RBAC | Backend | S | 003 | **SHIPPED** |
| 008 | Frontend 403 Handling | 1 — Backend RBAC | Frontend | S | 004 (for e2e test) | **SHIPPED** |
| 009 | SQL Filter on commission-plus Endpoints | 2 — SQL Data Filter | Backend | M | 003, 005 | **SHIPPED** (see note §009) |
| 010 | Backend Honors View-As Headers (audit + validation) | 3 — View-As | Backend | S | 003, 009, 004-007 | **SHIPPED** |
| 011 | Frontend: shared-http.js Injects View-As Headers | 3 — View-As | Frontend | S | 010 | **SHIPPED** |
| 012 | Frontend: View-As Pill Button in Sidebar | 3 — View-As | Frontend | S | 003, 013 (same branch) | **SHIPPED** |
| 013 | Frontend: View-As Picker Modal | 3 — View-As | Frontend | L | 012, 011, 010 | **SHIPPED** |
| 014 | Frontend: Sticky View-As Banner | 3 — View-As | Frontend | M | 012, 013, 015 | **SHIPPED** |
| 015 | Frontend: Exit View-As Flow | 3 — View-As | Frontend | S | 014, 011 | **SHIPPED** |
| 016 | Execute Test Matrix on Staging (sign off TC-01..TC-20 + N-01..N-12) | QA & Deploy | Cross-Cutting | M | 001–015 all deployed to staging | **SHIPPED** |
| 017 | Production Deploy Coordination | QA & Deploy | Cross-Cutting | S | 016 signed off | **SHIPPED** |
| P-001 | View-As Parity SOP — ongoing process | Standing process | Cross-Cutting | — | 017 | **ACTIVE** (see below) |

### Story 009 — Implementation note

The SQL filter design evolved from the original spec. The `seller_agency_member_id = effectiveUserId` clause was **not implemented** for ts/crm effective roles. Instead:
- `is_old_customer = 0/1` (role gate) IS applied.
- The endpoint returns role-wide rows so the ranking summary can compute relative positions.
- Frontend masks peer names (`'******'`) and filters `ownOrders` client-side for KPI cards / main table / exports.

See `docs/architecture-rbac-view-as.md` Section 7 for full rationale.

---

## Complexity Summary

| Complexity | Stories |
|------------|---------|
| S (Small)  | 001, 002, 005, 006, 007, 008, 010, 011, 012, 015, 017 — 11 stories |
| M (Medium) | 003, 004, 009, 014, 016 — 5 stories |
| L (Large)  | 013 — 1 story |

---

## Phase Swim Lanes

```
Phase 0        Phase 1                  Phase 2       Phase 3              QA/Deploy
-----------    ---------------------    ---------     -----------------    ---------
001            003                      009           010                  016
002            004 (api)                              011 (fe)             017
               005 (api)                              012 (fe)
               006 (api) ← HIGH PRIO                 013 (fe)
               007 (api)                              014 (fe)
               008 (fe)                               015 (fe)
```

Stories 012, 013, 014, 015 should be developed on a single feature branch and merged as a unit.

---

## Dependency Graph (simplified)

```
001 → 002 → 003 ┬→ 004 → 008
                ├→ 005 ──────┐
                ├→ 006       ├→ 009 → 010 → 011
                └→ 007       │              012 ┐
                             │              013 ├→ 014 → 015
                             └──────────────────┘
                                            ↓
                                     016 (all above) → 017
```

---

## Resolved Flags

All pre-ship flags were resolved during implementation.

| Story | Flag | Resolution |
|-------|------|-----------|
| 003 | OQ-3: `payload.user.agency_member.id` field name | Confirmed lowercase `id`. `AgencyMember` interface typed in `lib/jwt.ts`. |
| 007 | `chat-history` / `docs/tables` investigation | Both locked to admin. No ts/crm pages call them. |
| 002 | TC-14 outcome flip (200 → 401) | TC-14 updated in `test-strategy-rbac-view-as.md` to show 401 as the expected outcome. SHIPPED. |
| 003 | `VIEW_AS_ADMIN_ID` env var | Implemented as env-overridable with fallback to 555. Both staging and production Vercel projects have env var set. |

---

## Standing Process — P-001: View-As Parity SOP

This is not a deliverable story — it is a permanent development process.

**Trigger:** Any PR that changes a ts/crm-accessible page, shared component, or auth helper.

**Required action:** Complete the field-by-field parity checklist from `docs/view-as-parity-sop.md` and attach results to the PR.

**Owner:** Developer making the change.

**Reference:** `docs/view-as-parity-sop.md` (the canonical doc).

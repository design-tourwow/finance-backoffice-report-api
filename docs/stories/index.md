# Stories Index — RBAC + View-As Impersonation Initiative

**Total stories:** 17
**Generated:** 2026-04-29

---

## Story Table

| ID | Title | Phase | Type | Complexity | Dependencies |
|----|-------|-------|------|------------|--------------|
| 001 | Remove JWT_SECRET Fallback | 0 — Preparation | Backend | S | — |
| 002 | Strict Bearer / x-api-key Separation | 0 — Preparation | Backend | S | 001 (recommended) |
| 003 | Auth Helpers: getRealRole, getEffectiveRole, getEffectiveUserId, requireRole | 1 — Backend RBAC | Backend | M | 001, 002 |
| 004 | Lock Admin-Only Report Endpoints (17 routes) | 1 — Backend RBAC | Backend | M | 003 |
| 005 | Lock Admin + ts + crm Shared Endpoints (5 routes) | 1 — Backend RBAC | Backend | S | 003 |
| 006 | Lock High-Risk Admin Tools (database/*, tables/*, users) | 1 — Backend RBAC | Backend | S | 003 |
| 007 | Investigate and Lock gap-5 Endpoints (chat-history, docs/tables) | 1 — Backend RBAC | Backend | S | 003 |
| 008 | Frontend 403 Handling | 1 — Backend RBAC | Frontend | S | 004 (for e2e test) |
| 009 | SQL Filter on commission-plus Endpoints | 2 — SQL Data Filter | Backend | M | 003, 005 |
| 010 | Backend Honors View-As Headers (audit + validation) | 3 — View-As | Backend | S | 003, 009, 004-007 |
| 011 | Frontend: shared-http.js Injects View-As Headers | 3 — View-As | Frontend | S | 010 |
| 012 | Frontend: View-As Pill Button in Sidebar | 3 — View-As | Frontend | S | 003, 013 (same branch) |
| 013 | Frontend: View-As Picker Modal | 3 — View-As | Frontend | L | 012, 011, 010 |
| 014 | Frontend: Sticky View-As Banner | 3 — View-As | Frontend | M | 012, 013, 015 |
| 015 | Frontend: Exit View-As Flow | 3 — View-As | Frontend | S | 014, 011 |
| 016 | Execute Test Matrix on Staging (sign off TC-01..TC-20 + N-01..N-12) | QA & Deploy | Cross-Cutting | M | 001–015 all deployed to staging |
| 017 | Production Deploy Coordination | QA & Deploy | Cross-Cutting | S | 016 signed off |

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

## Flagged Items Requiring Clarification

| Story | Flag | Risk if unresolved |
|-------|------|--------------------|
| 003 | OQ-3 from architecture doc: `payload.user.agency_member.id` field name must be confirmed against a real live JWT before coding. If the field name differs, all three helper functions need adjustment. | Story 003 blocked or produces silent bug |
| 007 | Investigation step required before coding. If `chat-history` or `docs/tables` are actively used by ts/crm pages, a new story is needed to redesign the dependency. | Locking these endpoints could break ts/crm page functionality |
| 002 | TC-14 expected outcome flips from 200 to 401 after this story. The test strategy document should be updated to reflect this. | Stale test spec causes confusion during Story 016 |
| 003 | `VIEW_AS_ADMIN_ID` env var: the architecture recommends an env var rather than a hard-coded 555. Confirm with infra that this env var will be set in both staging and production Vercel projects before Story 003 is deployed. | Hard-coded fallback to 555 if env missing — acceptable but should be explicit |

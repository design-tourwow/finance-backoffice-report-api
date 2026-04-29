# Browser Smoke Test Checklist — RBAC + View-As Impersonation

**When to run:** Before every staging release of Phase 3. Required for phase sign-off.
**Browser:** Chrome (latest). Open DevTools (F12) before starting.
**Time estimate:** ~20 minutes for a full pass.

Staging frontend URL: `https://finance-backoffice-report-staging.vercel.app` (replace with actual)
Staging API URL: `https://finance-backoffice-report-api-staging.vercel.app`

---

## Section A — Role-based menu and route access

### A-01: Login as ts user — no view-as controls visible

1. Open the staging frontend in an Incognito window.
2. Log in with a ts user account (job_position = 'ts').
3. Inspect the sidebar/menu.
   - Expected: No "ดูเป็น..." button or icon is visible anywhere in the menu.
   - Expected: Menu only shows sections available to ts users.
4. In DevTools Network tab, navigate to `/sales-report-by-seller`.
   - Expected: Page loads, commission-plus API call succeeds (200).
   - Expected: `X-Effective-Role: ts` in the commission-plus response headers.
5. Try navigating directly to `/sales-report` by typing the URL.
   - Expected: Redirected to `/403` page or shown an access-denied message.
   - Expected: No data from the sales report is visible even briefly.

### A-02: Login as admin id=555 — view-as button visible

1. Open a new Incognito window.
2. Log in with the admin account whose agency_member.id = 555.
3. Inspect the sidebar/menu.
   - Expected: A "ดูเป็น..." (View as) button or picker control is visible in the sidebar.
   - Expected: No such button is visible when logged in as any other admin (id != 555).
4. Navigate to `/sales-report`.
   - Expected: Page loads and shows full admin data (all sellers).
   - Expected: `X-Effective-Role: admin` in the commission-plus response headers.

### A-03: Login as crm user — access mirrors ts

Repeat steps A-01 with a crm user account (job_position = 'crm').
- Expected: Same behavior as ts — no view-as button, /sales-report blocked, commission-plus scoped to own seller_id.

---

## Section B — View-as picker interaction

### B-01: Open picker — 2-step flow

1. Logged in as admin id=555 (from A-02).
2. Click the "ดูเป็น..." button in the sidebar.
   - Expected: A modal or panel opens showing a list of ts/crm users.
   - Expected: Users are grouped by team (if team grouping is implemented).
3. Confirm the list is populated (calls `/api/agency-members?roles=ts,crm`).
   - Expected: Network request visible in DevTools. Response contains agency members.

### B-02: Search filter in picker

1. In the open picker, type partial text in the search box (e.g. the first 2 characters of a known ts user's name or nick).
   - Expected: List filters to show only matching users.
   - Expected: Users not matching the query are hidden, not removed from DOM.

### B-03: Escape key closes picker

1. With the picker open, press Escape.
   - Expected: Modal/panel closes. No view-as session is activated.
   - Expected: Page still shows admin scope (no banner).

### B-04: Team grouping visible

1. Open picker again.
   - Expected: Users are grouped under team headings.
   - Expected: Switching teams or scrolling shows users from different teams.

---

## Section C — Activating and verifying view-as

### C-01: Apply view-as for a ts user

1. Open picker, select a ts user (e.g. Nick: "TS User 100", id=100).
2. Confirm selection (click "ยืนยัน" or however the 2-step confirm is triggered).
   - Expected: Picker closes.
   - Expected: A banner appears at the top of the page showing the impersonated user's nick name and team, e.g. "กำลังดูเป็น: [ts_nick] (TS)".
3. Open DevTools → Application → Session Storage → staging origin.
   - Expected: Keys `viewAsRole = ts` and `viewAsUserId = 100` are present.
4. Trigger any API call (e.g. reload the `/sales-report-by-seller` page).
   - Expected: Request headers include `X-View-As-Role: ts` and `X-View-As-User-Id: 100`.
   - Expected: Response header `X-Effective-Role: ts`.
   - Expected: Commission-plus data shows only orders for seller_id=100.

### C-02: Banner content is accurate

1. With view-as ts/100 active, inspect the banner element.
   - Expected: Displays the ts user's nick_name (not just "ts" or "user_id=100").
   - Expected: Displays the user's team name.
   - Expected: An "[ออกจากโหมดดูเป็น]" (Exit view-as) button is visible in the banner.

### C-03: Banner persists across page navigation

1. With view-as active, navigate to different pages:
   - Click "Dashboard" or home link.
   - Click "Sales report by seller" (`/sales-report-by-seller`).
   - Click any other menu item that a ts user can see.
   - Expected (each navigation): Banner remains visible at the top of every page.
   - Expected: `X-View-As-Role` and `X-View-As-User-Id` headers are sent on every API call from any page.
2. Check DevTools Network for a few API calls across pages:
   - Expected: Both view-as headers present on each request.

### C-04: Admin-only menu items remain visible during view-as

1. With view-as ts/100 active, inspect the sidebar.
   - Expected: All admin menu items are still shown (menu reflects real role, not view-as role).
   - Expected: The view-as banner is visible but does NOT collapse the admin menu.
2. Click an admin-only menu item (e.g. `/sales-report`).
   - Expected: The API call returns 403.
   - Expected: The page shows an access denied message (backend blocks it because effective role = ts).
   - Expected: The menu item was still clickable — the block is server-side, not UI-hidden.

---

## Section D — Exiting view-as

### D-01: Exit via banner button

1. With view-as ts/100 active, click "[ออกจากโหมดดูเป็น]" in the banner.
   - Expected: Page reloads automatically.
   - Expected: Banner is gone after reload.
   - Expected: SessionStorage `viewAsRole` and `viewAsUserId` are cleared (verify in DevTools Application tab).
2. Trigger an API call on the current page.
   - Expected: `X-View-As-Role` and `X-View-As-User-Id` headers are NOT present.
   - Expected: Response header `X-Effective-Role: admin`.
   - Expected: Commission-plus data shows all sellers (admin scope restored).

### D-02: Logout clears view-as state

1. Activate view-as ts/100 (from C-01).
2. Log out via the normal logout button.
   - Expected: Redirected to login page.
3. Log back in as admin id=555.
   - Expected: No view-as banner. No viewAs keys in sessionStorage.
   - Expected: Fresh admin session with no residual impersonation.

---

## Section E — Tab isolation

### E-01: New tab starts as clean admin session

1. With view-as ts/100 active in Tab A, open a new tab (Ctrl+T) and navigate to the staging frontend.
   - Expected: Tab B loads with NO view-as banner.
   - Expected: Tab B sessionStorage has NO `viewAsRole` or `viewAsUserId` keys.
   - Note: sessionStorage is per-tab in browsers — this is by design (R-07).
2. Trigger an API call in Tab B.
   - Expected: No view-as headers in the request. `X-Effective-Role: admin`.
3. Return to Tab A — verify view-as is still active there.
   - Expected: Banner still shows ts/100. SessionStorage still has the keys.

### E-02: Duplicate tab inherits then diverges

1. With view-as ts/100 active in Tab A, duplicate the tab (right-click tab → Duplicate).
   - Expected: Tab B may initially inherit sessionStorage (this is browser-specific behavior).
   - Expected: If Tab B inherits the session, it shows the banner — this is acceptable.
   - Clear view-as in Tab B by clicking Exit.
   - Expected: Tab A is unaffected (still shows ts/100 view-as).

---

## Section F — Security and edge cases

### F-01: X-Effective-Role mismatch warning in console

1. With view-as ts/100 active, open DevTools Console.
2. Manually delete `viewAsUserId` from sessionStorage (leave `viewAsRole` set):
   ```
   sessionStorage.removeItem('viewAsUserId')
   ```
3. Trigger an API call by refreshing the page.
   - Expected: Console shows a `[ViewAs]` warning about partial headers.
   - Expected: API call goes out WITHOUT the view-as headers (frontend `buildHeaders()` requires both to be set simultaneously).
   - Expected: Response is admin-scoped (no impersonation).

### F-02: Direct URL navigation as ts user to admin route

1. Open a new Incognito window. Log in as a ts user.
2. Manually type `/sales-report` in the address bar and press Enter.
   - Expected: Navigated to `/403` page.
   - Expected: No flash of the sales report data before the redirect.
3. Try `/sales-report` with a fetch in the Console:
   ```javascript
   const r = await SharedHttp.get('/api/reports/by-country'); console.log(r.status)
   ```
   (or via a plain fetch with the stored JWT)
   - Expected: 403 returned from the API.

### F-03: ts user manually adds view-as headers via DevTools

1. Logged in as a ts user, use the DevTools Console to issue a fetch with forged headers:
   ```javascript
   fetch('/api/reports/commission-plus', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token'),
       'X-View-As-Role': 'admin',
       'X-View-As-User-Id': '555'
     }
   }).then(r => console.log(r.status, r.headers.get('X-Effective-Role')))
   ```
   - Expected: HTTP 200 (ts is allowed on commission-plus).
   - Expected: `X-Effective-Role: ts` — headers were ignored, real role used.
   - Expected: Response data is scoped to the ts user's own seller_id. NOT all sellers.

### F-04: Verify response headers on commission-plus

1. Logged in as admin id=555, activate view-as ts/100, open `/sales-report-by-seller`.
2. In DevTools Network, click the commission-plus request.
3. Inspect response headers:
   - Expected: `X-Effective-Role: ts`
   - Expected: `Cache-Control: private, no-store`
4. Now exit view-as. Reload. Check the same commission-plus request.
   - Expected: `X-Effective-Role: admin`
   - Expected: `Cache-Control: private, no-store`

---

## Section G — Known manual-only TCs from the test strategy

The following test cases from `docs/test-strategy-rbac-view-as.md` require browser interaction and cannot be automated via curl:

| TC | Description | Section above |
|----|-------------|---------------|
| UI-01 | "ดูเป็น..." button only visible for admin id=555 | A-01, A-02 |
| UI-02 | Picker 2-step flow, search, team grouping | B-01 – B-04 |
| UI-03 | Banner shows correct nick + team, persists navigation | C-02, C-03 |
| UI-04 | Banner [Exit] clears sessionStorage and reloads | D-01 |
| UI-05 | Logout clears view-as state | D-02 |
| UI-06 | Tab isolation (sessionStorage per-tab) | E-01 |
| UI-07 | Console warning on partial view-as headers | F-01 |
| UI-08 | ts direct URL to /sales-report → /403 | F-02 |
| UI-09 | ts forged view-as headers ignored | F-03 |
| UI-10 | X-Effective-Role + Cache-Control in response | F-04 |

Sign-off: tester initials + date when all sections A–G are verified green.

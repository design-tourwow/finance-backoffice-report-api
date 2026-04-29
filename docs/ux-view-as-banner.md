# UX Spec: View-As Impersonation Feature

**Version:** 1.0  
**Date:** 2026-04-29  
**Author:** Sally (UX Designer)  
**Status:** Ready for implementation

---

## 1. Context & Mental Model

Admin id=555 needs to QA role-specific views without logging out and logging back in as a different person. Think of it as "trying on another person's glasses" — the admin puts them on, walks through the system seeing exactly what a TS or CRM user sees, then takes them off and is immediately back to full vision.

The key emotional contract with the user: they must ALWAYS know when they are impersonating. There is no ambiguity. The banner is a constant, honest signal — "you are wearing someone else's badge right now."

---

## 2. Entry Point — Where the Picker Opens

### 2.1 Location

The trigger button lives in the **top-right area of the sidebar**, below the logo, visible only when `agency_member.id === 555`. It is injected by `menu-component.js` during `initMenuComponent()`, immediately after `renderSidebarMenu()`.

Why the sidebar and not the top-bar? The `top-bar` (`nav.top-bar`) currently has `HEADER_MENU_VISIBLE = false` and renders an empty `navbar-list`. Injecting into the sidebar keeps everything in one managed location and avoids touching individual page HTML files. The sidebar persists across all pages. The `menu-component.js` already owns `.nav-menu` — adding one more element to the sidebar's `aside.sidebar` DOM is the lowest-risk injection point.

### 2.2 The Trigger Button

A compact pill-shaped button labelled **"ดูเป็น..."** (View As...). It sits below the last `.nav-item` in `.nav-menu`, separated by a thin top border. During impersonation the button changes to show the current target's nickname in amber, acting as a visual status indicator even when the banner is scrolled past.

### 2.3 ASCII Mockup — Normal Admin View (sidebar)

```
+--------------------------------+
|  [Tourwow Logo]                |
+--------------------------------+
|  Dashboard                     |
|  Tour Image Manager            |
|  Report >                      |
|    Sales by Country            |
|    Wholesale Destinations      |
|    Sales Report                |
|    Sales Report by Seller      |
|    Canceled Orders             |
|  Report P'NUT >                |
|  Report P'OH >                 |
|  Report Co'Auay >              |
+- - - - - - - - - - - - - - - -+
|  [ ดูเป็น... ]  (pill button)  |
+--------------------------------+
|  [<] ซ่อนเมนู                  |
+--------------------------------+
```

### 2.4 ASCII Mockup — During Impersonation (sidebar)

```
+--------------------------------+
|  [Tourwow Logo]                |
+--------------------------------+
|  Dashboard                     |
|  Sales Report by Seller        |    <- menu filtered to TS role
+- - - - - - - - - - - - - - - -+
|  [ NN (TS) ] [amber pill]      |    <- shows current target nick
+--------------------------------+
|  [<] ซ่อนเมนู                  |
+--------------------------------+
```

---

## 3. Picker Dialog — Two-Step Flow

### 3.1 Trigger Behavior

Clicking **"ดูเป็น..."** opens a modal dialog overlaid on top of the current page. It is NOT a dropdown — a modal is chosen because the two-step flow requires enough vertical space for a search dropdown and confirm action, and modals are less likely to clip behind sidebar or content boundaries.

### 3.2 Step 1 — Role Selector

The user first picks the role they want to impersonate. Two large toggle cards: **TS** and **CRM**. One must be selected before Step 2 unlocks. Default selection: whichever was last used (stored in sessionStorage `viewAsLastRole`), otherwise TS.

### 3.3 Step 2 — User Picker

Once a role is selected, the user dropdown appears below. It is a searchable select:
- Placeholder: "พิมพ์ชื่อ / nickname เพื่อค้นหา"
- Search filters by `first_name`, `last_name`, `nickname` (client-side, data is pre-loaded when dialog opens)
- Option format: **"NN (Team 3) — Nick Surname"** — nickname prominent, team number secondary, full name as subtitle
- Options are grouped by `team_number` ascending. Groups are labeled "Team 1", "Team 2", etc.
- If `team_number` is null, that group is labeled "ไม่ระบุทีม" and sorted last.

### 3.4 Confirm & Apply

An **"เริ่มดูเป็น [nickname]"** (Start viewing as [nickname]) button activates once both role and user are selected. On click:
1. Write `viewAsRole` and `viewAsUserId` to `sessionStorage`.
2. Close the modal.
3. Call `window.location.reload()`.

Page reload is chosen over in-place re-render because: (a) it is simpler to implement across 14+ pages, (b) it guarantees all API calls, `ROLE_ACCESS` checks, and menu filtering re-run with the impersonated role, (c) no risk of stale state in page modules.

### 3.5 ASCII Mockup — Picker Dialog

```
+---------------------------------------------------+
|                                                   |
|   ดูระบบในฐานะ...                           [X]   |
|                                                   |
|   เลือก Role                                      |
|   +------------------+  +------------------+     |
|   |                  |  |                  |     |
|   |    TS            |  |    CRM           |     |
|   |  Telesales       |  |  Customer Rel.   |     |
|   |                  |  |                  |     |
|   +------------------+  +------------------+     |
|        [selected]                                 |
|                                                   |
|   เลือกพนักงาน                                    |
|   +---------------------------------------------+ |
|   | พิมพ์ชื่อ / nickname...           [v]        | |
|   +---------------------------------------------+ |
|   | -- Team 1 ---                               | |
|   |   NN (Team 1) — Nittaya Somchai             | |
|   |   PP (Team 1) — Piyanut Raksa               | |
|   | -- Team 2 ---                               | |
|   |   KK (Team 2) — Kannika Jaidee  [selected]  | |
|   +---------------------------------------------+ |
|                                                   |
|        [ เริ่มดูเป็น KK ]    [ ยกเลิก ]           |
|                                                   |
+---------------------------------------------------+
```

---

## 4. Active Banner — During Impersonation

### 4.1 Placement & Stickiness

The banner is injected as the **very first child of `main.main-content`**, before `nav.top-bar`. This makes it appear at the top of the scrollable content area. It is `position: sticky; top: 0; z-index: 1100` so it stays visible as the user scrolls down into long reports. It is `z-index: 1100` to sit above `.top-bar` (assumed z-index ~100) but below any modal overlays (z-index 2000+).

Injection point in the DOM:

```
main.main-content
  |- div#view-as-banner   <-- injected here by menu-component.js
  |- nav.top-bar
  |- div.content-area
```

### 4.2 Banner Content

```
[WARNING ICON] ดูในฐานะ: KK (CRM, Team 2)  |  คุณคือ: Admin (id 555)  |  [เปลี่ยน]  [ออกจากโหมดดูเป็น]
```

- **Left zone:** warning icon + "ดูในฐานะ: [nickname] ([role], Team [N])"
- **Center zone:** "คุณคือ: Admin" — reminds the user of their real identity
- **Right zone:** two buttons: [เปลี่ยน] (Switch — reopens picker) and [ออกจากโหมดดูเป็น] (Exit)

### 4.3 Visual Design Recommendation

Use **amber/warning** palette — this color is universally understood as "you are in a special mode, not normal operation." Avoid red (implies error/danger) and green (implies everything is normal/healthy).

- Background: `#FEF3C7` (amber-100)
- Left border accent: `4px solid #F59E0B` (amber-400)
- Text: `#92400E` (amber-900) for high contrast
- [เปลี่ยน] button: secondary outline in amber-700
- [ออกจากโหมดดูเป็น] button: filled amber-600, white text

Color contrast check: `#92400E` on `#FEF3C7` = approximately 7:1 ratio — passes WCAG AA and AAA.

### 4.4 Banner Is Non-Dismissible

There is no close/hide button. The only way to exit impersonation mode is the explicit [ออกจากโหมดดูเป็น] button. This is intentional — accidental dismissal would leave the admin confused about which role they are seeing.

### 4.5 ASCII Mockup — Full Page During Impersonation

```
+--------------------------------------------------------------------+
|  [Tourwow Logo]   |                                                |
|  Sales Report     | [WARN] ดูในฐานะ: KK (CRM, Team 2)             |
|  by Seller        |        คุณคือ: Admin (id 555)    [เปลี่ยน]    |
|  [NN (TS) amber]  |        [ออกจากโหมดดูเป็น]                     |
|                   +------------------------------------------------+
|  [ซ่อนเมนู]       |  nav.top-bar (empty or hidden)                 |
|                   +------------------------------------------------+
|                   |                                                |
|                   |  content-area                                  |
|                   |  (page renders as KK/CRM role)                 |
|                   |                                                |
+-------------------+------------------------------------------------+
```

---

## 5. Exit Flow

### 5.1 Single Click, No Confirm Modal

Clicking [ออกจากโหมดดูเป็น] immediately:
1. Removes `viewAsRole` and `viewAsUserId` from `sessionStorage`.
2. Calls `window.location.reload()`.

No confirmation dialog. The reasoning: the admin is the only user who can enter this mode, they are not making destructive changes — they are only viewing. A confirm dialog adds friction without protecting anything meaningful. The page reload gives immediate visual feedback that the mode has ended (banner disappears, menu re-expands to full admin view).

---

## 6. Empty & Error States

### 6.1 No Users Found for a Role

When the API returns an empty array for a given role (e.g., no CRM members exist):
- The CRM toggle card is still shown but is **disabled** (grayed out, `cursor: not-allowed`)
- A tooltip on hover: "ไม่พบพนักงาน CRM ในระบบ"
- The user dropdown below shows: "ไม่พบรายชื่อพนักงานในระบบ" as a non-selectable placeholder option

### 6.2 API Failure When Opening Picker

If `GET /api/agency-members?roles=ts,crm` fails:
- Both role cards are shown but disabled
- A warning message inside the dialog: "ไม่สามารถโหลดรายชื่อพนักงานได้ กรุณาลองใหม่" with a [ลองใหม่] retry button
- The retry button re-fires the API call without closing the dialog

### 6.3 Network Drop While Impersonating

If the user is mid-session and the network drops:
- The banner continues to display (it reads from `sessionStorage`, not the API)
- API calls on the page will fail with their existing error handling (each page already handles API errors independently)
- When network recovers, the user continues as normal
- The impersonation state is not lost — `sessionStorage` persists for the browser tab lifetime

### 6.4 Session Storage Cleared / Tab Closed

Impersonation state is automatically wiped when the tab closes (sessionStorage behavior). On next open, the admin sees their normal view. This is the desired behavior — impersonation should not bleed across sessions.

### 6.5 Admin Navigates to a Page the Target Role Cannot Access

`menu-component.js` will call `redirectToForbiddenPage()` via `canAccessPath()` because the effective role check will use the impersonated role. The banner will NOT appear on the `/403` page (no `main.main-content` to inject into). The admin will see the standard 403 page. This is acceptable — it demonstrates exactly what the target role experiences when hitting a restricted URL. A small UX improvement for v2: the 403 page could show a reminder "คุณอยู่ในโหมดดูเป็น [nickname]" but this is not required for v1.

---

## 7. Responsive Behavior

The backoffice is primarily a desktop tool. However, the following breakpoints should be addressed:

### 7.1 Sidebar Collapsed (mobile / < 768px)

When `.sidebar-collapsed` is active, the sidebar is hidden. The [ดูเป็น...] trigger in the sidebar becomes unreachable. Solution: when the sidebar is collapsed and impersonation is active, the banner [เปลี่ยน] button serves as the only re-entry point to the picker. This is sufficient for a backoffice tool.

When the sidebar is collapsed and NOT impersonating, admin id=555 on mobile cannot open the picker until they expand the sidebar. This is acceptable — the target user (id=555) uses a desktop admin workstation.

### 7.2 Banner on Small Screens (< 768px)

The banner stacks vertically:
- Line 1: warning icon + "ดูในฐานะ: KK (CRM)"
- Line 2: "คุณคือ: Admin"
- Line 3: [เปลี่ยน] and [ออกจากโหมดดูเป็น] buttons side by side

Banner max-height should be constrained with `overflow: hidden` to avoid eating large amounts of the viewport. On mobile the banner height will be approximately 72–80px stacked.

### 7.3 Picker Dialog on Small Screens

The dialog should be `width: min(480px, 95vw)` and `max-height: 90vh; overflow-y: auto` so it does not overflow on smaller screens.

---

## 8. Accessibility

### 8.1 Keyboard Navigation

- The [ดูเป็น...] trigger button is focusable in tab order (`tabindex="0"` if it is a `<button>`, which it should be).
- The modal opens with focus trapped inside using a standard focus-trap pattern. Focus moves to the first interactive element (the TS role card or close button) on open.
- `Escape` key closes the modal without applying changes (same as [ยกเลิก]).
- Tab order within the modal: close button [X] → TS card → CRM card → search input → dropdown list → Apply button → Cancel button.
- The banner buttons [เปลี่ยน] and [ออกจากโหมดดูเป็น] are in the natural tab order at the top of the page.

### 8.2 Screen Reader

- The picker dialog uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby="view-as-dialog-title"`.
- The banner uses `role="alert"` so screen readers announce it on page load when impersonating. This is appropriate — the impersonation state is important and should be surfaced immediately.
- Role cards use `role="radio"` within a `role="radiogroup"` labelled "เลือก Role".
- The active banner has `aria-live="polite"` as a backup in case the initial `role="alert"` announcement is missed.
- When impersonation exits (banner removed), no announcement is needed as the page reloads.

### 8.3 Color Contrast

- Banner text `#92400E` on `#FEF3C7`: ~7.1:1 — passes WCAG AAA (4.5:1 required for normal text).
- Button text (white on `#D97706` amber-600): ~3.0:1 — passes WCAG AA for large text / UI components (3:1 threshold). For body text this would be insufficient; buttons at 14px+ bold are considered UI components under WCAG 1.4.11.
- Disabled role cards: use `#9CA3AF` (gray-400) text on `#F3F4F6` (gray-100) background — ~3.9:1, passes AA.

---

## 9. CSS Hooks — New Class Names

All new classes are prefixed `.va-` (view-as) to avoid collisions with existing classes.

```css
/* Trigger button in sidebar */
.va-trigger-wrap          /* wrapper div below nav-menu */
.va-trigger-btn           /* the pill button "ดูเป็น..." */
.va-trigger-btn--active   /* modifier: when impersonating, shows target nick */

/* Picker dialog */
.va-dialog-overlay        /* full-screen semi-transparent backdrop */
.va-dialog                /* the dialog box itself */
.va-dialog__header        /* title row + close button */
.va-dialog__title         /* h2 "ดูระบบในฐานะ..." */
.va-dialog__close         /* [X] close button */
.va-dialog__body          /* scrollable body */
.va-role-group            /* radiogroup wrapper for TS/CRM cards */
.va-role-card             /* individual role toggle card */
.va-role-card--selected   /* modifier: active selection */
.va-role-card--disabled   /* modifier: no users / API error */
.va-user-picker-wrap      /* wrapper for Step 2 search+dropdown */
.va-user-search           /* text input for filtering */
.va-user-list             /* ul of options */
.va-user-list__group      /* optgroup-style team header li */
.va-user-list__item       /* individual user li */
.va-user-list__item--selected  /* highlighted selection */
.va-dialog__actions       /* button row at bottom */
.va-btn-apply             /* "เริ่มดูเป็น [nick]" primary button */
.va-btn-cancel            /* "ยกเลิก" secondary button */
.va-dialog__error         /* API error message area */
.va-btn-retry             /* "ลองใหม่" retry link/button */

/* Active banner */
.va-banner                /* the sticky banner strip */
.va-banner__left          /* icon + "ดูในฐานะ" text zone */
.va-banner__center        /* "คุณคือ: Admin" text zone */
.va-banner__right         /* button group zone */
.va-banner__target        /* strong element: nickname + role */
.va-banner__self          /* "Admin (id 555)" text */
.va-btn-switch            /* [เปลี่ยน] button */
.va-btn-exit              /* [ออกจากโหมดดูเป็น] button */
```

Body-level state class for pages to react to impersonation:

```css
body.va-impersonating     /* added when sessionStorage has viewAsUserId */
```

This class lets individual pages add CSS rules if needed, e.g.:

```css
body.va-impersonating .content-area {
  padding-top: 0; /* banner already provides top separation */
}
```

---

## 10. Interaction Events — Sequence & State Changes

### 10.1 Initial Page Load (every page, every time)

```
menu-component.js initMenuComponent()
  |
  +-- Read token → get real user id + role
  |
  +-- IF real id === 555
  |     Inject .va-trigger-wrap + .va-trigger-btn into aside.sidebar
  |
  +-- Read sessionStorage: viewAsRole, viewAsUserId
  |
  +-- IF viewAsUserId exists (impersonating)
  |     Add body.va-impersonating
  |     Inject .va-banner as first child of main.main-content
  |     Update .va-trigger-btn to .va-trigger-btn--active with target nick
  |     Effective role for renderSidebarMenu() = viewAsRole (not real role)
  |
  +-- renderSidebarMenu() — uses effective role
  +-- renderHeaderMenu()
```

### 10.2 Opening the Picker

```
User clicks .va-trigger-btn
  |
  +-- Inject .va-dialog-overlay + .va-dialog into document.body
  +-- Fetch GET /api/agency-members?roles=ts,crm
  |     onSuccess: populate .va-user-list grouped by team
  |     onError:   show .va-dialog__error + .va-btn-retry; disable both role cards
  |
  +-- Pre-select: viewAsRole from sessionStorage (or 'ts' default)
  +-- Pre-select: viewAsUserId from sessionStorage (if exists)
  +-- Move focus to .va-dialog__close
  +-- Add keydown listener for Escape → close without applying
```

### 10.3 Role Card Selection

```
User clicks .va-role-card (TS or CRM)
  |
  +-- Update .va-role-card--selected modifier
  +-- Filter .va-user-list items to show only users of selected role
  +-- Clear .va-user-list__item--selected (selection reset when role changes)
  +-- Enable .va-btn-apply only if a user is also selected
```

### 10.4 User Search

```
User types in .va-user-search
  |
  +-- Client-side filter: show items whose nickname/first_name/last_name
  |   contains the search string (case-insensitive)
  +-- Show "ไม่พบผลลัพธ์" if empty results
  +-- NO API call — all members are fetched once on dialog open
```

### 10.5 User Selection

```
User clicks .va-user-list__item
  |
  +-- Add .va-user-list__item--selected
  +-- Store selectedUserId, selectedUserNick in dialog local state
  +-- Update .va-btn-apply label to "เริ่มดูเป็น [nick]"
  +-- Enable .va-btn-apply
```

### 10.6 Apply / Confirm

```
User clicks .va-btn-apply
  |
  +-- sessionStorage.setItem('viewAsRole', selectedRole)
  +-- sessionStorage.setItem('viewAsUserId', selectedUserId)
  +-- sessionStorage.setItem('viewAsUserNick', selectedUserNick)   // for banner display without re-fetch
  +-- sessionStorage.setItem('viewAsUserTeam', selectedUserTeam)   // for banner display
  +-- Remove .va-dialog-overlay + .va-dialog from DOM
  +-- window.location.reload()
```

Note: store `viewAsUserNick` and `viewAsUserTeam` in sessionStorage so the banner can render immediately on reload without an extra API call.

### 10.7 Cancel / Escape

```
User clicks .va-btn-cancel OR presses Escape
  |
  +-- Remove .va-dialog-overlay + .va-dialog from DOM
  +-- Return focus to .va-trigger-btn
  +-- No sessionStorage changes
  +-- No reload
```

### 10.8 Click [เปลี่ยน] (Switch) from Banner

```
User clicks .va-btn-switch in .va-banner
  |
  +-- Same flow as clicking .va-trigger-btn (10.2 above)
  +-- Dialog opens pre-populated with current viewAsRole + viewAsUserId
```

### 10.9 Exit Impersonation

```
User clicks .va-btn-exit in .va-banner
  |
  +-- sessionStorage.removeItem('viewAsRole')
  +-- sessionStorage.removeItem('viewAsUserId')
  +-- sessionStorage.removeItem('viewAsUserNick')
  +-- sessionStorage.removeItem('viewAsUserTeam')
  +-- window.location.reload()
```

### 10.10 What Triggers Reload vs In-Place Update

| Action | Reload? | Why |
|---|---|---|
| Apply new impersonation | Yes | Menu, API calls, role checks must all re-initialize |
| Switch to different user | Yes | Same as above |
| Exit impersonation | Yes | Menu re-expands to full admin; page data must refetch |
| Cancel picker | No | Nothing changed |
| Escape picker | No | Nothing changed |
| [ลองใหม่] retry API | No | Just re-fetches member list within dialog |

---

## 11. Summary of New sessionStorage Keys

| Key | Type | Value | Cleared on |
|---|---|---|---|
| `viewAsRole` | string | `'ts'` or `'crm'` | Exit button |
| `viewAsUserId` | string | e.g. `'42'` | Exit button |
| `viewAsUserNick` | string | e.g. `'KK'` | Exit button |
| `viewAsUserTeam` | string | e.g. `'2'` or `''` | Exit button |
| `viewAsLastRole` | string | Last used role (UI hint) | Never (persists for UX convenience) |

All keys use the `viewAs` prefix for clear namespacing.

---

## 12. Open UX Questions for Product Review

1. **Picker entry on mobile:** When the sidebar is collapsed (hamburger mode), the [ดูเป็น...] trigger is hidden inside the closed sidebar. Should there be a secondary trigger — e.g., a floating badge or the [เปลี่ยน] button in the banner acts as the sole entry point? The current spec relies on the sidebar being opened first. Acceptable for a desktop-primary tool, but worth confirming with the admin.

2. **Cross-tab behavior:** `sessionStorage` is tab-scoped. If admin id=555 opens a second tab while impersonating, that second tab starts fresh in admin view. Is this correct, or should impersonation be tab-local by design (which it is, under the current spec)?

3. **Audit logging:** Should the backend log when impersonation is active? Currently the spec only touches the frontend. If the admin uses [View As KK] and generates a PDF report, the PDF is generated in KK's context. If audit trails matter, the API calls should include a `X-View-As-User-Id` header so the server can log the impersonation context. This is a backend concern but has UX implications (the picker could show a "มีการบันทึก log การใช้งาน" notice).

4. **Team display in banner:** If `team_number` is null for a user, the banner shows "(CRM)" without a team suffix. Confirm that is acceptable, or should it show "(CRM, ไม่ระบุทีม)"?

5. **Nickname uniqueness:** The user list renders nicknames prominently. If two users share the same nickname in the same role, the disambiguation is the full name shown as a subtitle. This is assumed to be sufficient — confirm with stakeholders whether an ID suffix `— id=X` should always be shown (current spec shows it in the picker list, not in the banner).

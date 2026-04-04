# BizPOS System

## Current State
- Preferences (compact tables, tooltips, notifications, date format, currency) are saved to `bizpos_user_prefs` in localStorage but **not applied** anywhere in the app. They are purely cosmetic.
- The Edit Profile modal shows initials-based avatar with no option to upload a photo.
- POS page has currency amounts hardcoded as plain numbers with `.toLocaleString()` — no currency symbol prepended.
- ReportsPage hardcodes `PKR` as the currency prefix in all KPI cards and table cells.
- `NotificationBell` in AppLayout always shows all notifications regardless of user preferences.
- No shared `formatDate` or `formatCurrency` utility exists — each page formats independently.

## Requested Changes (Diff)

### Add
- `src/frontend/src/lib/prefs.ts` — shared utility module with:
  - `getPrefs()` — reads `bizpos_user_prefs` from localStorage, returns defaults if not set
  - `formatCurrency(amount, currency?)` — returns formatted string with correct symbol (PKR, USD, EUR, GBP, AED, SAR)
  - `formatDate(date, dateFormat?)` — formats a Date or ISO string per the user's date format preference (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Profile photo upload to Edit Profile modal: file input (accept image/*), preview the selected image as a circular avatar, store base64 in `bizpos_user_photo_{userId}` in localStorage, display the photo everywhere the initials avatar is shown (profile dropdown avatar, Edit Profile modal header)

### Modify
- **`AppLayout.tsx` — PreferencesContext/propagation:**
  - After `savePrefs()`, dispatch a custom DOM event `bizpos:prefs-changed` so other components can reactively re-read preferences without a full page reload.
  - `ProfileDropdown` component: show photo if available, else initials. Add photo upload UI in the Edit Profile modal.
  - `NotificationBell`: read prefs from localStorage and filter notifications based on `notifLowStock`, `notifPendingApprovals`, `notifSales` flags.
  - When `savePrefs` is called, apply `compact` class to `document.body` (or a data attribute `data-compact="true"`) so CSS can target table rows globally — avoids needing to touch every page.

- **Global CSS (`index.css`):**
  - Add rule: `body[data-compact='true'] table tbody tr td, body[data-compact='true'] table tbody tr th { padding-top: 0.25rem; padding-bottom: 0.25rem; font-size: 0.75rem; }` to implement compact table mode globally without touching each page.
  - Add rule for tooltips: `body[data-tooltips='false'] [data-tooltip], body[data-tooltips='false'] [title] { pointer-events: auto; }` — and hide tooltip content elements with class `tooltip-hint` when tooltips are off.

- **`AppLayout.tsx` — apply data attributes on mount and on pref change:**
  - On mount, read prefs and set `document.body.dataset.compact` and `document.body.dataset.tooltips` from stored prefs.
  - After `savePrefs()`, update these data attributes immediately so compact/tooltip changes are instant.

- **`POSPage.tsx`:**
  - Import `formatCurrency` and `getPrefs` from `@/lib/prefs`.
  - Replace all `.toLocaleString()` and `.toFixed(2)` currency displays with `formatCurrency(value, prefs.currency)`.
  - This covers: item price column, subtotal, discount, promo savings, tax, total in cart, and the receipt modal.

- **`ReportsPage.tsx`:**
  - Import `formatCurrency` and `getPrefs` from `@/lib/prefs`.
  - Replace hardcoded `PKR ${fmt(...)}` strings with `formatCurrency(value, prefs.currency)`.
  - Replace hardcoded `fmt()` in KPI cards across Sales, Purchase, Inventory, Payroll report tabs.
  - The `fmt` helper at top of file should be replaced/supplemented by the shared utility.

### Remove
- Nothing removed, only additions and targeted edits.

## Implementation Plan

1. Create `src/frontend/src/lib/prefs.ts` with `getPrefs()`, `formatCurrency()`, `formatDate()` exports.
2. Update `index.css` to add global compact-table and tooltip CSS rules using data attributes.
3. Update `AppLayout.tsx`:
   a. On mount, apply data attributes to body from saved prefs.
   b. After `savePrefs()`, update body data attributes immediately and dispatch `bizpos:prefs-changed` event.
   c. In `NotificationBell`, filter notifications by pref flags.
   d. In Edit Profile modal, replace initials avatar with photo upload: file input, base64 preview, save to `bizpos_user_photo_{id}`, display photo if available.
   e. In profile dropdown avatar circle, show photo img if available.
4. Update `POSPage.tsx`: use `formatCurrency` for all monetary displays; re-read prefs on component mount (listen to `bizpos:prefs-changed` event to re-render).
5. Update `ReportsPage.tsx`: use `formatCurrency` for all PKR-prefixed monetary KPI cards and table values; listen to `bizpos:prefs-changed` for reactivity.

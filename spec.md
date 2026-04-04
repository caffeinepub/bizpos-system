# BizPOS System

## Current State
The top bar has the company name pill, user name + role displayed as text, and a standalone logout icon button. The sidebar bottom has a dedicated logout button (icon + text when expanded). The `?` keyboard shortcut is supposed to toggle the shortcuts panel but it's broken — the `KeyboardShortcuts` component manages its own `open` state but the `?` key handler inside that same component uses a keydown listener on `window`, so if the modal is open, pressing `?` may not reach the handler correctly because the modal overlay captures events.

## Requested Changes (Diff)

### Add
- A circular user avatar/icon button in the top bar (rightmost, replacing the standalone logout button and the username text block)
- A dropdown panel that opens below the avatar button when clicked, showing:
  - User avatar (initials circle, large)
  - User full name
  - Role name (with Super badge if superUser)
  - A visual divider
  - Logout button/link (full width, red styled)
- A `UserProfileDropdown` component (inside AppLayout.tsx)

### Modify
- Remove the username + role text block (`nav.user.panel`) from the desktop top bar — it moves into the dropdown
- Remove the logout icon button from the desktop top bar — it moves into the dropdown
- Remove the logout button entirely from the sidebar bottom — the sidebar bottom div should be removed or just left empty / removed
- Fix `?` shortcut: the issue is that the `?` key listener fires `setOpen(prev => !prev)` but the modal overlay has a `tabIndex=-1` and captures events. The fix is to ensure the keydown handler checks if the modal is already open and if `?` is pressed, it closes regardless. Also make sure the handler is not accidentally blocked. A reliable fix: move the `?` toggle to use a `useEffect` that explicitly checks `open` state via a ref so stale closures don't cause issues.
- On mobile top bar: also replace the user section with just the avatar icon (no text)

### Remove
- Sidebar bottom logout button and its containing div
- Username/role text block in desktop top bar
- Standalone logout button in desktop top bar

## Implementation Plan
1. Add `UserProfileDropdown` component to AppLayout.tsx that renders a circular avatar button with user initials, and a dropdown containing full name, role, Super badge, divider, and logout action
2. Replace the `{/* User name + role */}` and `{/* Logout button */}` blocks in the desktop topbar with `<UserProfileDropdown />`
3. Remove the sidebar bottom section that contains the logout button
4. Fix the `?` shortcut by using a `openRef` in `KeyboardShortcuts` that stays in sync with `open` state, so the keydown handler reads from the ref instead of closing over stale state
5. Validate and deploy

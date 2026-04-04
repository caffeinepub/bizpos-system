# BizPOS System

## Current State
AppLayout.tsx has a left sidebar (slate-900) with:
- Logo + collapse toggle at top
- Nav groups in the middle
- A user info section at the bottom showing: company name, username, role badge, and logout button

The desktop top bar (hidden md:flex) shows only: FavoritesButton, BookmarkButton, NotificationBell — all right-aligned.

There are no keyboard shortcuts for screen navigation.

## Requested Changes (Diff)

### Add
- In the desktop top bar: company name (with switch button for super users), logged-in user's name + role badge, and a logout button — placed on the right side of the top bar after the icon buttons
- A keyboard shortcut system: pressing `G` then a letter (or just a shortcut key combo) navigates to common screens. A modal or tooltip should show available shortcuts. Standard approach: hold `?` or press `?` to see shortcut cheatsheet. Alt+key or just letter pairs (go-to navigation: press `G` then `D` for Dashboard, `G`+`P` for POS, etc.)

### Modify
- Remove the user info block (company name, username, role, logout button) from the sidebar bottom section — keep only the logout icon button when sidebar is collapsed, but move everything to the top bar
- Desktop top bar: add company name pill + user name + role + logout button to the RIGHT side
- Keep the mobile sidebar user info section as-is (it's a different layout)

### Remove
- The `!collapsed` user info block from sidebar bottom
- Logout button from sidebar (desktop only) — it moves to top bar

## Implementation Plan
1. Update the desktop top bar div to include: left side (page title or breadcrumb placeholder) and right side (Favorites, Bookmarks, Notifications, then a divider, then company name pill, user avatar/name, logout button)
2. Remove the user info + logout from the desktop sidebar bottom; keep the sidebar bottom clean or remove entirely
3. Add a KeyboardShortcuts component:
   - Listens for `?` key (no modifier needed) to open a cheat sheet modal
   - Listens for two-key sequences: `G` then `D`=Dashboard, `G`+`S`=Sales, `G`+`P`=POS, `G`+`I`=Inventory, `G`+`U`=Users, `G`+`R`=Reports, `G`+`A`=Accounts, `G`+`E`=Employees, `G`+`B`=Banking, `G`+`T`=Tickets, `G`+`O`=Purchase Orders, `G`+`C`=Customers
   - Ignore shortcuts when focus is inside an input/textarea/select
   - Show a small dismissable modal listing all shortcuts when `?` is pressed

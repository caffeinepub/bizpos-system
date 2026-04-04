# BizPOS System — Bookmarks, Favorites Menu & Warehouse Switcher Removal

## Current State
- AppLayout.tsx has a top bar with only a NotificationBell component on the right side.
- There is a `WarehouseSwitcher` component rendered inside the sidebar bottom section, visible only for `currentUser?.isSuperUser`. It appears in both collapsed and expanded states.
- No bookmarks or favorites/pinned menu exists anywhere in the system.
- The sidebar has a `navGroups` array with all 52+ screens across 13 groups.

## Requested Changes (Diff)

### Add
1. **Bookmarks dropdown in the top bar** — a star/bookmark icon button in the top bar (desktop and mobile). Clicking it opens a dropdown listing all user-bookmarked pages. Each item shows the page label and its icon, and clicking it navigates there. A "Manage Bookmarks" or "Add current page" action at the bottom of the dropdown lets users bookmark the current page or remove existing ones. Bookmarks are stored in localStorage under `bizpos_bookmarks_{userId}` as an array of `{ path, label, icon (string name) }`. The bookmark icon in the top bar should show a badge count if bookmarks exist.

2. **Customizable Favorites / Pinned Menu in the top bar** — a separate "Quick Access" or "Favorites" dropdown button in the top bar. This opens a panel showing the user's pinned pages as large clickable tiles/buttons. Users can add any nav item to favorites (via a "Pin to Favorites" option or a dedicated config panel). Favorites are stored in localStorage under `bizpos_favorites_{userId}`. A "Configure" or "Edit Favorites" option within the dropdown lets users toggle which nav items are pinned. This is separate from bookmarks — bookmarks are current-page shortcuts; favorites are a curated quick-access panel.

### Modify
3. **Top bar** — add BookmarkButton and FavoritesButton components to the right side of the top bar (desktop: `hidden md:flex` area; mobile: also add alongside bell). Keep NotificationBell. The top bar should now show: `[left spacer] [FavoritesButton] [BookmarkButton] [NotificationBell] [user info/name]`.

### Remove
4. **WarehouseSwitcher** — remove the `WarehouseSwitcher` component and its two render calls from the sidebar bottom section (both the collapsed and non-collapsed conditionals). The `WarehouseSwitcher` function itself can be deleted. Super users can still switch companies via the existing "Switch Company" / company name button that is already shown in the sidebar bottom. Do NOT remove that.

## Implementation Plan

1. **Remove WarehouseSwitcher**: Delete the `WarehouseSwitcher` function and remove both render calls (`{!collapsed && currentUser?.isSuperUser && <WarehouseSwitcher collapsed={false} />}` and `{collapsed && currentUser?.isSuperUser && <WarehouseSwitcher collapsed={true} />}`) from AppLayout.tsx sidebar bottom section. Remove unused imports if any (`RefreshCw` stays for other uses, check `Building2` is still used elsewhere).

2. **BookmarkButton component** (inside AppLayout.tsx or a new file):
   - Reads `bizpos_bookmarks_{userId}` from localStorage.
   - Renders a `Bookmark` or `Star` icon button with badge showing count.
   - Dropdown lists saved bookmarks with their icons and labels; click navigates.
   - Bottom of dropdown: "Bookmark this page" button — adds current path/label to the list. If already bookmarked, show "Remove bookmark".
   - Bookmarks reference `navGroups` subItems to get the label and icon for any path.
   - Per-item remove (X button on each row).

3. **FavoritesButton component** (inside AppLayout.tsx or a new file):
   - Reads `bizpos_favorites_{userId}` from localStorage.
   - Renders a `Star` or `LayoutGrid` icon button.
   - Dropdown shows pinned pages as a grid of icon+label tiles.
   - "Edit Favorites" section at bottom: shows a list of ALL nav items with a toggle (pin/unpin). User can add/remove from favorites.
   - Clicking a favorite item navigates to it.
   - Stored as array of path strings; labels/icons resolved from `navGroups` subItems.

4. **Wire into top bar**: Add both buttons to the desktop top bar (`hidden md:flex` div) and mobile top bar.

5. All localStorage operations use `currentUser?.id` as the key suffix so favorites/bookmarks are per-user.

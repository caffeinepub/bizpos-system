# BizPOS System

## Current State
Full-stack frontend-only React app with 40+ modules. Auth stored in `bizpos_session` localStorage. Users have `id, name, email, password, roleId, status, createdAt`. Roles have permissions array. No super user concept exists. Warehouses are stored as `bizpos_warehouses`. App uses TanStack Router with AppLayout wrapping all protected routes. AuthContext holds `currentUser` with `id, name, email, roleId, roleName, permissions[]`.

Reports Center (`/reports`) covers: Sales, Purchases, Inventory, Financial, Payroll, HR (leave), Activity (expenses). Missing standard reports: warehouse stock cross-location, inter-warehouse transfers, cheque/bank summary, tax collection, supplier aging, customer aging, attendance summary, leave balance, POS shift closing summary.

## Requested Changes (Diff)

### Add
- **Super User flag** on User model: `isSuperUser: boolean`, `assignedWarehouseIds: string[]` (empty = all warehouses)
- **Warehouse Selection Screen** (`/warehouse-select`): shown after login only for super users, before entering dashboard. Displays all warehouses as tiles/cards with name, location, stock count badge. Clicking a tile selects that warehouse and enters the app in that warehouse's context.
- **Warehouse Switcher** in top bar (AppLayout header): visible only for super users, shows current active warehouse name with a dropdown to switch to any other assigned warehouse mid-session. Switching updates `activeWarehouseId` in session.
- **Super User designation in Users page**: Add "Super User" toggle/checkbox in the Add/Edit User dialog. When enabled, show multi-select for warehouse assignment (or "All Warehouses" option). Badge in users table showing "Super User".
- **AuthContext extension**: add `isSuperUser`, `activeWarehouseId`, `assignedWarehouseIds`, `setActiveWarehouse(id)` to context and session.
- **Missing Reports** in ReportsPage:
  - Warehouse tab: "Stock by Warehouse" cross-location summary, "Inter-Warehouse Transfers" report
  - Banking tab (new category): Cheque Status report, Bank Account Balances, Bank Reconciliation Summary
  - Tax tab (new category): Tax Collection Summary by period/category
  - Supplier tab: Supplier Aging report (overdue balances)
  - Customer tab: Customer Aging report (overdue balances)
  - HR tab additions: Attendance Summary (by month/employee), Leave Balance report
  - POS/Operations tab (new or existing): Shift Closing Summary report

### Modify
- **`User` interface** in `useStore.ts`: add `isSuperUser?: boolean`, `assignedWarehouseIds?: string[]`
- **`AuthUser` interface** in `AuthContext.tsx`: add `isSuperUser: boolean`, `activeWarehouseId: string | null`, `assignedWarehouseIds: string[]`
- **`AuthContext` login function**: read `isSuperUser` and `assignedWarehouseIds` from user record, store in session
- **`AuthContext`**: add `setActiveWarehouse(id: string)` function that updates session
- **App.tsx**: Add `/warehouse-select` route. After login redirect: if `isSuperUser` → `/warehouse-select`, else → `/dashboard`
- **LoginPage**: after successful login, redirect super users to `/warehouse-select` instead of `/dashboard`
- **AppLayout**: add warehouse switcher dropdown in header for super users. Show current warehouse name. On switch, call `setActiveWarehouse`.
- **UsersPage**: add Super User toggle and warehouse multi-select to Add/Edit dialog. Show Super User badge in table.
- **Seed data in useStore.ts**: add `isSuperUser: true` and `assignedWarehouseIds: []` (all warehouses) to admin seed user. Add a dedicated super user seed: `superuser@bizpos.com / super123`.
- **ReportsPage**: add new report tabs/categories for Banking, Tax, and extend existing Warehouse, HR, Supplier, Customer categories.

### Remove
- Nothing removed

## Implementation Plan
1. Update `User` interface and `AuthUser` interface to include super user fields
2. Update `AuthContext` login to populate super user fields + add `setActiveWarehouse`
3. Create `WarehouseSelectPage.tsx` — grid of warehouse tiles, on click sets active warehouse and navigates to dashboard
4. Add `/warehouse-select` route in `App.tsx`, update post-login redirect logic
5. Update `UsersPage.tsx` — super user toggle + warehouse assignment in dialog, Super User badge in table
6. Update `AppLayout.tsx` — warehouse switcher dropdown in header for super users
7. Update seed data to include super user fields and a superuser seed account
8. Extend `ReportsPage.tsx` — add Banking, Tax categories; extend Warehouse (cross-location stock + transfers), HR (attendance summary + leave balance), add Shift Closing report, Supplier Aging, Customer Aging
9. Ensure new localStorage seed version key (`bizpos_seeded_v6`) triggers fresh seed

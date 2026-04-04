# BizPOS System

## Current State
A comprehensive frontend-only POS + ERP system with 60+ screens covering:
- Company → Warehouse → Shop hierarchy
- POS, Sales, Purchases, Inventory, Payments
- Accounting (COA, Journal Entries, Trial Balance, Balance Sheet, P&L)
- HR & Payroll (Employees, Salary, Attendance, Shifts, Departments, Designations)
- Supply Chain (Requisitions, GRN, Transfers, Shipments, Supplier Performance)
- Banking (Banks, Branches, Accounts, Cheque Books, Cheque Templates, Cheque Print, Bank Reconciliation)
- CRM (Customers, Suppliers, Customer Groups)
- Pricing (Taxes, Discounts, Promotions)
- Reports Center (Financial, Sales, Purchase, Inventory, HR, Warehouse, Banking, Tax, Aging, Operations)
- Admin (Users, Roles, Tickets, Logs, Settings)
- Various ancillary pages (Credit/Debit Notes, Returns, Opening Balances, Financial Years, Expense Categories)

Recent fixes applied:
- Sidebar menu highlighting bug (Purchases highlighting Supply Chain, Admin highlighting Warehouse) fixed
- All modals made responsive width (no horizontal scrolling)
- Preferences wired up (compact tables, tooltips, notifications, currency, date format)
- My Activity logs wired to real user actions
- Banking/Pricing/Supply Chain sidebar permission key mismatches fixed
- Route guards and auth flow tightened
- Stock flow end-to-end fixed

## Requested Changes (Diff)

### Add
- Nothing new — this is a full audit and fix pass

### Modify
- Fix ALL remaining UI inconsistencies, broken flows, weird behaviors, and edge cases across every screen
- Ensure every module is correctly linked to the Company → Warehouse → Shop hierarchy
- Ensure sidebar navigation has no duplicate active states anywhere
- Ensure all CRUD operations work (create, edit, delete, view) on every page
- Ensure all modals open correctly with proper sizing and no horizontal scroll
- Ensure all forms have proper validation and don't crash on empty/invalid input
- Ensure all export functions (PDF/Excel) work without errors
- Ensure all table filters work correctly
- Ensure all tabs on multi-tab pages switch correctly
- Ensure all links between related modules work (e.g., clicking warehouse on shops page links back)
- Ensure keyboard shortcuts all work as documented
- Ensure bookmark and favorites features work
- Ensure profile dropdown (Edit Profile, Change Password, Preferences, My Activity) all work
- Ensure seed data loads correctly with proper key `bizpos_seeded_v11` (bump version to fix stale data issues)
- Fix any TypeScript errors that may cause runtime crashes
- Fix any broken imports or missing page references in App.tsx routing
- Ensure RBAC permission checks on every route are consistent
- Fix any issues with the super user company-select flow (no sidebar/header until company selected)
- Ensure POS checkout works correctly end-to-end
- Ensure Bank Reconciliation 4-tab structure works
- Ensure Cheque Templates form works without crashing
- Ensure Cheque Print PDF generation works
- Ensure Reports Center all reports render without error
- Fix any issues with the COA FancyTree (right-click context menus, tree collapse/expand)
- Ensure Supply Chain approval workflow functions correctly
- Ensure Salary Processing generates slips correctly
- Ensure Shift Closing reads from real sales data
- Ensure Attendance module marks and displays attendance correctly
- Ensure Tickets module workflow (Open→Assigned→In Progress→Resolved→Closed) works
- Ensure Attachments work throughout the system
- Ensure notification bell shows correct alerts based on preferences
- Ensure currency preference updates all monetary displays
- Ensure date format preference is applied globally
- Ensure compact table preference applies to all tables
- Fix any broken routes in App.tsx (all 60+ pages must be routed)
- Check for any missing pages that are referenced in sidebar but not in App.tsx

### Remove
- Nothing to remove

## Implementation Plan

1. **Read and audit** App.tsx (routes), AppLayout.tsx (sidebar/nav), AuthContext.tsx (auth/session)
2. **Cross-check** all sidebar links against App.tsx routes — find any missing routes
3. **Check each page file** for obvious crashes, missing imports, broken logic
4. **Fix all identified issues** in a comprehensive batch
5. **Bump seed version** to `bizpos_seeded_v11` to ensure fresh data loads
6. **Validate** (lint + typecheck + build)

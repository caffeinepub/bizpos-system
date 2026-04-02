# BizPOS System — Comprehensive Audit & Fix

## Current State
Fully-built React frontend-only POS + Inventory + Accounting system. Build passes with no TypeScript/lint errors. The system has 50+ pages covering sales, purchases, inventory, HR, banking, supply chain, reports, and more. Data persisted in localStorage under `bizpos_*` keys.

## Requested Changes (Diff)

### Add
- **POS Receipt Modal**: After `handleCompleteSale`, show a printable receipt dialog with transaction details, itemized cart, tax breakdown, totals, and a "Print Receipt" button (uses `window.print()` on a styled receipt card)
- **Dashboard company-scoped KPIs**: Filter today's sales/purchases/items by the warehouses belonging to activeCompanyId
- **Payment method selection at POS checkout**: Let cashier pick Cash/Card/Bank Transfer before completing sale
- **POS barcode scan input**: pressing Enter after typing in search box selects the matching item automatically
- **Stock deduction on POS sale**: call `updateItem` to reduce item quantity when a sale is completed
- **Missing XLSX CDN**: ChartOfAccountsPage uses `(window as any).XLSX` which requires the XLSX library loaded via CDN. Add `<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js">` to index.html if not present
- **Seed banking data check**: BanksPage, BankBranchesPage, BankAccountsPage, ChequeBooksPage, ChequeTemplatesPage all seed from a local constant on first load. Verify seed data includes at least 2-3 entries for immediate usability.
- **Leave Management improvements**: LeaveManagementPage should show leave balance per employee derived from leaveTypes and leaveRequests
- **Salary slip after payroll**: After running payroll, auto-navigate to Salary Slips with success message

### Modify
- **POS Page**: 
  - Add receipt modal after checkout
  - Add payment method dropdown (Cash/Card/Bank Transfer) to cart summary
  - Auto-search on Enter keypress
  - Reduce stock quantity on sale completion using `useStore().updateItem`
- **Dashboard Page**:
  - Filter sales/purchases/items metrics by active company's warehouses
  - Show company name in header
  - Display count of pending purchase orders and pending leave requests as additional KPI cards
- **AppLayout sidebar**: 
  - Add "Leave Management" link under HR group (currently at path `/leave-management` but verify it appears in subItems)
  - Ensure "Tickets" is visible in Admin flyout
- **ChartOfAccountsPage**: 
  - Ensure XLSX is loaded properly (check index.html for the CDN script; if missing, add it)
  - The right-click context menu should use proper event.preventDefault() and handle click-outside to close
- **SettingsPage**: Add a "Clear All Data" button that clears all bizpos_* keys and reloads the page (dev/reset utility)
- **ReportsPage**: 
  - Fix the `?category=` query param parsing — `useLocation` from tanstack-router returns `location.search` as a string, verify parsing is correct
  - Add attendance summary tab under Operations report category
- **All CRUD pages**: Ensure every add/edit/delete action shows a toast notification

### Remove
- Nothing to remove

## Implementation Plan

1. **index.html**: Check and add XLSX CDN script if missing
2. **POSPage.tsx**: 
   - Add `paymentMethod` state (Cash/Card/Bank Transfer)
   - Add receipt modal with sale details
   - On handleCompleteSale: deduct stock via updateItem for each cart item, show receipt modal
   - Handle Enter keypress in search to auto-add first matching item
3. **DashboardPage.tsx**: 
   - Import `useAuth` and filter data by company's warehouse IDs
   - Add company context display
   - Add 2 more KPI cards (pending POs, pending leave requests)
4. **AppLayout.tsx**: 
   - Verify Leave Management is in HR subItems (it should be at path `/leave-management`)
   - Confirm Tickets is in Admin group
5. **SettingsPage.tsx**: Add reset/clear data section
6. **ChartOfAccountsPage.tsx**: Fix XLSX usage to handle CDN loading gracefully with try/catch and user-friendly error if not available
7. **useStore.ts**: Ensure `updateItem` function exists and reduces quantity properly

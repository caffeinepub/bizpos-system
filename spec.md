# BizPOS System — Missing Features Build

## Current State

A comprehensive frontend-only React POS + ERP system with Company → Warehouse → Shop hierarchy. Existing modules:
- Login, Dashboard, POS, Sales, Purchases, Payments, Inventory, Warehouses, Shops, Companies
- Chart of Accounts (4-level, FancyTree), Journal Entries page (basic)
- Customers, Suppliers, Purchase Orders, Supply Chain (5 screens)
- HR: Employees, Departments, Designations, Allowance Types, Salary Processing, Salary Slips, Shifts, Shift Closing, Attendance, Leave Management
- Banking: Banks, Branches, Bank Accounts, Cheque Books, Cheque Templates, Cheque Print, Bank Reconciliation
- Pricing: Taxes, Discounts, Promotions
- Reports Center, Logs, Tickets, Settings
- All data persisted in localStorage with `bizpos_*` keys
- Seed version key: `bizpos_seeded_v8`

## Requested Changes (Diff)

### Add

**Critical Features:**
1. **Manual Journal Entries** (`/journal-entries`) — Full Dr/Cr journal entry form with date, reference, narration, and line items (account from COA, debit/credit amounts). Debit must equal credit to post. List view with filters, edit/delete draft entries, post/unpost. PDF/Excel export.
2. **Customer Ledger** — Tab or side panel on Customers page showing running ledger: invoices, payments, credit notes, outstanding balance per customer. Also accessible as a report.
3. **Supplier Ledger** — Tab or side panel on Suppliers page showing running ledger: purchase invoices, payments, debit notes, outstanding balance per supplier.
4. **Credit Notes** (`/credit-notes`) — For sales returns. Form: select customer, original sale/invoice, items being returned (qty), reason, amount. Creates credit note record, restocks inventory, reduces customer balance.
5. **Debit Notes** (`/debit-notes`) — For purchase returns. Form: select supplier, original purchase, items being returned, reason, amount. Creates debit note record, reduces stock, reduces payable.
6. **Opening Balances** (`/opening-balances`) — Page to set opening balances for COA accounts, customer balances, supplier balances. Date picker for "go-live" date. Import from Excel. Only editable if no transactions posted yet for that account/entity.
7. **Financial Year Management** (`/financial-years`) — CRUD for financial years (name, start date, end date). Ability to close a year (locks all transactions in that period from edits). Status: Open / Closed. Current year indicator.

**Important Features:**
8. **Sales Returns** (`/sales-returns`) — List of all credit notes/returns. Filter by customer, date, status. Link back to original sale.
9. **Purchase Returns** (`/purchase-returns`) — List of all debit notes/returns. Filter by supplier, date, status. Link back to original purchase.
10. **Customer Groups** (`/customer-groups`) — CRUD for groups (Retail, Wholesale, VIP, etc.) with default discount %. Assign customers to groups. POS and sales apply group discount automatically.
11. **Barcode Generation** — On Items page, each item gets a "Generate Barcode" button. Opens modal with barcode image (Code128 format using a JS barcode library like JsBarcode). Print button sends to printer. Batch barcode print for selected items.
12. **Reorder Levels & Alerts** — On Items page, add Reorder Level and Reorder Qty fields per item. In-app notification bell (top bar) shows count of items below reorder level. Notifications dropdown lists each low-stock item with current qty vs reorder level. Also shown as a dashboard widget.
13. **Expense Management** (`/expenses`) — Record operational expenses (utilities, rent, salaries paid, etc.) with date, category, amount, payment method, COA account, description, attachments. Expense Categories CRUD. Monthly summary view. PDF/Excel export.

**UX/Minor Features:**
14. **Dashboard KPI Drill-Down** — Each KPI card on dashboard (Total Sales, Total Purchases, etc.) is clickable and navigates to the corresponding filtered report/list page.
15. **Notifications/Alerts Center** — Bell icon in top bar. Shows: low stock items, pending purchase requisition approvals, overdue payments, upcoming promotions expiring. Clickable notifications navigate to relevant page. Mark as read functionality.
16. **Audit Trail on Records** — Every saved record (sales, purchases, employees, etc.) shows "Created by [user] on [date]" and "Last modified by [user] on [date]" in detail/edit views.
17. **Bulk Actions in Tables** — Add checkbox column to all major tables (Sales, Purchases, Items, Customers, Suppliers, Employees). Bulk actions toolbar appears when rows selected: Bulk Delete, Bulk Export (PDF/Excel), Bulk Status Change where applicable.
18. **Print-Friendly Invoice Views** — Sales invoices, purchase orders, and GRNs get a "View/Print" button that opens a formatted modal with company header, logo, all line items, totals, terms. Print button triggers window.print() on that modal only.
19. **Password Reset / Change Password** — "Forgot Password" link on login page (since frontend-only, it shows a modal to enter email — if found in users list, shows the password hint or resets to a default and shows it). Change Password option in user profile/settings.

### Modify

- **App.tsx** — Add routes for all new pages: `/journal-entries`, `/credit-notes`, `/debit-notes`, `/opening-balances`, `/financial-years`, `/sales-returns`, `/purchase-returns`, `/customer-groups`, `/expenses`, `/expense-categories`
- **AppLayout.tsx** — Add new sidebar items:
  - Accounting group: Journal Entries, Opening Balances, Financial Years
  - Sales group: Sales Returns, Credit Notes
  - Purchases group: Purchase Returns, Debit Notes
  - Inventory group: Barcode Print (or as action on Items page)
  - HR/Expenses: Expenses module under a new "Finance" or existing group
  - Customer Groups under Customers
  - Notifications bell in top bar
- **DashboardPage.tsx** — Make KPI cards clickable with navigation links. Add low-stock alert widget.
- **CustomersPage.tsx** — Add Ledger tab showing customer transactions and running balance.
- **SuppliersPage.tsx** — Add Ledger tab showing supplier transactions and running balance.
- **ItemsPage.tsx** — Add Reorder Level/Reorder Qty fields. Add barcode generation button per row.
- **LoginPage.tsx** — Add Forgot Password link.
- **Seed data** — Bump seed version to `bizpos_seeded_v9`, add sample data for new modules: journal entries, credit notes, debit notes, customer groups, expenses, financial years, opening balances.
- **ReportsPage.tsx** — Add reports for: Sales Returns, Purchase Returns, Customer Ledger summary, Supplier Ledger summary, Expense Summary, Journal Entry Listing.

### Remove

- Nothing removed.

## Implementation Plan

1. Create new page files for all new routes (Journal Entries, Credit Notes, Debit Notes, Opening Balances, Financial Years, Sales Returns, Purchase Returns, Customer Groups, Expenses, Expense Categories)
2. Update App.tsx with new routes
3. Update AppLayout.tsx with new sidebar items and notification bell
4. Update DashboardPage.tsx for clickable KPIs and low-stock widget
5. Update CustomersPage.tsx and SuppliersPage.tsx with Ledger tabs
6. Update ItemsPage.tsx with reorder levels and barcode generation
7. Update LoginPage.tsx with forgot/change password
8. Update seed data (bump to v9) with sample records for all new modules
9. Update ReportsPage.tsx with new report types
10. Add JsBarcode library usage via CDN/import for barcode generation
11. All localStorage keys follow `bizpos_*` prefix convention

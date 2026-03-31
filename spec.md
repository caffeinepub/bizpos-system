# BizPOS System

## Current State
A comprehensive frontend-only (localStorage) POS/ERP system with 40+ screens including HR, Accounting, Supply Chain, Bank Management, Inventory, Sales, POS, Reporting, and more. Uses React + TanStack Router, blue/white/green palette, flyout sidebar navigation.

## Requested Changes (Diff)

### Add
1. **Daily Attendance Module** (`/attendance`)
   - Simple daily mark per employee: Present / Absent / Half-Day
   - Date-based view (default today, can navigate by date)
   - Table of all active employees with attendance status dropdowns
   - Save/submit attendance for a given date
   - Monthly attendance summary view per employee
   - Filters: date, department, status
   - Excel and PDF export
   - LocalStorage key: `bizpos_attendance`

2. **Ticket Management Module** (`/tickets`)
   - Both IT helpdesk (internal) and customer support tickets
   - Fields: ticket ID, type (IT/Customer), title, description, priority (Low/Medium/High/Critical), status (Open → Assigned → In Progress → Resolved → Closed), assignee, reporter, related customer (optional), created date, updated date
   - Status workflow: Open → Assigned → In Progress → Resolved → Closed
   - Two tabs: All Tickets, Create/Edit
   - Filters: type, status, priority, assignee, date range
   - Ticket detail view with status change, comments/notes timeline
   - Excel and PDF export
   - LocalStorage key: `bizpos_tickets`

3. **Attachments System** (added to key modules)
   - File upload component (supports images, PDFs, docs up to 5MB stored as base64)
   - Attachments tab or section on: Employees, Purchases, Sales, Purchase Orders, Tickets, Leave Management, Expenses, Journal Entries, Suppliers, Customers
   - Display attached files with name, size, type icon, preview (images), download button
   - LocalStorage keys: `bizpos_attachments_{module}_{recordId}`

### Modify
- **AppLayout.tsx**: Add `attendance` and `tickets` routes to HR and a new Support group in sidebar
- **App.tsx**: Add routes for `/attendance` and `/tickets`
- **Employees, Purchases, Sales, PO, Leave, Expenses, Journal Entries, Suppliers, Customers pages**: Add Attachments tab/section
- **RolesPage**: Add `attendance` and `tickets` permission keys

### Remove
- Nothing removed

## Implementation Plan
1. Create `AttendancePage.tsx` — daily mark UI, monthly summary, filters, export
2. Create `TicketsPage.tsx` — ticket list with status workflow, detail panel, comments, filters, export
3. Create `AttachmentManager.tsx` component — reusable file upload/view/download widget using base64 localStorage
4. Add attachment section to: EmployeesPage, PurchasesPage, SalesListPage, PurchaseOrdersPage, LeaveManagementPage, ExpensesPage, JournalEntriesPage, SuppliersPage, CustomersPage, TicketsPage
5. Update AppLayout.tsx — add Attendance to HR submenu, add Tickets to a Support group
6. Update App.tsx — register /attendance and /tickets routes
7. Update RolesPage — add attendance and tickets permission checkboxes
8. Seed realistic data: 30 days of attendance for 5 employees, 10 sample tickets

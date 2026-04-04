# BizPOS System

## Current State

BizPOS is a comprehensive frontend-only POS/ERP system with 60+ screens covering: Auth/Company hierarchy, POS, Sales, Purchases, Inventory (Items, Categories, Brands, Units, Variants), Customers/Suppliers, Pricing (Taxes, Discounts, Promotions), Accounting (COA, Journal Entries, Opening Balances, Financial Years), Banking (Banks, Branches, Accounts, Cheque Books, Templates, Print, Reconciliation), HR/Payroll (Employees, Departments, Designations, Allowances, Salary, Shifts, Attendance, Leave), Supply Chain (Requisitions, GRNs, Transfers, Shipments, Supplier Performance), Admin (Users, Roles, Tickets, Logs, Settings), and Reports (20+ report types). All data is in localStorage.

## Requested Changes (Diff)

### Add
- **Stock Movement Ledger**: Add a `StockMovement` interface and `bizpos_stock_movements` localStorage key. Record movements when: POS sale (type=Sale, qty=negative), Purchase received (type=Purchase, qty=positive), Stock Adjustment (type=Adjustment), GRN confirmed (type=GRN), Inventory Transfer (type=Transfer-Out / Transfer-In). On the Items page, add a "Ledger" tab (next to Variants) showing movement history per item with columns: Date, Type, Reference, Qty Change, Qty After, Notes.
- **Expense Categories integration**: The `Expense` interface is missing `categoryId` and `categoryName`. The `ExpensesPage` doesn't use the category from `bizpos_expense_categories`. Add fields, update the Add/Edit form to include a Category dropdown (loaded from `bizpos_expense_categories`), and show Category in the table and exports.
- **Customer Group linkage**: The `Customer` interface is missing `groupId` and `groupName`. The CustomersPage Add/Edit form doesn't have a Customer Group dropdown. Add fields, update form to include Group dropdown from `bizpos_customer_groups`, show group in the table. Seed customers should have groupId assigned.

### Modify
- **Sale interface + seed data**: Add fields `taxAmount?: number`, `promoSavings?: number`, `shopName?: string`, `paymentMethod?: string` to the `Sale` interface. Update POSPage to save these fields when creating a sale (they are already computed but not saved to the Sale record). Fix seed sale data: `shopId: "shop-001"` should be `shopId: "shop1"` to match the actual seed shop IDs. Add `shopName`, `paymentMethod`, `taxAmount`, `promoSavings` to seed sales.
- **SaleDetailPage**: Update to display Shop Name, Tax Amount, Promo Savings, and Payment Method. Currently only shows discount but not the full breakdown. Show the full financial breakdown: Subtotal → Manual Discount → Promo Savings → Taxable Amount → Tax → Total (same as POS receipt). Show Shop Name alongside Warehouse Name.
- **SalesListPage**: Add Shop column (look up from shops array using sale.shopId). Currently shows customer and warehouse but not the shop it was sold from.
- **PurchaseOrder seed data**: Seed POs use `supplierId: "sup-1"` and `"sup-2"` but actual seed suppliers have IDs `"sup-001"` and `"sup-002"`. Fix the PO seed data to use correct supplier IDs.
- **Reports export headers**: Currently hardcoded as `companyName: "BizPOS System"`. Should dynamically read the active company name from the user session's `activeCompanyId` and look up the company name. Fall back to settings.companyName.
- **Reports page**: The Sales report should also show tax amount and promo savings columns. The Expense report should show Category column.
- **Dashboard**: The chart currently uses synthetic/fake data (trigonometric approximations). Update to use actual daily aggregated data from the last 7 days: iterate through `filteredSales` and group by `saleDate`. Same for purchases.
- **Warehouse Stock page**: Ensure it filters correctly by the user's assigned company warehouses.
- **Accounting / Journal Entries**: When saving a Journal Entry, validate that debit total equals credit total (standard double-entry rule). If they don't balance, show an error and prevent saving.
- **Financial Years**: Add a check when saving a Journal Entry or Opening Balance — if a financial year is Closed, block transactions that fall within that closed period. Show a clear error message.
- **ItemsPage**: In the filter bar, add a "Warehouse" filter for admins scoped to company warehouses only (not all warehouses from all companies). Currently shows all warehouses across all companies.
- **POS**: When completing a sale, also record a Stock Movement entry for each item sold (type=Sale, qty=-quantity, reference=saleId).
- **Purchase received**: When a purchase status changes to Received, record Stock Movement entries (type=Purchase, qty=+quantity, reference=purchaseId).
- **GRN confirmed**: When GRN is accepted, record Stock Movement entries (type=GRN, qty=+acceptedQty, reference=grnNo).
- **Stock Adjustment**: When a stock adjustment is saved, record a Stock Movement entry (type=Adjustment, qty=adjustedQty, reference=adjustmentId).
- **Inventory Transfer completed**: When transfer moves to Completed, record Transfer-Out and Transfer-In movements.
- **AppLayout / Sidebar**: The Reports group `module: "reports"` must resolve to a permission key that exists in ALL_PERMS. Currently `"reports"` is in ALL_PERMS so this is fine. But the Accounting group (COA, Journal, Opening Balances etc.) is missing from navGroups entirely! Add an Accounting group to the sidebar with: Chart of Accounts, Journal Entries, Opening Balances, Financial Years, Expenses, Expense Categories, Trial Balance, Balance Sheet, Profit & Loss.
- **Roles RBAC**: The ALL_PERMS list in v11 seed includes `"attachments"` but there is no sidebar entry with `module: "attachments"`. This is fine (it's a feature flag), but ensure all 63 screen paths actually have a corresponding permission in the roles matrix.
- **Seed data — customer groups**: Update seed customers to have `groupId: "cg1"` (Retail) so the linkage is seeded from day one.

### Remove
- Nothing to remove.

## Implementation Plan

1. **useStore.ts changes:**
   - Add `StockMovement` interface and `KEYS.stockMovements = "bizpos_stock_movements"` key.
   - Add `stockMovements` to StoreState, readAll, and export `addStockMovement` action.
   - Update `Sale` interface: add `taxAmount?: number`, `promoSavings?: number`, `shopName?: string`, `paymentMethod?: string`.
   - Update `Customer` interface: add `groupId?: string`, `groupName?: string`.
   - Update `Expense` interface: add `categoryId?: string`, `categoryName?: string`.
   - Fix seed sales: `shopId: "shop1"` (was `shop-001`).
   - Fix seed POs: `supplierId: "sup-001"` and `"sup-002"`.
   - Update seed customers to include `groupId: "cg1"`.
   - In `addSale`, after saving items and sale, also call `addStockMovement` for each sold item.
   - In `updatePurchase`, when status becomes Received, call `addStockMovement` for each item.
   - Seed v13 initialization for stock_movements.

2. **POSPage.tsx**: When building the Sale object for `addSale()`, include `taxAmount`, `promoSavings`, `shopName`, `paymentMethod` fields.

3. **SaleDetailPage.tsx**: Show full financial breakdown (subtotal, promoSavings, taxAmount, discount, total). Show shopName. Show paymentMethod.

4. **SalesListPage.tsx**: Add a "Shop" column to the table.

5. **CustomersPage.tsx**: Add `groupId`/`groupName` fields. Add Customer Group dropdown to form. Show group name in table.

6. **ExpensesPage.tsx**: Add `categoryId`/`categoryName` fields. Add Category dropdown to form. Show category in table and exports.

7. **ItemsPage.tsx**: Add a "Ledger" tab showing stock movements for the selected item. Call `addStockMovement` on save if adding manually (not needed — movements come from transactions). Fix warehouse filter to show company-scoped warehouses for admins.

8. **AppLayout.tsx**: Add an **Accounting** nav group with sub-items for COA, Journal Entries, Opening Balances, Financial Years, Expenses, Expense Categories, Trial Balance, Balance Sheet, Profit & Loss. This is currently accessible only via the sidebar's direct links but not under a logical group.

9. **ReportsPage.tsx**: Use active company name for export headers. Update Sales report to include taxAmount and promoSavings columns if available. Update Expense report to include category column.

10. **DashboardPage.tsx**: Replace synthetic chart data with real daily aggregated totals from the last 7 calendar days.

11. **JournalEntriesPage.tsx**: Add debit/credit balance validation before save.

12. **GoodsReceiptPage.tsx**: On GRN acceptance, record stock movement entries.

13. **StockAdjustmentPage.tsx**: On save, record stock movement entries.

14. **InventoryTransfersPage.tsx**: On transfer completion, record Transfer-Out and Transfer-In stock movement entries.

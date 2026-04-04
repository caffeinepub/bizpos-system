# BizPOS System — Chart of Accounts Full Integration

## Current State

The BizPOS system has a functional Chart of Accounts (COA) with a 4-level hierarchy, and a Journal Entries module where accountants can post manual Dr/Cr entries. The Trial Balance, P&L, and Balance Sheet all read from `journalEntries` (for Trial Balance) or `account.currentBalance` (for P&L and Balance Sheet).

**Critical gaps identified:**
- `addSale`, `addPurchase`, `addPayment`, `addExpense`, `addPayroll`, `addBankTransaction`, and `updateGoodsReceiptNote` do NOT auto-generate journal entries in the COA.
- `account.currentBalance` on P&L/Balance Sheet is static seed data — it does not reflect live transactions.
- Items and Item Categories have no account mapping fields (Inventory Asset account, COGS account, Sales Revenue account).
- There is no system-wide default account mapping config (e.g., which account is the default Cash account, A/R, A/P, etc.).
- The Trial Balance only works if journal entries exist; P&L and Balance Sheet use stale `currentBalance` fields instead of live journal-entry aggregation.
- Payroll processing does not post to Salaries Expense / Salaries Payable accounts.
- Bank transactions do not create corresponding journal entries.
- Expenses posted to the Expenses module do not auto-create journal entries.
- Returns (sales/purchase returns, credit notes, debit notes) do not reverse journal entries.

## Requested Changes (Diff)

### Add
- `AccountMapping` interface and localStorage key `bizpos_account_mapping` — system-wide default account assignments (Cash, Bank, A/R, A/P, Inventory, COGS, Sales Revenue, Sales Tax Payable, Salary Expense, Salary Payable, Purchase Expense)
- `AccountMappingPage` at `/account-mapping` — UI for admins to configure default account mappings
- Auto-posting engine: `postAutoJournal(entry)` helper in useStore that creates a JournalEntry AND updates `currentBalance` on affected accounts simultaneously
- `inventoryAccountId`, `cogsAccountId`, `salesAccountId` fields on `ItemCategory` interface
- Account mapping fields on Item Categories page — dropdowns to map categories to Inventory, COGS, and Sales Revenue accounts
- Seed data updates: wire existing seed accounts to the mapping config with sensible defaults
- New seed leaf accounts: `ACCOUNTS RECEIVABLE` (Asset), `ACCOUNTS PAYABLE` (Liability, already exists as `acc-300-02-01-0001`), `SALES TAX PAYABLE` (Liability), `INVENTORY ASSET` (Asset), `PURCHASE EXPENSES` (Expense)

### Modify
- `addSale` in useStore: after saving sale, call `postAutoJournal` to create:
  - Dr Accounts Receivable (or Cash if cash sale) / Cr Sales Revenue (by category mapping)
  - Dr COGS / Cr Inventory Asset (by category mapping)
  - Dr Sales Revenue / Cr Sales Tax Payable (for tax portion)
- `addPurchase` / `updatePurchase` (when status → Received): call `postAutoJournal`:
  - Dr Inventory Asset / Cr Accounts Payable
- `addPayment` (customer payment received): call `postAutoJournal`:
  - Dr Cash/Bank / Cr Accounts Receivable
- `addExpense`: call `postAutoJournal`:
  - Dr Expense Account (from expense.accountId) / Cr Cash (from payment method)
- `addPayroll` / finalize payroll: call `postAutoJournal`:
  - Dr Salary Expense / Cr Salary Payable
  - On payment: Dr Salary Payable / Cr Cash/Bank
- `addBankTransaction`: call `postAutoJournal`:
  - Deposit: Dr Bank Account / Cr mapped source account
  - Withdrawal: Dr mapped target account / Cr Bank Account
- `updateGoodsReceiptNote` (status → Confirmed): call `postAutoJournal`:
  - Dr Inventory Asset / Cr Accounts Payable
- `addSalesReturn` / `addCreditNote`: reverse the original sale journal entry
- `addPurchaseReturn` / `addDebitNote`: reverse the original purchase journal entry
- `ItemCategory` interface: add `inventoryAccountId`, `cogsAccountId`, `salesAccountId` optional fields
- `TrialBalancePage`: already reads from journalEntries — now will have real data
- `ProfitLossPage`: switch from `account.currentBalance` to live aggregation from journalEntries grouped by account type
- `BalanceSheetPage`: switch from `account.currentBalance` to live aggregation from journalEntries
- `ChartOfAccountsPage`: show a "running balance" computed from journalEntries rather than the static `currentBalance` field
- `ItemCategoriesPage`: add account mapping dropdowns
- Sidebar: add Account Mapping link under Accounting group
- Seed data: bump to `bizpos_seeded_v14`, add missing leaf accounts, wire default account mapping

### Remove
- Nothing removed; all existing functionality preserved

## Implementation Plan

1. **Add `AccountMapping` interface and KEYS.accountMapping** to useStore
2. **Add `postAutoJournal` helper** in useStore — creates JournalEntry AND updates `currentBalance` on each affected account in a single atomic localStorage operation
3. **Add `getDefaultAccountMapping` / `saveAccountMapping`** functions exposed from useStore
4. **Update `ItemCategory` interface** with optional account mapping fields
5. **Modify `addSale`** to call `postAutoJournal` with correct Dr/Cr lines using category account mappings
6. **Modify `addPurchase` / `updatePurchase`** to call `postAutoJournal` on receive
7. **Modify `addPayment`** to call `postAutoJournal` (Dr Cash/Bank, Cr A/R)
8. **Modify `addExpense`** to call `postAutoJournal` (Dr Expense Account, Cr Cash)
9. **Modify `addPayroll`** to call `postAutoJournal` (Dr Salary Expense, Cr Salary Payable)
10. **Modify `addBankTransaction`** to call `postAutoJournal`
11. **Modify `updateGoodsReceiptNote`** to call `postAutoJournal` on confirmation
12. **Update `ProfitLossPage`** and **`BalanceSheetPage`** to compute balances live from journalEntries
13. **Create `AccountMappingPage`** with dropdowns for each system account role
14. **Update `ItemCategoriesPage`** with account mapping columns
15. **Add new leaf accounts** to seed data (A/R, Inventory Asset, Sales Tax Payable)
16. **Add default account mapping** to seed data
17. **Bump seed key** to `bizpos_seeded_v14`
18. **Add Account Mapping route and sidebar link**

# BizPOS System — Full Workflow Audit & Fix

## Current State

BizPOS is a comprehensive frontend-only POS/ERP system with 63+ screens covering sales, purchases, inventory, accounting (COA), banking, HR/payroll, supply chain, and reporting. Data is persisted in localStorage under `bizpos_*` keys. The system uses an auto-posting engine (`postAutoJournal`) in `useStore.ts` to create double-entry journal entries and update `currentBalance` on COA accounts whenever transactions occur.

## Audit Findings — Issues to Fix

### Critical Data Flow Breaks

1. **Credit Notes (Sales Returns) — no accounting integration**: When a credit note is posted, it restocks inventory (`adjustStock`) but does NOT post any journal entry. Standard: Dr Sales Revenue / Cr Accounts Receivable (reversal of original sale).

2. **Debit Notes (Purchase Returns) — no accounting integration**: When a debit note is posted, it removes stock (`adjustStock(-qty)`) but does NOT post any journal entry. Standard: Dr Accounts Payable / Cr Inventory Asset.

3. **GRN (Goods Receipt Note) — no journal or stock update**: When GRN status becomes Accepted/Partially Accepted, neither the inventory stock nor any journal entry is updated. The store's `addGoodsReceiptNote` / `updateGoodsReceiptNote` have no accounting or stock logic.

4. **Opening Balances — wrong localStorage key**: `OpeningBalancesPage` writes to `bizpos_accounts_v3` but the store uses `KEYS.accounts = 'bizpos_accounts_v3'` — this is actually correct. However the page directly writes to localStorage bypassing `updateAccount`, so `postAutoJournal` is never called and the `currentBalance` field is updated but `openingBalance` changes don't cascade.

5. **Supplier Payments — no dedicated workflow**: The `ReceivePaymentPage` only handles customer payments (sale outstanding balance). There is no UI or workflow for recording supplier payments (settling purchase invoices / Accounts Payable). Standard: Dr Accounts Payable / Cr Cash.

6. **Inventory Transfers — stock not actually updated**: When a transfer is completed, `addStockMovement` records the log entries but the actual `item.quantity` is never decremented from the source warehouse or incremented in the destination warehouse. The items stay with their original quantities.

7. **Stock Adjustment — no journal entry**: Adjustments record a stock movement log and update `item.quantity` but don't post a journal entry. Standard: Dr/Cr Inventory Asset / Cr/Dr Inventory Adjustment (Expense).

8. **Payroll to Salary Slip — disconnected**: `addPayroll` auto-posts journal (Dr Salary Expense / Cr Salaries Payable) when Finalized, but `addSalarySlip` (individual slip) has no journal posting and the two are not linked.

9. **Payment to Sale: wrong journal when sale type is Cash**: When a Cash sale is completed, the POS posts Dr Cash / Cr Revenue (correct). But if a separate payment is then recorded via ReceivePaymentPage for that same sale, it posts Dr Cash / Cr AR again — double-counting. The payment page should only handle Credit sales that have a balance due.

10. **GRN stock movement `quantityAfter` is always 0**: The transfer completion block sets `quantityAfter: 0` instead of computing the real post-transfer quantity.

11. **Export headers use hardcoded "BizPOS System"** instead of the active company name in several pages (PurchasesPage, etc.).

12. **Seed data version key**: The latest seed data uses `bizpos_seeded_v14`. Need to bump to `bizpos_seeded_v15` to re-seed with any corrections.

## Requested Changes (Diff)

### Add
- Supplier payment recording in the store: new `addSupplierPayment(payment)` function that posts Dr AP / Cr Cash journal automatically
- Supplier payments tab/section in PaymentHistoryPage or a new `/supplier-payments` route
- Stock Adjustment journal posting in `adjustStock` or in StockAdjustmentPage on save
- GRN acceptance journal + stock update in `updateGoodsReceiptNote` when status transitions to Accepted
- `postJournalEntry` exported helper function so CreditNotesPage and DebitNotesPage can call it without going through `useStore` (they manage their own localStorage directly)

### Modify
- `useStore.ts` — `updateGoodsReceiptNote`: when status changes to Accepted or Partially Accepted, increment inventory and post Dr Inventory / Cr AP journal
- `useStore.ts` — `updateInventoryTransfer`: when status changes to Completed, decrement source warehouse items and increment destination warehouse items (currently only logs movements, doesn't update quantities)
- `useStore.ts` — expose `postAutoJournal` as `postJournalEntry` in the return object so external pages can call it
- `CreditNotesPage.tsx` — on post: call `postJournalEntry(Dr AR / Cr Revenue)` via store
- `DebitNotesPage.tsx` — on post: call `postJournalEntry(Dr AP / Cr Inventory)` via store
- `OpeningBalancesPage.tsx` — on save: use store `updateAccount` for each account entry so balance cascades properly; also save opening balance for customers/suppliers
- `ReceivePaymentPage.tsx` — add validation to only show credit sales (balanceDue > 0), and also add a separate section for supplier payments with a purchase selector
- `StockAdjustmentPage.tsx` — on save: call `postJournalEntry` for the adjustment (Dr Inventory / Cr Expense or vice versa)
- `InventoryTransfersPage.tsx` — on Complete: also update item quantities (decrement from source, increment to destination)
- All export headers: use active company name from store settings

### Remove
- Nothing is removed

## Implementation Plan

1. **useStore.ts changes**:
   - In `updateGoodsReceiptNote`: detect status transition to Accepted/Partially Accepted → increment accepted qty on items → post Dr Inventory / Cr AP journal
   - In `updateInventoryTransfer`: detect status transition to Completed → update item quantities (decrement source, increment destination)
   - Export `postAutoJournal` as `postJournalEntry` in the return object
   - Add `addSupplierPayment(payment)` action that saves to `bizpos_supplier_payments` and posts Dr AP / Cr Cash journal

2. **CreditNotesPage.tsx**: on posting, call `store.postJournalEntry` with Dr Accounts Receivable reversal / Cr Sales Revenue reversal (negative sale reversal)

3. **DebitNotesPage.tsx**: on posting, call `store.postJournalEntry` with Dr Accounts Payable / Cr Inventory Asset

4. **StockAdjustmentPage.tsx**: on save, call `store.postJournalEntry` for the inventory adjustment

5. **InventoryTransfersPage.tsx**: on Complete action, also update `item.quantity` using `store.updateItem` for affected items

6. **OpeningBalancesPage.tsx**: fix to call `store.updateAccount` for each account entry, bypassing direct localStorage writes

7. **PaymentHistoryPage.tsx / ReceivePaymentPage.tsx**: add supplier payment section that selects a purchase invoice and records the payment with proper AP journal entry

8. Bump seed version to `bizpos_seeded_v15`

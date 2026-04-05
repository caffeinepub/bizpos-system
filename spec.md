# BizPOS System

## Current State
The BizPOS system is a feature-complete frontend-only POS/ERP system with 60+ screens. The following specific issues exist:

1. **Return procedure (CreditNotesPage, DebitNotesPage)**: The "Original Sale Reference" and "Original Purchase Reference" fields are plain text inputs requiring manual entry. Users must type e.g. `SALE-2026-001` manually. The item selection in the return items table is a basic dropdown without search, making it hard to find items in long lists.

2. **Tax Management (TaxesPage)**: When "Specific Categories" is selected as the applies-to type, categories are entered as a comma-separated text string (e.g. `Electronics, Food`). This is error-prone and unfriendly.

3. **Sidebar submenu hover/sticky bug (AppLayout)**: After hovering a sidebar group to show the flyout submenu, then moving the mouse away (not over the flyout), the submenu sometimes stays visible. The `clearFlyout` with 80ms timeout can miss edge cases where the mouse leaves the sidebar button but never enters the flyout panel.

4. **ItemCategoriesPage modal overflow**: The Add/Edit Category dialog uses `className="w-full max-w-[95vw] sm:max-w-2xl"` but has NO `max-h` or `overflow-y` constraint. When the content is tall (accounting section expanded, many fields), the modal overflows the screen vertically.

## Requested Changes (Diff)

### Add
- A searchable combobox component (using Command+Popover pattern from shadcn) for use in return forms and tax categories
- Sale reference searchable dropdown in CreditNotesPage: when customer is selected, load matching sales from localStorage and present as searchable dropdown. Selecting a sale auto-populates the sale ref AND pre-fills the return items from that sale
- Purchase reference searchable dropdown in DebitNotesPage: when supplier is selected, load matching purchases from localStorage and present as searchable dropdown. Selecting a purchase auto-populates the purchase ref AND pre-fills the return items from that purchase
- Multi-select searchable category dropdown in TaxesPage when "Specific Categories" is selected
- Multi-select searchable category dropdown in DiscountsPage if similar comma-type input exists
- Multi-select searchable category dropdown in PromotionsPage if similar comma-type input exists

### Modify
- **CreditNotesPage**: Replace "Original Sale Reference" text input with a searchable dropdown of sales (filtered by selected customer). On sale selection, auto-populate return items from that sale's items (with original price). Keep item qty editable. Add search capability to the item select dropdowns (use Command pattern)
- **DebitNotesPage**: Replace "Original Purchase Reference" text input with a searchable dropdown of purchases (filtered by selected supplier). On purchase selection, auto-populate return items. Add search to item select dropdowns.
- **TaxesPage**: Replace comma-separated categories Input with a multi-select searchable dropdown using item categories from store. Display selected categories as removable badges.
- **AppLayout sidebar flyout**: Increase the clearFlyout timeout from 80ms to 200ms AND add a `pointer-events-none` invisible bridge gap between the sidebar button and the flyout panel to prevent gaps causing the flyout to close. Also add a global click handler so clicking anywhere outside closes the flyout.
- **ItemCategoriesPage DialogContent**: Add `max-h-[90vh] overflow-y-auto` to the dialog content className. This should only apply to this specific dialog, not globally. Do NOT change the base dialog.tsx component.

### Remove
- Plain text input for "Original Sale Reference" in CreditNotesPage
- Plain text input for "Original Purchase Reference" in DebitNotesPage  
- Comma-separated text input for categories in TaxesPage

## Implementation Plan
1. Create a reusable `SearchableSelect` combobox component (Command + Popover) in `src/frontend/src/components/ui/searchable-select.tsx`
2. Create a reusable `MultiSelect` component for multi-select with search and badge display in `src/frontend/src/components/ui/multi-select.tsx`
3. Update CreditNotesPage: add sale lookup function from localStorage, add saleSearch state, replace saleRef input with searchable sale dropdown, auto-populate items on sale select, add search to item dropdowns
4. Update DebitNotesPage: same pattern but for purchases/suppliers
5. Update TaxesPage: replace categories comma input with MultiSelect using itemCategories from store
6. Update AppLayout: fix flyout timeout to 200ms, improve hover bridge gap logic
7. Update ItemCategoriesPage DialogContent: add max-h and overflow-y to the specific dialog

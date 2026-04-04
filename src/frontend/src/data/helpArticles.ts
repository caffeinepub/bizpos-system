export interface HelpArticle {
  id: string;
  title: string;
  icon: string;
  summary: string;
  sections: { heading: string; content: string }[];
}

const articles: Record<string, HelpArticle> = {
  dashboard: {
    id: "dashboard",
    title: "Dashboard",
    icon: "LayoutDashboard",
    summary:
      "The Dashboard is your central command center. It shows real-time KPIs, sales trends, low-stock alerts, and pending actions for your active company.",
    sections: [
      {
        heading: "Key Performance Indicators (KPIs)",
        content:
          "The top row of cards shows Today's Sales, Total Purchases, Total Customers, Total Suppliers, Pending POs, and Total Items — all filtered to your active company. Click any card to navigate to the relevant report.",
      },
      {
        heading: "Sales Chart",
        content:
          "The line/bar chart shows daily sales totals for the last 7 days. Data is pulled from completed POS and invoice sales. The chart updates automatically as new sales are recorded.",
      },
      {
        heading: "Low Stock Alerts",
        content:
          "Items that have fallen at or below their reorder level appear here. Click any alert to go to the Items page and take action. You can configure reorder levels per item in Inventory → Items.",
      },
      {
        heading: "Pending Approvals",
        content:
          "Purchase Requisitions awaiting approval are listed here. Click to navigate directly to the requisition. Only users with the Purchase Requisitions permission will see this section.",
      },
      {
        heading: "Navigation Tips",
        content:
          "Use keyboard shortcut G → D to jump to the Dashboard from anywhere. The active company name is shown in blue below the page title. Super users can click it to switch companies.",
      },
    ],
  },

  pos: {
    id: "pos",
    title: "Point of Sale (POS)",
    icon: "ShoppingCart",
    summary:
      "The POS screen is where cashiers process customer sales. It supports barcode scanning, category-wise item browsing, discounts, promotions, multiple payment methods, hold/resume, and receipt printing.",
    sections: [
      {
        heading: "Selecting a Shop",
        content:
          "On first use, POS asks you to select the shop you are operating from. Your selection is saved and remembered on future visits. Admins see all available shops; cashiers only see their assigned shop. Use the 'Change Shop' button in the header to switch.",
      },
      {
        heading: "Finding Items",
        content:
          "Search by item name, SKU, or barcode using the search box. Items are displayed category-wise in sequence order. Click a category tab to filter. Scan a barcode and the item is added instantly.",
      },
      {
        heading: "Cart Management",
        content:
          "Click an item to add it to the cart. Adjust quantities using + / − buttons. Apply a manual discount percentage in the cart summary. Select a customer to auto-apply their Customer Group discount.",
      },
      {
        heading: "Promotions & Taxes",
        content:
          "Active promotions apply automatically when you add qualifying items. The cart breakdown shows: Subtotal → Manual Discount → Promo Savings → Taxable Amount → Tax → Total. Taxes are calculated per item based on assigned tax rates.",
      },
      {
        heading: "Payment Methods",
        content:
          "Select Cash, Card, or Bank Transfer before completing the sale. You can split payment across methods by recording partial amounts. The balance due is shown in real-time.",
      },
      {
        heading: "Hold & Resume Sale",
        content:
          "Click 'Hold' to park the current cart. A badge shows the number of held sales. Click 'Held Sales' to view, resume, or delete any held cart. Held sales are saved per shop per user.",
      },
      {
        heading: "Completing a Sale",
        content:
          "Click 'Complete Sale' to finalize. A receipt modal appears with the sale ID, cashier, shop, itemized cart, and full financial breakdown. Use 'Print Receipt' to print or 'New Sale' to start fresh.",
      },
      {
        heading: "Cash Drawer / Register",
        content:
          "Use the Register button to manage the cash drawer. Enter opening balance at the start of shift. Record cash-in/cash-out events. At shift end, enter actual cash count and the system calculates variance.",
      },
    ],
  },

  sales: {
    id: "sales",
    title: "Sales",
    icon: "FileText",
    summary:
      "The Sales page lists all completed sales invoices. You can filter, view details, export to Excel or PDF, and process returns from here.",
    sections: [
      {
        heading: "Viewing Sales",
        content:
          "All sales are listed with Sale ID, date, customer, shop, warehouse, items count, and total. Use filters to narrow by date range, shop, warehouse, customer, or payment method.",
      },
      {
        heading: "Sale Detail",
        content:
          "Click a Sale ID to open the full detail view. It shows the complete financial breakdown: Subtotal → Discount → Promo Savings → Tax → Total → Paid → Balance Due. The itemized table shows each product with qty, unit price, discount, and line total.",
      },
      {
        heading: "Sales Returns",
        content:
          "To return items from a sale, click the Return button on the sale detail page. Select the items and quantities to return, enter a reason, and confirm. Stock is automatically incremented and a Credit Note is created.",
      },
      {
        heading: "Exporting",
        content:
          "Click Export Excel or Export PDF to download the current filtered view. The export includes the company name, report title, date/time, and logged-in user's name as a header.",
      },
    ],
  },

  "sales-returns": {
    id: "sales-returns",
    title: "Sales Returns",
    icon: "RotateCcw",
    summary:
      "Sales Returns records goods returned by customers. Each return links to the original sale, reverses the stock, and generates a Credit Note for accounting.",
    sections: [
      {
        heading: "Creating a Return",
        content:
          "Go to the original sale (Sales → click Sale ID) and use the Return action. Select the items being returned, enter quantities and reason, and confirm. The system validates that return quantities do not exceed original quantities.",
      },
      {
        heading: "Stock Impact",
        content:
          "Returned items are automatically added back to warehouse inventory. A stock movement entry of type 'Return' is recorded in the stock ledger.",
      },
      {
        heading: "Accounting Impact",
        content:
          "A journal entry is auto-posted: Dr Sales Revenue / Cr Accounts Receivable — reversing the original sale entry. The customer's outstanding balance is reduced.",
      },
    ],
  },

  "credit-notes": {
    id: "credit-notes",
    title: "Credit Notes",
    icon: "FileMinus",
    summary:
      "Credit Notes are issued to customers when goods are returned or when a credit adjustment is required. They reduce the customer's outstanding balance.",
    sections: [
      {
        heading: "What is a Credit Note?",
        content:
          "A credit note is a document that acknowledges a reduction in the amount a customer owes. It is typically issued after a sales return or as a goodwill adjustment.",
      },
      {
        heading: "Issuing a Credit Note",
        content:
          "Credit Notes are automatically created when you process a Sales Return. You can also manually create one from this page by selecting the customer, entering the amount, and providing a reason.",
      },
      {
        heading: "Accounting Entry",
        content:
          "Posting a credit note creates a journal entry: Dr Sales Revenue / Cr Accounts Receivable. The customer ledger is updated to reflect the reduced balance.",
      },
    ],
  },

  "receive-payment": {
    id: "receive-payment",
    title: "Receive Payment",
    icon: "Banknote",
    summary:
      "Record payments received from customers against outstanding sales invoices, or payments made to suppliers against purchase invoices.",
    sections: [
      {
        heading: "Customer Payments",
        content:
          "Select the customer, choose the unpaid or partially paid invoice, enter the amount received, payment method (cash, bank transfer, cheque), and reference number. Click Save to post the payment.",
      },
      {
        heading: "Supplier Payments",
        content:
          "Switch to the Supplier Payment tab. Select the supplier, choose the outstanding purchase invoice, enter the amount paid, and confirm. The accounts payable balance is reduced.",
      },
      {
        heading: "Accounting Impact",
        content:
          "Customer payment: Dr Cash/Bank → Cr Accounts Receivable. Supplier payment: Dr Accounts Payable → Cr Cash/Bank. All entries post automatically to the Chart of Accounts.",
      },
    ],
  },

  "payment-history": {
    id: "payment-history",
    title: "Payment History",
    icon: "History",
    summary:
      "A full ledger of all customer and supplier payments recorded in the system, with filters for date, type, and party.",
    sections: [
      {
        heading: "Filtering",
        content:
          "Filter by date range, payment type (customer/supplier), payment method, or search by party name. All active filters are included in exports.",
      },
      {
        heading: "Exporting",
        content:
          "Export to Excel or PDF. The export includes company name, timestamp, and active filter summary in the header.",
      },
    ],
  },

  purchases: {
    id: "purchases",
    title: "Purchases",
    icon: "ShoppingBag",
    summary:
      "The Purchases module records supplier invoices. Purchases can be linked to Purchase Orders and Goods Receipt Notes for a complete 3-way match workflow.",
    sections: [
      {
        heading: "Creating a Purchase",
        content:
          "Click 'New Purchase'. Select the supplier, date, and payment terms. Add line items (product, quantity, unit price). Link to a Purchase Order if one exists. Set status to Draft, Pending, or Received.",
      },
      {
        heading: "Receiving Stock",
        content:
          "When a purchase status is set to 'Received', warehouse stock is automatically incremented for all line items. A stock movement entry of type 'Purchase' is recorded.",
      },
      {
        heading: "Accounting Impact",
        content:
          "On receiving: Dr Inventory Asset → Cr Accounts Payable. When payment is made via Receive Payment: Dr Accounts Payable → Cr Cash/Bank.",
      },
      {
        heading: "3-Way Match",
        content:
          "Best practice: Create a Purchase Requisition → get it approved → issue a PO → receive goods via GRN → create the Purchase Invoice. This ensures the right goods were ordered, received, and invoiced.",
      },
    ],
  },

  "purchase-orders": {
    id: "purchase-orders",
    title: "Purchase Orders",
    icon: "ClipboardList",
    summary:
      "Purchase Orders (POs) are formal documents sent to suppliers to order goods. They form the starting point of the procurement workflow.",
    sections: [
      {
        heading: "Creating a PO",
        content:
          "Click 'New PO'. Select supplier, expected delivery date, and warehouse. Add line items with quantities and agreed prices. Save as Draft or submit to the supplier.",
      },
      {
        heading: "PO Workflow",
        content:
          "Draft → Sent → Partially Received → Received → Cancelled. Status updates automatically as GRNs are created against the PO.",
      },
      {
        heading: "Linking to GRN",
        content:
          "When goods arrive, go to Supply Chain → Goods Receipt Note and link the GRN to this PO. The system checks received quantities against ordered quantities.",
      },
    ],
  },

  "purchase-returns": {
    id: "purchase-returns",
    title: "Purchase Returns",
    icon: "RotateCw",
    summary:
      "Purchase Returns records goods sent back to suppliers. Each return reduces inventory and creates a Debit Note for accounting.",
    sections: [
      {
        heading: "Creating a Purchase Return",
        content:
          "Select the original purchase, choose items and quantities being returned, enter the reason, and confirm. The system ensures return quantities do not exceed received quantities.",
      },
      {
        heading: "Stock Impact",
        content:
          "Returned item quantities are automatically deducted from warehouse inventory. A stock movement entry of type 'Purchase Return' is recorded.",
      },
      {
        heading: "Accounting Impact",
        content:
          "A journal entry is auto-posted: Dr Accounts Payable → Cr Inventory Asset — reversing the original purchase receipt. The supplier's balance is reduced.",
      },
    ],
  },

  "debit-notes": {
    id: "debit-notes",
    title: "Debit Notes",
    icon: "FilePlus",
    summary:
      "Debit Notes are issued to suppliers when goods are returned or when a debit adjustment is needed against a purchase invoice.",
    sections: [
      {
        heading: "What is a Debit Note?",
        content:
          "A debit note informs the supplier that you are debiting their account — meaning they owe you a credit. It is issued after a purchase return or pricing discrepancy.",
      },
      {
        heading: "Creating a Debit Note",
        content:
          "Debit Notes are automatically created when processing a Purchase Return. You can also manually issue one by selecting the supplier, entering the amount, and providing a reason.",
      },
    ],
  },

  items: {
    id: "items",
    title: "Items (Inventory)",
    icon: "Package",
    summary:
      "The Items page manages your product catalog. Each item belongs to a warehouse and can have categories, brands, units, variants, barcodes, tax rates, and reorder levels.",
    sections: [
      {
        heading: "Adding an Item",
        content:
          "Click 'Add Item'. Fill in Name, SKU, Category, Brand, Unit, Selling Price, Cost Price, Tax Rate, Discount, and assign to a Warehouse. Set a Reorder Level and Reorder Qty for low-stock alerts.",
      },
      {
        heading: "Item Variants",
        content:
          "Open an item and go to the Variants tab. Add variants like Size S/M/L or Color Red/Blue. Each variant has its own SKU suffix, price adjustment, and stock quantity.",
      },
      {
        heading: "Barcode",
        content:
          "Click the Barcode icon on any item row to generate and view its barcode. Print it directly or save as PDF for label printing.",
      },
      {
        heading: "Stock Ledger",
        content:
          "The Stock Ledger tab shows every inventory movement for the item: purchases, sales, adjustments, transfers, and returns — with date, type, quantity change, and running balance.",
      },
      {
        heading: "Account Mapping",
        content:
          "Item Categories can override the default COA account mapping. Expand 'Advanced: Accounting Accounts' in the Category form to assign specific Inventory Asset, COGS, and Sales Revenue accounts for that category.",
      },
    ],
  },

  "item-categories": {
    id: "item-categories",
    title: "Item Categories",
    icon: "Tag",
    summary:
      "Categories group items for filtering, reporting, and POS display. Each category has a sequence number that controls the order items appear in POS.",
    sections: [
      {
        heading: "Creating a Category",
        content:
          "Enter the category name, code, and a sequence number (Seq No). Lower seq numbers appear first in POS. Enable/disable status to show or hide the category.",
      },
      {
        heading: "POS Ordering",
        content:
          "In POS, when 'All' is selected, items are grouped under their category headers in ascending Seq No order. Set Seq No = 1 for your most popular category so it appears first.",
      },
      {
        heading: "Advanced Accounting Accounts",
        content:
          "Expand the 'Advanced: Accounting Accounts' panel to assign specific COA accounts (Inventory Asset, COGS, Sales Revenue) for items in this category. Leave blank to use system defaults from Account Mapping.",
      },
    ],
  },

  "item-brands": {
    id: "item-brands",
    title: "Item Brands",
    icon: "Award",
    summary:
      "Brands allow you to track which manufacturer or brand an item belongs to. Used for filtering in inventory and reports.",
    sections: [
      {
        heading: "Managing Brands",
        content:
          "Create brands with a name, code, and optional description. Assign brands to items in the Items form. Filter the Items list by brand to view all products from a specific manufacturer.",
      },
    ],
  },

  "item-units": {
    id: "item-units",
    title: "Item Units",
    icon: "Ruler",
    summary:
      "Units of measure define how items are counted and sold — for example: pieces, kilograms, litres, boxes, dozens.",
    sections: [
      {
        heading: "Creating a Unit",
        content:
          "Enter the unit name (e.g., Kilogram), abbreviation (e.g., kg), and optional conversion factor relative to a base unit. Assign units to items so quantities display correctly in POS, invoices, and reports.",
      },
    ],
  },

  "stock-adjustment": {
    id: "stock-adjustment",
    title: "Stock Adjustment",
    icon: "SlidersHorizontal",
    summary:
      "Stock Adjustments let you manually correct inventory quantities — for example after a stock count reveals a discrepancy.",
    sections: [
      {
        heading: "Making an Adjustment",
        content:
          "Select the warehouse and item, choose Add or Remove, enter the quantity, and provide a reason (e.g., 'Stock count variance', 'Damaged goods'). Click Save to update stock immediately.",
      },
      {
        heading: "Accounting Impact",
        content:
          "Add adjustment: Dr Inventory → Cr Adjustment Account. Remove adjustment: Dr Adjustment Account → Cr Inventory. Both entries are posted automatically using the item's cost price.",
      },
    ],
  },

  "warehouse-stock": {
    id: "warehouse-stock",
    title: "Warehouse Stock",
    icon: "Warehouse",
    summary:
      "View current stock levels for all items across a selected warehouse. Useful for stock-taking and reorder planning.",
    sections: [
      {
        heading: "Viewing Stock",
        content:
          "Select a warehouse from the filter. The table shows each item, current quantity, reorder level, and status (OK / Low Stock / Out of Stock). Filter by category or search by item name.",
      },
      {
        heading: "Exporting",
        content:
          "Export the current view to Excel for use in stock-taking sheets or supplier ordering.",
      },
    ],
  },

  customers: {
    id: "customers",
    title: "Customers",
    icon: "Users",
    summary:
      "Manage your customer database. Track contact details, customer groups for pricing, and view the customer ledger with running balance.",
    sections: [
      {
        heading: "Adding a Customer",
        content:
          "Fill in name, email, phone, address, tax number, and assign a Customer Group. The group determines any automatic discount applied at POS when this customer is selected.",
      },
      {
        heading: "Customer Ledger",
        content:
          "Click a customer row and open the Ledger tab to see all invoices, payments, credit notes, and the running balance. Export the ledger to Excel or PDF.",
      },
      {
        heading: "Customer Groups",
        content:
          "Assign customers to groups (e.g., Retail, Wholesale, VIP) that carry a discount percentage. The discount auto-applies in POS when the customer is added to the cart.",
      },
    ],
  },

  "customer-groups": {
    id: "customer-groups",
    title: "Customer Groups",
    icon: "UsersRound",
    summary:
      "Customer Groups define pricing tiers. Assign a discount percentage to a group and all customers in that group get that discount at POS automatically.",
    sections: [
      {
        heading: "Creating a Group",
        content:
          "Enter the group name (e.g., Wholesale) and a discount percentage. Save, then assign customers to this group from the Customers page.",
      },
      {
        heading: "How it Works in POS",
        content:
          "When you add a customer to the POS cart, their group discount is automatically applied to the cart total. The discount is shown in the cart breakdown as a separate line.",
      },
    ],
  },

  suppliers: {
    id: "suppliers",
    title: "Suppliers",
    icon: "Truck",
    summary:
      "Manage your supplier database. Track contact details, payment terms, and view the supplier ledger with all outstanding invoices and payments.",
    sections: [
      {
        heading: "Adding a Supplier",
        content:
          "Fill in company name, contact person, email, phone, address, tax number, and default payment terms (e.g., Net 30). These details auto-fill in Purchase Orders.",
      },
      {
        heading: "Supplier Ledger",
        content:
          "Click a supplier row and open the Ledger tab. It shows all purchase invoices, payments made, debit notes, and the running balance (amount owed to supplier).",
      },
    ],
  },

  taxes: {
    id: "taxes",
    title: "Tax Rates",
    icon: "Percent",
    summary:
      "Define tax rates (GST, VAT, etc.) that are assigned to items or categories. Taxes are automatically calculated at POS and on invoices.",
    sections: [
      {
        heading: "Creating a Tax Rate",
        content:
          "Enter a name (e.g., GST 17%), the percentage rate, and optionally assign it to specific item categories. Taxes assigned to a category apply to all items in that category unless overridden at the item level.",
      },
      {
        heading: "Tax at POS",
        content:
          "The POS cart shows a separate Tax line. The taxable amount is: Subtotal minus Discounts and Promo Savings. Tax is applied to this taxable amount.",
      },
    ],
  },

  discounts: {
    id: "discounts",
    title: "Discounts",
    icon: "BadgePercent",
    summary:
      "Set permanent percentage discounts on items or item categories. These apply automatically in POS and on invoices.",
    sections: [
      {
        heading: "Creating a Discount",
        content:
          "Enter a name, percentage, and assign to either a specific item or an entire category. Category-level discounts apply to all items unless the item has its own specific discount.",
      },
      {
        heading: "Discount Priority",
        content:
          "Item-level discounts take priority over category-level discounts. Manual discounts at POS are applied on top of product/category discounts.",
      },
    ],
  },

  promotions: {
    id: "promotions",
    title: "Promotions",
    icon: "Zap",
    summary:
      "Create date-range based promotions that automatically apply at POS during the active period. Status badges show Active, Upcoming, or Expired.",
    sections: [
      {
        heading: "Creating a Promotion",
        content:
          "Enter promo name, discount percentage, start date, and end date. Assign to specific items or categories. The status badge updates automatically based on today's date.",
      },
      {
        heading: "How Promotions Apply",
        content:
          "When the current date falls within the promotion period, the discount is automatically applied at POS as 'Promo Savings'. Multiple active promotions stack — the best applicable promo wins per item.",
      },
    ],
  },

  "payment-modes": {
    id: "payment-modes",
    title: "Payment Modes",
    icon: "CreditCard",
    summary:
      "Configure the payment methods available at POS and in invoices — such as Cash, Card, Bank Transfer, Cheque.",
    sections: [
      {
        heading: "Managing Payment Modes",
        content:
          "Add, edit, or disable payment methods. Active payment modes appear in the POS cart and in the Receive Payment form. Set a default mode that is pre-selected in POS.",
      },
    ],
  },

  "chart-of-accounts": {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    icon: "GitBranch",
    summary:
      "The Chart of Accounts (COA) is the backbone of accounting. It is a 4-level hierarchy of all financial accounts used to classify every transaction.",
    sections: [
      {
        heading: "COA Hierarchy",
        content:
          "Level 0: Group (Assets, Liabilities, Equity, Revenue, Expenses). Level 1: Sub-Group (Current Assets, Fixed Assets). Level 2: Ledger (Cash & Cash Equivalents). Level 3: Sub-Ledger (Petty Cash, Main Cash). Only Level 3 accounts are used in transactions.",
      },
      {
        heading: "Adding Accounts",
        content:
          "Right-click any node in the tree to Add Child (allowed on Levels 0–2). Enter account name, code (follows parent pattern), and account type. The code is auto-suggested based on the parent's code.",
      },
      {
        heading: "Account Codes",
        content:
          "Follow the 4-level pattern: 1000 → 1100 → 1110 → 1111. The system validates that codes are not duplicated and follow the correct format for each level.",
      },
      {
        heading: "Import / Export",
        content:
          "Use the Import/Export tab to bulk-upload accounts via Excel. Download the provided template, fill it in, and upload. Existing accounts are updated; new ones are created.",
      },
    ],
  },

  "account-mapping": {
    id: "account-mapping",
    title: "Account Mapping",
    icon: "Link",
    summary:
      "Account Mapping tells the system which COA accounts to use for automatic journal entries. Set up once before going live.",
    sections: [
      {
        heading: "Required Mappings",
        content:
          "Map these accounts from your COA: Cash Account (for cash sales/payments), Bank Account (for bank transactions), Accounts Receivable (customer balances), Accounts Payable (supplier balances), Inventory Asset (stock value), COGS (cost of goods sold), Sales Revenue (income), Sales Tax Payable, Salary Expense, Salary Payable.",
      },
      {
        heading: "Category Overrides",
        content:
          "In Item Categories → Advanced Accounting Accounts, you can override the Inventory, COGS, and Sales Revenue mappings per category. This is useful if different product lines post to different income accounts.",
      },
    ],
  },

  "journal-entries": {
    id: "journal-entries",
    title: "Journal Entries",
    icon: "BookOpen",
    summary:
      "Post manual double-entry journal entries for adjustments that don't originate from a standard transaction (e.g., depreciation, provisions, error corrections).",
    sections: [
      {
        heading: "Creating an Entry",
        content:
          "Click 'New Journal Entry'. Enter a date, reference, and description. Add debit and credit lines, selecting the COA account for each line. The system enforces that total debits = total credits before saving.",
      },
      {
        heading: "Double-Entry Rule",
        content:
          "Every journal entry must balance: Total Debit = Total Credit. The Save button is disabled until both sides balance. This ensures the accounting equation (Assets = Liabilities + Equity) is always maintained.",
      },
      {
        heading: "When to Use",
        content:
          "Use manual journal entries for: depreciation, bank charges, provisions, accruals, error corrections, and any financial adjustment that doesn't come from sales, purchases, or payments.",
      },
    ],
  },

  "opening-balances": {
    id: "opening-balances",
    title: "Opening Balances",
    icon: "Scale",
    summary:
      "Enter starting balances when going live with BizPOS. This includes COA account balances, customer outstanding amounts, and supplier outstanding amounts.",
    sections: [
      {
        heading: "When to Use",
        content:
          "Set opening balances when migrating from another system. Enter the balance for each relevant COA account as of your 'go-live' date. This ensures the Trial Balance, Balance Sheet, and P&L start from the correct position.",
      },
      {
        heading: "Customer / Supplier Balances",
        content:
          "Enter the amount each customer owes you and the amount you owe each supplier as of the go-live date. These seed the customer and supplier ledgers.",
      },
    ],
  },

  "financial-years": {
    id: "financial-years",
    title: "Financial Years",
    icon: "CalendarRange",
    summary:
      "Define your financial periods. Close a year to lock prior transactions and start a new accounting period.",
    sections: [
      {
        heading: "Creating a Financial Year",
        content:
          "Enter the start date and end date of the financial year (e.g., 1 July 2024 – 30 June 2025). Set it as Active to allow transactions to post.",
      },
      {
        heading: "Closing a Year",
        content:
          "At year-end, click Close. This locks all transactions in that period — no new entries can be posted to closed periods. Closing transfers net profit/loss to Retained Earnings automatically.",
      },
    ],
  },

  "trial-balance": {
    id: "trial-balance",
    title: "Trial Balance",
    icon: "Scale",
    summary:
      "The Trial Balance lists all COA accounts with their total debits and credits. It is used to verify that the books are balanced.",
    sections: [
      {
        heading: "Reading the Trial Balance",
        content:
          "Each account shows its opening balance, total debits for the period, total credits, and closing balance. The sum of all debit balances must equal the sum of all credit balances.",
      },
      {
        heading: "Filters",
        content:
          "Filter by financial year and date range. Use 'Show zero balances' to include accounts with no activity. Export to PDF or Excel for audit purposes.",
      },
    ],
  },

  "balance-sheet": {
    id: "balance-sheet",
    title: "Balance Sheet",
    icon: "LayoutList",
    summary:
      "The Balance Sheet shows the financial position of the company at a point in time: Assets = Liabilities + Equity.",
    sections: [
      {
        heading: "Structure",
        content:
          "Assets section: Current Assets (Cash, Receivables, Inventory) + Fixed Assets. Liabilities section: Current Liabilities (Payables, Tax Payable) + Long-term Liabilities. Equity section: Paid-in Capital + Retained Earnings + Current Period Net Profit.",
      },
      {
        heading: "Data Source",
        content:
          "All figures are computed live from journal entry balances. Every transaction (POS sale, purchase receipt, payment, payroll, expense) automatically updates the relevant accounts.",
      },
    ],
  },

  "profit-loss": {
    id: "profit-loss",
    title: "Profit & Loss",
    icon: "TrendingUp",
    summary:
      "The Profit & Loss (Income Statement) shows revenues, cost of goods sold, gross profit, operating expenses, and net profit for a selected period.",
    sections: [
      {
        heading: "Structure",
        content:
          "Revenue (Sales) minus Cost of Goods Sold = Gross Profit. Gross Profit minus Operating Expenses (Salaries, Rent, Utilities, etc.) = Net Profit/Loss.",
      },
      {
        heading: "Period Selection",
        content:
          "Select a date range or financial year to view P&L for that period. Compare periods by running two separate exports.",
      },
    ],
  },

  expenses: {
    id: "expenses",
    title: "Expenses",
    icon: "Receipt",
    summary:
      "Record operational expenses such as rent, utilities, office supplies, and petty cash payments. Each expense is linked to a category and posts to the COA.",
    sections: [
      {
        heading: "Recording an Expense",
        content:
          "Select the expense category, enter amount, date, description, payment method, reference number, and which warehouse/shop the expense belongs to. Save to post the entry.",
      },
      {
        heading: "Accounting Impact",
        content:
          "Dr Expense Account (from category mapping) → Cr Cash/Bank. The expense account used depends on the expense category's COA mapping.",
      },
    ],
  },

  "expense-categories": {
    id: "expense-categories",
    title: "Expense Categories",
    icon: "FolderOpen",
    summary:
      "Expense Categories classify operational expenses (e.g., Rent, Utilities, Marketing). Each category maps to a COA account for automatic journal posting.",
    sections: [
      {
        heading: "Creating a Category",
        content:
          "Enter the category name, code, and the COA account it should post to when an expense of this type is recorded. This ensures expenses are correctly classified in your P&L.",
      },
    ],
  },

  banks: {
    id: "banks",
    title: "Banks",
    icon: "Landmark",
    summary:
      "Manage the list of banks your business works with. Banks are linked to Branches, Bank Accounts, and Cheque Templates.",
    sections: [
      {
        heading: "Managing Banks",
        content:
          "Add banks with name, code, country, and SWIFT code. Once a bank is added, create its branches under Banking → Branches and then create bank accounts under Banking → Bank Accounts.",
      },
    ],
  },

  "bank-branches": {
    id: "bank-branches",
    title: "Bank Branches",
    icon: "GitFork",
    summary:
      "Add and manage branches for each bank. Branches are linked to bank accounts for complete banking records.",
    sections: [
      {
        heading: "Adding a Branch",
        content:
          "Select the parent bank, enter the branch name, branch code, address, and IFSC/routing code. Branches are used when creating Bank Accounts and Cheque Books.",
      },
    ],
  },

  "bank-accounts": {
    id: "bank-accounts",
    title: "Bank Accounts",
    icon: "CreditCard",
    summary:
      "Bank Accounts link your real-world bank accounts to the Chart of Accounts for reconciliation and automated journal posting.",
    sections: [
      {
        heading: "Creating a Bank Account",
        content:
          "Select the bank and branch, enter the account number, account holder name, currency, and link to the corresponding COA account (must be under the Bank/Cash group). Opening balance is set via Opening Balances.",
      },
      {
        heading: "Why Link to COA?",
        content:
          "Linking to the COA means that every bank transaction (deposit, withdrawal, cheque payment) automatically creates a journal entry and keeps the Balance Sheet current.",
      },
    ],
  },

  "cheque-books": {
    id: "cheque-books",
    title: "Cheque Books",
    icon: "BookMarked",
    summary:
      "Issue and track cheque books. Each cheque book is linked to a bank account and records the range of cheque leaf numbers.",
    sections: [
      {
        heading: "Issuing a Cheque Book",
        content:
          "Select the bank account, enter the cheque book number, starting leaf number, ending leaf number, and date issued. The system creates individual leaf records that are tracked as Used/Available/Cancelled.",
      },
      {
        heading: "Cheque Leaf Status",
        content:
          "Each leaf can be: Available (unused), Used (printed), Cancelled (voided). The cheque book summary shows how many leaves are used vs available.",
      },
    ],
  },

  "cheque-templates": {
    id: "cheque-templates",
    title: "Cheque Templates",
    icon: "Layout",
    summary:
      "Design cheque print templates that match your actual cheque stationery. Define field positions so the printed PDF aligns with the physical cheque.",
    sections: [
      {
        heading: "Creating a Template",
        content:
          "Enter Template Name, select the Bank, and set the cheque dimensions (width and height in inches). Then configure each field row: Amount, Date, Payee, Rupees, Bearer — each with Prefix, Postfix, Field Size, Field Width, and X/Y axis coordinates.",
      },
      {
        heading: "X/Y Coordinates",
        content:
          "Coordinates are measured in inches from the top-left corner of the cheque. Print a test cheque on plain paper, hold it over the cheque stationery, and adjust X/Y values until fields align perfectly.",
      },
      {
        heading: "One Template per Bank",
        content:
          "Different banks have different cheque layouts. Create a separate template for each bank. Templates are selected in Cheque Print when generating PDFs.",
      },
    ],
  },

  "cheque-print": {
    id: "cheque-print",
    title: "Cheque Print",
    icon: "Printer",
    summary:
      "Generate print-ready PDF cheques using your configured templates. Supports single cheque printing and bulk cheque generation via manual entry or Excel import.",
    sections: [
      {
        heading: "Single Cheque",
        content:
          "Select bank account, cheque book, available leaf, and template. Fill in Payee, Amount (auto-converts to words), Date, and Memo. Click Generate PDF to download the print-ready cheque.",
      },
      {
        heading: "Bulk Cheque Printing",
        content:
          "Use the Bulk Print tab for multiple cheques at once. Enter data manually in the table, or import from Excel using the provided template. Select the cheques you want and click 'Generate Bulk PDF' — one cheque per page in a single PDF.",
      },
      {
        heading: "Excel Import Format",
        content:
          "Download the Excel template from the Import sub-tab. Columns: Payee, Amount, Date (YYYY-MM-DD), Memo. Upload the filled file, preview the rows, then apply to the table.",
      },
      {
        heading: "Print History",
        content:
          "All printed cheques are logged with date, payee, amount, and the leaf used. Leaves are automatically marked as Used after printing.",
      },
    ],
  },

  "bank-reconciliation": {
    id: "bank-reconciliation",
    title: "Bank Reconciliation",
    icon: "CheckSquare",
    summary:
      "Reconcile your bank account statement with the system's journal entries to identify differences and ensure the books match the bank.",
    sections: [
      {
        heading: "4-Tab Workflow",
        content:
          "Tab 1 — Bank Transactions: import or enter transactions from the bank statement. Tab 2 — Journal Entries: view all system entries for the account. Tab 3 — Matching/Reconciliation: match bank transactions to journal entries. Tab 4 — Summary: see unmatched items and closing balance.",
      },
      {
        heading: "Reconciling",
        content:
          "In the Matching tab, select a bank transaction and its matching journal entry, then click Match. Matched pairs are highlighted. Unmatched items represent timing differences or errors that need investigation.",
      },
    ],
  },

  employees: {
    id: "employees",
    title: "Employees",
    icon: "UserCheck",
    summary:
      "Manage your employee records including personal details, department, designation, shift assignment, allowances, and document attachments.",
    sections: [
      {
        heading: "Adding an Employee",
        content:
          "Enter personal details (name, CNIC, date of birth, joining date), assign Department and Designation, link to a Shift, and configure salary type (monthly/hourly/daily) and basic salary.",
      },
      {
        heading: "Allowances",
        content:
          "Add allowance lines to the employee (e.g., House Rent, Medical, Transport). Each allowance references an Allowance Type and is either a fixed amount or a percentage of basic salary.",
      },
      {
        heading: "Attachments",
        content:
          "Use the Attachments tab to upload employee documents such as CNIC copy, employment contract, educational certificates. Documents can be downloaded at any time.",
      },
    ],
  },

  departments: {
    id: "departments",
    title: "Departments",
    icon: "Building",
    summary:
      "Departments organize employees into functional groups (e.g., Sales, Finance, Operations). Used in employee records, reports, and attendance.",
    sections: [
      {
        heading: "Managing Departments",
        content:
          "Create departments with a name, code, and optional description. Assign a head of department. Departments are selected when creating employee records.",
      },
    ],
  },

  designations: {
    id: "designations",
    title: "Designations",
    icon: "Briefcase",
    summary:
      "Designations define job titles within departments (e.g., Sales Manager, Cashier, Accountant). Linked to employees for reporting and payroll.",
    sections: [
      {
        heading: "Managing Designations",
        content:
          "Create designations with a title, code, and the department they belong to. Designations are selected on employee records and appear in salary slips and HR reports.",
      },
    ],
  },

  "allowance-types": {
    id: "allowance-types",
    title: "Allowance Types",
    icon: "PlusCircle",
    summary:
      "Define the types of allowances paid to employees — such as House Rent Allowance, Medical, Transport, and Performance Bonus.",
    sections: [
      {
        heading: "Creating Allowance Types",
        content:
          "Enter the allowance name, code, and whether it is taxable or not. Set whether it is a fixed amount or percentage-based. These types are referenced when adding allowances to an employee.",
      },
    ],
  },

  "salary-processing": {
    id: "salary-processing",
    title: "Salary Processing",
    icon: "DollarSign",
    summary:
      "Run payroll for a selected period. The system calculates each employee's gross salary (basic + allowances) and auto-generates salary slips.",
    sections: [
      {
        heading: "Running Payroll",
        content:
          "Select the month/year and the employee (or process all employees at once). The system computes: Basic Salary + All Allowances − Deductions = Net Pay. Click Process to finalize and generate salary slips.",
      },
      {
        heading: "Salary Types",
        content:
          "Monthly: flat monthly salary. Hourly: salary based on hours worked (requires attendance data). Daily Wage: salary based on days worked.",
      },
      {
        heading: "Accounting Impact",
        content:
          "Finalizing payroll posts: Dr Salary Expense → Cr Salaries Payable. When salaries are disbursed, record the payment to post: Dr Salaries Payable → Cr Cash/Bank.",
      },
    ],
  },

  "salary-slips": {
    id: "salary-slips",
    title: "Salary Slips",
    icon: "FileCheck",
    summary:
      "View and print salary slips for all employees. Each slip shows the full earnings and deductions breakdown.",
    sections: [
      {
        heading: "Viewing Slips",
        content:
          "Filter by employee, month, or year. Click any row to view the full slip. The slip shows employee details, period, basic salary, allowance breakdown, total deductions, and net pay.",
      },
      {
        heading: "Printing",
        content:
          "Click Print PDF to download a formatted salary slip PDF suitable for handing to the employee. The slip includes company name, logo reference, and the processing date.",
      },
    ],
  },

  shifts: {
    id: "shifts",
    title: "Shifts",
    icon: "Clock",
    summary:
      "Define work shifts (e.g., Morning, Afternoon, Night) with start and end times. Assign shifts to employees for scheduling and POS shift management.",
    sections: [
      {
        heading: "Creating Shifts",
        content:
          "Enter shift name, start time, end time, and assign to one or more employees. Multiple employees can share the same shift. Shifts appear in employee records and shift closing reports.",
      },
    ],
  },

  "shift-closing": {
    id: "shift-closing",
    title: "Shift Closing",
    icon: "LogOut",
    summary:
      "Open and close POS shifts. Track expected vs actual cash, calculate variance, and generate shift closing reports.",
    sections: [
      {
        heading: "Opening a Shift",
        content:
          "At the start of the shift, enter the opening cash balance (amount physically in the drawer). Click 'Open Shift'. This creates a shift record with a start timestamp.",
      },
      {
        heading: "Closing a Shift",
        content:
          "At end of shift, the system shows the expected cash (opening balance + cash sales). Enter the actual cash counted. The variance is calculated automatically. Provide a reason if variance is non-zero. Click 'Close Shift' to generate the closing report.",
      },
    ],
  },

  attendance: {
    id: "attendance",
    title: "Attendance",
    icon: "CalendarCheck",
    summary:
      "Mark daily attendance for all employees — Present, Absent, or Half-day. Attendance data integrates with payroll for hourly and daily-wage employees.",
    sections: [
      {
        heading: "Marking Attendance",
        content:
          "Select the date. A table shows all active employees. Mark each employee as Present (P), Absent (A), or Half-Day (H). Save the record. The same date can be edited later if needed.",
      },
      {
        heading: "Payroll Integration",
        content:
          "For hourly and daily-wage employees, salary processing reads the attendance records to compute days/hours worked. Ensure attendance is marked before running payroll for the period.",
      },
    ],
  },

  "leave-management": {
    id: "leave-management",
    title: "Leave Management",
    icon: "CalendarOff",
    summary:
      "Track employee leave requests. Manage leave types, approvals, and integration with attendance and payroll.",
    sections: [
      {
        heading: "Creating a Leave Request",
        content:
          "Select the employee, leave type (Annual, Sick, Casual, Unpaid), start date, end date, and reason. The leave balance is checked against allowed days for that leave type.",
      },
      {
        heading: "Approval Workflow",
        content:
          "Submitted leaves can be Approved or Rejected by an authorized user. Approved leaves automatically mark the corresponding attendance days as Absent.",
      },
    ],
  },

  "purchase-requisitions": {
    id: "purchase-requisitions",
    title: "Purchase Requisitions",
    icon: "ClipboardSignature",
    summary:
      "Purchase Requisitions are internal requests to purchase goods. They go through an approval workflow before a Purchase Order is issued.",
    sections: [
      {
        heading: "Creating a Requisition",
        content:
          "Select the warehouse, enter the requested items and quantities, specify the reason and required date. Save as Draft, then Submit for approval.",
      },
      {
        heading: "Approval Workflow",
        content:
          "Draft → Submitted → Approved → PO Issued. Authorized managers can Approve or Reject. Approved requisitions show a button to convert to a Purchase Order automatically.",
      },
    ],
  },

  "goods-receipt": {
    id: "goods-receipt",
    title: "Goods Receipt Notes (GRN)",
    icon: "PackageCheck",
    summary:
      "GRNs record the physical receipt of goods from a supplier. They form part of the 3-way match: PO → GRN → Invoice.",
    sections: [
      {
        heading: "Creating a GRN",
        content:
          "Select the Purchase Order this GRN is for. For each item, enter the Ordered Qty, Received Qty, Accepted Qty, and Rejected Qty. Enter the date and delivery note number.",
      },
      {
        heading: "Stock Impact",
        content:
          "When a GRN is confirmed (status = Accepted or Partially Accepted), the Accepted Qty is automatically added to warehouse inventory. Rejected items are not stocked.",
      },
      {
        heading: "Accounting Entry",
        content:
          "Confirming a GRN posts: Dr Inventory Asset → Cr Accounts Payable, using the item's cost price and accepted quantity.",
      },
    ],
  },

  "inventory-transfers": {
    id: "inventory-transfers",
    title: "Inventory Transfers",
    icon: "ArrowLeftRight",
    summary:
      "Move stock between warehouses. Transfers follow a Draft → In Transit → Completed workflow to track goods in transit.",
    sections: [
      {
        heading: "Creating a Transfer",
        content:
          "Select source warehouse, destination warehouse, and add items with transfer quantities. Save as Draft, then change status to In Transit when goods are dispatched.",
      },
      {
        heading: "Completing a Transfer",
        content:
          "When goods arrive at the destination, change status to Completed. The system automatically decrements stock at the source and increments it at the destination warehouse.",
      },
    ],
  },

  shipments: {
    id: "shipments",
    title: "Shipment Tracking",
    icon: "Ship",
    summary:
      "Track inbound (supplier to warehouse) and outbound (warehouse to customer) shipments with carrier, tracking number, and status updates.",
    sections: [
      {
        heading: "Tracking a Shipment",
        content:
          "Enter the shipment reference, type (Inbound/Outbound), carrier name, tracking number, expected delivery date, and current status. Update status as it progresses: Pending → In Transit → Delivered.",
      },
    ],
  },

  "supplier-performance": {
    id: "supplier-performance",
    title: "Supplier Performance",
    icon: "BarChart2",
    summary:
      "Analyze supplier KPIs: acceptance rate, on-time delivery percentage, average lead time, and quality rating. Use this data to make better procurement decisions.",
    sections: [
      {
        heading: "KPIs Explained",
        content:
          "Acceptance Rate: (Accepted Qty / Ordered Qty) × 100. On-Time Delivery: percentage of POs received by expected date. Avg Lead Time: average days from PO to GRN. Quality Rating: manual score (1–5 stars) assigned per supplier.",
      },
    ],
  },

  reports: {
    id: "reports",
    title: "Reports Center",
    icon: "BarChart",
    summary:
      "The Reports Center aggregates data from all modules into filterable, exportable reports. Every report supports Excel and PDF export with company header.",
    sections: [
      {
        heading: "Report Categories",
        content:
          "Sales (Summary, by Product, by Customer) | Purchases (Summary, by Supplier) | Returns | Inventory (Stock, Low Stock, Valuation) | Warehouse | Financial (T/B, B/S, P&L) | HR & Payroll | Banking | Tax | Aging (Customer, Supplier) | Operations (Shift Closing)",
      },
      {
        heading: "Filters",
        content:
          "Each report has its own filter set. Common filters: date range, company, warehouse, shop. Apply filters and click the report name to load data. Active filters are included in the export header.",
      },
      {
        heading: "Export Headers",
        content:
          "Every exported file includes: Company Name, Report Title, Date/Time Generated, Logged-in User's Name, and all active filter values. This makes exported reports audit-friendly.",
      },
    ],
  },

  users: {
    id: "users",
    title: "Users",
    icon: "Users",
    summary:
      "Create and manage system users. Assign roles, set company/warehouse/shop access, and mark super users who can manage multiple companies.",
    sections: [
      {
        heading: "Creating a User",
        content:
          "Enter name, email, password, and select a Role. Choose the Company the user belongs to, then select which Warehouses and Shops they can access. Their access is strictly limited to selected locations.",
      },
      {
        heading: "Super User",
        content:
          "Toggle 'Is Super User' to give a user company-level access. Super users see a company tile selection screen on login and can switch between companies. Optionally restrict a super user to specific companies.",
      },
      {
        heading: "Access Control",
        content:
          "A user's role determines which screens they can access (RBAC). Their warehouse/shop assignment further limits which data they see. Both controls work together.",
      },
    ],
  },

  roles: {
    id: "roles",
    title: "Roles & Permissions",
    icon: "Shield",
    summary:
      "Define roles with specific screen-level permissions. All 52+ screens are available in 12 permission groups. Assign roles to users.",
    sections: [
      {
        heading: "Creating a Role",
        content:
          "Enter a role name (e.g., Accountant, Warehouse Manager) and select which screens this role can access. Permissions are grouped into 12 modules: General, POS & Sales, Customers, Purchases, Pricing, Inventory, Warehouse, Accounting, Banking, HR, Supply Chain, Admin.",
      },
      {
        heading: "Group Toggles",
        content:
          "Click a module group header to toggle all permissions in that group at once. The counter shows how many permissions are selected per group. This makes it fast to set up standard roles.",
      },
      {
        heading: "Best Practices",
        content:
          "Create roles like: Admin (all permissions), Accountant (Accounting + Banking + Reports), Cashier (POS + Sales + Payments), HR Manager (HR + Payroll), Warehouse Staff (Inventory + Supply Chain).",
      },
    ],
  },

  logs: {
    id: "logs",
    title: "System Logs",
    icon: "Activity",
    summary:
      "A complete audit trail of all actions performed in the system — who did what, when, and on which record.",
    sections: [
      {
        heading: "What is Logged",
        content:
          "Login/Logout, POS sales, purchase CRUD, customer/supplier changes, inventory adjustments, user management, salary processing, and more. Each entry records: User, Action, Module, Description, and Timestamp.",
      },
      {
        heading: "Filtering Logs",
        content:
          "Filter by date range, user, module, or action type. Export to Excel or PDF for audit purposes. The 'My Activity' option in the profile dropdown shows only the current user's recent actions.",
      },
    ],
  },

  tickets: {
    id: "tickets",
    title: "Tickets",
    icon: "LifeBuoy",
    summary:
      "Manage internal IT helpdesk tickets and customer support tickets. Full workflow with priorities, assignees, and attachments.",
    sections: [
      {
        heading: "Ticket Types",
        content:
          "Internal: IT/helpdesk tickets raised by staff (e.g., hardware issue, software bug). Customer: support requests raised on behalf of customers (e.g., billing query, product issue).",
      },
      {
        heading: "Workflow",
        content:
          "Open → Assigned → In Progress → Resolved → Closed. Assign tickets to specific users. Set priority: Low, Medium, High, Critical. Add comments to track progress. Attach relevant documents.",
      },
    ],
  },

  settings: {
    id: "settings",
    title: "Settings",
    icon: "Settings",
    summary:
      "Configure system-wide settings including company details, default preferences, and developer tools for testing.",
    sections: [
      {
        heading: "System Configuration",
        content:
          "Update company name, logo, address, tax number, currency, and date format that appear in printed documents and exports.",
      },
      {
        heading: "Developer Tools",
        content:
          "The 'Developer Tools' card at the bottom lets you wipe all BizPOS localStorage data and reload fresh seed data. Use this to reset the system to a clean demo state. WARNING: This deletes all data.",
      },
    ],
  },

  companies: {
    id: "companies",
    title: "Companies",
    icon: "Building2",
    summary:
      "Manage the top level of the BizPOS hierarchy. Super users can create and manage multiple companies, each with their own warehouses, shops, and data.",
    sections: [
      {
        heading: "Creating a Company",
        content:
          "Enter company name, registration number, address, contact details, and tax number. Each company is a completely separate business entity with its own data scope.",
      },
      {
        heading: "Hierarchy",
        content:
          "Company → Warehouses → Shops. Click 'View Warehouses' on a company row to see all its warehouses. All data (sales, purchases, employees, etc.) is scoped to the active company.",
      },
    ],
  },

  warehouses: {
    id: "warehouses",
    title: "Warehouses",
    icon: "Warehouse",
    summary:
      "Warehouses hold stock and serve as the middle tier of the hierarchy. Each warehouse belongs to a company and can have multiple shops.",
    sections: [
      {
        heading: "Creating a Warehouse",
        content:
          "Select the parent company, enter warehouse name, code, address, and manager. Inventory items are assigned to warehouses. Stock adjustments and transfers are warehouse-specific.",
      },
      {
        heading: "Linking to Shops",
        content:
          "Shops are created under a warehouse. POS loads items from the warehouse linked to the selected shop. Multiple shops can share the same warehouse inventory pool.",
      },
    ],
  },

  shops: {
    id: "shops",
    title: "Shops",
    icon: "Store",
    summary:
      "Shops are POS locations linked to a warehouse. Cashiers are assigned to specific shops and can only process sales from their assigned shop.",
    sections: [
      {
        heading: "Creating a Shop",
        content:
          "Select the parent warehouse, enter shop name, code, address, and assign staff users (cashiers). The shop's inventory comes from the linked warehouse.",
      },
      {
        heading: "POS Relationship",
        content:
          "When a cashier opens POS, they see only their assigned shop. The shop's warehouse determines which items appear. Completing a sale deducts stock from that warehouse.",
      },
    ],
  },

  "company-select": {
    id: "company-select",
    title: "Company Selection",
    icon: "Building2",
    summary:
      "Super users see this screen on login. Select a company tile to enter that company's context and access its full dashboard and modules.",
    sections: [
      {
        heading: "Selecting a Company",
        content:
          "Click any company tile to enter that company. The active company name appears in the top bar. To switch companies, click the company name pill in the top bar and you will return to this selection screen.",
      },
      {
        heading: "Who Sees This Screen",
        content:
          "Only users marked as Super User see this screen. Regular admins and cashiers go directly to the Dashboard after login, scoped to their assigned company.",
      },
    ],
  },
};

export default articles;

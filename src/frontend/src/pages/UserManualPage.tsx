import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Download,
  Landmark,
  LayoutDashboard,
  LogIn,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: { heading: string; body: string }[];
}

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: LogIn,
    content: [
      {
        heading: "Overview",
        body: "BizPOS is a complete, production-ready Point of Sale and ERP system covering sales, purchasing, inventory, accounting, banking, HR, payroll, supply chain, and reporting — all in one platform. The system follows a strict Company → Warehouse → Shop hierarchy. Every transaction, user, and report is scoped to this hierarchy.",
      },
      {
        heading: "Default Login Credentials",
        body: "Super User: superuser@bizpos.com / super123 (manages all companies, sees company tiles on login).\nCompany Admin: admin@bizpos.com / admin123 (full access within Alpha Retail Group).\nCashier: cashier@bizpos.com / cashier123 (POS and Sales only, restricted to Downtown Shop A).\n\nTo reset demo data: Settings → Developer Tools → Reset All Data.",
      },
      {
        heading: "First-Time Setup Order",
        body: "1. Super User logs in → creates Companies.\n2. Admin logs in → sets up Warehouses under the company.\n3. Admin creates Shops under each Warehouse.\n4. Admin configures Chart of Accounts (COA) → Account Mapping.\n5. Admin sets up Banks, Branches, Bank Accounts.\n6. Admin creates Departments, Designations, Employees.\n7. Admin creates Item Categories, Brands, Units → then Items.\n8. Admin creates Roles with permissions → assigns Users to roles, warehouses, and shops.\n9. Admin sets Tax Rates, Discounts, Promotions.\n10. Admin enters Opening Balances → defines Financial Year.\n\nAfter setup, the system is ready for day-to-day POS, sales, purchasing, and payroll operations.",
      },
      {
        heading: "Navigation",
        body: "Left Sidebar: Hover any group (Sales, Purchases, Inventory, etc.) to reveal a flyout submenu with all screens in that group.\n\nTop Bar (right side):\n• Company name pill — super users can click it to switch companies.\n• Bell icon — notifications for low stock and pending approvals.\n• Bookmark icon — save/remove the current page for quick access.\n• Star icon — open your Favorites panel and pin frequently used screens.\n• User avatar — opens the profile dropdown (Edit Profile, Change Password, Preferences, My Activity, Sign Out).\n\nKeyboard Shortcuts:\n• G then D = Dashboard\n• G then P = POS\n• G then S = Sales\n• G then I = Items\n• G then U = Users\n• G then R = Reports\n• G then A = Chart of Accounts\n• G then E = Employees\n• G then B = Banks\n• G then T = Tickets\n• G then O = Purchase Orders\n• G then C = Customers\n• ? = Toggle shortcut cheat-sheet",
      },
    ],
  },
  {
    id: "hierarchy",
    title: "Company → Warehouse → Shop Hierarchy",
    icon: Building2,
    content: [
      {
        heading: "How the Hierarchy Works",
        body: "Every entity in BizPOS belongs to this hierarchy:\n\nCompany (top level) — managed by the super user. Examples: Alpha Retail Group, Beta Distribution Co.\n\nWarehouse (under company) — holds physical stock. Examples: Main Warehouse, North Warehouse. Items are assigned to warehouses.\n\nShop (under warehouse) — a sales point. Examples: Shop A, Shop B. POS operates at the shop level and loads items from its parent warehouse.",
      },
      {
        heading: "Managing Companies",
        body: "Path: Admin → Companies\nWho: Super User only.\nActions: Add, edit, deactivate companies. Each company has a name, address, phone, email, and tax number. When the super user logs in they see company tiles — clicking a tile enters that company's context.",
      },
      {
        heading: "Managing Warehouses",
        body: "Path: Warehouse → Warehouses\nWho: Company Admin.\nActions: Add warehouses under the active company. Each warehouse has a name, code, location, and manager. Items are assigned here. Breadcrumb links navigate back to Companies.",
      },
      {
        heading: "Managing Shops",
        body: "Path: Warehouse → Shops\nWho: Company Admin.\nActions: Add shops under a warehouse. Each shop has a name, code, address, and assigned staff (cashiers). POS uses the shop's parent warehouse to determine which items are available. Breadcrumb links navigate back to Warehouses.",
      },
    ],
  },
  {
    id: "pos",
    title: "Point of Sale (POS)",
    icon: ShoppingCart,
    content: [
      {
        heading: "Opening the POS",
        body: "Path: POS (sidebar, direct link)\nOn first visit the system asks you to select the shop you are selling from. This is remembered for future sessions. Use the 'Change Shop' button in the POS header to switch shops mid-session.",
      },
      {
        heading: "Adding Items to Cart",
        body: "1. Browse items by category tabs at the top (ordered by category sequence number).\n2. Click 'All' to see all items grouped under category headings.\n3. Search items by name or barcode in the search box.\n4. Click any item card to add it to the cart, or type a quantity before clicking.\n5. In the cart, click the quantity to adjust it, or use the trash icon to remove an item.",
      },
      {
        heading: "Applying Discounts, Promos, and Tax",
        body: "The cart summary shows a full financial breakdown:\n• Subtotal — sum of item prices × quantities.\n• Manual Discount — enter a flat discount amount in the cart.\n• Promo Savings — automatically deducted if an active promotion applies to any item.\n• Taxable Amount — subtotal after discounts.\n• Tax — computed from item/category tax rates.\n• Total — final payable amount.\n\nCustomer Group discounts also auto-apply when you select a customer who belongs to a group with a discount rate.",
      },
      {
        heading: "Holding and Resuming Sales",
        body: "Click 'Hold' to pause the current sale and save it. A badge on the 'Held Sales' button shows the count of held carts. Click 'Held Sales' to see all held carts, then 'Resume' to restore one or 'Delete' to discard it. Held sales are saved per user per shop.",
      },
      {
        heading: "Completing a Sale",
        body: "1. Select the customer (optional — required for credit sales).\n2. Choose payment method: Cash, Card, or Bank Transfer.\n3. Click 'Complete Sale'.\n4. A receipt modal appears with all sale details. Click 'Print Receipt' to send to the printer or 'New Sale' to start fresh.\n5. Stock is automatically deducted from the warehouse, and journal entries are auto-posted to accounting.",
      },
      {
        heading: "POS Register / Cash Drawer",
        body: "Path: HR → Shift Closing\nThe shift closing screen manages the cash drawer for a POS shift:\n1. Open a shift at the start of the day and enter the opening cash balance.\n2. During the day, sales and cash-ins/outs are tracked.\n3. At end of day, enter the actual cash in the drawer.\n4. The system computes the variance (expected vs actual).\n5. Close the shift to generate a closing report PDF.",
      },
    ],
  },
  {
    id: "sales",
    title: "Sales Module",
    icon: DollarSign,
    content: [
      {
        heading: "Sales List",
        body: "Path: Sales → Sales List\nShows all completed sales invoices. Filter by date range, customer, shop, or payment method. Click any sale to view the full detail including itemised breakdown, financials, and attached documents. Export to Excel or PDF using the buttons at the top right.",
      },
      {
        heading: "Sales Returns",
        body: "Path: Sales → Sales Returns\nWhen a customer returns goods: create a Sales Return linked to the original sale, enter the returned items and quantities, and select a reason. The system reverses the sale's journal entry and adds stock back to the warehouse.",
      },
      {
        heading: "Credit Notes",
        body: "Path: Sales → Credit Notes\nAfter a sales return is confirmed, issue a Credit Note to formally record the amount owed back to the customer. This posts Dr Sales Revenue / Cr Accounts Receivable in the ledger.",
      },
      {
        heading: "Receive Payment",
        body: "Path: Sales → Receive Payment\nRecord customer payments against outstanding sales invoices. Select the customer, pick the invoice, enter the amount received, and choose the payment method. The system posts Dr Cash → Cr Accounts Receivable automatically.",
      },
      {
        heading: "Payment History",
        body: "Path: Sales → Payment History\nView all recorded payments (customer and supplier). Filter by date, type, or customer/supplier. Export available.",
      },
    ],
  },
  {
    id: "purchases",
    title: "Purchases Module",
    icon: Package,
    content: [
      {
        heading: "Purchase Orders (PO)",
        body: "Path: Purchases → Purchase Orders\n1. Create a PO by selecting a supplier, warehouse, and adding line items with quantities and unit costs.\n2. Set status to Draft, then Sent when sent to the supplier.\n3. When goods arrive, change status to Received — this increases warehouse stock and posts Dr Inventory / Cr Accounts Payable.",
      },
      {
        heading: "Purchase Invoices / Bills",
        body: "Path: Purchases → Invoices / Bills\nRecord supplier invoices after receiving goods. Link to a PO for 3-way matching (PO → GRN → Invoice). Filter by supplier, status, and date. Export available.",
      },
      {
        heading: "Purchase Returns",
        body: "Path: Purchases → Purchase Returns\nWhen goods need to be returned to a supplier: create a Purchase Return, enter quantities, and reason. Stock is decremented and a Debit Note can be issued.",
      },
      {
        heading: "Debit Notes",
        body: "Path: Purchases → Debit Notes\nIssued after a purchase return to formally record the credit owed by the supplier. Posts Dr Accounts Payable / Cr Inventory in the ledger.",
      },
      {
        heading: "Suppliers",
        body: "Path: Purchases → Suppliers\nManage supplier master data: name, contact, address, payment terms, and opening balances. Each supplier has a Ledger tab showing all purchase invoices, payments, and running balance.",
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Module",
    icon: Package,
    content: [
      {
        heading: "Items",
        body: "Path: Inventory → Items\nThe central product master. Each item has:\n• Name, SKU, barcode\n• Category, Brand, Unit of Measure\n• Warehouse assignment\n• Cost price, selling price\n• Tax rate and discount\n• Reorder level and reorder quantity (triggers low-stock alerts)\n• Variants tab — add size/color/weight variants with separate SKU suffixes and price adjustments\n• Barcode tab — generate and print barcode labels\n• Stock Ledger tab — full history of all stock movements (purchases, sales, adjustments, transfers, returns)",
      },
      {
        heading: "Item Categories",
        body: "Path: Inventory → Item Categories\nCRUD for categories. Each category has a Sequence Number that controls display order in POS. Lower numbers appear first. Categories can also override the default accounting accounts (Inventory Asset, COGS, Sales Revenue) for that product line.",
      },
      {
        heading: "Item Brands and Units",
        body: "Path: Inventory → Item Brands / Item Units\nBrands and units of measure (pcs, kg, box, litre, etc.) are managed as masters and assigned to items. Used for filtering in reports.",
      },
      {
        heading: "Stock Adjustment",
        body: "Path: Inventory → Stock Adjustment\nManually correct stock quantities (damaged goods, count discrepancies). Enter the item, warehouse, adjustment type (add/remove), quantity, and reason. Each adjustment posts a journal entry to accounting.",
      },
      {
        heading: "Warehouse Stock View",
        body: "Path: Inventory → Warehouse Stock\nSee a summary of all items and their current stock quantities across all warehouses. Filter by warehouse or item category.",
      },
    ],
  },
  {
    id: "supplychain",
    title: "Supply Chain",
    icon: Truck,
    content: [
      {
        heading: "Purchase Requisitions",
        body: "Path: Supply Chain → Purchase Requisitions\nThe procurement process starts here:\n1. Any staff member creates a requisition (items needed, quantities, justification).\n2. Manager reviews and Approves or Rejects it.\n3. Approved requisitions can be converted to Purchase Orders.",
      },
      {
        heading: "Goods Receipt Notes (GRN)",
        body: "Path: Supply Chain → Goods Receipt\nWhen a shipment arrives:\n1. Create a GRN linked to a PO.\n2. Enter accepted and rejected quantities per line.\n3. Set status to Accepted — this increments warehouse stock and posts the inventory journal entry.",
      },
      {
        heading: "Inventory Transfers",
        body: "Path: Supply Chain → Inventory Transfers\nMove stock between warehouses:\n1. Create a transfer (source warehouse, destination warehouse, items + quantities).\n2. Status: Draft → In Transit → Completed.\n3. On completion: stock decrements from source and increments at destination.",
      },
      {
        heading: "Shipment Tracking",
        body: "Path: Supply Chain → Shipment Tracking\nTrack inbound and outbound shipments. Record carrier, tracking number, expected date, and status updates. Two tabs: Inbound (purchases) and Outbound (transfers/sales).",
      },
      {
        heading: "Supplier Performance",
        body: "Path: Supply Chain → Supplier Performance\nKPI dashboard per supplier:\n• Acceptance Rate (accepted qty / ordered qty)\n• On-Time Delivery Rate\n• Average Lead Time (days)\n• Overall Rating\nDrill into order history and quality analysis per supplier.",
      },
    ],
  },
  {
    id: "accounting",
    title: "Accounting Module",
    icon: Calculator,
    content: [
      {
        heading: "Chart of Accounts (COA)",
        body: "Path: Accounting → Chart of Accounts\nA 4-level account hierarchy (e.g. Assets → Current Assets → Cash → Petty Cash). The tree view is collapsed by default — click arrows to expand. Right-click any node to Add Child, Edit, or Delete. Import/export via Excel using the provided template.\n\nAccount codes follow the pattern: L0 (1 digit) → L1 (2 digits) → L2 (4 digits) → L3 (6 digits leaf accounts). Only leaf accounts (L3) appear in dropdowns throughout the system.",
      },
      {
        heading: "Account Mapping",
        body: "Path: Accounting → Account Mapping\nTells the system which COA accounts to use for automatic journal postings. Map these before entering any transactions:\n• Cash Account (for POS cash sales, expenses)\n• Bank Account (for bank transfers)\n• Accounts Receivable (for credit sales)\n• Accounts Payable (for purchases on credit)\n• Inventory Asset (for stock value)\n• Cost of Goods Sold (COGS)\n• Sales Revenue\n• Sales Tax Payable\n• Salary Expense\n• Salaries Payable",
      },
      {
        heading: "Journal Entries",
        body: "Path: Accounting → Journal Entries\nPost manual double-entry journal entries. Add as many debit and credit lines as needed. The system validates that total debits = total credits before saving. All auto-posted entries (from POS, purchases, payments, etc.) also appear here for a complete audit trail.",
      },
      {
        heading: "Opening Balances",
        body: "Path: Accounting → Opening Balances\nEnter starting balances for COA accounts, customers (A/R), and suppliers (A/P) when going live for the first time. This sets the baseline for all financial reports.",
      },
      {
        heading: "Financial Years",
        body: "Path: Accounting → Financial Years\nDefine fiscal periods. Closing a period locks all transactions within it to prevent backdating. Required for accurate period-based financial reports.",
      },
      {
        heading: "Financial Reports",
        body: "Trial Balance: Path: Accounting → Trial Balance\nLists all accounts with debit and credit totals. Total debits must equal total credits. Computed from live journal entries.\n\nBalance Sheet: Path: Accounting → Balance Sheet\nAssets = Liabilities + Equity. Updated in real time as transactions occur.\n\nProfit & Loss: Path: Accounting → Profit & Loss\nRevenue − COGS − Expenses = Net Profit for any selected period.",
      },
    ],
  },
  {
    id: "banking",
    title: "Banking Module",
    icon: Landmark,
    content: [
      {
        heading: "Banks, Branches, and Bank Accounts",
        body: "Path: Banking → Banks / Branches / Bank Accounts\nSet up your bank master data first:\n1. Add Banks (e.g., National Bank, City Bank).\n2. Add Branches under each bank.\n3. Add Bank Accounts linked to a branch and mapped to a COA account. Every bank transaction posts to this COA account.",
      },
      {
        heading: "Cheque Books",
        body: "Path: Banking → Cheque Books\nIssue cheque books to a bank account. Enter the starting and ending cheque numbers. The system tracks used and available leaves.",
      },
      {
        heading: "Cheque Templates",
        body: "Path: Banking → Cheque Templates\nDesign the layout of a cheque (field positions) to match your bank's physical cheque stationery. Templates are bank-specific. You must create a template before printing cheques for a bank.",
      },
      {
        heading: "Cheque Print",
        body: "Path: Banking → Cheque Print\nGenerate PDF cheques positioned to print on real cheque stationery. Two modes:\n• Single Print — fill in one cheque's details, preview, and print.\n• Bulk Print — enter multiple cheques manually or import from Excel using the provided template, then generate all PDFs at once.",
      },
      {
        heading: "Bank Reconciliation",
        body: "Path: Banking → Bank Reconciliation (also under Accounting)\n4 tabs:\n1. Bank Transactions — import or enter your bank statement transactions.\n2. Journal Entries — all system-side bank postings.\n3. Matching / Reconciliation — match bank statement lines to journal entries.\n4. Summary — reconciled vs unreconciled totals.\nExport each tab to Excel or PDF.",
      },
    ],
  },
  {
    id: "hr",
    title: "HR & Payroll",
    icon: Users,
    content: [
      {
        heading: "Employees",
        body: "Path: HR → Employees\nFull employee master: personal info, department, designation, assigned shift, joining date, salary type (monthly/hourly/daily), basic salary, and allowances. Attachments tab for employment contracts and documents.",
      },
      {
        heading: "Departments, Designations, Allowance Types",
        body: "Path: HR → Departments / Designations / Allowance Types\nSet up these masters before adding employees:\n• Departments — organisational units (Finance, Sales, Warehouse, etc.)\n• Designations — job titles (Manager, Cashier, Accountant, etc.) linked to departments\n• Allowance Types — define fixed or percentage-based allowances (Travel, Housing, Medical)",
      },
      {
        heading: "Salary Processing",
        body: "Path: HR → Salary Processing\n1. Select the payroll period (month).\n2. The system loads each employee's basic salary + allowances.\n3. Review and adjust deductions if needed.\n4. Finalize payroll — this auto-posts Dr Salary Expense / Cr Salaries Payable journal entries.\n5. Salary slips are generated automatically.",
      },
      {
        heading: "Attendance",
        body: "Path: HR → Attendance\nMark daily attendance for each employee: Present, Absent, or Half-Day. Attendance data feeds into payroll calculations for daily-wage and hourly employees.",
      },
      {
        heading: "Leave Management",
        body: "Path: HR → Leave Management\nTrack leave applications and balances per employee. Approved leaves are reflected in attendance and can affect payroll deductions.",
      },
      {
        heading: "Shifts and Shift Closing",
        body: "Path: HR → Shift Management / Shift Closing\nShifts: Define Morning, Afternoon, Night shifts and assign to employees.\n\nShift Closing (cash drawer management):\n1. Open a shift — enter opening cash balance.\n2. During the shift, POS sales are tracked.\n3. Close shift — enter actual cash in drawer; system shows variance.\n4. Generate and print the shift closing report PDF.",
      },
    ],
  },
  {
    id: "reports",
    title: "Reports Center",
    icon: BarChart3,
    content: [
      {
        heading: "Accessing Reports",
        body: "Path: Reports (sidebar group — hover to see categories)\nEvery report has:\n• Date range and other relevant filters\n• Multiple tabs for different data views within the same report\n• Export to Excel and PDF buttons\n• PDF header includes company name, report title, date/time, and logged-in user",
      },
      {
        heading: "Available Report Categories",
        body: "Sales Reports — Sales Summary, Sales by Product, Sales by Customer, Sales Returns\n\nPurchase Reports — Purchase Summary by Supplier\n\nInventory Reports — Stock Summary, Low Stock Alert, Stock Valuation\n\nWarehouse Reports — Stock by Warehouse (cross-location), Inter-Warehouse Transfers\n\nFinancial Reports — Trial Balance, Balance Sheet, Profit & Loss, Journal Listing\n\nPayroll Reports — Salary Register, Payslips\n\nHR Reports — Attendance Summary, Leave Balance\n\nExpense Reports — Expense Summary by Category\n\nBanking Reports — Cheque Status, Bank Account Balances, Reconciliation Summary\n\nTax Reports — Tax Collection Summary\n\nAging Reports — Supplier Aging (overdue payables), Customer Aging (overdue receivables)\n\nOperations Reports — Shift Closing Summary",
      },
    ],
  },
  {
    id: "admin",
    title: "Admin & Settings",
    icon: Shield,
    content: [
      {
        heading: "Users",
        body: "Path: Admin → Users\nCreate and manage user accounts. Each user has:\n• Email and password\n• Assigned role (determines screen access)\n• Assigned company, warehouses, and shops (determines data scope)\n• Super User toggle (enables company tile login flow)\n\nAdmin users see all locations; cashiers are restricted to their assigned shop.",
      },
      {
        heading: "Roles and Permissions",
        body: "Path: Admin → Roles\nCreate roles and assign fine-grained permissions. All 52+ screens are listed in the permissions matrix, grouped by module:\n• General, POS & Sales, Customers, Purchases & Suppliers, Pricing, Inventory, Warehouse & Hierarchy, Accounting, Banking, HR & Payroll, Supply Chain, Admin\n\nClick a group header to toggle all permissions in that group. The counter shows how many are selected. Assign a role to one or more users.",
      },
      {
        heading: "System Logs / Audit Trail",
        body: "Path: Admin → System Logs\nAll user actions are recorded: logins, POS checkouts, CRUD operations on all modules. Logs include the user name, action type, description, and timestamp. Filter by user or date. Also accessible from the profile dropdown under My Activity.",
      },
      {
        heading: "Tickets",
        body: "Path: Admin → Tickets\nInternal IT helpdesk and customer support tickets. Workflow: Open → Assigned → In Progress → Resolved → Closed. Each ticket has a priority (Low, Medium, High, Critical), an assignee, and an attachments panel for screenshots or documents.",
      },
      {
        heading: "Settings",
        body: "Path: Admin → Settings\nSystem-wide configuration: company details, default currency, date format, and tax settings.\n\nDeveloper Tools card (bottom of settings page):\n• Reset All Data — wipes all bizpos_* localStorage keys and reloads fresh seed data. Use for testing or demonstration purposes.",
      },
    ],
  },
  {
    id: "preferences",
    title: "User Preferences & Profile",
    icon: Settings,
    content: [
      {
        heading: "Profile Dropdown",
        body: "Click your user avatar in the top-right corner of the top bar to open the profile dropdown. Options:\n• Edit Profile — update name, email, phone, job title, department, bio, and upload a profile photo\n• Change Password — enter current and new password with confirmation\n• Preferences — configure display and notification settings\n• My Activity — view your last 20 recorded actions with a link to the full log\n• System Settings — shortcut to the Settings page\n• Sign Out",
      },
      {
        heading: "Preferences",
        body: "All preferences are saved and applied immediately:\n• Compact Tables — reduces row height and font size across all data tables\n• Show Tooltips — shows/hides tooltip hints throughout the app\n• Low Stock Notifications — bell icon shows low-stock alerts when enabled\n• Pending Approvals Notifications — bell icon shows pending requisition alerts when enabled\n• Date Format — changes how dates appear across the app (DD/MM/YYYY, MM/DD/YYYY, etc.)\n• Currency — changes the currency symbol used in POS and all reports (PKR, USD, EUR, GBP, AED, SAR)",
      },
      {
        heading: "Bookmarks and Favorites",
        body: "Bookmark icon (top bar) — saves or removes the current page from your personal bookmark list. Click the bookmark icon again to see all your bookmarked pages and jump to them.\n\nStar icon (top bar) — opens the Favorites panel. Two modes:\n• Quick access — shows your pinned screens.\n• Configure — browse all screens and toggle which ones to pin.\n\nBoth bookmarks and favorites are saved per user in localStorage.",
      },
    ],
  },
];

export default function UserManualPage() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["getting-started"]),
  );
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveSection(id);
  };

  const navigateToSection = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActiveSection(id);
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const filtered = search.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.content.some(
            (c) =>
              c.heading.toLowerCase().includes(search.toLowerCase()) ||
              c.body.toLowerCase().includes(search.toLowerCase()),
          ),
      )
    : sections;

  const handleDownloadPDF = () => {
    const JsPDFCtor = (window as any).jspdf?.jsPDF ?? (window as any).jsPDF;
    const doc = new JsPDFCtor({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = 20;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BizPOS — Complete User Manual", margin, 19);
    y = 40;

    for (const section of sections) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(section.title, margin, y);
      y += 8;

      for (const item of section.content) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(item.heading, margin, y);
        y += 6;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(item.body, contentW);
        for (const line of lines as string[]) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += 5;
        }
        y += 4;
      }
      y += 6;
    }

    doc.save("BizPOS-User-Manual.pdf");
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar TOC */}
      <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">User Manual</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search manual..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <nav className="p-2">
          {filtered.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => navigateToSection(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors mb-0.5 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                {expanded.has(s.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Full PDF
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              BizPOS — Complete User Manual
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              A complete reference guide for all modules. Click a section in the
              sidebar to jump to it.
            </p>
          </div>

          {filtered.map((section) => {
            const Icon = section.icon;
            const isOpen = expanded.has(section.id);
            return (
              <div
                key={section.id}
                id={section.id}
                className="mb-4 bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-base flex-1">
                    {section.title}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {section.content.map((item) => (
                      <div key={item.heading} className="px-5 py-4">
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                          {item.heading}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

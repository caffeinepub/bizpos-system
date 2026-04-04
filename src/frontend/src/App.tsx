import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import AccountMappingPage from "./pages/AccountMappingPage";
import AllowanceTypesPage from "./pages/AllowanceTypesPage";
import AttendancePage from "./pages/AttendancePage";
import BalanceSheetPage from "./pages/BalanceSheetPage";
import BankAccountsPage from "./pages/BankAccountsPage";
import BankBranchesPage from "./pages/BankBranchesPage";
import BankReconciliationPage from "./pages/BankReconciliationPage";
import BanksPage from "./pages/BanksPage";
import ChartOfAccountsPage from "./pages/ChartOfAccountsPage";
import ChequeBooksPage from "./pages/ChequeBooksPage";
import ChequePrintPage from "./pages/ChequePrintPage";
import ChequeTemplatesPage from "./pages/ChequeTemplatesPage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanySelectPage from "./pages/CompanySelectPage";
import CreditNotesPage from "./pages/CreditNotesPage";
import CustomerGroupsPage from "./pages/CustomerGroupsPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import DebitNotesPage from "./pages/DebitNotesPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DesignationsPage from "./pages/DesignationsPage";
import DiscountsPage from "./pages/DiscountsPage";
import EmployeesPage from "./pages/EmployeesPage";
import ExpenseCategoriesPage from "./pages/ExpenseCategoriesPage";
import ExpensesPage from "./pages/ExpensesPage";
import FinancialYearsPage from "./pages/FinancialYearsPage";
import GoodsReceiptPage from "./pages/GoodsReceiptPage";
import InventoryTransfersPage from "./pages/InventoryTransfersPage";
import ItemBrandsPage from "./pages/ItemBrandsPage";
import ItemCategoriesPage from "./pages/ItemCategoriesPage";
import ItemUnitsPage from "./pages/ItemUnitsPage";
import ItemsPage from "./pages/ItemsPage";
import JournalEntriesPage from "./pages/JournalEntriesPage";
import LeaveManagementPage from "./pages/LeaveManagementPage";
import LoginPage from "./pages/LoginPage";
import LogsPage from "./pages/LogsPage";
import OpeningBalancesPage from "./pages/OpeningBalancesPage";
import POSPage from "./pages/POSPage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import PaymentModesPage from "./pages/PaymentModesPage";
import ProfitLossPage from "./pages/ProfitLossPage";
import PromotionsPage from "./pages/PromotionsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import PurchaseRequisitionsPage from "./pages/PurchaseRequisitionsPage";
import PurchaseReturnsPage from "./pages/PurchaseReturnsPage";
import PurchasesPage from "./pages/PurchasesPage";
import ReceivePaymentPage from "./pages/ReceivePaymentPage";
import ReportsPage from "./pages/ReportsPage";
import RolesPage from "./pages/RolesPage";
import SalaryProcessingPage from "./pages/SalaryProcessingPage";
import SalarySlipsPage from "./pages/SalarySlipsPage";
import SaleDetailPage from "./pages/SaleDetailPage";
import SalesListPage from "./pages/SalesListPage";
import SalesReturnsPage from "./pages/SalesReturnsPage";
import SettingsPage from "./pages/SettingsPage";
import ShiftClosingPage from "./pages/ShiftClosingPage";
import ShiftsPage from "./pages/ShiftsPage";
import ShipmentTrackingPage from "./pages/ShipmentTrackingPage";
import ShopsPage from "./pages/ShopsPage";
import StockAdjustmentPage from "./pages/StockAdjustmentPage";
import SupplierPerformancePage from "./pages/SupplierPerformancePage";
import SuppliersPage from "./pages/SuppliersPage";
import TaxesPage from "./pages/TaxesPage";
import TicketsPage from "./pages/TicketsPage";
import TrialBalancePage from "./pages/TrialBalancePage";
import UsersPage from "./pages/UsersPage";
import WarehouseSelectPage from "./pages/WarehouseSelectPage";
import WarehouseStockPage from "./pages/WarehouseStockPage";
import WarehousesPage from "./pages/WarehousesPage";

// Ensure v9 seed data exists (legacy - kept for existing data)
(function ensureV9Seed() {
  if (localStorage.getItem("bizpos_seeded_v9")) return;

  // Financial Years
  if (!localStorage.getItem("bizpos_financial_years")) {
    localStorage.setItem(
      "bizpos_financial_years",
      JSON.stringify([
        {
          id: "fy1",
          name: "FY 2025-26",
          startDate: "2025-04-01",
          endDate: "2026-03-31",
          isCurrent: true,
          status: "Open",
        },
      ]),
    );
  }

  // Customer Groups
  if (!localStorage.getItem("bizpos_customer_groups")) {
    localStorage.setItem(
      "bizpos_customer_groups",
      JSON.stringify([
        {
          id: "cg1",
          name: "Retail",
          description: "Standard retail customers",
          discount: 0,
          status: "Active",
        },
        {
          id: "cg2",
          name: "Wholesale",
          description: "Wholesale buyers with volume discounts",
          discount: 5,
          status: "Active",
        },
        {
          id: "cg3",
          name: "VIP",
          description: "VIP customers with premium discounts",
          discount: 10,
          status: "Active",
        },
        {
          id: "cg4",
          name: "Corporate",
          description: "Corporate accounts",
          discount: 8,
          status: "Active",
        },
      ]),
    );
  }

  // Expense Categories
  if (!localStorage.getItem("bizpos_expense_categories")) {
    localStorage.setItem(
      "bizpos_expense_categories",
      JSON.stringify([
        {
          id: "ec1",
          name: "Utilities",
          description: "Electricity, water, internet",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec2",
          name: "Rent",
          description: "Office and warehouse rent",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec3",
          name: "Transport",
          description: "Transport and logistics costs",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec4",
          name: "Office Supplies",
          description: "Stationery and office items",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec5",
          name: "Marketing",
          description: "Advertising and promotions",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec6",
          name: "Maintenance",
          description: "Equipment and facility maintenance",
          accountId: "",
          accountName: "",
          status: "Active",
        },
      ]),
    );
  }

  // Sample Expenses (enhanced with category)
  const existingExpenses = JSON.parse(
    localStorage.getItem("bizpos_expenses") || "[]",
  );
  if (existingExpenses.length < 3) {
    localStorage.setItem(
      "bizpos_expenses",
      JSON.stringify([
        ...existingExpenses,
        {
          id: "exp-v9-1",
          accountId: "",
          accountName: "General Expense",
          categoryId: "ec1",
          categoryName: "Utilities",
          amount: 15000,
          description: "Monthly electricity bill",
          date: "2026-03-01",
          paymentMethod: "Bank",
          reference: "UTIL-001",
          createdBy: "System Admin",
          createdAt: new Date().toISOString(),
        },
        {
          id: "exp-v9-2",
          accountId: "",
          accountName: "General Expense",
          categoryId: "ec2",
          categoryName: "Rent",
          amount: 50000,
          description: "Office rent - March 2026",
          date: "2026-03-05",
          paymentMethod: "Cheque",
          reference: "RENT-003",
          createdBy: "System Admin",
          createdAt: new Date().toISOString(),
        },
        {
          id: "exp-v9-3",
          accountId: "",
          accountName: "General Expense",
          categoryId: "ec3",
          categoryName: "Transport",
          amount: 8500,
          description: "Delivery charges for warehouse",
          date: "2026-03-10",
          paymentMethod: "Cash",
          reference: "TRN-012",
          createdBy: "System Admin",
          createdAt: new Date().toISOString(),
        },
      ]),
    );
  }

  // Sample Credit Notes
  if (!localStorage.getItem("bizpos_credit_notes")) {
    localStorage.setItem(
      "bizpos_credit_notes",
      JSON.stringify([
        {
          id: "cn-001",
          noteNumber: "CN-2026-001",
          customerId: "",
          customerName: "Walk-in Customer",
          saleRef: "SALE-2026-001",
          date: "2026-03-15",
          items: [
            {
              itemId: "",
              itemName: "Samsung Galaxy S24",
              qty: 1,
              price: 185000,
              subtotal: 185000,
            },
          ],
          totalAmount: 185000,
          reason: "Customer received defective unit",
          status: "Posted",
          createdBy: "System Admin",
          createdAt: new Date().toISOString(),
          modifiedBy: "System Admin",
          modifiedAt: new Date().toISOString(),
        },
        {
          id: "cn-002",
          noteNumber: "CN-2026-002",
          customerId: "",
          customerName: "Ahmed Khan",
          saleRef: "SALE-2026-003",
          date: "2026-03-20",
          items: [
            {
              itemId: "",
              itemName: "Office Chair",
              qty: 2,
              price: 5000,
              subtotal: 10000,
            },
          ],
          totalAmount: 10000,
          reason: "Wrong color delivered",
          status: "Draft",
          createdBy: "System Admin",
          createdAt: new Date().toISOString(),
          modifiedBy: "System Admin",
          modifiedAt: new Date().toISOString(),
        },
      ]),
    );
  }

  // Sample Debit Notes
  if (!localStorage.getItem("bizpos_debit_notes")) {
    localStorage.setItem(
      "bizpos_debit_notes",
      JSON.stringify([
        {
          id: "dn-001",
          noteNumber: "DN-2026-001",
          supplierId: "",
          supplierName: "Tech Supplies Co.",
          purchaseRef: "PO-2026-001",
          date: "2026-03-16",
          items: [
            {
              itemId: "",
              itemName: "Laptop Dell XPS",
              qty: 1,
              price: 150000,
              subtotal: 150000,
            },
          ],
          totalAmount: 150000,
          reason: "Damaged in transit",
          status: "Posted",
          createdBy: "System Admin",
          createdAt: new Date().toISOString(),
          modifiedBy: "System Admin",
          modifiedAt: new Date().toISOString(),
        },
      ]),
    );
  }

  // Opening Balances (empty by default)
  if (!localStorage.getItem("bizpos_opening_balances")) {
    localStorage.setItem("bizpos_opening_balances", JSON.stringify([]));
  }

  // Update items with reorderLevel and reorderQty if not set
  try {
    const items = JSON.parse(localStorage.getItem("bizpos_items") || "[]");
    const updatedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      reorderLevel: item.reorderLevel ?? 10,
      reorderQty: item.reorderQty ?? 50,
    }));
    localStorage.setItem("bizpos_items", JSON.stringify(updatedItems));
  } catch {
    /* ignore */
  }

  localStorage.setItem("bizpos_seeded_v9", "true");
})();

// V10 seed: update role permissions + add bank transactions
(function ensureSeedV10() {
  if (localStorage.getItem("bizpos_seeded_v10")) return;

  const ALL_52_PERMS = [
    "dashboard",
    "reports",
    "logs",
    "settings",
    "pos",
    "sales",
    "sales_returns",
    "credit_notes",
    "payments",
    "customers",
    "customer_groups",
    "purchases",
    "purchase_orders",
    "purchase_returns",
    "debit_notes",
    "suppliers",
    "taxes",
    "discounts",
    "promotions",
    "inventory",
    "stock_adjustment",
    "warehouse_stock",
    "companies",
    "warehouse",
    "shops",
    "accounts",
    "journal_entries",
    "opening_balances",
    "financial_years",
    "expenses",
    "expense_categories",
    "bank_reconciliation",
    "trial_balance",
    "balance_sheet",
    "profit_loss",
    "employees",
    "salary_processing",
    "leave_management",
    "departments",
    "designations",
    "allowance_types",
    "salary_slips",
    "shifts",
    "shift_closing",
    "attendance",
    "supply_chain",
    "purchase_requisitions",
    "goods_receipt",
    "inventory_transfers",
    "shipments",
    "supplier_performance",
    "banking",
    "tickets",
    "users",
    "roles",
    "item_categories",
    "item_brands",
    "item_units",
    "attachments",
  ];

  // Update roles
  try {
    const roles = JSON.parse(localStorage.getItem("bizpos_roles") || "[]");
    const updatedRoles = roles.map(
      (r: { name: string; permissions: string[] }) => {
        if (r.name === "Admin") return { ...r, permissions: ALL_52_PERMS };
        if (r.name === "Cashier")
          return {
            ...r,
            permissions: ["dashboard", "pos", "sales", "payments"],
          };
        return r;
      },
    );
    localStorage.setItem("bizpos_roles", JSON.stringify(updatedRoles));
  } catch {
    /* ignore */
  }

  // Ensure super user has correct flags
  try {
    const users = JSON.parse(localStorage.getItem("bizpos_users") || "[]");
    const updatedUsers = users.map(
      (u: {
        email: string;
        isSuperUser?: boolean;
        assignedCompanyId?: string;
        assignedWarehouseIds?: string[];
        assignedShopIds?: string[];
      }) => {
        if (u.email === "superuser@bizpos.com") {
          return {
            ...u,
            isSuperUser: true,
            assignedCompanyId: null,
            assignedWarehouseIds: [],
            assignedShopIds: [],
          };
        }
        return u;
      },
    );
    localStorage.setItem("bizpos_users", JSON.stringify(updatedUsers));
  } catch {
    /* ignore */
  }

  // Seed bank transactions if not already seeded
  if (
    !localStorage.getItem("bizpos_bank_transactions") ||
    JSON.parse(localStorage.getItem("bizpos_bank_transactions") || "[]")
      .length === 0
  ) {
    localStorage.setItem(
      "bizpos_bank_transactions",
      JSON.stringify([
        {
          id: "bt1",
          bankAccountId: "ba1",
          date: "2026-03-01",
          type: "Credit",
          amount: 50000,
          description: "Sales deposit",
          reference: "DEP-001",
          reconciled: false,
        },
        {
          id: "bt2",
          bankAccountId: "ba1",
          date: "2026-03-05",
          type: "Debit",
          amount: 15000,
          description: "Supplier payment",
          reference: "CHQ-001",
          reconciled: false,
        },
        {
          id: "bt3",
          bankAccountId: "ba1",
          date: "2026-03-10",
          type: "Credit",
          amount: 30000,
          description: "Customer payment",
          reference: "DEP-002",
          reconciled: false,
        },
      ]),
    );
  }

  localStorage.setItem("bizpos_seeded_v10", "1");
})();

// V11 seed: ensure all sessions have correct permissions refresh
(function ensureSeedV11() {
  if (localStorage.getItem("bizpos_seeded_v11")) return;

  // Ensure all roles have correct permissions
  const ALL_PERMS = [
    "dashboard",
    "reports",
    "logs",
    "settings",
    "pos",
    "sales",
    "sales_returns",
    "credit_notes",
    "payments",
    "customers",
    "customer_groups",
    "purchases",
    "purchase_orders",
    "purchase_returns",
    "debit_notes",
    "suppliers",
    "taxes",
    "discounts",
    "promotions",
    "inventory",
    "stock_adjustment",
    "warehouse_stock",
    "companies",
    "warehouse",
    "shops",
    "accounts",
    "journal_entries",
    "opening_balances",
    "financial_years",
    "expenses",
    "expense_categories",
    "bank_reconciliation",
    "trial_balance",
    "balance_sheet",
    "profit_loss",
    "employees",
    "salary_processing",
    "leave_management",
    "departments",
    "designations",
    "allowance_types",
    "salary_slips",
    "shifts",
    "shift_closing",
    "attendance",
    "supply_chain",
    "purchase_requisitions",
    "goods_receipt",
    "inventory_transfers",
    "shipments",
    "supplier_performance",
    "banking",
    "banks",
    "bank_branches",
    "bank_accounts",
    "cheque_books",
    "cheque_templates",
    "cheque_print",
    "tickets",
    "users",
    "roles",
    "item_categories",
    "item_brands",
    "item_units",
    "attachments",
  ];

  try {
    const roles = JSON.parse(localStorage.getItem("bizpos_roles") || "[]");
    const updatedRoles = roles.map(
      (r: { name: string; permissions: string[] }) => {
        if (r.name === "Admin") return { ...r, permissions: ALL_PERMS };
        if (r.name === "Cashier")
          return {
            ...r,
            permissions: ["dashboard", "pos", "sales", "payments"],
          };
        return r;
      },
    );
    localStorage.setItem("bizpos_roles", JSON.stringify(updatedRoles));
  } catch {
    /* ignore */
  }

  // Fix session permissions if admin
  try {
    const session = JSON.parse(
      localStorage.getItem("bizpos_session") || "null",
    );
    if (
      session &&
      (session.permissions?.includes("all") || session.roleName === "Admin")
    ) {
      const updated = { ...session, permissions: ALL_PERMS };
      localStorage.setItem("bizpos_session", JSON.stringify(updated));
    }
  } catch {
    /* ignore */
  }

  localStorage.setItem("bizpos_seeded_v11", "1");
})();

// Fix: ensure "banking" permission is in all admin sessions
(() => {
  try {
    const session = JSON.parse(
      localStorage.getItem("bizpos_session") || "null",
    );
    if (
      session &&
      Array.isArray(session.permissions) &&
      !session.permissions.includes("banking")
    ) {
      if (
        session.permissions.includes("all") ||
        session.permissions.includes("banks") ||
        session.permissions.includes("reports")
      ) {
        const updated = {
          ...session,
          permissions: [
            ...session.permissions.filter((p: string) => p !== "banks"),
            "banking",
            "banks",
          ],
        };
        localStorage.setItem("bizpos_session", JSON.stringify(updated));
      }
    }
  } catch {
    /* ignore */
  }
})();

// V12 seed: item categories, brands, units
(function ensureSeedV12() {
  if (localStorage.getItem("bizpos_seeded_v12")) return;

  if (!localStorage.getItem("bizpos_item_categories")) {
    const cats = [
      {
        id: "cat-001",
        code: "CAT-001",
        name: "Electronics",
        description: "Electronic devices and gadgets",
        status: "active",
      },
      {
        id: "cat-002",
        code: "CAT-002",
        name: "Accessories",
        description: "Device accessories and peripherals",
        parentId: "cat-001",
        status: "active",
      },
      {
        id: "cat-003",
        code: "CAT-003",
        name: "Clothing",
        description: "Apparel and fashion items",
        status: "active",
      },
      {
        id: "cat-004",
        code: "CAT-004",
        name: "Food & Beverage",
        description: "Food, drinks and consumables",
        status: "active",
      },
      {
        id: "cat-005",
        code: "CAT-005",
        name: "Office Supplies",
        description: "Office stationery and equipment",
        status: "active",
      },
      {
        id: "cat-006",
        code: "CAT-006",
        name: "Sports",
        description: "Sports equipment and apparel",
        status: "active",
      },
      {
        id: "cat-007",
        code: "CAT-007",
        name: "Toys",
        description: "Toys, games and hobbies",
        status: "active",
      },
      {
        id: "cat-008",
        code: "CAT-008",
        name: "Home & Garden",
        description: "Home decor and gardening",
        status: "active",
      },
    ];
    localStorage.setItem("bizpos_item_categories", JSON.stringify(cats));
  }

  if (!localStorage.getItem("bizpos_item_brands")) {
    const brands = [
      {
        id: "brand-001",
        code: "BRD-001",
        name: "Samsung",
        description: "Samsung Electronics",
        status: "active",
      },
      {
        id: "brand-002",
        code: "BRD-002",
        name: "Apple",
        description: "Apple Inc.",
        status: "active",
      },
      {
        id: "brand-003",
        code: "BRD-003",
        name: "Sony",
        description: "Sony Corporation",
        status: "active",
      },
      {
        id: "brand-004",
        code: "BRD-004",
        name: "LG",
        description: "LG Electronics",
        status: "active",
      },
      {
        id: "brand-005",
        code: "BRD-005",
        name: "Nike",
        description: "Nike Inc.",
        status: "active",
      },
      {
        id: "brand-006",
        code: "BRD-006",
        name: "Adidas",
        description: "Adidas AG",
        status: "active",
      },
      {
        id: "brand-007",
        code: "BRD-007",
        name: "Generic",
        description: "Generic / Unbranded",
        status: "active",
      },
      {
        id: "brand-008",
        code: "BRD-008",
        name: "Anker",
        description: "Anker Innovations",
        status: "active",
      },
    ];
    localStorage.setItem("bizpos_item_brands", JSON.stringify(brands));
  }

  if (!localStorage.getItem("bizpos_item_units")) {
    const units = [
      {
        id: "unit-001",
        code: "UOM-001",
        name: "Piece",
        abbreviation: "pcs",
        isBaseUnit: true,
        conversionFactor: 1,
        status: "active",
      },
      {
        id: "unit-002",
        code: "UOM-002",
        name: "Kilogram",
        abbreviation: "kg",
        isBaseUnit: false,
        conversionFactor: 1000,
        status: "active",
      },
      {
        id: "unit-003",
        code: "UOM-003",
        name: "Litre",
        abbreviation: "L",
        isBaseUnit: false,
        conversionFactor: 1,
        status: "active",
      },
      {
        id: "unit-004",
        code: "UOM-004",
        name: "Box",
        abbreviation: "box",
        isBaseUnit: false,
        conversionFactor: 12,
        status: "active",
      },
      {
        id: "unit-005",
        code: "UOM-005",
        name: "Dozen",
        abbreviation: "doz",
        isBaseUnit: false,
        conversionFactor: 12,
        status: "active",
      },
      {
        id: "unit-006",
        code: "UOM-006",
        name: "Meter",
        abbreviation: "m",
        isBaseUnit: false,
        conversionFactor: 1,
        status: "active",
      },
      {
        id: "unit-007",
        code: "UOM-007",
        name: "Pair",
        abbreviation: "pr",
        isBaseUnit: false,
        conversionFactor: 2,
        status: "active",
      },
    ];
    localStorage.setItem("bizpos_item_units", JSON.stringify(units));
  }

  // Update roles with new permissions
  try {
    const roles = JSON.parse(localStorage.getItem("bizpos_roles") || "[]");
    const newPerms = [
      "item_categories",
      "item_brands",
      "item_units",
      "attachments",
    ];
    const updatedRoles = roles.map(
      (r: { name: string; permissions: string[] }) => {
        if (r.name === "Admin") {
          return {
            ...r,
            permissions: [...new Set([...(r.permissions || []), ...newPerms])],
          };
        }
        return r;
      },
    );
    localStorage.setItem("bizpos_roles", JSON.stringify(updatedRoles));
  } catch {
    /* ignore */
  }

  // Update current session
  try {
    const session = JSON.parse(
      localStorage.getItem("bizpos_session") || "null",
    );
    if (session && Array.isArray(session.permissions)) {
      const newPerms = [
        "item_categories",
        "item_brands",
        "item_units",
        "attachments",
      ];
      const merged = [...new Set([...session.permissions, ...newPerms])];
      localStorage.setItem(
        "bizpos_session",
        JSON.stringify({ ...session, permissions: merged }),
      );
    }
  } catch {
    /* ignore */
  }

  localStorage.setItem("bizpos_seeded_v12", "1");
})();

// V13 seed: stockMovements init, fix seed data
(function ensureSeedV13() {
  if (localStorage.getItem("bizpos_seeded_v13")) return;

  // Init stockMovements if not present
  if (!localStorage.getItem("bizpos_stock_movements")) {
    localStorage.setItem("bizpos_stock_movements", JSON.stringify([]));
  }

  // Fix any existing seed sales with wrong shopId
  try {
    const sales = JSON.parse(localStorage.getItem("bizpos_sales") || "[]");
    const updated = sales.map(
      (s: {
        id: string;
        shopId?: string;
        shopName?: string;
        paymentMethod?: string;
        taxAmount?: number;
        promoSavings?: number;
      }) => {
        if (s.shopId === "shop-001") {
          return {
            ...s,
            shopId: "shop1",
            shopName: s.shopName || "Downtown Shop A",
          };
        }
        return s;
      },
    );
    localStorage.setItem("bizpos_sales", JSON.stringify(updated));
  } catch {
    /* ignore */
  }

  // Fix seed customers with groupId/groupName
  try {
    const customers = JSON.parse(
      localStorage.getItem("bizpos_customers") || "[]",
    );
    const updated = customers.map(
      (c: { id: string; groupId?: string; groupName?: string }) => {
        if (c.id === "cust-001" && !c.groupId)
          return { ...c, groupId: "cg1", groupName: "Retail" };
        if (c.id === "cust-002" && !c.groupId)
          return { ...c, groupId: "cg1", groupName: "Retail" };
        if (c.id === "cust-003" && !c.groupId)
          return { ...c, groupId: "cg3", groupName: "VIP" };
        return c;
      },
    );
    localStorage.setItem("bizpos_customers", JSON.stringify(updated));
  } catch {
    /* ignore */
  }

  // Fix seed POs supplier IDs
  try {
    const pos = JSON.parse(
      localStorage.getItem("bizpos_purchase_orders") || "[]",
    );
    const updated = pos.map(
      (po: { id: string; supplierId: string; supplierName: string }) => {
        if (po.id === "po-1" && po.supplierId === "sup-1") {
          return {
            ...po,
            supplierId: "sup-001",
            supplierName: "Tech Distributors Ltd",
          };
        }
        if (po.id === "po-2" && po.supplierId === "sup-2") {
          return {
            ...po,
            supplierId: "sup-002",
            supplierName: "Galaxy Electronics",
          };
        }
        if (po.id === "po-3" && po.supplierId === "sup-1") {
          return { ...po, supplierId: "sup-001" };
        }
        return po;
      },
    );
    localStorage.setItem("bizpos_purchase_orders", JSON.stringify(updated));
  } catch {
    /* ignore */
  }

  localStorage.setItem("bizpos_seeded_v13", "1");
})();

function isLoggedIn() {
  return !!localStorage.getItem("bizpos_session");
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (isLoggedIn()) {
      try {
        const session = JSON.parse(
          localStorage.getItem("bizpos_session") || "{}",
        );
        if (session.isSuperUser && !session.activeCompanyId) {
          throw redirect({ to: "/company-select" });
        }
      } catch (e) {
        if (e && typeof e === "object" && "href" in (e as object)) throw e;
      }
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  beforeLoad: () => {
    const raw = localStorage.getItem("bizpos_session");
    if (!raw) throw redirect({ to: "/" });
    try {
      const session = JSON.parse(raw);
      if (session.isSuperUser && !session.activeCompanyId) {
        throw redirect({ to: "/company-select" });
      }
    } catch (e) {
      if (e instanceof Error) throw redirect({ to: "/" });
      throw e;
    }
  },
  component: AppLayout,
});

const warehouseSelectRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/warehouse-select",
  component: WarehouseSelectPage,
});
const companySelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/company-select",
  beforeLoad: () => {
    const raw = localStorage.getItem("bizpos_session");
    if (!raw) throw redirect({ to: "/" });
    try {
      const session = JSON.parse(raw);
      if (!session.isSuperUser) throw redirect({ to: "/dashboard" });
    } catch (e) {
      if (e instanceof Error) throw redirect({ to: "/" });
      throw e;
    }
  },
  component: CompanySelectPage,
});
const companiesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/companies",
  component: CompaniesPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});
const posRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/pos",
  component: POSPage,
});
const salesListRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales",
  component: SalesListPage,
});
const saleDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales/$saleId",
  component: SaleDetailPage,
});
const itemsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/items",
  component: ItemsPage,
});
const itemCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/item-categories",
  component: ItemCategoriesPage,
});
const itemBrandsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/item-brands",
  component: ItemBrandsPage,
});
const itemUnitsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/item-units",
  component: ItemUnitsPage,
});
const stockAdjustmentRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/stock-adjustment",
  component: StockAdjustmentPage,
});
const suppliersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/suppliers",
  component: SuppliersPage,
});
const purchasesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchases",
  component: PurchasesPage,
});
const warehouseStockRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/warehouse-stock",
  component: WarehouseStockPage,
});
const warehousesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/warehouses",
  component: WarehousesPage,
});
const shopsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/shops",
  component: ShopsPage,
});
const paymentModesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/payment-modes",
  component: PaymentModesPage,
});
const receivePaymentRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/receive-payment",
  component: ReceivePaymentPage,
});
const paymentHistoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/payment-history",
  component: PaymentHistoryPage,
});
const chartOfAccountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/chart-of-accounts",
  component: ChartOfAccountsPage,
});
const accountMappingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/account-mapping",
  component: AccountMappingPage,
});
const journalEntriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/journal-entries",
  component: JournalEntriesPage,
});
const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/expenses",
  component: ExpensesPage,
});
const expenseCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/expense-categories",
  component: ExpenseCategoriesPage,
});
const trialBalanceRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/trial-balance",
  component: TrialBalancePage,
});
const balanceSheetRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/balance-sheet",
  component: BalanceSheetPage,
});
const profitLossRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/profit-loss",
  component: ProfitLossPage,
});
const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports",
  component: ReportsPage,
});
const employeesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/employees",
  component: EmployeesPage,
});
const salaryProcessingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/salary-processing",
  component: SalaryProcessingPage,
});
const leaveManagementRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/leave-management",
  component: LeaveManagementPage,
});
const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/users",
  component: UsersPage,
});
const rolesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/roles",
  component: RolesPage,
});
const logsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/logs",
  component: LogsPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: SettingsPage,
});
const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/customers",
  component: CustomersPage,
});
const bankReconciliationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/bank-reconciliation",
  component: BankReconciliationPage,
});
const purchaseOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchase-orders",
  component: PurchaseOrdersPage,
});
const taxesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/taxes",
  component: TaxesPage,
});
const discountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/discounts",
  component: DiscountsPage,
});
const promotionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/promotions",
  component: PromotionsPage,
});
const purchaseRequisitionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchase-requisitions",
  component: PurchaseRequisitionsPage,
});
const goodsReceiptRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/goods-receipt",
  component: GoodsReceiptPage,
});
const inventoryTransfersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory-transfers",
  component: InventoryTransfersPage,
});
const shipmentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/shipments",
  component: ShipmentTrackingPage,
});
const supplierPerformanceRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/supplier-performance",
  component: SupplierPerformancePage,
});
const departmentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/departments",
  component: DepartmentsPage,
});
const designationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/designations",
  component: DesignationsPage,
});
const allowanceTypesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/allowance-types",
  component: AllowanceTypesPage,
});
const salarySlipsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/salary-slips",
  component: SalarySlipsPage,
});
const shiftsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/shifts",
  component: ShiftsPage,
});
const shiftClosingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/shift-closing",
  component: ShiftClosingPage,
});
const banksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/banks",
  component: BanksPage,
});
const bankBranchesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/bank-branches",
  component: BankBranchesPage,
});
const bankAccountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/bank-accounts",
  component: BankAccountsPage,
});
const chequeBooksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/cheque-books",
  component: ChequeBooksPage,
});
const chequeTemplatesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/cheque-templates",
  component: ChequeTemplatesPage,
});
const attendanceRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/attendance",
  component: AttendancePage,
});
const ticketsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/tickets",
  component: TicketsPage,
});
const chequePrintRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/cheque-print",
  component: ChequePrintPage,
});

// New routes
const creditNotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/credit-notes",
  component: CreditNotesPage,
});
const debitNotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/debit-notes",
  component: DebitNotesPage,
});
const openingBalancesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/opening-balances",
  component: OpeningBalancesPage,
});
const financialYearsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/financial-years",
  component: FinancialYearsPage,
});
const salesReturnsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales-returns",
  component: SalesReturnsPage,
});
const purchaseReturnsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/purchase-returns",
  component: PurchaseReturnsPage,
});
const customerGroupsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/customer-groups",
  component: CustomerGroupsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  companySelectRoute,
  layoutRoute.addChildren([
    warehouseSelectRoute,
    companiesRoute,
    dashboardRoute,
    posRoute,
    salesListRoute,
    saleDetailRoute,
    itemsRoute,
    itemCategoriesRoute,
    itemBrandsRoute,
    itemUnitsRoute,
    stockAdjustmentRoute,
    suppliersRoute,
    purchasesRoute,
    warehouseStockRoute,
    warehousesRoute,
    shopsRoute,
    paymentModesRoute,
    receivePaymentRoute,
    paymentHistoryRoute,
    chartOfAccountsRoute,
    accountMappingRoute,
    journalEntriesRoute,
    expensesRoute,
    expenseCategoriesRoute,
    trialBalanceRoute,
    balanceSheetRoute,
    profitLossRoute,
    reportsRoute,
    employeesRoute,
    salaryProcessingRoute,
    leaveManagementRoute,
    usersRoute,
    rolesRoute,
    logsRoute,
    settingsRoute,
    customersRoute,
    bankReconciliationRoute,
    purchaseOrdersRoute,
    taxesRoute,
    discountsRoute,
    promotionsRoute,
    purchaseRequisitionsRoute,
    goodsReceiptRoute,
    inventoryTransfersRoute,
    shipmentsRoute,
    supplierPerformanceRoute,
    departmentsRoute,
    designationsRoute,
    allowanceTypesRoute,
    salarySlipsRoute,
    shiftsRoute,
    shiftClosingRoute,
    banksRoute,
    bankBranchesRoute,
    bankAccountsRoute,
    chequeBooksRoute,
    chequeTemplatesRoute,
    chequePrintRoute,
    attendanceRoute,
    ticketsRoute,
    // New routes
    creditNotesRoute,
    debitNotesRoute,
    openingBalancesRoute,
    financialYearsRoute,
    salesReturnsRoute,
    purchaseReturnsRoute,
    customerGroupsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

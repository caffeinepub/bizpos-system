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

// Ensure v9 seed data exists
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
    if (!isLoggedIn()) throw redirect({ to: "/" });
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
    if (!isLoggedIn()) throw redirect({ to: "/" });
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

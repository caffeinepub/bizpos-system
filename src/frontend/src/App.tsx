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
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DesignationsPage from "./pages/DesignationsPage";
import DiscountsPage from "./pages/DiscountsPage";
import EmployeesPage from "./pages/EmployeesPage";
import ExpensesPage from "./pages/ExpensesPage";
import GoodsReceiptPage from "./pages/GoodsReceiptPage";
import InventoryTransfersPage from "./pages/InventoryTransfersPage";
import ItemsPage from "./pages/ItemsPage";
import JournalEntriesPage from "./pages/JournalEntriesPage";
import LeaveManagementPage from "./pages/LeaveManagementPage";
import LoginPage from "./pages/LoginPage";
import LogsPage from "./pages/LogsPage";
import POSPage from "./pages/POSPage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import PaymentModesPage from "./pages/PaymentModesPage";
import ProfitLossPage from "./pages/ProfitLossPage";
import PromotionsPage from "./pages/PromotionsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import PurchaseRequisitionsPage from "./pages/PurchaseRequisitionsPage";
import PurchasesPage from "./pages/PurchasesPage";
import ReceivePaymentPage from "./pages/ReceivePaymentPage";
import ReportsPage from "./pages/ReportsPage";
import RolesPage from "./pages/RolesPage";
import SalaryProcessingPage from "./pages/SalaryProcessingPage";
import SalarySlipsPage from "./pages/SalarySlipsPage";
import SaleDetailPage from "./pages/SaleDetailPage";
import SalesListPage from "./pages/SalesListPage";
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
        if (session.isSuperUser && session.activeWarehouseId === null) {
          throw redirect({ to: "/warehouse-select" });
        }
      } catch (e) {
        // If redirect was thrown, rethrow it
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

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    warehouseSelectRoute,
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

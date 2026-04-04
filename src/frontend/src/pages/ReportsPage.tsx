import PageHelp from "@/components/PageHelp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, getPrefs } from "@/lib/prefs";
import { useLocation } from "@tanstack/react-router";
import {
  BarChart2,
  BookOpen,
  Building2,
  DollarSign,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";

import {
  exportExcel as exportExcelUtil,
  exportPDF as exportPDFUtil,
} from "../utils/exportUtils";

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 0 });
}

function getActiveCompanyName(): string {
  try {
    const session = JSON.parse(localStorage.getItem("bizpos_session") || "{}");
    if (session?.activeCompanyId) {
      const companies = JSON.parse(
        localStorage.getItem("bizpos_companies") || "[]",
      );
      const co = companies.find(
        (c: { id: string; name: string }) => c.id === session.activeCompanyId,
      );
      if (co?.name) return co.name;
    }
    const settings = JSON.parse(
      localStorage.getItem("bizpos_settings") || "{}",
    );
    return settings?.companyName || "BizPOS";
  } catch {
    return "BizPOS";
  }
}

function exportExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  companyName: string,
  title?: string,
  generatedBy?: string,
  filters?: { label: string; value: string }[],
) {
  exportExcelUtil(filename, "Report", headers, rows, {
    companyName,
    reportTitle: title ?? filename.replace(/\.xlsx$/, "").replace(/-/g, " "),
    generatedBy: generatedBy ?? "Unknown",
    filters,
  });
}

function exportPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  companyName: string,
  generatedBy?: string,
  filters?: { label: string; value: string }[],
) {
  exportPDFUtil(title, headers, rows, filename, {
    companyName,
    generatedBy: generatedBy ?? "Unknown",
    filters,
  });
}

const COLORS = [
  "#2563EB",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

function ExportBar({
  title,
  headers,
  rows,
  filename,
  companyName,
  generatedBy,
  filters,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  companyName: string;
  generatedBy?: string;
  filters?: { label: string; value: string }[];
}) {
  return (
    <div className="flex gap-2 justify-end mb-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportExcel(
            headers,
            rows,
            `${filename}.xlsx`,
            companyName,
            title,
            generatedBy,
            filters,
          )
        }
        data-ocid="reports.secondary_button"
      >
        <FileSpreadsheet className="h-4 w-4 mr-1 text-green-600" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportPDF(
            title,
            headers,
            rows,
            `${filename}.pdf`,
            companyName,
            generatedBy,
            filters,
          )
        }
        data-ocid="reports.secondary_button"
      >
        <Download className="h-4 w-4 mr-1 text-red-500" />
        PDF
      </Button>
    </div>
  );
}

const SummaryCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-gray-500">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}
      </div>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export default function ReportsPage() {
  const store = useStore();
  const { currentUser } = useAuth();
  const location = useLocation();
  const activeCategory = useMemo(() => {
    return new URLSearchParams(location.search).get("category") || "sales";
  }, [location.search]);

  // Preferences (currency, etc.)
  const [prefs, setPrefs] = useState(getPrefs);
  useEffect(() => {
    const handler = () => setPrefs(getPrefs());
    window.addEventListener("bizpos:prefs-changed", handler);
    return () => window.removeEventListener("bizpos:prefs-changed", handler);
  }, []);

  // ---- Sales filter state ----
  const [salesListSearch, setSalesListSearch] = useState("");
  const [salesListDateFrom, setSalesListDateFrom] = useState("");
  const [salesListDateTo, setSalesListDateTo] = useState("");
  const [salesListType, setSalesListType] = useState("all");
  const [salesListWarehouse, setSalesListWarehouse] = useState("all");
  const [salesCustSearch, setSalesCustSearch] = useState("");
  const [salesProdSearch, setSalesProdSearch] = useState("");
  const [salesWhSearch, setSalesWhSearch] = useState("");

  // ---- Purchase filter state ----
  const [purListSearch, setPurListSearch] = useState("");
  const [purListDateFrom, setPurListDateFrom] = useState("");
  const [purListDateTo, setPurListDateTo] = useState("");
  const [purListStatus, setPurListStatus] = useState("all");
  const [purSupSearch, setPurSupSearch] = useState("");
  const [purItemSearch, setPurItemSearch] = useState("");

  // ---- Inventory filter state ----
  const [invSearch, setInvSearch] = useState("");
  const [invWarehouse, setInvWarehouse] = useState("all");
  const [invLowSearch, setInvLowSearch] = useState("");
  const [invWhSearch, setInvWhSearch] = useState("");

  // ---- Payroll filter state ----
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState("all");
  const [payrollSearch, setPayrollSearch] = useState("");
  const [deductSearch, setDeductSearch] = useState("");

  // ---- Financial filter state ----
  const [tbSearch, setTbSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  // ---- Leave filter state ----
  const [leaveEmpSearch, setLeaveEmpSearch] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("all");
  const [leavePendSearch, setLeavePendSearch] = useState("");

  // ---- Activity filter state ----
  const [actModuleSearch, setActModuleSearch] = useState("");
  const [actLogSearch, setActLogSearch] = useState("");
  const [actLogModule, setActLogModule] = useState("all");

  // ---- Sales data ----
  const salesAll = store.sales;
  const salesFiltered = salesAll.filter((s) => {
    if (salesListDateFrom && s.saleDate < salesListDateFrom) return false;
    if (salesListDateTo && s.saleDate > salesListDateTo) return false;
    if (salesListType !== "all" && s.saleType !== salesListType) return false;
    if (salesListWarehouse !== "all" && s.warehouseName !== salesListWarehouse)
      return false;
    if (
      salesListSearch &&
      !s.customerName.toLowerCase().includes(salesListSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const salesByCustomer = Object.entries(
    salesAll.reduce(
      (acc, s) => {
        if (!acc[s.customerName]) acc[s.customerName] = { orders: 0, total: 0 };
        acc[s.customerName].orders++;
        acc[s.customerName].total += s.total;
        return acc;
      },
      {} as Record<string, { orders: number; total: number }>,
    ),
  )
    .map(([name, d]) => ({
      name,
      orders: d.orders,
      total: d.total,
      avg: Math.round(d.total / d.orders),
    }))
    .filter(
      (r) =>
        !salesCustSearch ||
        r.name.toLowerCase().includes(salesCustSearch.toLowerCase()),
    );

  const salesByProduct = Object.entries(
    salesAll
      .flatMap((s) => s.items)
      .reduce(
        (acc, item) => {
          if (!acc[item.itemName]) acc[item.itemName] = { qty: 0, revenue: 0 };
          acc[item.itemName].qty += item.quantity;
          acc[item.itemName].revenue += item.subtotal;
          return acc;
        },
        {} as Record<string, { qty: number; revenue: number }>,
      ),
  )
    .map(([name, d]) => ({ name, qty: d.qty, revenue: d.revenue }))
    .filter(
      (r) =>
        !salesProdSearch ||
        r.name.toLowerCase().includes(salesProdSearch.toLowerCase()),
    );

  const totalAllSalesRevenue = salesAll.reduce((s, sale) => s + sale.total, 0);

  const salesByWarehouse = Object.entries(
    salesAll.reduce(
      (acc, s) => {
        if (!acc[s.warehouseName])
          acc[s.warehouseName] = { orders: 0, revenue: 0 };
        acc[s.warehouseName].orders++;
        acc[s.warehouseName].revenue += s.total;
        return acc;
      },
      {} as Record<string, { orders: number; revenue: number }>,
    ),
  )
    .map(([name, d]) => ({ name, orders: d.orders, revenue: d.revenue }))
    .filter(
      (r) =>
        !salesWhSearch ||
        r.name.toLowerCase().includes(salesWhSearch.toLowerCase()),
    );

  const salesByPaymentMode = Object.entries(
    store.payments.reduce(
      (acc, p) => {
        if (!acc[p.paymentModeName])
          acc[p.paymentModeName] = { count: 0, total: 0 };
        acc[p.paymentModeName].count++;
        acc[p.paymentModeName].total += p.amount;
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    ),
  ).map(([mode, d]) => ({ mode, count: d.count, total: d.total }));

  const dailySales = Object.entries(
    salesFiltered.reduce(
      (acc, s) => {
        if (!acc[s.saleDate]) acc[s.saleDate] = { count: 0, total: 0 };
        acc[s.saleDate].count++;
        acc[s.saleDate].total += s.total;
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    ),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, count: d.count, total: d.total }));

  // ---- Purchase data ----
  const purchasesFiltered = store.purchases.filter((p) => {
    if (purListDateFrom && p.purchaseDate < purListDateFrom) return false;
    if (purListDateTo && p.purchaseDate > purListDateTo) return false;
    if (purListStatus !== "all" && p.status !== purListStatus) return false;
    if (
      purListSearch &&
      !p.supplierName.toLowerCase().includes(purListSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const purchasesBySupplier = Object.entries(
    store.purchases.reduce(
      (acc, p) => {
        if (!acc[p.supplierName])
          acc[p.supplierName] = { orders: 0, amount: 0, last: p.purchaseDate };
        acc[p.supplierName].orders++;
        acc[p.supplierName].amount += p.total;
        if (p.purchaseDate > acc[p.supplierName].last)
          acc[p.supplierName].last = p.purchaseDate;
        return acc;
      },
      {} as Record<string, { orders: number; amount: number; last: string }>,
    ),
  )
    .map(([name, d]) => ({
      name,
      orders: d.orders,
      amount: d.amount,
      last: d.last,
    }))
    .filter(
      (r) =>
        !purSupSearch ||
        r.name.toLowerCase().includes(purSupSearch.toLowerCase()),
    );

  const purchasesByItem = Object.entries(
    store.purchases
      .flatMap((p) => p.items)
      .reduce(
        (acc, item) => {
          if (!acc[item.itemName]) acc[item.itemName] = { qty: 0, cost: 0 };
          acc[item.itemName].qty += item.quantity;
          acc[item.itemName].cost += item.subtotal;
          return acc;
        },
        {} as Record<string, { qty: number; cost: number }>,
      ),
  )
    .map(([name, d]) => ({ name, qty: d.qty, cost: d.cost }))
    .filter(
      (r) =>
        !purItemSearch ||
        r.name.toLowerCase().includes(purItemSearch.toLowerCase()),
    );

  // ---- Inventory data ----
  const stockSummary = store.items
    .map((item) => {
      const wh = store.warehouses.find((w) => w.id === item.warehouseId);
      return {
        ...item,
        warehouseName: wh?.name ?? "",
        value: item.quantity * item.costPrice,
      };
    })
    .filter((i) => {
      if (invSearch && !i.name.toLowerCase().includes(invSearch.toLowerCase()))
        return false;
      if (invWarehouse !== "all" && i.warehouseName !== invWarehouse)
        return false;
      return true;
    });

  const lowStock = store.items
    .map((item) => ({
      ...item,
      warehouseName:
        store.warehouses.find((w) => w.id === item.warehouseId)?.name ?? "",
    }))
    .filter((i) => i.quantity <= 10)
    .filter(
      (i) =>
        !invLowSearch ||
        i.name.toLowerCase().includes(invLowSearch.toLowerCase()),
    );

  const totalStockValue = stockSummary.reduce((s, i) => s + i.value, 0);

  const stockByWarehouse = Object.entries(
    store.items
      .map((item) => ({
        ...item,
        warehouseName:
          store.warehouses.find((w) => w.id === item.warehouseId)?.name ?? "",
        value: item.quantity * item.costPrice,
      }))
      .filter(
        (i) =>
          !invWhSearch ||
          i.warehouseName.toLowerCase().includes(invWhSearch.toLowerCase()),
      )
      .reduce(
        (acc, i) => {
          if (!acc[i.warehouseName])
            acc[i.warehouseName] = { items: 0, value: 0 };
          acc[i.warehouseName].items++;
          acc[i.warehouseName].value += i.value;
          return acc;
        },
        {} as Record<string, { items: number; value: number }>,
      ),
  ).map(([wh, d]) => ({ wh, items: d.items, value: d.value }));

  // ---- Payroll data ----
  const filteredPayrolls =
    selectedPayrollPeriod === "all"
      ? store.payrolls
      : store.payrolls.filter((p) => p.id === selectedPayrollPeriod);

  const salaryRegister = filteredPayrolls
    .filter((p) => p.status === "Finalized")
    .flatMap((p) =>
      p.items.map((item) => ({
        period: p.period,
        name: item.employeeName,
        basic: item.basicSalary,
        allowances: item.grossSalary - item.basicSalary,
        deductions: item.totalDeductions,
        net: item.netSalary,
      })),
    )
    .filter(
      (r) =>
        !payrollSearch ||
        r.name.toLowerCase().includes(payrollSearch.toLowerCase()),
    );

  const deductionsReport = filteredPayrolls
    .filter((p) => p.status === "Finalized")
    .flatMap((p) =>
      p.items.map((item) => ({
        period: p.period,
        name: item.employeeName,
        incomeTax: item.deductions.incomeTax,
        pf: item.deductions.providentFund,
        loan: item.deductions.loanDeduction,
        advance: item.deductions.advance ?? 0,
        other: item.deductions.other ?? 0,
        total: item.totalDeductions,
      })),
    )
    .filter(
      (r) =>
        !deductSearch ||
        r.name.toLowerCase().includes(deductSearch.toLowerCase()),
    );

  // ---- Financial data ----
  const trialBalance = store.accounts
    .filter((a) => !a.isGroup)
    .map((a) => ({
      code: a.code,
      name: a.name,
      type: a.type,
      debit: a.normalBalance === "Debit" ? a.currentBalance : 0,
      credit: a.normalBalance === "Credit" ? a.currentBalance : 0,
    }))
    .filter(
      (r) =>
        !tbSearch ||
        r.name.toLowerCase().includes(tbSearch.toLowerCase()) ||
        r.code.toLowerCase().includes(tbSearch.toLowerCase()),
    );

  const totalDebit = trialBalance.reduce((s, r) => s + r.debit, 0);
  const totalCredit = trialBalance.reduce((s, r) => s + r.credit, 0);

  const assets = store.accounts
    .filter((a) => a.type === "Asset" && !a.isGroup)
    .reduce((s, a) => s + a.currentBalance, 0);
  const liabilities = store.accounts
    .filter((a) => a.type === "Liability" && !a.isGroup)
    .reduce((s, a) => s + a.currentBalance, 0);
  const equity = store.accounts
    .filter((a) => a.type === "Equity" && !a.isGroup)
    .reduce((s, a) => s + a.currentBalance, 0);
  const income = store.accounts
    .filter((a) => a.type === "Income" && !a.isGroup)
    .reduce((s, a) => s + a.currentBalance, 0);
  const cogs = store.accounts
    .filter((a) => a.type === "COGS" && !a.isGroup)
    .reduce((s, a) => s + a.currentBalance, 0);
  const expenses = store.accounts
    .filter((a) => a.type === "Expense" && !a.isGroup)
    .reduce((s, a) => s + a.currentBalance, 0);
  const grossProfit = income - cogs;
  const netIncome = grossProfit - expenses;

  const ledgerAccount = selectedAccount
    ? store.accounts.find((a) => a.id === selectedAccount)
    : null;
  const ledgerEntries = selectedAccount
    ? store.journalEntries
        .filter((e) => e.lines.some((l) => l.accountId === selectedAccount))
        .flatMap((e) =>
          e.lines
            .filter((l) => l.accountId === selectedAccount)
            .map((l) => ({
              date: e.date,
              ref: e.reference,
              desc: e.description,
              debit: l.debit,
              credit: l.credit,
            })),
        )
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];
  let runningBalance = ledgerAccount?.openingBalance ?? 0;
  const ledgerWithBalance = ledgerEntries.map((e) => {
    runningBalance += e.debit - e.credit;
    return { ...e, balance: runningBalance };
  });

  // ---- Leave data ----
  const leaveByEmployee = store.employees
    .map((emp) => ({
      emp: emp.name,
      empId: emp.employeeId,
      types: store.leaveTypes
        .filter((lt) => lt.isActive)
        .map((lt) => {
          const used = store.leaveRequests
            .filter(
              (r) =>
                r.employeeId === emp.id &&
                r.leaveTypeId === lt.id &&
                r.status === "Approved",
            )
            .reduce((s, r) => s + r.days, 0);
          return {
            lt: lt.name,
            allowed: lt.daysAllowedPerYear,
            used,
            remaining:
              lt.daysAllowedPerYear === 0
                ? "N/A"
                : String(Math.max(0, lt.daysAllowedPerYear - used)),
          };
        })
        .filter((t) => t.used > 0),
    }))
    .filter((e) => e.types.length > 0)
    .filter(
      (e) =>
        !leaveEmpSearch ||
        e.emp.toLowerCase().includes(leaveEmpSearch.toLowerCase()),
    );

  const leaveUtilization = store.leaveTypes.map((lt) => {
    const requests = store.leaveRequests.filter((r) => r.leaveTypeId === lt.id);
    const approved = requests.filter((r) => r.status === "Approved").length;
    const rejected = requests.filter((r) => r.status === "Rejected").length;
    return {
      name: lt.name,
      total: requests.length,
      approved,
      rejected,
      pending: requests.filter((r) => r.status === "Pending").length,
    };
  });

  const pendingLeave = store.leaveRequests.filter((r) => {
    const statusOk = leaveStatus === "all" || r.status === leaveStatus;
    const searchOk =
      !leavePendSearch ||
      r.employeeName.toLowerCase().includes(leavePendSearch.toLowerCase());
    return statusOk && searchOk;
  });

  // ---- Activity data ----
  const moduleActivity = Object.entries(
    store.logs.reduce(
      (acc, l) => {
        acc[l.module] = (acc[l.module] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .filter(
      (r) =>
        !actModuleSearch ||
        r.module.toLowerCase().includes(actModuleSearch.toLowerCase()),
    );

  const recentLogs = store.logs
    .slice()
    .reverse()
    .slice(0, 50)
    .filter((l) => {
      if (
        actLogSearch &&
        !l.user.toLowerCase().includes(actLogSearch.toLowerCase()) &&
        !l.details.toLowerCase().includes(actLogSearch.toLowerCase())
      )
        return false;
      if (actLogModule !== "all" && l.module !== actLogModule) return false;
      return true;
    });

  const uniqueLogModules = [...new Set(store.logs.map((l) => l.module))];
  const uniqueWarehouses = [...new Set(salesAll.map((s) => s.warehouseName))];
  const uniqueInvWarehouses = [
    ...new Set(
      store.items.map(
        (i) => store.warehouses.find((w) => w.id === i.warehouseId)?.name ?? "",
      ),
    ),
  ];

  return (
    <div className="flex h-full" data-ocid="reports.page">
      <main className="flex-1 overflow-y-auto p-6">
        {/* ============ SALES REPORTS ============ */}
        {activeCategory === "sales" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Sales Reports</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Sales"
                value={salesAll.length}
                color="text-blue-600"
              />
              <SummaryCard
                label="Total Revenue"
                value={formatCurrency(totalAllSalesRevenue, prefs.currency)}
                color="text-green-600"
              />
              <SummaryCard
                label="Cash Sales"
                value={salesAll.filter((s) => s.saleType === "Cash").length}
                color="text-blue-600"
              />
              <SummaryCard
                label="Credit Sales"
                value={salesAll.filter((s) => s.saleType === "Credit").length}
                color="text-orange-600"
              />
            </div>

            {dailySales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Daily Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={dailySales}
                      barSize={28}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="total"
                        fill="#2563EB"
                        name="Revenue"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="list" data-ocid="reports.sales.tab">
              <TabsList className="mb-4">
                <TabsTrigger value="list" data-ocid="reports.sales.list.tab">
                  Sales List
                </TabsTrigger>
                <TabsTrigger
                  value="customer"
                  data-ocid="reports.sales.customer.tab"
                >
                  By Customer
                </TabsTrigger>
                <TabsTrigger
                  value="product"
                  data-ocid="reports.sales.product.tab"
                >
                  By Product
                </TabsTrigger>
                <TabsTrigger
                  value="warehouse"
                  data-ocid="reports.sales.warehouse.tab"
                >
                  By Warehouse
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  data-ocid="reports.sales.payment.tab"
                >
                  By Payment Mode
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sales List</CardTitle>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Input
                        placeholder="Search customer..."
                        value={salesListSearch}
                        onChange={(e) => setSalesListSearch(e.target.value)}
                        className="w-44"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">From</Label>
                        <Input
                          type="date"
                          value={salesListDateFrom}
                          onChange={(e) => setSalesListDateFrom(e.target.value)}
                          className="w-36"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">To</Label>
                        <Input
                          type="date"
                          value={salesListDateTo}
                          onChange={(e) => setSalesListDateTo(e.target.value)}
                          className="w-36"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={salesListType}
                          onValueChange={setSalesListType}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Warehouse</Label>
                        <Select
                          value={salesListWarehouse}
                          onValueChange={setSalesListWarehouse}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Warehouses</SelectItem>
                            {uniqueWarehouses.map((w) => (
                              <SelectItem key={w} value={w}>
                                {w}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ExportBar
                      title="Sales List"
                      headers={[
                        "Date",
                        "Customer",
                        "Warehouse",
                        "Type",
                        "Total",
                        "Status",
                      ]}
                      rows={salesFiltered.map((s) => [
                        s.saleDate,
                        s.customerName,
                        s.warehouseName,
                        s.saleType,
                        s.total,
                        s.status,
                      ])}
                      filename="sales_list"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesFiltered.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-gray-400 py-6"
                            >
                              No records
                            </TableCell>
                          </TableRow>
                        )}
                        {salesFiltered.map((s, i) => (
                          <TableRow
                            key={s.id}
                            data-ocid={`reports.sales.item.${i + 1}`}
                          >
                            <TableCell>{s.saleDate}</TableCell>
                            <TableCell className="font-medium">
                              {s.customerName}
                            </TableCell>
                            <TableCell>{s.warehouseName}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  s.saleType === "Cash"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }
                              >
                                {s.saleType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(s.total)}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-700">
                                {s.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customer">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sales by Customer
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search customer..."
                        value={salesCustSearch}
                        onChange={(e) => setSalesCustSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Sales by Customer"
                      headers={["Customer", "Orders", "Total", "Avg Order"]}
                      rows={salesByCustomer.map((r) => [
                        r.name,
                        r.orders,
                        r.total,
                        r.avg,
                      ])}
                      filename="sales_by_customer"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Avg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByCustomer.map((r) => (
                          <TableRow key={r.name}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.orders}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.total)}
                            </TableCell>
                            <TableCell className="font-mono text-gray-500">
                              {fmt(r.avg)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="product">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sales by Product
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search product..."
                        value={salesProdSearch}
                        onChange={(e) => setSalesProdSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Sales by Product"
                      headers={["Product", "Qty", "Revenue", "%"]}
                      rows={salesByProduct.map((r) => [
                        r.name,
                        r.qty,
                        r.revenue,
                        totalAllSalesRevenue > 0
                          ? `${((r.revenue / totalAllSalesRevenue) * 100).toFixed(1)}%`
                          : "-",
                      ])}
                      filename="sales_by_product"
                      companyName={getActiveCompanyName()}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByProduct.map((r) => (
                          <TableRow key={r.name}>
                            <TableCell className="text-sm">{r.name}</TableCell>
                            <TableCell>{r.qty}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.revenue)}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {totalAllSalesRevenue > 0
                                ? `${((r.revenue / totalAllSalesRevenue) * 100).toFixed(1)}%`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="warehouse">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sales by Warehouse
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search warehouse..."
                        value={salesWhSearch}
                        onChange={(e) => setSalesWhSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Sales by Warehouse"
                      headers={["Warehouse", "Orders", "Revenue"]}
                      rows={salesByWarehouse.map((r) => [
                        r.name,
                        r.orders,
                        r.revenue,
                      ])}
                      filename="sales_by_warehouse"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByWarehouse.map((r) => (
                          <TableRow key={r.name}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.orders}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sales by Payment Mode
                    </CardTitle>
                    <ExportBar
                      title="Sales by Payment Mode"
                      headers={["Mode", "Count", "Total"]}
                      rows={salesByPaymentMode.map((r) => [
                        r.mode,
                        r.count,
                        r.total,
                      ])}
                      filename="sales_by_payment"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mode</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByPaymentMode.map((r) => (
                          <TableRow key={r.mode}>
                            <TableCell>{r.mode}</TableCell>
                            <TableCell>{r.count}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ============ PURCHASE REPORTS ============ */}
        {activeCategory === "purchases" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Purchase Reports
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SummaryCard
                label="Total Purchases"
                value={store.purchases.length}
                color="text-blue-600"
              />
              <SummaryCard
                label="Total Amount"
                value={formatCurrency(
                  store.purchases.reduce((s, p) => s + p.total, 0),
                  prefs.currency,
                )}
                color="text-orange-600"
              />
              <SummaryCard
                label="Received"
                value={
                  store.purchases.filter((p) => p.status === "Received").length
                }
                color="text-green-600"
              />
            </div>

            <Tabs defaultValue="list" data-ocid="reports.purchases.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="list"
                  data-ocid="reports.purchases.list.tab"
                >
                  Purchases List
                </TabsTrigger>
                <TabsTrigger
                  value="supplier"
                  data-ocid="reports.purchases.supplier.tab"
                >
                  By Supplier
                </TabsTrigger>
                <TabsTrigger
                  value="item"
                  data-ocid="reports.purchases.item.tab"
                >
                  By Item
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Purchases List</CardTitle>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Input
                        placeholder="Search supplier..."
                        value={purListSearch}
                        onChange={(e) => setPurListSearch(e.target.value)}
                        className="w-44"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">From</Label>
                        <Input
                          type="date"
                          value={purListDateFrom}
                          onChange={(e) => setPurListDateFrom(e.target.value)}
                          className="w-36"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">To</Label>
                        <Input
                          type="date"
                          value={purListDateTo}
                          onChange={(e) => setPurListDateTo(e.target.value)}
                          className="w-36"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={purListStatus}
                          onValueChange={setPurListStatus}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Ordered">Ordered</SelectItem>
                            <SelectItem value="Received">Received</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ExportBar
                      title="Purchases List"
                      headers={[
                        "Date",
                        "Supplier",
                        "Warehouse",
                        "Total",
                        "Status",
                      ]}
                      rows={purchasesFiltered.map((p) => [
                        p.purchaseDate,
                        p.supplierName,
                        p.warehouseName,
                        p.total,
                        p.status,
                      ])}
                      filename="purchases_list"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchasesFiltered.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-gray-400 py-6"
                            >
                              No records
                            </TableCell>
                          </TableRow>
                        )}
                        {purchasesFiltered.map((p, i) => (
                          <TableRow
                            key={p.id}
                            data-ocid={`reports.purchases.item.${i + 1}`}
                          >
                            <TableCell>{p.purchaseDate}</TableCell>
                            <TableCell className="font-medium">
                              {p.supplierName}
                            </TableCell>
                            <TableCell>{p.warehouseName}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(p.total)}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-700">
                                {p.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="supplier">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Supplier</CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search supplier..."
                        value={purSupSearch}
                        onChange={(e) => setPurSupSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Purchases by Supplier"
                      headers={[
                        "Supplier",
                        "Orders",
                        "Amount",
                        "Last Purchase",
                      ]}
                      rows={purchasesBySupplier.map((r) => [
                        r.name,
                        r.orders,
                        r.amount,
                        r.last,
                      ])}
                      filename="purchases_by_supplier"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Last Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchasesBySupplier.map((r) => (
                          <TableRow key={r.name}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.orders}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.amount)}
                            </TableCell>
                            <TableCell>{r.last}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="item">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Item</CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search item..."
                        value={purItemSearch}
                        onChange={(e) => setPurItemSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Purchases by Item"
                      headers={["Item", "Qty Purchased", "Total Cost"]}
                      rows={purchasesByItem.map((r) => [r.name, r.qty, r.cost])}
                      filename="purchases_by_item"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Qty Purchased</TableHead>
                          <TableHead>Total Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchasesByItem.map((r) => (
                          <TableRow key={r.name}>
                            <TableCell className="text-sm">{r.name}</TableCell>
                            <TableCell>{r.qty}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.cost)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ============ INVENTORY REPORTS ============ */}
        {activeCategory === "inventory" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Inventory Reports
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Items"
                value={store.items.length}
                color="text-blue-600"
              />
              <SummaryCard
                label="Total Value"
                value={formatCurrency(
                  store.items.reduce((s, i) => s + i.quantity * i.costPrice, 0),
                  prefs.currency,
                )}
                color="text-green-600"
              />
              <SummaryCard
                label="Low Stock"
                value={store.items.filter((i) => i.quantity <= 10).length}
                color="text-red-600"
                sub="≤ 10 units"
              />
              <SummaryCard
                label="Warehouses"
                value={store.warehouses.length}
                color="text-purple-600"
              />
            </div>

            <Tabs defaultValue="stock" data-ocid="reports.inventory.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="stock"
                  data-ocid="reports.inventory.stock.tab"
                >
                  Stock Summary
                </TabsTrigger>
                <TabsTrigger
                  value="lowstock"
                  data-ocid="reports.inventory.lowstock.tab"
                >
                  Low Stock
                </TabsTrigger>
                <TabsTrigger
                  value="warehouse"
                  data-ocid="reports.inventory.warehouse.tab"
                >
                  By Warehouse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stock">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Stock Valuation</CardTitle>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Input
                        placeholder="Search item..."
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                        className="w-56"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Warehouse</Label>
                        <Select
                          value={invWarehouse}
                          onValueChange={setInvWarehouse}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Warehouses</SelectItem>
                            {uniqueInvWarehouses.map((w) => (
                              <SelectItem key={w} value={w}>
                                {w}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ExportBar
                      title="Stock Summary"
                      headers={[
                        "SKU",
                        "Name",
                        "Warehouse",
                        "Qty",
                        "Cost",
                        "Value",
                      ]}
                      rows={stockSummary.map((i) => [
                        i.sku,
                        i.name,
                        i.warehouseName,
                        i.quantity,
                        i.costPrice,
                        i.value,
                      ])}
                      filename="stock_summary"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Cost/Unit</TableHead>
                          <TableHead>Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockSummary.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="text-sm">{i.name}</TableCell>
                            <TableCell>{i.warehouseName}</TableCell>
                            <TableCell>{i.quantity}</TableCell>
                            <TableCell className="font-mono">
                              {fmt(i.costPrice)}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {fmt(i.value)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell colSpan={4}>Total</TableCell>
                          <TableCell className="font-mono">
                            {fmt(totalStockValue)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lowstock">
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-base text-red-700">
                      ⚠ Low Stock Alert (≤ 10 units)
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search item..."
                        value={invLowSearch}
                        onChange={(e) => setInvLowSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Low Stock Report"
                      headers={["SKU", "Name", "Warehouse", "Qty"]}
                      rows={lowStock.map((i) => [
                        i.sku,
                        i.name,
                        i.warehouseName,
                        i.quantity,
                      ])}
                      filename="low_stock"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStock.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-gray-400 py-6"
                            >
                              No low stock items
                            </TableCell>
                          </TableRow>
                        )}
                        {lowStock.map((i) => (
                          <TableRow key={i.id} className="bg-red-50">
                            <TableCell className="font-mono text-sm">
                              {i.sku}
                            </TableCell>
                            <TableCell>{i.name}</TableCell>
                            <TableCell>{i.warehouseName}</TableCell>
                            <TableCell className="font-bold text-red-600">
                              {i.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="warehouse">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Stock by Warehouse
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search warehouse..."
                        value={invWhSearch}
                        onChange={(e) => setInvWhSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Stock by Warehouse"
                      headers={["Warehouse", "Items", "Total Value"]}
                      rows={stockByWarehouse.map((r) => [
                        r.wh,
                        r.items,
                        r.value,
                      ])}
                      filename="stock_by_warehouse"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockByWarehouse.map((r) => (
                            <TableRow key={r.wh}>
                              <TableCell>{r.wh}</TableCell>
                              <TableCell>{r.items}</TableCell>
                              <TableCell className="font-mono">
                                {fmt(r.value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={stockByWarehouse}
                            dataKey="value"
                            nameKey="wh"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label
                          >
                            {stockByWarehouse.map((entry, i) => (
                              <Cell
                                key={entry.wh}
                                fill={COLORS[i % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => fmt(Number(v))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ============ PAYROLL REPORTS ============ */}
        {activeCategory === "payroll" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Payroll Reports
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
            <div className="mb-4 flex gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Payroll Period</Label>
                <Select
                  value={selectedPayrollPeriod}
                  onValueChange={setSelectedPayrollPeriod}
                >
                  <SelectTrigger className="w-48" data-ocid="reports.select">
                    <SelectValue placeholder="All Periods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {store.payrolls
                      .filter((p) => p.status === "Finalized")
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.period}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Payroll Runs"
                value={
                  filteredPayrolls.filter((p) => p.status === "Finalized")
                    .length
                }
                color="text-blue-600"
              />
              <SummaryCard
                label="Total Gross"
                value={formatCurrency(
                  filteredPayrolls.reduce((s, p) => s + p.totalGross, 0),
                  prefs.currency,
                )}
                color="text-blue-600"
              />
              <SummaryCard
                label="Total Deductions"
                value={formatCurrency(
                  filteredPayrolls.reduce((s, p) => s + p.totalDeductions, 0),
                  prefs.currency,
                )}
                color="text-red-600"
              />
              <SummaryCard
                label="Total Net"
                value={formatCurrency(
                  filteredPayrolls.reduce((s, p) => s + p.totalNet, 0),
                  prefs.currency,
                )}
                color="text-green-600"
              />
            </div>

            <Tabs defaultValue="salary" data-ocid="reports.payroll.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="salary"
                  data-ocid="reports.payroll.salary.tab"
                >
                  Salary Register
                </TabsTrigger>
                <TabsTrigger
                  value="deductions"
                  data-ocid="reports.payroll.deductions.tab"
                >
                  Deductions Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="salary">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Salary Register</CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search employee..."
                        value={payrollSearch}
                        onChange={(e) => setPayrollSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Salary Register"
                      headers={[
                        "Period",
                        "Employee",
                        "Basic",
                        "Allowances",
                        "Deductions",
                        "Net",
                      ]}
                      rows={salaryRegister.map((r) => [
                        r.period,
                        r.name,
                        r.basic,
                        r.allowances,
                        r.deductions,
                        r.net,
                      ])}
                      filename="salary_register"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Basic</TableHead>
                          <TableHead>Allowances</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net Pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaryRegister.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-gray-400 py-6"
                            >
                              No finalized payrolls
                            </TableCell>
                          </TableRow>
                        )}
                        {salaryRegister.map((r, idx) => (
                          <TableRow key={`${r.name}-${r.period}-${idx}`}>
                            <TableCell className="text-sm">
                              {r.period}
                            </TableCell>
                            <TableCell className="font-medium">
                              {r.name}
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.basic)}
                            </TableCell>
                            <TableCell className="font-mono text-green-700">
                              {fmt(r.allowances)}
                            </TableCell>
                            <TableCell className="font-mono text-red-600">
                              {fmt(r.deductions)}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-blue-700">
                              {fmt(r.net)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deductions">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Deductions Report
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search employee..."
                        value={deductSearch}
                        onChange={(e) => setDeductSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Deductions Report"
                      headers={[
                        "Period",
                        "Employee",
                        "Income Tax",
                        "PF",
                        "Loan",
                        "Advance",
                        "Other",
                        "Total",
                      ]}
                      rows={deductionsReport.map((r) => [
                        r.period,
                        r.name,
                        r.incomeTax,
                        r.pf,
                        r.loan,
                        r.advance,
                        r.other,
                        r.total,
                      ])}
                      filename="deductions_report"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Income Tax</TableHead>
                          <TableHead>Provident Fund</TableHead>
                          <TableHead>Loan</TableHead>
                          <TableHead>Advance</TableHead>
                          <TableHead>Other</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deductionsReport.map((r, idx) => (
                          <TableRow key={`${r.name}-${r.period}-${idx}`}>
                            <TableCell className="text-sm">
                              {r.period}
                            </TableCell>
                            <TableCell className="font-medium">
                              {r.name}
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.incomeTax)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.pf)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.loan)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.advance)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {fmt(r.other)}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-red-700">
                              {fmt(r.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ============ FINANCIAL REPORTS ============ */}
        {activeCategory === "financial" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Financial Reports
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>

            <Tabs defaultValue="trial" data-ocid="reports.financial.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="trial"
                  data-ocid="reports.financial.trial.tab"
                >
                  Trial Balance
                </TabsTrigger>
                <TabsTrigger
                  value="ledger"
                  data-ocid="reports.financial.ledger.tab"
                >
                  General Ledger
                </TabsTrigger>
                <TabsTrigger value="pl" data-ocid="reports.financial.pl.tab">
                  P&amp;L Summary
                </TabsTrigger>
                <TabsTrigger value="bs" data-ocid="reports.financial.bs.tab">
                  Balance Sheet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trial">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Trial Balance
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search account..."
                        value={tbSearch}
                        onChange={(e) => setTbSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>
                        Total Debit:{" "}
                        <strong className="text-blue-700">
                          {fmt(totalDebit)}
                        </strong>
                      </span>
                      <span>
                        Total Credit:{" "}
                        <strong className="text-blue-700">
                          {fmt(totalCredit)}
                        </strong>
                      </span>
                      <Badge
                        className={
                          Math.abs(totalDebit - totalCredit) < 1
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {Math.abs(totalDebit - totalCredit) < 1
                          ? "Balanced"
                          : "Imbalanced"}
                      </Badge>
                    </div>
                    <ExportBar
                      title="Trial Balance"
                      headers={["Code", "Account", "Type", "Debit", "Credit"]}
                      rows={trialBalance.map((r) => [
                        r.code,
                        r.name,
                        r.type,
                        r.debit || "",
                        r.credit || "",
                      ])}
                      filename="trial_balance"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Debit</TableHead>
                          <TableHead>Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.map((r) => (
                          <TableRow key={r.code}>
                            <TableCell className="font-mono text-sm">
                              {r.code}
                            </TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>
                              <Badge className="text-xs">{r.type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {r.debit > 0 ? fmt(r.debit) : ""}
                            </TableCell>
                            <TableCell className="font-mono">
                              {r.credit > 0 ? fmt(r.credit) : ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ledger">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Account Ledger
                      </CardTitle>
                      <Select
                        value={selectedAccount}
                        onValueChange={setSelectedAccount}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Select account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {store.accounts
                            .filter((a) => !a.isGroup)
                            .map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.code} — {a.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedAccount && (
                      <ExportBar
                        title={`Ledger — ${ledgerAccount?.name}`}
                        headers={[
                          "Date",
                          "Reference",
                          "Description",
                          "Debit",
                          "Credit",
                          "Balance",
                        ]}
                        rows={ledgerWithBalance.map((e) => [
                          e.date,
                          e.ref,
                          e.desc,
                          e.debit || "",
                          e.credit || "",
                          e.balance,
                        ])}
                        filename="general_ledger"
                        companyName={getActiveCompanyName()}
                        generatedBy={currentUser?.name ?? "Unknown"}
                      />
                    )}
                  </CardHeader>
                  <CardContent>
                    {!selectedAccount && (
                      <p className="text-gray-400 text-sm text-center py-6">
                        Select an account to view its ledger
                      </p>
                    )}
                    {selectedAccount && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Debit</TableHead>
                            <TableHead>Credit</TableHead>
                            <TableHead>Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-gray-50">
                            <TableCell
                              colSpan={5}
                              className="font-medium text-sm"
                            >
                              Opening Balance
                            </TableCell>
                            <TableCell className="font-mono font-bold">
                              {fmt(ledgerAccount?.openingBalance ?? 0)}
                            </TableCell>
                          </TableRow>
                          {ledgerWithBalance.map((e, idx) => (
                            <TableRow key={`${e.ref}-${idx}`}>
                              <TableCell className="text-sm">
                                {e.date}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {e.ref}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {e.desc}
                              </TableCell>
                              <TableCell className="font-mono">
                                {e.debit > 0 ? fmt(e.debit) : ""}
                              </TableCell>
                              <TableCell className="font-mono">
                                {e.credit > 0 ? fmt(e.credit) : ""}
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                {fmt(e.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {ledgerWithBalance.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-gray-400 py-4"
                              >
                                No transactions
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Profit &amp; Loss
                    </CardTitle>
                    <ExportBar
                      title="Profit & Loss"
                      headers={["Category", "Amount"]}
                      rows={[
                        ["Total Income", income],
                        ["Cost of Goods Sold", cogs],
                        ["Gross Profit", grossProfit],
                        ["Operating Expenses", expenses],
                        [
                          netIncome >= 0 ? "Net Income" : "Net Loss",
                          Math.abs(netIncome),
                        ],
                      ]}
                      filename="profit_loss"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm max-w-lg">
                      <div className="flex justify-between py-1">
                        <span className="font-semibold text-green-700">
                          Total Income
                        </span>
                        <span className="font-mono text-green-700">
                          {fmt(income)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">
                          Cost of Goods Sold
                        </span>
                        <span className="font-mono text-red-600">
                          ({fmt(cogs)})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-t font-semibold">
                        <span>Gross Profit</span>
                        <span className="font-mono">{fmt(grossProfit)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">
                          Operating Expenses
                        </span>
                        <span className="font-mono text-red-600">
                          ({fmt(expenses)})
                        </span>
                      </div>
                      <div
                        className={`flex justify-between py-2 border-t font-bold text-lg ${netIncome >= 0 ? "text-green-700" : "text-red-700"}`}
                      >
                        <span>Net {netIncome >= 0 ? "Income" : "Loss"}</span>
                        <span className="font-mono">
                          {fmt(Math.abs(netIncome))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bs">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Balance Sheet — Assets
                      </CardTitle>
                      <ExportBar
                        title="Balance Sheet - Assets"
                        headers={["Account", "Balance"]}
                        rows={store.accounts
                          .filter(
                            (a) =>
                              a.type === "Asset" &&
                              !a.isGroup &&
                              a.currentBalance > 0,
                          )
                          .map((a) => [a.name, a.currentBalance])}
                        filename="balance_sheet_assets"
                        companyName={getActiveCompanyName()}
                        generatedBy={currentUser?.name ?? "Unknown"}
                      />
                    </CardHeader>
                    <CardContent>
                      {store.accounts
                        .filter(
                          (a) =>
                            a.type === "Asset" &&
                            !a.isGroup &&
                            a.currentBalance > 0,
                        )
                        .map((a) => (
                          <div
                            key={a.id}
                            className="flex justify-between text-sm py-1 border-b border-gray-50"
                          >
                            <span className="text-gray-700">{a.name}</span>
                            <span className="font-mono">
                              {fmt(a.currentBalance)}
                            </span>
                          </div>
                        ))}
                      <div className="flex justify-between font-bold text-blue-700 border-t pt-2 mt-2">
                        <span>Total Assets</span>
                        <span className="font-mono">{fmt(assets)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Balance Sheet — Liabilities &amp; Equity
                      </CardTitle>
                      <ExportBar
                        title="Balance Sheet - Liabilities & Equity"
                        headers={["Account", "Type", "Balance"]}
                        rows={store.accounts
                          .filter(
                            (a) =>
                              (a.type === "Liability" || a.type === "Equity") &&
                              !a.isGroup &&
                              a.currentBalance > 0,
                          )
                          .map((a) => [a.name, a.type, a.currentBalance])}
                        filename="balance_sheet_liabilities"
                        companyName={getActiveCompanyName()}
                        generatedBy={currentUser?.name ?? "Unknown"}
                      />
                    </CardHeader>
                    <CardContent>
                      {store.accounts
                        .filter(
                          (a) =>
                            (a.type === "Liability" || a.type === "Equity") &&
                            !a.isGroup &&
                            a.currentBalance > 0,
                        )
                        .map((a) => (
                          <div
                            key={a.id}
                            className="flex justify-between text-sm py-1 border-b border-gray-50"
                          >
                            <span className="text-gray-700">
                              {a.name}{" "}
                              <span className="text-xs text-gray-400">
                                ({a.type})
                              </span>
                            </span>
                            <span className="font-mono">
                              {fmt(a.currentBalance)}
                            </span>
                          </div>
                        ))}
                      <div className="flex justify-between font-bold text-purple-700 border-t pt-2 mt-2">
                        <span>Total Liabilities + Equity</span>
                        <span className="font-mono">
                          {fmt(liabilities + equity)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ============ LEAVE / HR REPORTS ============ */}
        {activeCategory === "leave" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Leave &amp; HR Reports
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Requests"
                value={store.leaveRequests.length}
                color="text-blue-600"
              />
              <SummaryCard
                label="Pending"
                value={
                  store.leaveRequests.filter((r) => r.status === "Pending")
                    .length
                }
                color="text-yellow-600"
              />
              <SummaryCard
                label="Approved"
                value={
                  store.leaveRequests.filter((r) => r.status === "Approved")
                    .length
                }
                color="text-green-600"
              />
              <SummaryCard
                label="Rejected"
                value={
                  store.leaveRequests.filter((r) => r.status === "Rejected")
                    .length
                }
                color="text-red-600"
              />
            </div>

            <Tabs defaultValue="byemp" data-ocid="reports.leave.tab">
              <TabsList className="mb-4">
                <TabsTrigger value="byemp" data-ocid="reports.leave.byemp.tab">
                  Leave by Employee
                </TabsTrigger>
                <TabsTrigger
                  value="utilization"
                  data-ocid="reports.leave.utilization.tab"
                >
                  Leave Utilization
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  data-ocid="reports.leave.pending.tab"
                >
                  Pending Requests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="byemp">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Leave Summary by Employee
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search employee..."
                        value={leaveEmpSearch}
                        onChange={(e) => setLeaveEmpSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Leave by Employee"
                      headers={[
                        "Employee",
                        "Leave Type",
                        "Allowed",
                        "Used",
                        "Remaining",
                      ]}
                      rows={leaveByEmployee.flatMap((e) =>
                        e.types.map((t) => [
                          e.emp,
                          t.lt,
                          t.allowed,
                          t.used,
                          t.remaining,
                        ]),
                      )}
                      filename="leave_by_employee"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Allowed</TableHead>
                          <TableHead>Used</TableHead>
                          <TableHead>Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveByEmployee.flatMap((e) =>
                          e.types.map((t) => (
                            <TableRow key={`${e.empId}-${t.lt}`}>
                              <TableCell className="font-medium">
                                {e.emp}
                              </TableCell>
                              <TableCell>{t.lt}</TableCell>
                              <TableCell>
                                {t.allowed === 0 ? "Unlimited" : t.allowed}
                              </TableCell>
                              <TableCell className="font-mono text-orange-600">
                                {t.used}
                              </TableCell>
                              <TableCell className="font-mono text-green-600">
                                {t.remaining}
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="utilization">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Leave Utilization by Type
                    </CardTitle>
                    <ExportBar
                      title="Leave Utilization"
                      headers={[
                        "Leave Type",
                        "Total Req.",
                        "Approved",
                        "Rejected",
                        "Pending",
                      ]}
                      rows={leaveUtilization.map((r) => [
                        r.name,
                        r.total,
                        r.approved,
                        r.rejected,
                        r.pending,
                      ])}
                      filename="leave_utilization"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Total Req.</TableHead>
                          <TableHead>Approved</TableHead>
                          <TableHead>Rejected</TableHead>
                          <TableHead>Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveUtilization.map((r) => (
                          <TableRow key={r.name}>
                            <TableCell className="font-medium">
                              {r.name}
                            </TableCell>
                            <TableCell>{r.total}</TableCell>
                            <TableCell className="text-green-600">
                              {r.approved}
                            </TableCell>
                            <TableCell className="text-red-600">
                              {r.rejected}
                            </TableCell>
                            <TableCell className="text-yellow-600">
                              {r.pending}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Leave Requests</CardTitle>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Input
                        placeholder="Search employee..."
                        value={leavePendSearch}
                        onChange={(e) => setLeavePendSearch(e.target.value)}
                        className="w-56"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={leaveStatus}
                          onValueChange={setLeaveStatus}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ExportBar
                      title="Leave Requests"
                      headers={[
                        "Employee",
                        "Leave Type",
                        "From",
                        "To",
                        "Days",
                        "Status",
                        "Reason",
                      ]}
                      rows={pendingLeave.map((r) => [
                        r.employeeName,
                        r.leaveTypeName,
                        r.fromDate,
                        r.toDate,
                        r.days,
                        r.status,
                        r.reason,
                      ])}
                      filename="leave_requests"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingLeave.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-gray-400 py-4"
                            >
                              No requests
                            </TableCell>
                          </TableRow>
                        )}
                        {pendingLeave.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.employeeName}
                            </TableCell>
                            <TableCell>{r.leaveTypeName}</TableCell>
                            <TableCell>{r.fromDate}</TableCell>
                            <TableCell>{r.toDate}</TableCell>
                            <TableCell>{r.days}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  r.status === "Approved"
                                    ? "bg-green-100 text-green-700"
                                    : r.status === "Rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }
                              >
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {r.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ============ ACTIVITY SUMMARY ============ */}
        {activeCategory === "activity" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Activity Summary
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Logs"
                value={store.logs.length}
                color="text-blue-600"
              />
              <SummaryCard
                label="Unique Users"
                value={new Set(store.logs.map((l) => l.user)).size}
                color="text-purple-600"
              />
              <SummaryCard
                label="Modules Active"
                value={new Set(store.logs.map((l) => l.module)).size}
                color="text-green-600"
              />
              <SummaryCard
                label="Today's Actions"
                value={
                  store.logs.filter((l) =>
                    l.timestamp.startsWith(
                      new Date().toISOString().slice(0, 10),
                    ),
                  ).length
                }
                color="text-orange-600"
              />
            </div>

            <Tabs defaultValue="module" data-ocid="reports.activity.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="module"
                  data-ocid="reports.activity.module.tab"
                >
                  Module Activity
                </TabsTrigger>
                <TabsTrigger value="logs" data-ocid="reports.activity.logs.tab">
                  Recent Logs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="module">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Activity by Module
                    </CardTitle>
                    <div className="flex gap-3 mt-3">
                      <Input
                        placeholder="Search module..."
                        value={actModuleSearch}
                        onChange={(e) => setActModuleSearch(e.target.value)}
                        className="w-56"
                      />
                    </div>
                    <ExportBar
                      title="Module Activity"
                      headers={["Module", "Count"]}
                      rows={moduleActivity.map((r) => [r.module, r.count])}
                      filename="module_activity"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent>
                    {moduleActivity.length > 0 && (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={moduleActivity} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis
                            dataKey="module"
                            type="category"
                            width={90}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="count"
                            fill="#2563EB"
                            name="Actions"
                            radius={[0, 4, 4, 0]}
                          >
                            {moduleActivity.map((entry, i) => (
                              <Cell
                                key={entry.module}
                                fill={COLORS[i % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moduleActivity.map((r) => (
                          <TableRow key={r.module}>
                            <TableCell>{r.module}</TableCell>
                            <TableCell className="font-mono font-bold text-blue-700">
                              {r.count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Recent Log Entries
                    </CardTitle>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Input
                        placeholder="Search user or details..."
                        value={actLogSearch}
                        onChange={(e) => setActLogSearch(e.target.value)}
                        className="w-56"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Module</Label>
                        <Select
                          value={actLogModule}
                          onValueChange={setActLogModule}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Modules</SelectItem>
                            {uniqueLogModules.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ExportBar
                      title="Activity Logs"
                      headers={[
                        "Timestamp",
                        "User",
                        "Module",
                        "Action",
                        "Details",
                      ]}
                      rows={recentLogs.map((l) => [
                        l.timestamp,
                        l.user,
                        l.module,
                        l.action,
                        l.details,
                      ])}
                      filename="activity_logs"
                      companyName={getActiveCompanyName()}
                      generatedBy={currentUser?.name ?? "Unknown"}
                    />
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentLogs.map((log, i) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {log.user}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                {log.module}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  (
                                    {
                                      create: "bg-green-100 text-green-700",
                                      update: "bg-blue-100 text-blue-700",
                                      delete: "bg-red-100 text-red-700",
                                      login: "bg-purple-100 text-purple-700",
                                      logout: "bg-gray-100 text-gray-600",
                                      view: "bg-yellow-100 text-yellow-700",
                                    } as Record<string, string>
                                  )[log.action] ?? ""
                                }
                              >
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="text-sm"
                              data-ocid={`reports.activity.item.${i + 1}`}
                            >
                              {log.details}
                            </TableCell>
                          </TableRow>
                        ))}
                        {recentLogs.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-gray-400 py-6"
                            >
                              No logs yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeCategory === "warehouse" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Warehouse Reports
            </h2>
            <Tabs defaultValue="stock" data-ocid="reports.warehouse.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="stock"
                  data-ocid="reports.warehouse.stock.tab"
                >
                  Stock by Warehouse
                </TabsTrigger>
                <TabsTrigger
                  value="transfers"
                  data-ocid="reports.warehouse.transfers.tab"
                >
                  Inter-Warehouse Transfers
                </TabsTrigger>
              </TabsList>
              <TabsContent value="stock">
                <WarehouseStockReport currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="transfers">
                <TransfersReport currentUser={currentUser} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeCategory === "banking" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Banking Reports</h2>
            <Tabs defaultValue="cheque" data-ocid="reports.banking.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="cheque"
                  data-ocid="reports.banking.cheque.tab"
                >
                  Cheque Status
                </TabsTrigger>
                <TabsTrigger
                  value="accounts"
                  data-ocid="reports.banking.accounts.tab"
                >
                  Bank Account Balances
                </TabsTrigger>
                <TabsTrigger
                  value="reconciliation"
                  data-ocid="reports.banking.recon.tab"
                >
                  Reconciliation Summary
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cheque">
                <ChequeStatusReport currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="accounts">
                <BankAccountsReport currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="reconciliation">
                <ReconciliationReport currentUser={currentUser} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeCategory === "tax" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Tax Reports</h2>
            <TaxCollectionReport currentUser={currentUser} />
          </div>
        )}

        {activeCategory === "aging" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Aging Reports</h2>
            <Tabs defaultValue="supplier" data-ocid="reports.aging.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="supplier"
                  data-ocid="reports.aging.supplier.tab"
                >
                  Supplier Aging
                </TabsTrigger>
                <TabsTrigger
                  value="customer"
                  data-ocid="reports.aging.customer.tab"
                >
                  Customer Aging
                </TabsTrigger>
              </TabsList>
              <TabsContent value="supplier">
                <SupplierAgingReport currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="customer">
                <CustomerAgingReport currentUser={currentUser} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeCategory === "operations" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Operations Reports
            </h2>
            <Tabs defaultValue="shift" data-ocid="reports.operations.tab">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="shift"
                  data-ocid="reports.operations.shift.tab"
                >
                  Shift Closing
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  data-ocid="reports.operations.attendance.tab"
                >
                  Attendance Summary
                </TabsTrigger>
                <TabsTrigger
                  value="leave"
                  data-ocid="reports.operations.leave.tab"
                >
                  Leave Balance
                </TabsTrigger>
              </TabsList>
              <TabsContent value="shift">
                <ShiftClosingReport currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="attendance">
                <AttendanceSummaryReport currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="leave">
                <LeaveBalanceReport currentUser={currentUser} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

// ---- New Report Sub-Components ----

function WarehouseStockReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [whFilter, setWhFilter] = useState("all");
  const warehouses: {
    id: string;
    name: string;
    location: string;
    status: string;
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_warehouses") || "[]");
    } catch {
      return [];
    }
  })();
  const items: {
    warehouseId?: string;
    warehouseName?: string;
    quantity?: number;
    price?: number;
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_items") || "[]");
    } catch {
      return [];
    }
  })();

  const rows = warehouses
    .filter((w) => whFilter === "all" || w.id === whFilter)
    .map((w) => {
      const whItems = items.filter(
        (i) => i.warehouseId === w.id || i.warehouseName === w.name,
      );
      const qty = whItems.reduce((s, i) => s + (i.quantity ?? 0), 0);
      const val = whItems.reduce(
        (s, i) => s + (i.quantity ?? 0) * (i.price ?? 0),
        0,
      );
      return {
        name: w.name,
        location: w.location,
        items: whItems.length,
        qty,
        val,
      };
    });

  const hdrs = [
    "Warehouse",
    "Location",
    "Total Items",
    "Total Qty",
    "Total Value",
  ];
  const exportRows = rows.map((r) => [
    r.name,
    r.location,
    r.items,
    r.qty,
    fmt(r.val),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stock by Warehouse</CardTitle>
        <div className="flex gap-3 mt-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Warehouse</Label>
            <Select value={whFilter} onValueChange={setWhFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Stock by Warehouse"
          headers={hdrs}
          rows={exportRows}
          filename="warehouse_stock"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-6"
                >
                  No data
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-gray-500">{r.location}</TableCell>
                <TableCell>{r.items}</TableCell>
                <TableCell>{r.qty}</TableCell>
                <TableCell className="font-mono">{fmt(r.val)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TransfersReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [fromF, setFromF] = useState("all");
  const transfers: {
    id: string;
    transferNumber?: string;
    fromWarehouseName?: string;
    toWarehouseName?: string;
    date?: string;
    status?: string;
    items?: unknown[];
  }[] = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("bizpos_inventory_transfers") || "[]",
      );
    } catch {
      return [];
    }
  })();

  const filtered = transfers.filter((t) => {
    const matchSearch =
      !search ||
      (t.transferNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusF === "all" || t.status === statusF;
    const matchFrom = fromF === "all" || t.fromWarehouseName === fromF;
    return matchSearch && matchStatus && matchFrom;
  });

  const hdrs = ["Transfer#", "From", "To", "Date", "Status", "Items"];
  const exportRows = filtered.map((t) => [
    t.transferNumber ?? t.id,
    t.fromWarehouseName ?? "",
    t.toWarehouseName ?? "",
    t.date ?? "",
    t.status ?? "",
    t.items?.length ?? 0,
  ]);
  const fromOptions = [
    ...new Set(transfers.map((t) => t.fromWarehouseName).filter(Boolean)),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inter-Warehouse Transfers</CardTitle>
        <div className="flex gap-3 mt-3 flex-wrap">
          <Input
            placeholder="Search transfer#..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusF} onValueChange={setStatusF}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["Draft", "In Transit", "Completed", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From Warehouse</Label>
            <Select value={fromF} onValueChange={setFromF}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {fromOptions.map((f) => (
                  <SelectItem key={f as string} value={f as string}>
                    {f as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Inter-Warehouse Transfers"
          headers={hdrs}
          rows={exportRows}
          filename="inventory_transfers"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No transfers
                </TableCell>
              </TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">
                  {t.transferNumber ?? t.id}
                </TableCell>
                <TableCell>{t.fromWarehouseName}</TableCell>
                <TableCell>{t.toWarehouseName}</TableCell>
                <TableCell>{t.date}</TableCell>
                <TableCell>
                  <Badge className="text-xs">{t.status}</Badge>
                </TableCell>
                <TableCell>{t.items?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ChequeStatusReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [bankF, setBankF] = useState("all");
  const chequeBooks: {
    id: string;
    chequebookNumber?: string;
    accountNumber?: string;
    bankName?: string;
    startLeaf?: number;
    endLeaf?: number;
    leaves?: { status?: string }[];
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_cheque_books") || "[]");
    } catch {
      return [];
    }
  })();

  const filtered = chequeBooks.filter(
    (b) => bankF === "all" || b.bankName === bankF,
  );
  const bankOptions = [
    ...new Set(chequeBooks.map((b) => b.bankName).filter(Boolean)),
  ];

  const rows = filtered.map((b) => {
    const leaves = b.leaves ?? [];
    const total = leaves.length;
    const used = leaves.filter((l) => l.status === "Used").length;
    const avail = leaves.filter((l) => l.status === "Available").length;
    const voided = leaves.filter((l) => l.status === "Voided").length;
    return {
      book: b.chequebookNumber ?? b.id,
      account: b.accountNumber ?? "",
      bank: b.bankName ?? "",
      total,
      used,
      avail,
      voided,
    };
  });

  const hdrs = [
    "Cheque Book",
    "Account",
    "Bank",
    "Total Leaves",
    "Used",
    "Available",
    "Voided",
  ];
  const exportRows = rows.map((r) => [
    r.book,
    r.account,
    r.bank,
    r.total,
    r.used,
    r.avail,
    r.voided,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cheque Status</CardTitle>
        <div className="flex gap-3 mt-3">
          <div className="space-y-1">
            <Label className="text-xs">Bank</Label>
            <Select value={bankF} onValueChange={setBankF}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                {bankOptions.map((b) => (
                  <SelectItem key={b as string} value={b as string}>
                    {b as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Cheque Status"
          headers={hdrs}
          rows={exportRows}
          filename="cheque_status"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-400 py-6"
                >
                  No cheque books
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.book}>
                <TableCell className="font-mono text-sm">{r.book}</TableCell>
                <TableCell>{r.account}</TableCell>
                <TableCell>{r.bank}</TableCell>
                <TableCell>{r.total}</TableCell>
                <TableCell className="text-orange-600">{r.used}</TableCell>
                <TableCell className="text-green-600">{r.avail}</TableCell>
                <TableCell className="text-red-600">{r.voided}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BankAccountsReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [bankF, setBankF] = useState("all");
  const accounts: {
    id: string;
    accountName?: string;
    bankName?: string;
    branchName?: string;
    accountType?: string;
    currency?: string;
    balance?: number;
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_bank_accounts") || "[]");
    } catch {
      return [];
    }
  })();
  const bankOptions = [
    ...new Set(accounts.map((a) => a.bankName).filter(Boolean)),
  ];
  const filtered = accounts.filter(
    (a) => bankF === "all" || a.bankName === bankF,
  );

  const hdrs = [
    "Account Name",
    "Bank",
    "Branch",
    "Type",
    "Currency",
    "Balance",
  ];
  const exportRows = filtered.map((a) => [
    a.accountName ?? "",
    a.bankName ?? "",
    a.branchName ?? "",
    a.accountType ?? "",
    a.currency ?? "PKR",
    fmt(a.balance ?? 0),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bank Account Balances</CardTitle>
        <div className="flex gap-3 mt-3">
          <div className="space-y-1">
            <Label className="text-xs">Bank</Label>
            <Select value={bankF} onValueChange={setBankF}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                {bankOptions.map((b) => (
                  <SelectItem key={b as string} value={b as string}>
                    {b as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Bank Account Balances"
          headers={hdrs}
          rows={exportRows}
          filename="bank_accounts_report"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No accounts
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.accountName}</TableCell>
                <TableCell>{a.bankName}</TableCell>
                <TableCell>{a.branchName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{a.accountType}</Badge>
                </TableCell>
                <TableCell>{a.currency ?? "PKR"}</TableCell>
                <TableCell className="font-mono font-bold text-blue-700">
                  {fmt(a.balance ?? 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReconciliationReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [acctF, setAcctF] = useState("all");
  const recs: {
    id: string;
    accountName?: string;
    date?: string;
    statementBalance?: number;
    bookBalance?: number;
    status?: string;
  }[] = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("bizpos_bank_reconciliation") || "[]",
      );
    } catch {
      return [];
    }
  })();
  const acctOptions = [
    ...new Set(recs.map((r) => r.accountName).filter(Boolean)),
  ];
  const filtered = recs.filter(
    (r) => acctF === "all" || r.accountName === acctF,
  );

  const hdrs = [
    "Account",
    "Date",
    "Statement Balance",
    "Book Balance",
    "Difference",
    "Status",
  ];
  const exportRows = filtered.map((r) => {
    const diff = (r.statementBalance ?? 0) - (r.bookBalance ?? 0);
    return [
      r.accountName ?? "",
      r.date ?? "",
      fmt(r.statementBalance ?? 0),
      fmt(r.bookBalance ?? 0),
      fmt(diff),
      r.status ?? "",
    ];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bank Reconciliation Summary</CardTitle>
        <div className="flex gap-3 mt-3">
          <div className="space-y-1">
            <Label className="text-xs">Account</Label>
            <Select value={acctF} onValueChange={setAcctF}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {acctOptions.map((a) => (
                  <SelectItem key={a as string} value={a as string}>
                    {a as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Bank Reconciliation Summary"
          headers={hdrs}
          rows={exportRows}
          filename="bank_reconciliation_report"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No reconciliation records
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const diff = (r.statementBalance ?? 0) - (r.bookBalance ?? 0);
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.accountName}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-mono">
                    {fmt(r.statementBalance ?? 0)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {fmt(r.bookBalance ?? 0)}
                  </TableCell>
                  <TableCell
                    className={`font-mono font-bold ${Math.abs(diff) < 0.01 ? "text-green-600" : "text-red-600"}`}
                  >
                    {fmt(diff)}
                  </TableCell>
                  <TableCell>
                    <Badge className="text-xs">{r.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TaxCollectionReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [taxNameF, setTaxNameF] = useState("all");

  const sales: {
    date?: string;
    tax?: number;
    taxName?: string;
    total?: number;
    subTotal?: number;
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_sales") || "[]");
    } catch {
      return [];
    }
  })();
  const taxes: { name?: string; rate?: number }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_taxes") || "[]");
    } catch {
      return [];
    }
  })();

  const filtered = sales.filter((s) => {
    const d = s.date ?? "";
    const matchDate = (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
    const matchTax = taxNameF === "all" || s.taxName === taxNameF;
    return matchDate && matchTax;
  });

  // Group by tax name
  const taxMap: Record<
    string,
    { taxable: number; collected: number; rate: number }
  > = {};
  for (const s of filtered) {
    const key = s.taxName ?? "Unknown Tax";
    if (!taxMap[key]) {
      const t = taxes.find((tx) => tx.name === key);
      taxMap[key] = { taxable: 0, collected: 0, rate: t?.rate ?? 0 };
    }
    taxMap[key].taxable += s.subTotal ?? s.total ?? 0;
    taxMap[key].collected += s.tax ?? 0;
  }

  const rows = Object.entries(taxMap).map(([name, v]) => ({ name, ...v }));
  const taxOptions = [...new Set(sales.map((s) => s.taxName).filter(Boolean))];

  const hdrs = ["Tax Name", "Rate %", "Taxable Amount", "Tax Collected"];
  const exportRows = rows.map((r) => [
    r.name,
    `${r.rate}%`,
    fmt(r.taxable),
    fmt(r.collected),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Collection Summary</CardTitle>
        <div className="flex gap-3 mt-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tax Name</Label>
            <Select value={taxNameF} onValueChange={setTaxNameF}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Taxes</SelectItem>
                {taxOptions.map((t) => (
                  <SelectItem key={t as string} value={t as string}>
                    {t as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Tax Collection Summary"
          headers={hdrs}
          rows={exportRows}
          filename="tax_collection"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
          filters={[
            { label: "Date From", value: dateFrom || "All" },
            { label: "Date To", value: dateTo || "All" },
          ]}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-400 py-6"
                >
                  No tax data
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.rate}%</TableCell>
                <TableCell className="font-mono">{fmt(r.taxable)}</TableCell>
                <TableCell className="font-mono font-bold text-blue-700">
                  {fmt(r.collected)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function agingBuckets(
  items: { date?: string; amount?: number; total?: number; dueDate?: string }[],
  nameKey: string,
) {
  const now = new Date();
  const result: Record<
    string,
    { current: number; d30: number; d60: number; d90: number; total: number }
  > = {};
  for (const item of items) {
    const name =
      ((item as Record<string, unknown>)[nameKey] as string) ?? "Unknown";
    if (!result[name])
      result[name] = { current: 0, d30: 0, d60: 0, d90: 0, total: 0 };
    const d = new Date(item.dueDate ?? item.date ?? now);
    const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const amt = item.amount ?? item.total ?? 0;
    result[name].total += amt;
    if (days <= 0) result[name].current += amt;
    else if (days <= 30) result[name].d30 += amt;
    else if (days <= 60) result[name].d60 += amt;
    else result[name].d90 += amt;
  }
  return Object.entries(result).map(([name, v]) => ({ name, ...v }));
}

function SupplierAgingReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [search, setSearch] = useState("");
  const purchases: { supplierName?: string; date?: string; total?: number }[] =
    (() => {
      try {
        return JSON.parse(localStorage.getItem("bizpos_purchases") || "[]");
      } catch {
        return [];
      }
    })();
  const rows = agingBuckets(
    purchases.map((p) => ({ ...p })),
    "supplierName",
  ).filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );
  const hdrs = [
    "Supplier",
    "Current",
    "30 Days",
    "60 Days",
    "90+ Days",
    "Total",
  ];
  const exportRows = rows.map((r) => [
    r.name,
    fmt(r.current),
    fmt(r.d30),
    fmt(r.d60),
    fmt(r.d90),
    fmt(r.total),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Supplier Aging</CardTitle>
        <div className="flex gap-3 mt-3">
          <Input
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
        <ExportBar
          title="Supplier Aging"
          headers={hdrs}
          rows={exportRows}
          filename="supplier_aging"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No data
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-green-700">
                  {fmt(r.current)}
                </TableCell>
                <TableCell className="font-mono text-yellow-700">
                  {fmt(r.d30)}
                </TableCell>
                <TableCell className="font-mono text-orange-700">
                  {fmt(r.d60)}
                </TableCell>
                <TableCell className="font-mono text-red-700">
                  {fmt(r.d90)}
                </TableCell>
                <TableCell className="font-mono font-bold">
                  {fmt(r.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CustomerAgingReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [search, setSearch] = useState("");
  const sales: { customerName?: string; date?: string; total?: number }[] =
    (() => {
      try {
        return JSON.parse(localStorage.getItem("bizpos_sales") || "[]");
      } catch {
        return [];
      }
    })();
  const rows = agingBuckets(
    sales.map((s) => ({ ...s })),
    "customerName",
  ).filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );
  const hdrs = [
    "Customer",
    "Current",
    "30 Days",
    "60 Days",
    "90+ Days",
    "Total",
  ];
  const exportRows = rows.map((r) => [
    r.name,
    fmt(r.current),
    fmt(r.d30),
    fmt(r.d60),
    fmt(r.d90),
    fmt(r.total),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customer Aging</CardTitle>
        <div className="flex gap-3 mt-3">
          <Input
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
        <ExportBar
          title="Customer Aging"
          headers={hdrs}
          rows={exportRows}
          filename="customer_aging"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No data
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-green-700">
                  {fmt(r.current)}
                </TableCell>
                <TableCell className="font-mono text-yellow-700">
                  {fmt(r.d30)}
                </TableCell>
                <TableCell className="font-mono text-orange-700">
                  {fmt(r.d60)}
                </TableCell>
                <TableCell className="font-mono text-red-700">
                  {fmt(r.d90)}
                </TableCell>
                <TableCell className="font-mono font-bold">
                  {fmt(r.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ShiftClosingReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const closings: {
    id: string;
    shopName?: string;
    shiftName?: string;
    openedDate?: string;
    openedBy?: string;
    expectedCash?: number;
    actualCash?: number;
    variance?: number;
    status?: string;
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_shift_closings") || "[]");
    } catch {
      return [];
    }
  })();

  const filtered = closings.filter((c) => {
    const d = c.openedDate ?? "";
    return (
      (!search ||
        (c.shopName ?? "").toLowerCase().includes(search.toLowerCase())) &&
      (statusF === "all" || c.status === statusF) &&
      (!dateFrom || d >= dateFrom) &&
      (!dateTo || d <= dateTo)
    );
  });

  const hdrs = [
    "Shop",
    "Shift",
    "Date",
    "Opened By",
    "Expected Cash",
    "Actual Cash",
    "Variance",
    "Status",
  ];
  const exportRows = filtered.map((c) => [
    c.shopName ?? "",
    c.shiftName ?? "",
    c.openedDate ?? "",
    c.openedBy ?? "",
    fmt(c.expectedCash ?? 0),
    fmt(c.actualCash ?? 0),
    fmt(c.variance ?? 0),
    c.status ?? "",
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shift Closing Summary</CardTitle>
        <div className="flex gap-3 mt-3 flex-wrap">
          <Input
            placeholder="Search shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusF} onValueChange={setStatusF}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["Open", "Closed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
        <ExportBar
          title="Shift Closing Summary"
          headers={hdrs}
          rows={exportRows}
          filename="shift_closings"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-400 py-6"
                >
                  No shift closings
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.shopName}</TableCell>
                <TableCell>{c.shiftName}</TableCell>
                <TableCell>{c.openedDate}</TableCell>
                <TableCell>{c.openedBy}</TableCell>
                <TableCell className="font-mono">
                  {fmt(c.expectedCash ?? 0)}
                </TableCell>
                <TableCell className="font-mono">
                  {fmt(c.actualCash ?? 0)}
                </TableCell>
                <TableCell
                  className={`font-mono font-bold ${(c.variance ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {fmt(c.variance ?? 0)}
                </TableCell>
                <TableCell>
                  <Badge className="text-xs">{c.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AttendanceSummaryReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [monthF, setMonthF] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const attendance: {
    employeeName?: string;
    date?: string;
    status?: "Present" | "Absent" | "Half-Day";
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_attendance") || "[]");
    } catch {
      return [];
    }
  })();

  const filtered = attendance.filter((a) => {
    const month = (a.date ?? "").slice(0, 7);
    return (
      (!monthF || month === monthF) &&
      (!search ||
        (a.employeeName ?? "").toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Group by employee
  const empMap: Record<
    string,
    { present: number; absent: number; halfDay: number }
  > = {};
  for (const a of filtered) {
    const name = a.employeeName ?? "Unknown";
    if (!empMap[name]) empMap[name] = { present: 0, absent: 0, halfDay: 0 };
    if (a.status === "Present") empMap[name].present++;
    else if (a.status === "Absent") empMap[name].absent++;
    else if (a.status === "Half-Day") empMap[name].halfDay++;
  }

  const rows = Object.entries(empMap).map(([name, v]) => {
    const total = v.present + v.absent + v.halfDay;
    const pct =
      total > 0 ? Math.round(((v.present + v.halfDay * 0.5) / total) * 100) : 0;
    return { name, ...v, total, pct };
  });

  const hdrs = [
    "Employee",
    "Present",
    "Absent",
    "Half-Day",
    "Total Days",
    "Attendance%",
  ];
  const exportRows = rows.map((r) => [
    r.name,
    r.present,
    r.absent,
    r.halfDay,
    r.total,
    `${r.pct}%`,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance Summary</CardTitle>
        <div className="flex gap-3 mt-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Month</Label>
            <Input
              type="month"
              value={monthF}
              onChange={(e) => setMonthF(e.target.value)}
              className="w-36"
            />
          </div>
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
        <ExportBar
          title="Attendance Summary"
          headers={hdrs}
          rows={exportRows}
          filename="attendance_summary"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
          filters={[{ label: "Month", value: monthF }]}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No attendance data
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-green-600">{r.present}</TableCell>
                <TableCell className="text-red-600">{r.absent}</TableCell>
                <TableCell className="text-yellow-600">{r.halfDay}</TableCell>
                <TableCell>{r.total}</TableCell>
                <TableCell>
                  <span
                    className={`font-bold ${r.pct >= 80 ? "text-green-600" : r.pct >= 60 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {r.pct}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LeaveBalanceReport({
  currentUser,
}: { currentUser: { name?: string } | null }) {
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const leaveRequests: {
    employeeName?: string;
    leaveTypeName?: string;
    days?: number;
    status?: string;
  }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_leave_requests") || "[]");
    } catch {
      return [];
    }
  })();

  // Group by employee + type
  const grouped: Record<string, Record<string, number>> = {};
  for (const r of leaveRequests) {
    if (r.status !== "Approved") continue;
    const emp = r.employeeName ?? "Unknown";
    const type = r.leaveTypeName ?? "General";
    if (!grouped[emp]) grouped[emp] = {};
    grouped[emp][type] = (grouped[emp][type] ?? 0) + (r.days ?? 0);
  }

  const entitlement = 20; // default annual entitlement
  const rows: {
    emp: string;
    type: string;
    entitlement: number;
    used: number;
    remaining: number;
  }[] = [];
  for (const [emp, types] of Object.entries(grouped)) {
    for (const [type, used] of Object.entries(types)) {
      rows.push({
        emp,
        type,
        entitlement,
        used,
        remaining: entitlement - used,
      });
    }
  }

  const filtered = rows.filter((r) => {
    return (
      (!search || r.emp.toLowerCase().includes(search.toLowerCase())) &&
      (typeF === "all" || r.type === typeF)
    );
  });
  const typeOptions = [...new Set(rows.map((r) => r.type))];

  const hdrs = ["Employee", "Leave Type", "Entitlement", "Used", "Remaining"];
  const exportRows = filtered.map((r) => [
    r.emp,
    r.type,
    r.entitlement,
    r.used,
    r.remaining,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave Balance</CardTitle>
        <div className="flex gap-3 mt-3 flex-wrap">
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <div className="space-y-1">
            <Label className="text-xs">Leave Type</Label>
            <Select value={typeF} onValueChange={setTypeF}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ExportBar
          title="Leave Balance"
          headers={hdrs}
          rows={exportRows}
          filename="leave_balance"
          companyName={getActiveCompanyName()}
          generatedBy={currentUser?.name ?? "Unknown"}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hdrs.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-6"
                >
                  No leave data
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={`${r.emp}-${r.type}`}>
                <TableCell className="font-medium">{r.emp}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.entitlement}</TableCell>
                <TableCell className="text-orange-600">{r.used}</TableCell>
                <TableCell
                  className={`font-bold ${r.remaining > 5 ? "text-green-600" : "text-red-600"}`}
                >
                  {r.remaining}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

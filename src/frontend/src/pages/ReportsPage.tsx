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
import { useMemo, useState } from "react";
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

function exportExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  title?: string,
  generatedBy?: string,
  filters?: { label: string; value: string }[],
) {
  exportExcelUtil(filename, "Report", headers, rows, {
    companyName: "BizPOS System",
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
  generatedBy?: string,
  filters?: { label: string; value: string }[],
) {
  exportPDFUtil(title, headers, rows, filename, {
    companyName: "BizPOS System",
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
  generatedBy,
  filters,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
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
                value={`PKR ${fmt(totalAllSalesRevenue)}`}
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
                value={`PKR ${fmt(store.purchases.reduce((s, p) => s + p.total, 0))}`}
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
                value={`PKR ${fmt(store.items.reduce((s, i) => s + i.quantity * i.costPrice, 0))}`}
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
                value={`PKR ${fmt(filteredPayrolls.reduce((s, p) => s + p.totalGross, 0))}`}
                color="text-blue-600"
              />
              <SummaryCard
                label="Total Deductions"
                value={`PKR ${fmt(filteredPayrolls.reduce((s, p) => s + p.totalDeductions, 0))}`}
                color="text-red-600"
              />
              <SummaryCard
                label="Total Net"
                value={`PKR ${fmt(filteredPayrolls.reduce((s, p) => s + p.totalNet, 0))}`}
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
      </main>
    </div>
  );
}

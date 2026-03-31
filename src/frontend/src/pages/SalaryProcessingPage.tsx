import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, FileSpreadsheet, Printer, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { Payroll, PayrollItem } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = [2023, 2024, 2025, 2026];

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 0 });
}

function computeGross(item: PayrollItem): number {
  return (
    item.basicSalary +
    item.allowances.hra +
    item.allowances.transport +
    item.allowances.medical +
    item.allowances.bonus +
    item.allowances.commission +
    item.allowances.other
  );
}

function computeDeductions(item: PayrollItem): number {
  return (
    item.deductions.incomeTax +
    item.deductions.providentFund +
    item.deductions.loanDeduction +
    item.deductions.advance +
    item.deductions.other
  );
}

export default function SalaryProcessingPage() {
  const { currentUser } = useAuth();
  const { employees, payrolls, addPayroll, updatePayroll } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detailPayroll, setDetailPayroll] = useState<Payroll | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [payslipItem, setPayslipItem] = useState<PayrollItem | null>(null);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [payslipPeriod, setPayslipPeriod] = useState("");
  const [ytdYear, setYtdYear] = useState(String(now.getFullYear()));

  const handleExportPDF = () => {
    const rows = payrolls.map((p) => [
      `${p.year}-${String(p.month).padStart(2, "0")}`,
      p.items.length,
      p.items.reduce((s, i) => s + i.grossSalary, 0).toLocaleString(),
      p.items.reduce((s, i) => s + i.totalDeductions, 0).toLocaleString(),
      p.items.reduce((s, i) => s + i.netSalary, 0).toLocaleString(),
      p.status,
    ]);
    exportPDF(
      "Payroll History",
      ["Period", "Employees", "Gross", "Deductions", "Net", "Status"],
      rows,
      "payroll-history.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "Month", value: month },
          { label: "Year", value: year },
        ],
      },
    );
  };

  const handleExportExcel = () => {
    const rows = payrolls.map((p) => [
      `${p.year}-${String(p.month).padStart(2, "0")}`,
      p.items.length,
      p.items.reduce((s, i) => s + i.grossSalary, 0),
      p.items.reduce((s, i) => s + i.totalDeductions, 0),
      p.items.reduce((s, i) => s + i.netSalary, 0),
      p.status,
    ]);
    exportExcel(
      "payroll-history.xlsx",
      "Payroll History",
      ["Period", "Employees", "Gross", "Deductions", "Net", "Status"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Payroll History",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "Month", value: month },
          { label: "Year", value: year },
        ],
      },
    );
  };

  const loadEmployees = () => {
    const active = employees.filter((e) => e.status === "Active");
    const items: PayrollItem[] = active.map((e) => {
      const basic = e.employmentType === "Monthly-Salaried" ? e.basicSalary : 0;
      return {
        employeeId: e.id,
        employeeName: e.name,
        employmentType: e.employmentType,
        basicSalary: basic,
        hoursWorked: e.employmentType === "Hourly" ? 160 : undefined,
        daysWorked: e.employmentType === "Daily-Wage" ? 26 : undefined,
        overtimeHours: e.employmentType === "Hourly" ? 0 : undefined,
        overtimeMultiplier: 1.5,
        allowances: {
          hra: Math.round(basic * 0.1),
          transport: 2000,
          medical: 1000,
          bonus: 0,
          commission: 0,
          other: 0,
        },
        grossSalary: 0,
        deductions: {
          incomeTax: 0,
          providentFund: Math.round(basic * 0.05),
          loanDeduction: 0,
          advance: 0,
          other: 0,
        },
        totalDeductions: 0,
        netSalary: 0,
      };
    });
    setPayrollItems(items);
    setLoaded(true);
    toast.success(`Loaded ${items.length} employees`);
  };

  const updateItem = (empId: string, patch: Partial<PayrollItem>) => {
    setPayrollItems((prev) =>
      prev.map((item) => {
        if (item.employeeId !== empId) return item;
        const updated = { ...item, ...patch };
        const emp = employees.find((e) => e.id === empId);
        if (emp) {
          if (emp.employmentType === "Hourly") {
            const hw = updated.hoursWorked ?? 0;
            const ot = updated.overtimeHours ?? 0;
            const otMult = updated.overtimeMultiplier ?? 1.5;
            updated.basicSalary = Math.round(
              emp.hourlyRate * hw + emp.hourlyRate * otMult * ot,
            );
          } else if (emp.employmentType === "Daily-Wage") {
            updated.basicSalary = Math.round(
              emp.dailyRate * (updated.daysWorked ?? 0),
            );
          }
        }
        const gross = computeGross(updated);
        updated.grossSalary = gross;
        updated.totalDeductions = computeDeductions(updated);
        updated.netSalary = gross - updated.totalDeductions;
        return updated;
      }),
    );
  };

  const handleSave = (status: "Draft" | "Finalized") => {
    if (!loaded || payrollItems.length === 0) {
      toast.error("Load employees first");
      return;
    }
    const m = Number(month);
    const y = Number(year);
    const period = `${MONTHS[m - 1]} ${y}`;
    const existing = payrolls.find((p) => p.month === m && p.year === y);
    const items = payrollItems.map((item) => {
      const gross = computeGross(item);
      const totalDed = computeDeductions(item);
      return {
        ...item,
        grossSalary: gross,
        totalDeductions: totalDed,
        netSalary: gross - totalDed,
      };
    });
    const totals = items.reduce(
      (acc, i) => ({
        gross: acc.gross + i.grossSalary,
        ded: acc.ded + i.totalDeductions,
        net: acc.net + i.netSalary,
      }),
      { gross: 0, ded: 0, net: 0 },
    );
    if (existing) {
      updatePayroll(existing.id, {
        status,
        items,
        totalGross: totals.gross,
        totalDeductions: totals.ded,
        totalNet: totals.net,
      });
    } else {
      addPayroll({
        period,
        month: m,
        year: y,
        status,
        totalGross: totals.gross,
        totalDeductions: totals.ded,
        totalNet: totals.net,
        employeeCount: items.length,
        items,
      });
    }
    toast.success(
      status === "Finalized" ? "Payroll finalized!" : "Saved as draft",
    );
  };

  // YTD Summary
  const ytdPayrolls = payrolls.filter(
    (p) => p.year === Number(ytdYear) && p.status === "Finalized",
  );
  const ytdByEmployee: Record<
    string,
    {
      name: string;
      gross: number;
      deductions: number;
      net: number;
      months: number;
    }
  > = {};
  for (const payroll of ytdPayrolls) {
    for (const item of payroll.items) {
      if (!ytdByEmployee[item.employeeId]) {
        ytdByEmployee[item.employeeId] = {
          name: item.employeeName,
          gross: 0,
          deductions: 0,
          net: 0,
          months: 0,
        };
      }
      ytdByEmployee[item.employeeId].gross += item.grossSalary;
      ytdByEmployee[item.employeeId].deductions += item.totalDeductions;
      ytdByEmployee[item.employeeId].net += item.netSalary;
      ytdByEmployee[item.employeeId].months += 1;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Salary Processing</h1>
        <p className="text-gray-600 mt-1">
          Process payroll and manage salary records
        </p>
      </div>

      <Tabs defaultValue="process">
        <TabsList data-ocid="salary.tab">
          <TabsTrigger value="process">Process Payroll</TabsTrigger>
          <TabsTrigger value="history">Payroll History</TabsTrigger>
          <TabsTrigger value="ytd">YTD Summary</TabsTrigger>
        </TabsList>

        {/* ---- Process Payroll ---- */}
        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1.5">
                  <Label>Month</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-40" data-ocid="salary.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={loadEmployees}
                  data-ocid="salary.primary_button"
                >
                  Load Employees
                </Button>
              </div>
            </CardContent>
          </Card>

          {loaded && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Payroll — {MONTHS[Number(month) - 1]} {year}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSave("Draft")}
                      data-ocid="salary.secondary_button"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button
                      onClick={() => handleSave("Finalized")}
                      data-ocid="salary.submit_button"
                    >
                      Finalize Payroll
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>HRA</TableHead>
                      <TableHead>Trans.</TableHead>
                      <TableHead>Med.</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Comm.</TableHead>
                      <TableHead>Other+</TableHead>
                      <TableHead className="text-blue-600">Gross</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>PF</TableHead>
                      <TableHead>Loan</TableHead>
                      <TableHead>Advance</TableHead>
                      <TableHead>Other-</TableHead>
                      <TableHead className="text-red-600">Total Ded.</TableHead>
                      <TableHead className="text-green-600">Net Pay</TableHead>
                      {payrollItems.some(
                        (i) => i.employmentType === "Hourly",
                      ) && <TableHead>Hrs / OT</TableHead>}
                      {payrollItems.some(
                        (i) => i.employmentType === "Daily-Wage",
                      ) && <TableHead>Days</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map((item, idx) => {
                      const gross = computeGross(item);
                      const totalDed = computeDeductions(item);
                      const net = gross - totalDed;
                      const emp = employees.find(
                        (e) => e.id === item.employeeId,
                      );
                      return (
                        <TableRow
                          key={item.employeeId}
                          data-ocid={`salary.item.${idx + 1}`}
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {item.employeeName}
                          </TableCell>
                          <TableCell>
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              {item.employmentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.employmentType === "Monthly-Salaried"
                              ? fmt(item.basicSalary)
                              : item.employmentType === "Hourly"
                                ? `${emp?.hourlyRate ?? 0}/hr × ${item.hoursWorked ?? 0}h`
                                : `${emp?.dailyRate ?? 0}/day × ${item.daysWorked ?? 0}d`}
                          </TableCell>
                          {(
                            [
                              ["hra", item.allowances.hra],
                              ["transport", item.allowances.transport],
                              ["medical", item.allowances.medical],
                              ["bonus", item.allowances.bonus],
                              ["commission", item.allowances.commission],
                              ["other", item.allowances.other],
                            ] as [keyof PayrollItem["allowances"], number][]
                          ).map(([key, val]) => (
                            <TableCell key={key}>
                              <Input
                                type="number"
                                className="w-20 h-7 text-xs"
                                value={val}
                                onChange={(e) =>
                                  updateItem(item.employeeId, {
                                    allowances: {
                                      ...item.allowances,
                                      [key]: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="font-bold text-blue-700 font-mono">
                            {fmt(gross)}
                          </TableCell>
                          {(
                            [
                              ["incomeTax", item.deductions.incomeTax],
                              ["providentFund", item.deductions.providentFund],
                              ["loanDeduction", item.deductions.loanDeduction],
                              ["advance", item.deductions.advance],
                              ["other", item.deductions.other],
                            ] as [keyof PayrollItem["deductions"], number][]
                          ).map(([key, val]) => (
                            <TableCell key={key}>
                              <Input
                                type="number"
                                className="w-20 h-7 text-xs"
                                value={val}
                                onChange={(e) =>
                                  updateItem(item.employeeId, {
                                    deductions: {
                                      ...item.deductions,
                                      [key]: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="font-bold text-red-600 font-mono">
                            {fmt(totalDed)}
                          </TableCell>
                          <TableCell className="font-bold text-green-700 font-mono">
                            {fmt(net)}
                          </TableCell>
                          {item.employmentType === "Hourly" && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  className="w-16 h-7 text-xs"
                                  placeholder="Hrs"
                                  value={item.hoursWorked ?? 0}
                                  onChange={(e) =>
                                    updateItem(item.employeeId, {
                                      hoursWorked: Number(e.target.value),
                                    })
                                  }
                                />
                                <Input
                                  type="number"
                                  className="w-14 h-7 text-xs"
                                  placeholder="OT"
                                  value={item.overtimeHours ?? 0}
                                  onChange={(e) =>
                                    updateItem(item.employeeId, {
                                      overtimeHours: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </TableCell>
                          )}
                          {item.employmentType === "Daily-Wage" && (
                            <TableCell>
                              <Input
                                type="number"
                                className="w-20 h-7 text-xs"
                                placeholder="Days"
                                value={item.daysWorked ?? 0}
                                onChange={(e) =>
                                  updateItem(item.employeeId, {
                                    daysWorked: Number(e.target.value),
                                  })
                                }
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 font-bold border-t-2">
                      <TableCell colSpan={9}>TOTALS</TableCell>
                      <TableCell className="text-blue-700 font-mono">
                        {fmt(
                          payrollItems.reduce((s, i) => s + computeGross(i), 0),
                        )}
                      </TableCell>
                      <TableCell colSpan={5} />
                      <TableCell className="text-red-600 font-mono">
                        {fmt(
                          payrollItems.reduce(
                            (s, i) => s + computeDeductions(i),
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell className="text-green-700 font-mono">
                        {fmt(
                          payrollItems.reduce(
                            (s, i) =>
                              s + (computeGross(i) - computeDeductions(i)),
                            0,
                          ),
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---- Payroll History ---- */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payroll History</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  data-ocid="salary.secondary_button"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  data-ocid="salary.secondary_button"
                >
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Total Deductions</TableHead>
                    <TableHead>Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.length === 0 && (
                    <TableRow data-ocid="salary.empty_state">
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-400 py-8"
                      >
                        No payroll records yet
                      </TableCell>
                    </TableRow>
                  )}
                  {payrolls
                    .slice()
                    .sort(
                      (a, b) => b.year * 12 + b.month - (a.year * 12 + a.month),
                    )
                    .map((p, idx) => (
                      <TableRow key={p.id} data-ocid={`salary.item.${idx + 1}`}>
                        <TableCell className="font-medium">
                          {p.period}
                        </TableCell>
                        <TableCell>{p.employeeCount}</TableCell>
                        <TableCell className="font-mono text-blue-700">
                          {fmt(p.totalGross)}
                        </TableCell>
                        <TableCell className="font-mono text-red-600">
                          {fmt(p.totalDeductions)}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-green-700">
                          {fmt(p.totalNet)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.status === "Finalized"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDetailPayroll(p);
                              setDetailSheetOpen(true);
                            }}
                            data-ocid={`salary.secondary_button.${idx + 1}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- YTD Summary ---- */}
        <TabsContent value="ytd" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Year-to-Date Summary</CardTitle>
                <Select value={ytdYear} onValueChange={setYtdYear}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Months Paid</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Total Deductions</TableHead>
                    <TableHead>Total Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(ytdByEmployee).length === 0 && (
                    <TableRow data-ocid="salary.ytd.empty_state">
                      <TableCell
                        colSpan={5}
                        className="text-center text-gray-400 py-8"
                      >
                        No finalized payrolls for {ytdYear}
                      </TableCell>
                    </TableRow>
                  )}
                  {Object.entries(ytdByEmployee).map(([empId, data], idx) => (
                    <TableRow
                      key={empId}
                      data-ocid={`salary.ytd.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{data.name}</TableCell>
                      <TableCell>{data.months}</TableCell>
                      <TableCell className="font-mono text-blue-700">
                        {fmt(data.gross)}
                      </TableCell>
                      <TableCell className="font-mono text-red-600">
                        {fmt(data.deductions)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-green-700">
                        {fmt(data.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {Object.entries(ytdByEmployee).length > 0 && (
                    <TableRow className="bg-gray-50 font-bold border-t-2">
                      <TableCell colSpan={2}>TOTALS</TableCell>
                      <TableCell className="font-mono text-blue-700">
                        {fmt(
                          Object.values(ytdByEmployee).reduce(
                            (s, d) => s + d.gross,
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-red-600">
                        {fmt(
                          Object.values(ytdByEmployee).reduce(
                            (s, d) => s + d.deductions,
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-green-700">
                        {fmt(
                          Object.values(ytdByEmployee).reduce(
                            (s, d) => s + d.net,
                            0,
                          ),
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent
          className="w-full sm:max-w-2xl overflow-y-auto"
          data-ocid="salary.sheet"
        >
          <SheetHeader>
            <SheetTitle>Payroll Details — {detailPayroll?.period}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailPayroll?.items.map((item, idx) => (
                  <TableRow
                    key={item.employeeId}
                    data-ocid={`salary.row.${idx + 1}`}
                  >
                    <TableCell>{item.employeeName}</TableCell>
                    <TableCell className="font-mono">
                      {fmt(item.grossSalary)}
                    </TableCell>
                    <TableCell className="font-mono text-red-600">
                      {fmt(item.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-green-700">
                      {fmt(item.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPayslipItem(item);
                          setPayslipPeriod(detailPayroll?.period ?? "");
                          setPayslipDialogOpen(true);
                        }}
                        data-ocid="salary.secondary_button"
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="salary.dialog">
          <DialogHeader>
            <DialogTitle>Payslip — {payslipPeriod}</DialogTitle>
          </DialogHeader>
          {payslipItem && (
            <div className="space-y-3 text-sm" id="payslip-print-area">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-lg">BizPOS System</p>
                <p className="text-gray-500">Salary Slip — {payslipPeriod}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Employee:</span>
                <span className="font-medium">{payslipItem.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{payslipItem.employmentType}</span>
              </div>
              <div className="border-t pt-2">
                <p className="font-semibold mb-1 text-green-700">Earnings</p>
                {(
                  [
                    ["Basic Salary", payslipItem.basicSalary],
                    ["HRA", payslipItem.allowances.hra],
                    ["Transport", payslipItem.allowances.transport],
                    ["Medical", payslipItem.allowances.medical],
                    ["Bonus", payslipItem.allowances.bonus],
                    ["Commission", payslipItem.allowances.commission],
                    ["Other", payslipItem.allowances.other],
                  ] as [string, number][]
                )
                  .filter(([, v]) => v > 0)
                  .map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-mono">{fmt(val)}</span>
                    </div>
                  ))}
                <div className="flex justify-between font-bold text-blue-700 border-t mt-1 pt-1">
                  <span>Gross Salary</span>
                  <span className="font-mono">
                    {fmt(payslipItem.grossSalary)}
                  </span>
                </div>
              </div>
              <div className="border-t pt-2">
                <p className="font-semibold mb-1 text-red-700">Deductions</p>
                {(
                  [
                    ["Income Tax", payslipItem.deductions.incomeTax],
                    ["Provident Fund", payslipItem.deductions.providentFund],
                    ["Loan", payslipItem.deductions.loanDeduction],
                    ["Advance", payslipItem.deductions.advance],
                    ["Other", payslipItem.deductions.other],
                  ] as [string, number][]
                )
                  .filter(([, v]) => v > 0)
                  .map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-mono text-red-600">{fmt(val)}</span>
                    </div>
                  ))}
                <div className="flex justify-between font-bold text-red-700 border-t mt-1 pt-1">
                  <span>Total Deductions</span>
                  <span className="font-mono">
                    {fmt(payslipItem.totalDeductions)}
                  </span>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg text-green-700">
                <span>Net Pay</span>
                <span className="font-mono">{fmt(payslipItem.netSalary)}</span>
              </div>
              <Button className="w-full mt-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print Payslip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

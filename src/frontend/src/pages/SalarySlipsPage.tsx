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
import { Separator } from "@/components/ui/separator";
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
import { Eye, FileText, Plus, Printer, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { SalarySlip } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel } from "../utils/exportUtils";

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
  return `PKR ${n.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;
}

function printSlipPDF(slip: SalarySlip) {
  // Use jsPDF via window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const JsPDF = w.jspdf?.jsPDF ?? w.jsPDF;
  if (!JsPDF) {
    alert("PDF library not loaded");
    return;
  }
  const doc = new JsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text("BizPOS System", 14, y);
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Salary Slip", 14, y);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pw - 14, y);
  y += 6;

  // Employee details
  doc.setFontSize(10);
  doc.text(`Employee: ${slip.employeeName}  (${slip.employeeCode})`, 14, y);
  y += 5;
  doc.text(
    `Designation: ${slip.designation}    Department: ${slip.department}`,
    14,
    y,
  );
  y += 5;
  doc.text(
    `Pay Period: ${slip.periodLabel}    Slip #: ${slip.slipNumber}`,
    14,
    y,
  );
  y += 5;
  doc.text(
    `Payment Date: ${slip.paymentDate}    Bank: ${slip.bankName}  A/C: ${slip.accountNumber}`,
    14,
    y,
  );
  y += 7;
  doc.line(14, y, pw - 14, y);
  y += 6;

  // Earnings
  doc.setFont("helvetica", "bold");
  doc.text("EARNINGS", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("Basic Salary", 14, y);
  doc.text(fmt(slip.basicSalary), pw - 14, y, { align: "right" });
  y += 5;
  for (const a of slip.allowances) {
    doc.text(a.name, 14, y);
    doc.text(fmt(a.amount), pw - 14, y, { align: "right" });
    y += 5;
  }
  doc.line(14, y, pw - 14, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Gross Salary", 14, y);
  doc.text(fmt(slip.grossSalary), pw - 14, y, { align: "right" });
  y += 8;

  // Deductions
  doc.setFont("helvetica", "normal");
  doc.setFont("helvetica", "bold");
  doc.text("DEDUCTIONS", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  for (const d of slip.deductions) {
    doc.text(d.name, 14, y);
    doc.text(fmt(d.amount), pw - 14, y, { align: "right" });
    y += 5;
  }
  doc.line(14, y, pw - 14, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Total Deductions", 14, y);
  doc.text(fmt(slip.totalDeductions), pw - 14, y, { align: "right" });
  y += 8;

  // Net
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text("Net Salary", 14, y);
  doc.text(fmt(slip.netSalary), pw - 14, y, { align: "right" });
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Status: ${slip.status}    Generated: ${new Date(slip.generatedAt).toLocaleDateString()}`,
    14,
    y,
  );

  doc.save(`salary-slip-${slip.slipNumber}.pdf`);
}

export default function SalarySlipsPage() {
  const { salarySlips, employees, addSalarySlip, updateSalarySlip } =
    useStore();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [viewSlip, setViewSlip] = useState<SalarySlip | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Generate slip form
  const [genOpen, setGenOpen] = useState(false);
  const [genEmployeeId, setGenEmployeeId] = useState("");
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genPayDate, setGenPayDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [genStatus, setGenStatus] = useState<"Draft" | "Paid">("Draft");

  const filtered = salarySlips
    .filter((s) => {
      const matchSearch =
        s.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        s.slipNumber.toLowerCase().includes(search.toLowerCase());
      const matchMonth =
        monthFilter === "All" || s.month === Number(monthFilter);
      const matchYear = yearFilter === "All" || s.year === Number(yearFilter);
      const matchDept = deptFilter === "All" || s.department === deptFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchMonth && matchYear && matchDept && matchStatus;
    })
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

  const handleGenerate = () => {
    const emp = employees.find((e) => e.id === genEmployeeId);
    if (!emp) {
      toast.error("Select an employee");
      return;
    }
    const periodLabel = `${MONTHS[genMonth - 1]} ${genYear}`;
    const existing = salarySlips.find(
      (s) =>
        s.employeeId === genEmployeeId &&
        s.month === genMonth &&
        s.year === genYear,
    );
    if (existing) {
      toast.error("Salary slip already exists for this period");
      return;
    }
    // Compute allowances from employee.allowances
    const empAllowances = emp.allowances ?? [];
    const count = salarySlips.length + 1;
    const slipAllowances = empAllowances.map((ea) => ({
      name: "Allowance",
      amount: ea.amount,
      taxable: false,
    }));
    const totalAllowances = slipAllowances.reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    const grossSalary = emp.basicSalary + totalAllowances;
    const incomeTax = Math.round(grossSalary * 0.05);
    const pf = Math.round(emp.basicSalary * 0.05);
    const deductions = [
      { name: "Income Tax", amount: incomeTax },
      { name: "Provident Fund", amount: pf },
    ];
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    addSalarySlip({
      slipNumber: `SS-${genYear}-${String(count).padStart(3, "0")}`,
      employeeId: genEmployeeId,
      employeeName: emp.name,
      employeeCode: emp.employeeId,
      designation: emp.designation,
      department: emp.department,
      month: genMonth,
      year: genYear,
      periodLabel,
      basicSalary: emp.basicSalary,
      allowances: slipAllowances,
      grossSalary,
      deductions,
      totalDeductions,
      netSalary: grossSalary - totalDeductions,
      paymentDate: genPayDate,
      bankName: emp.bankName,
      accountNumber: emp.accountNumber,
      status: genStatus,
      generatedAt: new Date().toISOString(),
    });
    toast.success("Salary slip generated");
    setGenOpen(false);
  };

  const deptNames = [...new Set(salarySlips.map((s) => s.department))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Slips</h1>
          <p className="text-gray-600 mt-1">
            Manage and print employee salary slips
          </p>
        </div>
        <Button
          onClick={() => setGenOpen(true)}
          data-ocid="salary_slips.open_modal_button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Slip
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{salarySlips.length}</p>
            <p className="text-sm text-gray-500">Total Slips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">
              {salarySlips.filter((s) => s.status === "Paid").length}
            </p>
            <p className="text-sm text-gray-500">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-yellow-600">
              {salarySlips.filter((s) => s.status === "Draft").length}
            </p>
            <p className="text-sm text-gray-500">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {fmt(salarySlips.reduce((sum, s) => sum + s.netSalary, 0))}
            </p>
            <p className="text-sm text-gray-500">Total Net Paid</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-ocid="salary_slips.tab">
            All Slips
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48"
                  data-ocid="salary_slips.search_input"
                />
              </div>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-36" data-ocid="salary_slips.select">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Months</SelectItem>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Years</SelectItem>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {deptNames.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportExcel(
                  "salary-slips.xlsx",
                  "Salary Slips",
                  [
                    "Slip #",
                    "Employee",
                    "Department",
                    "Designation",
                    "Period",
                    "Basic",
                    "Gross",
                    "Deductions",
                    "Net Pay",
                    "Payment Date",
                    "Status",
                  ],
                  filtered.map((s) => [
                    s.slipNumber,
                    s.employeeName,
                    s.department,
                    s.designation,
                    s.periodLabel,
                    s.basicSalary,
                    s.grossSalary,
                    s.totalDeductions,
                    s.netSalary,
                    s.paymentDate,
                    s.status,
                  ]),
                  {
                    companyName: "BizPOS System",
                    reportTitle: "Salary Slips",
                    generatedBy: currentUser?.name,
                  },
                )
              }
            >
              Excel
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slip #</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Dept / Designation</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-gray-500"
                        data-ocid="salary_slips.empty_state"
                      >
                        No salary slips found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((slip, idx) => (
                      <TableRow
                        key={slip.id}
                        data-ocid={`salary_slips.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {slip.slipNumber}
                        </TableCell>
                        <TableCell>
                          {slip.employeeName}
                          <br />
                          <span className="text-xs text-gray-400">
                            {slip.employeeCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          {slip.department}
                          <br />
                          <span className="text-xs text-gray-500">
                            {slip.designation}
                          </span>
                        </TableCell>
                        <TableCell>{slip.periodLabel}</TableCell>
                        <TableCell>{fmt(slip.basicSalary)}</TableCell>
                        <TableCell>{fmt(slip.grossSalary)}</TableCell>
                        <TableCell className="font-semibold text-blue-700">
                          {fmt(slip.netSalary)}
                        </TableCell>
                        <TableCell>{slip.paymentDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              slip.status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {slip.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setViewSlip(slip);
                                setViewOpen(true);
                              }}
                              data-ocid={`salary_slips.button.${idx + 1}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => printSlipPDF(slip)}
                              data-ocid={`salary_slips.button.${idx + 1}`}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {slip.status === "Draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={() => {
                                  updateSalarySlip(slip.id, { status: "Paid" });
                                  toast.success("Marked as Paid");
                                }}
                                data-ocid={`salary_slips.button.${idx + 1}`}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Salary Slip Viewer Sheet */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Salary Slip</SheetTitle>
          </SheetHeader>
          {viewSlip && (
            <div className="mt-4 space-y-4" data-ocid="salary_slips.panel">
              {/* Header */}
              <div className="text-center bg-blue-600 text-white rounded-lg p-4">
                <h2 className="text-lg font-bold">BizPOS System</h2>
                <p className="text-sm opacity-90">
                  Salary Slip - {viewSlip.periodLabel}
                </p>
                <p className="text-xs opacity-75">
                  Slip No: {viewSlip.slipNumber}
                </p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="text-gray-500">Name</span>
                  <p className="font-medium">{viewSlip.employeeName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Emp Code</span>
                  <p className="font-medium">{viewSlip.employeeCode}</p>
                </div>
                <div>
                  <span className="text-gray-500">Designation</span>
                  <p className="font-medium">{viewSlip.designation}</p>
                </div>
                <div>
                  <span className="text-gray-500">Department</span>
                  <p className="font-medium">{viewSlip.department}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bank</span>
                  <p className="font-medium">{viewSlip.bankName || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Account #</span>
                  <p className="font-medium">{viewSlip.accountNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Payment Date</span>
                  <p className="font-medium">{viewSlip.paymentDate}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <Badge
                    className={
                      viewSlip.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {viewSlip.status}
                  </Badge>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Earnings</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1">Basic Salary</td>
                      <td className="py-1 text-right font-medium">
                        {fmt(viewSlip.basicSalary)}
                      </td>
                    </tr>
                    {viewSlip.allowances.map((a) => (
                      <tr key={a.name} className="border-b">
                        <td className="py-1">
                          {a.name}{" "}
                          {a.taxable ? (
                            <span className="text-xs text-orange-500">
                              (Taxable)
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="py-1 text-right">{fmt(a.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-blue-50">
                      <td className="py-2">Gross Salary</td>
                      <td className="py-2 text-right text-blue-700">
                        {fmt(viewSlip.grossSalary)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Deductions</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {viewSlip.deductions.map((d) => (
                      <tr key={d.name} className="border-b">
                        <td className="py-1">{d.name}</td>
                        <td className="py-1 text-right text-red-600">
                          -{fmt(d.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-red-50">
                      <td className="py-2">Total Deductions</td>
                      <td className="py-2 text-right text-red-700">
                        -{fmt(viewSlip.totalDeductions)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Separator />

              {/* Net Salary */}
              <div className="bg-blue-600 text-white rounded-lg p-4 flex justify-between items-center">
                <span className="font-bold text-lg">Net Salary</span>
                <span className="font-bold text-2xl">
                  {fmt(viewSlip.netSalary)}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => printSlipPDF(viewSlip)}
                data-ocid="salary_slips.button"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print / Save PDF
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Generate Slip Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="salary_slips.dialog"
        >
          <DialogHeader>
            <DialogTitle>Generate Salary Slip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={genEmployeeId} onValueChange={setGenEmployeeId}>
                <SelectTrigger data-ocid="salary_slips.select">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(
                      (e) =>
                        e.status === "Active" &&
                        e.employmentType === "Monthly-Salaried",
                    )
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.employeeId})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Month</Label>
                <Select
                  value={String(genMonth)}
                  onValueChange={(v) => setGenMonth(Number(v))}
                >
                  <SelectTrigger>
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
              <div>
                <Label>Year</Label>
                <Select
                  value={String(genYear)}
                  onValueChange={(v) => setGenYear(Number(v))}
                >
                  <SelectTrigger>
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
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={genPayDate}
                onChange={(e) => setGenPayDate(e.target.value)}
                data-ocid="salary_slips.input"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={genStatus}
                onValueChange={(v) => setGenStatus(v as "Draft" | "Paid")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Save as Draft</SelectItem>
                  <SelectItem value="Paid">Save and Mark Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleGenerate}
                data-ocid="salary_slips.submit_button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGenOpen(false)}
                data-ocid="salary_slips.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

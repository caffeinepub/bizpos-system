import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { exportExcel, exportPDF } from "../utils/exportUtils";

type AttendanceStatus = "present" | "absent" | "half-day" | "not-marked";

interface AttendanceRecord {
  date: string;
  employeeId: string;
  status: AttendanceStatus;
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  status: string;
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  "half-day": "Half Day",
  "not-marked": "Not Marked",
};

function getEmployees(): Employee[] {
  try {
    const data = JSON.parse(localStorage.getItem("bizpos_employees") ?? "[]");
    return Array.isArray(data)
      ? data.filter((e: Employee) => e.status === "Active")
      : [];
  } catch {
    return [];
  }
}

function getAttendance(): AttendanceRecord[] {
  try {
    return JSON.parse(localStorage.getItem("bizpos_attendance") ?? "[]");
  } catch {
    return [];
  }
}

function saveAttendance(records: AttendanceRecord[]) {
  localStorage.setItem("bizpos_attendance", JSON.stringify(records));
}

function seedAttendance(employees: Employee[]) {
  if (employees.length === 0) return;
  const existing = getAttendance();
  if (existing.length > 0) return;
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceStatus[] = [
    "present",
    "present",
    "present",
    "absent",
    "half-day",
  ];
  for (let d = 30; d >= 1; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    for (const emp of employees) {
      records.push({
        date: dateStr,
        employeeId: emp.id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }
  saveAttendance(records);
}

export default function AttendancePage() {
  const { currentUser } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const employees = useMemo(() => {
    const emps = getEmployees();
    seedAttendance(emps);
    return emps;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [monthYear, setMonthYear] = useState(today.slice(0, 7));

  // Daily attendance for selected date
  const [dailyMap, setDailyMap] = useState<Record<string, AttendanceStatus>>(
    () => {
      const recs = getAttendance().filter((r) => r.date === today);
      return Object.fromEntries(recs.map((r) => [r.employeeId, r.status]));
    },
  );

  const loadDay = (date: string) => {
    const recs = getAttendance().filter((r) => r.date === date);
    const map: Record<string, AttendanceStatus> = {};
    for (const r of recs) {
      map[r.employeeId] = r.status;
    }
    setDailyMap(map);
    setSelectedDate(date);
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    loadDay(d.toISOString().split("T")[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    loadDay(d.toISOString().split("T")[0]);
  };

  const setStatus = (empId: string, status: AttendanceStatus) => {
    setDailyMap((prev) => ({ ...prev, [empId]: status }));
  };

  const saveDay = () => {
    const all = getAttendance().filter((r) => r.date !== selectedDate);
    for (const emp of employees) {
      const status = dailyMap[emp.id] ?? "not-marked";
      all.push({ date: selectedDate, employeeId: emp.id, status });
    }
    saveAttendance(all);
    toast.success(`Attendance saved for ${selectedDate}`);
  };

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))],
    [employees],
  );

  const filteredEmployees = employees.filter((e) => {
    const matchDept = filterDept === "all" || e.department === filterDept;
    const status = dailyMap[e.id] ?? "not-marked";
    const matchStatus = filterStatus === "all" || status === filterStatus;
    return matchDept && matchStatus;
  });

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const all = getAttendance();
    return employees.map((emp) => {
      const empRecs = all.filter(
        (r) => r.employeeId === emp.id && r.date.startsWith(monthYear),
      );
      const present = empRecs.filter((r) => r.status === "present").length;
      const absent = empRecs.filter((r) => r.status === "absent").length;
      const halfDay = empRecs.filter((r) => r.status === "half-day").length;
      return { ...emp, present, absent, halfDay, total: empRecs.length };
    });
  }, [employees, monthYear]);

  const filteredMonthly = monthlySummary.filter(
    (e) => filterDept === "all" || e.department === filterDept,
  );

  const handleExportDailyPDF = () => {
    const rows = filteredEmployees.map((e) => [
      e.employeeId,
      e.name,
      e.department,
      e.designation,
      STATUS_LABELS[dailyMap[e.id] ?? "not-marked"],
    ]);
    exportPDF(
      `Daily Attendance - ${selectedDate}`,
      ["Emp ID", "Name", "Department", "Designation", "Status"],
      rows,
      "daily-attendance.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "System",
        filters: [],
      },
    );
  };

  const handleExportDailyExcel = () => {
    const rows = filteredEmployees.map((e) => [
      e.employeeId,
      e.name,
      e.department,
      e.designation,
      STATUS_LABELS[dailyMap[e.id] ?? "not-marked"],
    ]);
    exportExcel(
      "daily-attendance.xlsx",
      "Attendance",
      ["Emp ID", "Name", "Department", "Designation", "Status"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: `Daily Attendance - ${selectedDate}`,
        generatedBy: currentUser?.name ?? "System",
        filters: [],
      },
    );
  };

  const handleExportMonthlyPDF = () => {
    const rows = filteredMonthly.map((e) => [
      e.employeeId,
      e.name,
      e.department,
      String(e.present),
      String(e.absent),
      String(e.halfDay),
      String(e.total),
    ]);
    exportPDF(
      `Monthly Attendance - ${monthYear}`,
      [
        "Emp ID",
        "Name",
        "Department",
        "Present",
        "Absent",
        "Half-Day",
        "Total",
      ],
      rows,
      "monthly-attendance.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "System",
        filters: [],
      },
    );
  };

  const handleExportMonthlyExcel = () => {
    const rows = filteredMonthly.map((e) => [
      e.employeeId,
      e.name,
      e.department,
      e.present,
      e.absent,
      e.halfDay,
      e.total,
    ]);
    exportExcel(
      "monthly-attendance.xlsx",
      "Monthly",
      [
        "Emp ID",
        "Name",
        "Department",
        "Present",
        "Absent",
        "Half-Day",
        "Total",
      ],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: `Monthly Attendance - ${monthYear}`,
        generatedBy: currentUser?.name ?? "System",
        filters: [],
      },
    );
  };

  const dailyPresent = Object.values(dailyMap).filter(
    (s) => s === "present",
  ).length;
  const dailyAbsent = Object.values(dailyMap).filter(
    (s) => s === "absent",
  ).length;
  const dailyHalf = Object.values(dailyMap).filter(
    (s) => s === "half-day",
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Track daily employee attendance</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily" data-ocid="attendance.tab">
            Daily Attendance
          </TabsTrigger>
          <TabsTrigger value="monthly" data-ocid="attendance.tab">
            Monthly Summary
          </TabsTrigger>
        </TabsList>

        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevDay}
                data-ocid="attendance.pagination_prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => loadDay(e.target.value)}
                className="w-44"
                data-ocid="attendance.input"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={nextDay}
                data-ocid="attendance.pagination_next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-44" data-ocid="attendance.select">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="attendance.select">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
                <SelectItem value="not-marked">Not Marked</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDailyPDF}
                data-ocid="attendance.secondary_button"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDailyExcel}
                data-ocid="attendance.secondary_button"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                size="sm"
                onClick={saveDay}
                data-ocid="attendance.save_button"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Attendance
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <p className="text-sm text-green-700">Present</p>
              <p className="text-3xl font-bold text-green-800">
                {dailyPresent}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <p className="text-sm text-red-700">Absent</p>
              <p className="text-3xl font-bold text-red-800">{dailyAbsent}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <p className="text-sm text-yellow-700">Half Day</p>
              <p className="text-3xl font-bold text-yellow-800">{dailyHalf}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Employees ({filteredEmployees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="attendance.empty_state"
                >
                  No active employees found. Add employees first.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emp ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp, i) => {
                      const status: AttendanceStatus =
                        dailyMap[emp.id] ?? "not-marked";
                      return (
                        <TableRow
                          key={emp.id}
                          data-ocid={`attendance.item.${i + 1}`}
                        >
                          <TableCell className="font-mono">
                            {emp.employeeId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {emp.name}
                          </TableCell>
                          <TableCell>{emp.department}</TableCell>
                          <TableCell>{emp.designation}</TableCell>
                          <TableCell>
                            <Select
                              value={status}
                              onValueChange={(v) =>
                                setStatus(emp.id, v as AttendanceStatus)
                              }
                            >
                              <SelectTrigger
                                className="w-36"
                                data-ocid={`attendance.select.${i + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="half-day">
                                  Half Day
                                </SelectItem>
                                <SelectItem value="not-marked">
                                  Not Marked
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Summary Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-44"
              data-ocid="attendance.input"
            />
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-44" data-ocid="attendance.select">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMonthlyPDF}
                data-ocid="attendance.secondary_button"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMonthlyExcel}
                data-ocid="attendance.secondary_button"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Monthly Summary — {monthYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Half Day</TableHead>
                    <TableHead className="text-center">Total Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonthly.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                        data-ocid="attendance.empty_state"
                      >
                        No data for selected month
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMonthly.map((emp, i) => (
                      <TableRow
                        key={emp.id}
                        data-ocid={`attendance.item.${i + 1}`}
                      >
                        <TableCell className="font-mono">
                          {emp.employeeId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.name}
                        </TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">
                            {emp.present}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-red-100 text-red-800">
                            {emp.absent}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {emp.halfDay}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {emp.total}
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
    </div>
  );
}

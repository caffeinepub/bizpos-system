import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AttachmentManager from "../components/AttachmentManager";
import { useAuth } from "../context/AuthContext";
import type { Employee } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

const DEPARTMENTS = [
  "Sales",
  "IT",
  "Accounts",
  "HR",
  "Operations",
  "Management",
  "Warehouse",
];

const TYPE_COLORS: Record<string, string> = {
  "Monthly-Salaried": "bg-blue-100 text-blue-700",
  Hourly: "bg-purple-100 text-purple-700",
  "Daily-Wage": "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Terminated: "bg-red-100 text-red-700",
};

type FormState = Omit<Employee, "id">;

const EMPTY_FORM: FormState = {
  employeeId: "",
  name: "",
  department: "Sales",
  designation: "",
  employmentType: "Monthly-Salaried",
  joinDate: new Date().toISOString().slice(0, 10),
  phone: "",
  email: "",
  bankName: "",
  accountNumber: "",
  basicSalary: 0,
  hourlyRate: 0,
  dailyRate: 0,
  status: "Active",
  nic: "",
  gender: "Male",
  dateOfBirth: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  maritalStatus: "Single",
  notes: "",
};

export default function EmployeesPage() {
  const { currentUser } = useAuth();
  const { employees, addEmployee, updateEmployee, deleteEmployee, addLog } =
    useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const handleExportPDF = () => {
    const rows = employees.map((e) => [
      e.employeeId,
      e.name,
      e.department,
      e.designation,
      e.employmentType,
      e.basicSalary.toLocaleString(),
      e.status,
    ]);
    exportPDF(
      "Employees",
      [
        "ID",
        "Name",
        "Department",
        "Designation",
        "Type",
        "Basic Salary",
        "Status",
      ],
      rows,
      "employees.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          search && { label: "Search", value: search },
          filterType !== "all" && { label: "Type", value: filterType },
          filterStatus !== "all" && { label: "Status", value: filterStatus },
        ].filter(Boolean) as { label: string; value: string }[],
      },
    );
  };

  const handleExportExcel = () => {
    const rows = employees.map((e) => [
      e.employeeId,
      e.name,
      e.department,
      e.designation,
      e.employmentType,
      e.basicSalary,
      e.status,
    ]);
    exportExcel(
      "employees.xlsx",
      "Employees",
      [
        "ID",
        "Name",
        "Department",
        "Designation",
        "Type",
        "Basic Salary",
        "Status",
      ],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Employees",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          search && { label: "Search", value: search },
          filterType !== "all" && { label: "Type", value: filterType },
          filterStatus !== "all" && { label: "Status", value: filterStatus },
        ].filter(Boolean) as { label: string; value: string }[],
      },
    );
  };

  const openAdd = () => {
    setEditing(null);
    const nextNum = employees.length + 1;
    setForm({
      ...EMPTY_FORM,
      employeeId: `EMP${String(nextNum).padStart(3, "0")}`,
      joinDate: new Date().toISOString().slice(0, 10),
    });
    setSheetOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      employmentType: emp.employmentType,
      joinDate: emp.joinDate,
      phone: emp.phone,
      email: emp.email,
      bankName: emp.bankName,
      accountNumber: emp.accountNumber,
      basicSalary: emp.basicSalary,
      hourlyRate: emp.hourlyRate,
      dailyRate: emp.dailyRate,
      status: emp.status,
      nic: emp.nic ?? "",
      gender: emp.gender ?? "Male",
      dateOfBirth: emp.dateOfBirth ?? "",
      address: emp.address ?? "",
      emergencyContactName: emp.emergencyContactName ?? "",
      emergencyContactPhone: emp.emergencyContactPhone ?? "",
      maritalStatus: emp.maritalStatus ?? "Single",
      notes: emp.notes ?? "",
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.employeeId) {
      toast.error("Employee ID and Name are required");
      return;
    }
    if (editing) {
      updateEmployee(editing.id, form);
      addLog("Employees", "update", `Employee updated: ${form.name}`);
      toast.success("Employee updated");
    } else {
      addEmployee(form);
      addLog("Employees", "create", `Employee added: ${form.name}`);
      toast.success("Employee added");
    }
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    addLog("Employees", "delete", "Employee deleted");
    toast.success("Employee deleted");
    setDeleteId(null);
  };

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || e.employmentType === filterType;
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchDept = filterDept === "all" || e.department === filterDept;
    return matchSearch && matchType && matchStatus && matchDept;
  });

  const departments = [...new Set(employees.map((e) => e.department))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <PageHelp pageId="employees" />
          </div>
          <p className="text-gray-600 mt-1">Manage all employee records</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="employees.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="employees.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button onClick={openAdd} data-ocid="employees.open_modal_button">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {employees.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter((e) => e.status === "Active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Monthly Salaried
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                employees.filter((e) => e.employmentType === "Monthly-Salaried")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Hourly / Daily
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {
                employees.filter((e) => e.employmentType !== "Monthly-Salaried")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee List
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name / ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-44"
                  data-ocid="employees.search_input"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40" data-ocid="employees.select">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Monthly-Salaried">
                    Monthly-Salaried
                  </SelectItem>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Daily-Wage">Daily-Wage</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate/Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow data-ocid="employees.empty_state">
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-400 py-8"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((emp, idx) => (
                <TableRow key={emp.id} data-ocid={`employees.item.${idx + 1}`}>
                  <TableCell className="font-mono text-sm">
                    {emp.employeeId}
                  </TableCell>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {emp.designation}
                  </TableCell>
                  <TableCell>
                    <Badge className={TYPE_COLORS[emp.employmentType]}>
                      {emp.employmentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {emp.employmentType === "Monthly-Salaried" &&
                      `${emp.basicSalary.toLocaleString()}/mo`}
                    {emp.employmentType === "Hourly" && `${emp.hourlyRate}/hr`}
                    {emp.employmentType === "Daily-Wage" &&
                      `${emp.dailyRate}/day`}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[emp.status]}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(emp)}
                        data-ocid={`employees.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => setDeleteId(emp.id)}
                        data-ocid={`employees.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="w-full sm:max-w-2xl overflow-y-auto"
          data-ocid="employees.sheet"
        >
          <SheetHeader>
            <SheetTitle>
              {editing ? "Edit Employee" : "Add Employee"}
            </SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="compensation">
                Compensation & Bank
              </TabsTrigger>
              {editing && (
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              )}
            </TabsList>

            {/* Tab 1: General */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Employee ID *</Label>
                  <Input
                    value={form.employeeId}
                    onChange={(e) =>
                      setForm({ ...form, employeeId: e.target.value })
                    }
                    data-ocid="employees.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={form.department}
                    onValueChange={(v) => setForm({ ...form, department: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Input
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type</Label>
                  <Select
                    value={form.employmentType}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        employmentType: v as Employee["employmentType"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly-Salaried">
                        Monthly-Salaried
                      </SelectItem>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                      <SelectItem value="Daily-Wage">Daily-Wage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Join Date</Label>
                  <Input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) =>
                      setForm({ ...form, joinDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as Employee["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Personal Info */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>NIC / ID Number</Label>
                  <Input
                    value={form.nic}
                    onChange={(e) => setForm({ ...form, nic: e.target.value })}
                    placeholder="35201-1234567-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) =>
                      setForm({ ...form, gender: v as Employee["gender"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Marital Status</Label>
                  <Select
                    value={form.maritalStatus}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        maritalStatus: v as Employee["maritalStatus"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    rows={2}
                    data-ocid="employees.textarea"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) =>
                      setForm({ ...form, emergencyContactName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Compensation & Bank */}
            <TabsContent value="compensation" className="space-y-4">
              <div className="space-y-3">
                {form.employmentType === "Monthly-Salaried" && (
                  <div className="space-y-1.5">
                    <Label>Basic Salary (Monthly)</Label>
                    <Input
                      type="number"
                      value={form.basicSalary}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          basicSalary: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                {form.employmentType === "Hourly" && (
                  <div className="space-y-1.5">
                    <Label>Hourly Rate</Label>
                    <Input
                      type="number"
                      value={form.hourlyRate}
                      onChange={(e) =>
                        setForm({ ...form, hourlyRate: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
                {form.employmentType === "Daily-Wage" && (
                  <div className="space-y-1.5">
                    <Label>Daily Rate</Label>
                    <Input
                      type="number"
                      value={form.dailyRate}
                      onChange={(e) =>
                        setForm({ ...form, dailyRate: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bank Name</Label>
                    <Input
                      value={form.bankName}
                      onChange={(e) =>
                        setForm({ ...form, bankName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Number</Label>
                    <Input
                      value={form.accountNumber}
                      onChange={(e) =>
                        setForm({ ...form, accountNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            {editing && (
              <TabsContent value="attachments">
                <AttachmentManager
                  moduleKey="employees"
                  recordId={editing.id}
                />
              </TabsContent>
            )}
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleSave}
              className="flex-1"
              data-ocid="employees.submit_button"
            >
              {editing ? "Update" : "Add"} Employee
            </Button>
            <Button
              variant="outline"
              onClick={() => setSheetOpen(false)}
              data-ocid="employees.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="employees.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

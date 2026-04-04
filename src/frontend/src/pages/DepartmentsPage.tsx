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
import { Textarea } from "@/components/ui/textarea";
import { Building2, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { Department } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

type FormState = Omit<Department, "id">;

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  headOfDepartment: "",
  status: "Active",
  createdAt: new Date().toISOString(),
};

export default function DepartmentsPage() {
  const {
    departments,
    employees,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = departments.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = departments.filter((d) => d.status === "Active").length;
  const inactive = departments.filter((d) => d.status === "Inactive").length;

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, createdAt: new Date().toISOString() });
    setSheetOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingId(dept.id);
    setForm({
      code: dept.code,
      name: dept.name,
      description: dept.description,
      headOfDepartment: dept.headOfDepartment,
      status: dept.status,
      createdAt: dept.createdAt,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      toast.error("Code and Name are required");
      return;
    }
    if (editingId) {
      updateDepartment(editingId, form);
      toast.success("Department updated");
    } else {
      addDepartment(form);
      toast.success("Department added");
    }
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    const hasEmployees = employees.some(
      (e) => e.department === departments.find((d) => d.id === id)?.name,
    );
    if (hasEmployees) {
      toast.error("Cannot delete department with assigned employees");
      setDeleteId(null);
      return;
    }
    deleteDepartment(id);
    toast.success("Department deleted");
    setDeleteId(null);
  };

  const handleExcelExport = () => {
    exportExcel(
      "departments.xlsx",
      "Departments",
      ["Code", "Name", "Head of Department", "Status", "Description"],
      filtered.map((d) => [
        d.code,
        d.name,
        d.headOfDepartment,
        d.status,
        d.description,
      ]),
      {
        companyName: "BizPOS System",
        reportTitle: "Departments Report",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handlePdfExport = () => {
    exportPDF(
      "Departments",
      ["Code", "Name", "Head of Department", "Status"],
      filtered.map((d) => [d.code, d.name, d.headOfDepartment, d.status]),
      "departments.pdf",
      {
        companyName: "BizPOS System",
        reportTitle: "Departments Report",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
            <PageHelp pageId="departments" />
          </div>
          <p className="text-gray-600 mt-1">Manage company departments</p>
        </div>
        <Button onClick={openAdd} data-ocid="departments.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-sm text-gray-500">Total Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-bold text-sm">
                  {active}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold">{active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-700 font-bold text-sm">
                  {inactive}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold">{inactive}</p>
                <p className="text-sm text-gray-500">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search departments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-56"
                  data-ocid="departments.search_input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-ocid="departments.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExcelExport}>
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePdfExport}>
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Head of Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                    data-ocid="departments.empty_state"
                  >
                    No departments found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((dept, idx) => (
                  <TableRow
                    key={dept.id}
                    data-ocid={`departments.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{dept.code}</TableCell>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.headOfDepartment}</TableCell>
                    <TableCell className="text-gray-500 max-w-xs truncate">
                      {dept.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          dept.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }
                        onClick={() =>
                          updateDepartment(dept.id, {
                            status:
                              dept.status === "Active" ? "Inactive" : "Active",
                          })
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {dept.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(dept)}
                          data-ocid={`departments.edit_button.${idx + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => setDeleteId(dept.id)}
                          data-ocid={`departments.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Edit Department" : "Add Department"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="DEPT-SALES"
                data-ocid="departments.input"
              />
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Sales"
              />
            </div>
            <div>
              <Label>Head of Department</Label>
              <Input
                value={form.headOfDepartment}
                onChange={(e) =>
                  setForm((p) => ({ ...p, headOfDepartment: e.target.value }))
                }
                placeholder="Manager name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Department description"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as "Active" | "Inactive" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                data-ocid="departments.save_button"
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                data-ocid="departments.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="departments.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="departments.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="departments.confirm_button"
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

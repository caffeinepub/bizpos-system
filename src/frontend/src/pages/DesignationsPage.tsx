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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Award, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { Designation } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

type FormState = Omit<Designation, "id">;

const EMPTY_FORM: FormState = {
  code: "",
  title: "",
  departmentId: "",
  grade: "",
  description: "",
  status: "Active",
};

export default function DesignationsPage() {
  const {
    designations,
    departments,
    employees,
    addDesignation,
    updateDesignation,
    deleteDesignation,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = designations.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || d.departmentId === deptFilter;
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (desig: Designation) => {
    setEditingId(desig.id);
    setForm({
      code: desig.code,
      title: desig.title,
      departmentId: desig.departmentId,
      grade: desig.grade,
      description: desig.description,
      status: desig.status,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.title) {
      toast.error("Code and Title are required");
      return;
    }
    if (editingId) {
      updateDesignation(editingId, form);
      toast.success("Designation updated");
    } else {
      addDesignation(form);
      toast.success("Designation added");
    }
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    const desig = designations.find((d) => d.id === id);
    const hasEmployees = employees.some((e) => e.designation === desig?.title);
    if (hasEmployees) {
      toast.error("Cannot delete designation with assigned employees");
      setDeleteId(null);
      return;
    }
    deleteDesignation(id);
    toast.success("Designation deleted");
    setDeleteId(null);
  };

  const getDeptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? id;

  const handleExcelExport = () => {
    exportExcel(
      "designations.xlsx",
      "Designations",
      ["Code", "Title", "Department", "Grade", "Status"],
      filtered.map((d) => [
        d.code,
        d.title,
        getDeptName(d.departmentId),
        d.grade,
        d.status,
      ]),
      {
        companyName: "BizPOS System",
        reportTitle: "Designations Report",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handlePdfExport = () => {
    exportPDF(
      "Designations",
      ["Code", "Title", "Department", "Grade", "Status"],
      filtered.map((d) => [
        d.code,
        d.title,
        getDeptName(d.departmentId),
        d.grade,
        d.status,
      ]),
      "designations.pdf",
      {
        companyName: "BizPOS System",
        reportTitle: "Designations Report",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Designations</h1>
          <p className="text-gray-600 mt-1">Manage employee designations</p>
        </div>
        <Button onClick={openAdd} data-ocid="designations.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Designation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search designations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-52"
                  data-ocid="designations.search_input"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-44" data-ocid="designations.select">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
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
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Grade</TableHead>
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
                    data-ocid="designations.empty_state"
                  >
                    No designations found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((desig, idx) => (
                  <TableRow
                    key={desig.id}
                    data-ocid={`designations.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{desig.code}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      {desig.title}
                    </TableCell>
                    <TableCell>{getDeptName(desig.departmentId)}</TableCell>
                    <TableCell>{desig.grade}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          desig.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }
                        onClick={() =>
                          updateDesignation(desig.id, {
                            status:
                              desig.status === "Active" ? "Inactive" : "Active",
                          })
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {desig.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(desig)}
                          data-ocid={`designations.edit_button.${idx + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => setDeleteId(desig.id)}
                          data-ocid={`designations.delete_button.${idx + 1}`}
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
              {editingId ? "Edit Designation" : "Add Designation"}
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
                placeholder="SM"
                data-ocid="designations.input"
              />
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Sales Manager"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, departmentId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade</Label>
              <Input
                value={form.grade}
                onChange={(e) =>
                  setForm((p) => ({ ...p, grade: e.target.value }))
                }
                placeholder="Grade-A"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
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
                data-ocid="designations.save_button"
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                data-ocid="designations.cancel_button"
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
        <AlertDialogContent data-ocid="designations.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Designation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="designations.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="designations.confirm_button"
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

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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { AllowanceType } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

type FormState = Omit<AllowanceType, "id">;

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  calculationType: "Fixed",
  defaultValue: 0,
  taxable: false,
  status: "Active",
};

export default function AllowanceTypesPage() {
  const {
    allowanceTypes,
    addAllowanceType,
    updateAllowanceType,
    deleteAllowanceType,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = allowanceTypes.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (a: AllowanceType) => {
    setEditingId(a.id);
    setForm({
      code: a.code,
      name: a.name,
      calculationType: a.calculationType,
      defaultValue: a.defaultValue,
      taxable: a.taxable,
      status: a.status,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      toast.error("Code and Name are required");
      return;
    }
    if (editingId) {
      updateAllowanceType(editingId, form);
      toast.success("Allowance type updated");
    } else {
      addAllowanceType(form);
      toast.success("Allowance type added");
    }
    setSheetOpen(false);
  };

  const handleExcelExport = () => {
    exportExcel(
      "allowance-types.xlsx",
      "Allowance Types",
      ["Code", "Name", "Type", "Default Value", "Taxable", "Status"],
      filtered.map((a) => [
        a.code,
        a.name,
        a.calculationType,
        a.defaultValue,
        a.taxable ? "Yes" : "No",
        a.status,
      ]),
      {
        companyName: "BizPOS System",
        reportTitle: "Allowance Types",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handlePdfExport = () => {
    exportPDF(
      "Allowance Types",
      ["Code", "Name", "Type", "Default Value", "Taxable", "Status"],
      filtered.map((a) => [
        a.code,
        a.name,
        a.calculationType,
        a.defaultValue,
        a.taxable ? "Yes" : "No",
        a.status,
      ]),
      "allowance-types.pdf",
      {
        companyName: "BizPOS System",
        reportTitle: "Allowance Types",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Allowance Types</h1>
          <p className="text-gray-600 mt-1">Manage employee allowance types</p>
        </div>
        <Button onClick={openAdd} data-ocid="allowance_types.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Allowance Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-52"
                  data-ocid="allowance_types.search_input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-32"
                  data-ocid="allowance_types.select"
                >
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
                <TableHead>Calculation Type</TableHead>
                <TableHead>Default Value</TableHead>
                <TableHead>Taxable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                    data-ocid="allowance_types.empty_state"
                  >
                    No allowance types found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a, idx) => (
                  <TableRow
                    key={a.id}
                    data-ocid={`allowance_types.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          a.calculationType === "Fixed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }
                      >
                        {a.calculationType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.calculationType === "Percentage"
                        ? `${a.defaultValue}%`
                        : `PKR ${a.defaultValue.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          a.taxable
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {a.taxable ? "Taxable" : "Non-Taxable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          a.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }
                        onClick={() =>
                          updateAllowanceType(a.id, {
                            status:
                              a.status === "Active" ? "Inactive" : "Active",
                          })
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(a)}
                          data-ocid={`allowance_types.edit_button.${idx + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => setDeleteId(a.id)}
                          data-ocid={`allowance_types.delete_button.${idx + 1}`}
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
              {editingId ? "Edit Allowance Type" : "Add Allowance Type"}
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
                placeholder="HRA"
                data-ocid="allowance_types.input"
              />
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="House Rent Allowance"
              />
            </div>
            <div>
              <Label>Calculation Type</Label>
              <Select
                value={form.calculationType}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    calculationType: v as "Fixed" | "Percentage",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed Amount</SelectItem>
                  <SelectItem value="Percentage">
                    Percentage of Basic
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {form.calculationType === "Percentage"
                  ? "Default Percentage (%)"
                  : "Default Amount (PKR)"}
              </Label>
              <Input
                type="number"
                value={form.defaultValue}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    defaultValue: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="taxable"
                checked={form.taxable}
                onCheckedChange={(c) =>
                  setForm((p) => ({ ...p, taxable: !!c }))
                }
                data-ocid="allowance_types.checkbox"
              />
              <Label htmlFor="taxable">Taxable</Label>
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
                data-ocid="allowance_types.save_button"
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                data-ocid="allowance_types.cancel_button"
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
        <AlertDialogContent data-ocid="allowance_types.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Allowance Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="allowance_types.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteId && deleteAllowanceType(deleteId);
                toast.success("Deleted");
                setDeleteId(null);
              }}
              data-ocid="allowance_types.confirm_button"
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

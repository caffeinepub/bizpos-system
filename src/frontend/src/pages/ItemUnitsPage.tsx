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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Ruler, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { ItemUnit } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

export default function ItemUnitsPage() {
  const { itemUnits, items, addItemUnit, updateItemUnit, deleteItemUnit } =
    useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<ItemUnit | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    abbreviation: "",
    isBaseUnit: false,
    conversionFactor: "1",
    status: "active" as "active" | "inactive",
  });

  const filtered = itemUnits.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase()) ||
      u.abbreviation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const suggestCode = () => {
    const max = itemUnits.reduce((acc, u) => {
      const num = Number.parseInt(u.code.replace(/\D/g, "") || "0");
      return Math.max(acc, num);
    }, 0);
    return `UOM-${String(max + 1).padStart(3, "0")}`;
  };

  const openAdd = () => {
    setEditingUnit(null);
    setForm({
      code: suggestCode(),
      name: "",
      abbreviation: "",
      isBaseUnit: false,
      conversionFactor: "1",
      status: "active",
    });
    setDialogOpen(true);
  };

  const openEdit = (unit: ItemUnit) => {
    setEditingUnit(unit);
    setForm({
      code: unit.code,
      name: unit.name,
      abbreviation: unit.abbreviation,
      isBaseUnit: unit.isBaseUnit,
      conversionFactor: unit.conversionFactor.toString(),
      status: unit.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim() || !form.abbreviation.trim()) {
      toast.error("Code, Name and Abbreviation are required");
      return;
    }
    const isDuplicate = itemUnits.some(
      (u) => u.code === form.code.trim() && u.id !== editingUnit?.id,
    );
    if (isDuplicate) {
      toast.error("Unit code already exists");
      return;
    }
    const data: Omit<ItemUnit, "id"> = {
      code: form.code.trim(),
      name: form.name.trim(),
      abbreviation: form.abbreviation.trim(),
      isBaseUnit: form.isBaseUnit,
      conversionFactor: Number.parseFloat(form.conversionFactor) || 1,
      status: form.status,
    };
    if (editingUnit) {
      updateItemUnit(editingUnit.id, data);
      toast.success("Unit updated");
    } else {
      addItemUnit(data);
      toast.success("Unit created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const inUse = items.some((i) => i.unitId === id);
    if (inUse) {
      toast.error("Cannot delete: unit is used by one or more items");
      setDeleteId(null);
      return;
    }
    deleteItemUnit(id);
    toast.success("Unit deleted");
    setDeleteId(null);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((u) => [
      u.code,
      u.name,
      u.abbreviation,
      u.isBaseUnit ? "Yes" : "No",
      u.conversionFactor.toString(),
      u.status,
    ]);
    exportPDF(
      "Units of Measure",
      [
        "Code",
        "Name",
        "Abbreviation",
        "Base Unit",
        "Conversion Factor",
        "Status",
      ],
      rows,
      "item-units.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Units of Measure",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((u) => [
      u.code,
      u.name,
      u.abbreviation,
      u.isBaseUnit ? "Yes" : "No",
      u.conversionFactor,
      u.status,
    ]);
    exportExcel(
      "item-units.xlsx",
      "Units",
      [
        "Code",
        "Name",
        "Abbreviation",
        "Base Unit",
        "Conversion Factor",
        "Status",
      ],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Units of Measure",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ruler className="h-6 w-6 text-blue-600" />
            Units of Measure
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage units of measure (pcs, kg, L, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            Excel
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            data-ocid="item_units.primary_button"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Unit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by name, code or abbreviation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="item_units.search_input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="item_units.select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="item_units.table">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>Base Unit</TableHead>
                <TableHead>Conversion Factor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="item_units.empty_state"
                  >
                    No units found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((unit, i) => (
                  <TableRow
                    key={unit.id}
                    data-ocid={`item_units.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {unit.code}
                    </TableCell>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {unit.abbreviation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {unit.isBaseUnit ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Base
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {unit.conversionFactor === 1
                        ? "1 (base)"
                        : unit.conversionFactor}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          unit.status === "active" ? "default" : "secondary"
                        }
                        className={
                          unit.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {unit.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(unit)}
                          data-ocid={`item_units.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(unit.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`item_units.delete_button.${i + 1}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-lg"
          data-ocid="item_units.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Unit" : "Add Unit of Measure"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="UOM-001"
                  data-ocid="item_units.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Piece"
                  data-ocid="item_units.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Abbreviation *</Label>
                <Input
                  value={form.abbreviation}
                  onChange={(e) =>
                    setForm({ ...form, abbreviation: e.target.value })
                  }
                  placeholder="e.g. pcs"
                  data-ocid="item_units.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Conversion Factor</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.conversionFactor}
                  onChange={(e) =>
                    setForm({ ...form, conversionFactor: e.target.value })
                  }
                  placeholder="1"
                  data-ocid="item_units.input"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="isBaseUnit"
                checked={form.isBaseUnit}
                onCheckedChange={(v) => setForm({ ...form, isBaseUnit: !!v })}
                data-ocid="item_units.checkbox"
              />
              <Label htmlFor="isBaseUnit" className="cursor-pointer">
                This is a base unit (conversion factor = 1)
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "active" | "inactive" })
                }
              >
                <SelectTrigger data-ocid="item_units.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="item_units.save_button">
                {editingUnit ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this unit? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="item_units.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteId!)}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="item_units.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

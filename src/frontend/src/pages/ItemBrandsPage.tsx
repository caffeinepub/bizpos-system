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
import { Edit, Plus, Search, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { ItemBrand } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

export default function ItemBrandsPage() {
  const { itemBrands, items, addItemBrand, updateItemBrand, deleteItemBrand } =
    useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<ItemBrand | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  const filtered = itemBrands.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const suggestCode = () => {
    const max = itemBrands.reduce((acc, b) => {
      const num = Number.parseInt(b.code.replace(/\D/g, "") || "0");
      return Math.max(acc, num);
    }, 0);
    return `BRD-${String(max + 1).padStart(3, "0")}`;
  };

  const openAdd = () => {
    setEditingBrand(null);
    setForm({
      code: suggestCode(),
      name: "",
      description: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const openEdit = (brand: ItemBrand) => {
    setEditingBrand(brand);
    setForm({
      code: brand.code,
      name: brand.name,
      description: brand.description || "",
      status: brand.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    const isDuplicate = itemBrands.some(
      (b) => b.code === form.code.trim() && b.id !== editingBrand?.id,
    );
    if (isDuplicate) {
      toast.error("Brand code already exists");
      return;
    }
    const data: Omit<ItemBrand, "id"> = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    };
    if (editingBrand) {
      updateItemBrand(editingBrand.id, data);
      toast.success("Brand updated");
    } else {
      addItemBrand(data);
      toast.success("Brand created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const inUse = items.some((i) => i.brandId === id);
    if (inUse) {
      toast.error("Cannot delete: brand is used by one or more items");
      setDeleteId(null);
      return;
    }
    deleteItemBrand(id);
    toast.success("Brand deleted");
    setDeleteId(null);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((b) => [
      b.code,
      b.name,
      b.description || "",
      b.status,
    ]);
    exportPDF(
      "Item Brands",
      ["Code", "Name", "Description", "Status"],
      rows,
      "item-brands.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Item Brands",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((b) => [
      b.code,
      b.name,
      b.description || "",
      b.status,
    ]);
    exportExcel(
      "item-brands.xlsx",
      "Brands",
      ["Code", "Name", "Description", "Status"],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Item Brands",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-blue-600" />
            Item Brands
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product brands and manufacturers
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
            data-ocid="item_brands.primary_button"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Brand
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
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="item_brands.search_input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="item_brands.select">
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
          <Table data-ocid="item_brands.table">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="item_brands.empty_state"
                  >
                    No brands found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((brand, i) => (
                  <TableRow
                    key={brand.id}
                    data-ocid={`item_brands.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {brand.code}
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                      {brand.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          brand.status === "active" ? "default" : "secondary"
                        }
                        className={
                          brand.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {brand.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(brand)}
                          data-ocid={`item_brands.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(brand.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`item_brands.delete_button.${i + 1}`}
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
          data-ocid="item_brands.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Edit Brand" : "Add Brand"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="BRD-001"
                  data-ocid="item_brands.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Samsung"
                  data-ocid="item_brands.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                data-ocid="item_brands.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "active" | "inactive" })
                }
              >
                <SelectTrigger data-ocid="item_brands.select">
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
              <Button onClick={handleSave} data-ocid="item_brands.save_button">
                {editingBrand ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this brand? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="item_brands.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteId!)}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="item_brands.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

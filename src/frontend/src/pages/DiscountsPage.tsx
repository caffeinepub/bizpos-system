import PageHelp from "@/components/PageHelp";
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
  DialogFooter,
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
import {
  Edit,
  FileDown,
  FileText,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { Discount } from "../store/useStore";

import {
  exportExcel as exportExcelUtil,
  exportPDF as exportPDFUtil,
} from "../utils/exportUtils";

const EMPTY_FORM = {
  name: "",
  percentage: "",
  applicableTo: "all" as Discount["applicableTo"],
  categories: "",
  productIds: [] as string[],
  status: "Active" as Discount["status"],
};

export default function DiscountsPage() {
  const { discounts, items, addDiscount, updateDiscount, deleteDiscount } =
    useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = discounts.filter((d) => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase());
    const mst = filterStatus === "all" || d.status === filterStatus;
    return ms && mst;
  });

  const totalActive = discounts.filter((d) => d.status === "Active").length;
  const avgPct = discounts.length
    ? discounts.reduce((s, d) => s + d.percentage, 0) / discounts.length
    : 0;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };
  const openEdit = (d: Discount) => {
    setEditing(d);
    setForm({
      name: d.name,
      percentage: d.percentage.toString(),
      applicableTo: d.applicableTo,
      categories: d.categories.join(", "),
      productIds: d.productIds,
      status: d.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.percentage) {
      toast.error("Name and Percentage are required");
      return;
    }
    const data: Omit<Discount, "id"> = {
      name: form.name,
      percentage: Number.parseFloat(form.percentage) || 0,
      applicableTo: form.applicableTo,
      categories: form.categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      productIds: form.productIds,
      status: form.status,
    };
    if (editing) {
      updateDiscount(editing.id, data);
      toast.success("Discount updated");
    } else {
      addDiscount(data);
      toast.success("Discount created");
    }
    setDialogOpen(false);
  };

  const toggleProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((p) => p !== id)
        : [...prev.productIds, id],
    }));
  };

  const exportExcel = () => {
    exportExcelUtil(
      "discounts.xlsx",
      "Discounts",
      ["Name", "Discount (%)", "Applies To", "Categories", "Status"],
      filtered.map((d) => [
        d.name,
        `${d.percentage}%`,
        d.applicableTo,
        d.categories.join(", ") || "-",
        d.status,
      ]),
      { reportTitle: "Discounts", generatedBy: currentUser?.name },
    );
  };

  const exportPDF = () => {
    exportPDFUtil(
      "Discounts Report",
      ["Name", "Discount (%)", "Applies To", "Categories", "Status"],
      filtered.map((d) => [
        d.name,
        `${d.percentage}%`,
        d.applicableTo,
        d.categories.join(", ") || "-",
        d.status,
      ]),
      "discounts.pdf",
      { generatedBy: currentUser?.name },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Discounts</h1>
            <PageHelp pageId="discounts" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage product and category discounts
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="discounts.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Discount
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Discounts</p>
                <p className="text-2xl font-bold">{discounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalActive}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg. Discount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {avgPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discounts..."
                className="pl-9"
                data-ocid="discounts.search_input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="discounts.select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              data-ocid="discounts.button"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              data-ocid="discounts.button"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table data-ocid="discounts.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Discount (%)</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Categories / Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="discounts.empty_state"
                  >
                    No discounts found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d, i) => (
                  <TableRow key={d.id} data-ocid={`discounts.item.${i + 1}`}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-green-700 font-semibold">
                        {d.percentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {d.applicableTo === "all"
                          ? "All Products"
                          : d.applicableTo === "category"
                            ? "Category"
                            : "Product"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {d.applicableTo === "category" &&
                      d.categories.length > 0 ? (
                        d.categories.join(", ")
                      ) : d.applicableTo === "product" &&
                        d.productIds.length > 0 ? (
                        `${d.productIds.length} product(s)`
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(d)}
                          data-ocid={`discounts.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(d.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`discounts.delete_button.${i + 1}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
          data-ocid="discounts.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Discount" : "Add Discount"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Bulk Discount"
                  data-ocid="discounts.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Percentage (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.percentage}
                  onChange={(e) =>
                    setForm({ ...form, percentage: e.target.value })
                  }
                  placeholder="10"
                  data-ocid="discounts.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select
                value={form.applicableTo}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    applicableTo: v as Discount["applicableTo"],
                  })
                }
              >
                <SelectTrigger data-ocid="discounts.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="category">Specific Categories</SelectItem>
                  <SelectItem value="product">Specific Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.applicableTo === "category" && (
              <div className="space-y-2">
                <Label>Categories (comma-separated)</Label>
                <Input
                  value={form.categories}
                  onChange={(e) =>
                    setForm({ ...form, categories: e.target.value })
                  }
                  placeholder="Electronics, Food"
                  data-ocid="discounts.input"
                />
              </div>
            )}
            {form.applicableTo === "product" && (
              <div className="space-y-2">
                <Label>Select Products</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.productIds.includes(item.id)}
                        onCheckedChange={() => toggleProduct(item.id)}
                        id={`disc-product-${item.id}`}
                      />
                      <label
                        htmlFor={`disc-product-${item.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {item.name}{" "}
                        <span className="text-gray-400 font-mono text-xs">
                          {item.sku}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as Discount["status"] })
                }
              >
                <SelectTrigger className="w-32" data-ocid="discounts.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="discounts.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="discounts.save_button">
              {editing ? "Update" : "Add"} Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="discounts.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteDiscount(deleteId!);
                setDeleteId(null);
                toast.success("Discount deleted");
              }}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="discounts.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

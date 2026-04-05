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
import { MultiSelect } from "@/components/ui/multi-select";
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
  CalendarRange,
  Edit,
  FileDown,
  FileText,
  Gift,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { Promotion } from "../store/useStore";

import {
  exportExcel as exportExcelUtil,
  exportPDF as exportPDFUtil,
} from "../utils/exportUtils";

function getPromoStatus(
  p: Promotion,
): "Active" | "Upcoming" | "Expired" | "Inactive" {
  if (p.status === "Inactive") return "Inactive";
  const today = new Date().toISOString().slice(0, 10);
  if (today < p.startDate) return "Upcoming";
  if (today > p.endDate) return "Expired";
  return "Active";
}

function statusBadge(status: ReturnType<typeof getPromoStatus>) {
  const map: Record<string, string> = {
    Active: "bg-green-100 text-green-700 border-green-200",
    Upcoming: "bg-blue-100 text-blue-700 border-blue-200",
    Expired: "bg-gray-100 text-gray-500 border-gray-200",
    Inactive: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}
    >
      {status}
    </span>
  );
}

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(ms / 86400000));
}

const EMPTY_FORM = {
  name: "",
  discountPercentage: "",
  startDate: "",
  endDate: "",
  applicableTo: "all" as Promotion["applicableTo"],
  categoryIds: [] as string[],
  productIds: [] as string[],
  status: "Active" as Promotion["status"],
};

export default function PromotionsPage() {
  const {
    promotions,
    items,
    itemCategories,
    addPromotion,
    updatePromotion,
    deletePromotion,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = promotions.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const computedStatus = getPromoStatus(p);
    const mst =
      filterStatus === "all" ||
      computedStatus === filterStatus ||
      p.status === filterStatus;
    return ms && mst;
  });

  const countByStatus = (s: string) =>
    promotions.filter((p) => getPromoStatus(p) === s).length;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    const matchedIds = p.categories
      .map((cName) => {
        const found = itemCategories.find(
          (ic) => ic.name === cName || ic.id === cName,
        );
        return found ? found.id : null;
      })
      .filter(Boolean) as string[];
    setForm({
      name: p.name,
      discountPercentage: p.discountPercentage.toString(),
      startDate: p.startDate,
      endDate: p.endDate,
      applicableTo: p.applicableTo,
      categoryIds: matchedIds,
      productIds: p.productIds,
      status: p.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (
      !form.name ||
      !form.discountPercentage ||
      !form.startDate ||
      !form.endDate
    ) {
      toast.error("All required fields must be filled");
      return;
    }
    if (form.startDate > form.endDate) {
      toast.error("Start date must be before end date");
      return;
    }
    const categoryNames = form.categoryIds
      .map((id) => itemCategories.find((ic) => ic.id === id)?.name)
      .filter(Boolean) as string[];
    const data: Omit<Promotion, "id"> = {
      name: form.name,
      discountPercentage: Number.parseFloat(form.discountPercentage) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      applicableTo: form.applicableTo,
      categories: categoryNames,
      productIds: form.productIds,
      status: form.status,
    };
    if (editing) {
      updatePromotion(editing.id, data);
      toast.success("Promotion updated");
    } else {
      addPromotion(data);
      toast.success("Promotion created");
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
      "promotions.xlsx",
      "Promotions",
      [
        "Name",
        "Discount (%)",
        "Start Date",
        "End Date",
        "Duration",
        "Applies To",
        "Status",
      ],
      filtered.map((p) => [
        p.name,
        `${p.discountPercentage}%`,
        p.startDate,
        p.endDate,
        `${daysBetween(p.startDate, p.endDate)} days`,
        p.applicableTo,
        getPromoStatus(p),
      ]),
      { reportTitle: "Promotions", generatedBy: currentUser?.name },
    );
  };

  const exportPDF = () => {
    exportPDFUtil(
      "Promotions Report",
      ["Name", "Discount", "Start", "End", "Duration", "Status"],
      filtered.map((p) => [
        p.name,
        `${p.discountPercentage}%`,
        p.startDate,
        p.endDate,
        `${daysBetween(p.startDate, p.endDate)}d`,
        getPromoStatus(p),
      ]),
      "promotions.pdf",
      { generatedBy: currentUser?.name },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
            <PageHelp pageId="promotions" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage date-range based promotional discounts
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="promotions.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{promotions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {countByStatus("Active")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CalendarRange className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-500">
                  {countByStatus("Upcoming")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CalendarRange className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-400">
                  {countByStatus("Expired")}
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
                placeholder="Search promotions..."
                className="pl-9"
                data-ocid="promotions.search_input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="promotions.select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              data-ocid="promotions.button"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              data-ocid="promotions.button"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table data-ocid="promotions.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="promotions.empty_state"
                  >
                    No promotions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => (
                  <TableRow key={p.id} data-ocid={`promotions.item.${i + 1}`}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-green-700 font-semibold">
                        {p.discountPercentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{p.startDate}</TableCell>
                    <TableCell className="text-sm">{p.endDate}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {daysBetween(p.startDate, p.endDate)} days
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p.applicableTo === "all"
                          ? "All"
                          : p.applicableTo === "category"
                            ? "Category"
                            : "Product"}
                      </Badge>
                    </TableCell>
                    <TableCell>{statusBadge(getPromoStatus(p))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                          data-ocid={`promotions.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(p.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`promotions.delete_button.${i + 1}`}
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
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="promotions.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Promotion" : "Add Promotion"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Sale"
                  data-ocid="promotions.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.discountPercentage}
                  onChange={(e) =>
                    setForm({ ...form, discountPercentage: e.target.value })
                  }
                  placeholder="15"
                  data-ocid="promotions.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  data-ocid="promotions.input"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  data-ocid="promotions.input"
                />
              </div>
            </div>
            {form.startDate &&
              form.endDate &&
              form.startDate <= form.endDate && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded px-3 py-1.5">
                  Duration: {daysBetween(form.startDate, form.endDate)} days
                </p>
              )}
            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select
                value={form.applicableTo}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    applicableTo: v as Promotion["applicableTo"],
                    categoryIds: [],
                    productIds: [],
                  })
                }
              >
                <SelectTrigger data-ocid="promotions.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="category">Specific Categories</SelectItem>
                  <SelectItem value="product">Specific Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category multi-select */}
            {form.applicableTo === "category" && (
              <div className="space-y-2">
                <Label>Categories</Label>
                <p className="text-xs text-muted-foreground">
                  Search and select one or more categories this promotion
                  applies to.
                </p>
                <MultiSelect
                  data-ocid="promotions.select"
                  options={itemCategories
                    .filter((c) => c.status === "active")
                    .map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                      meta: cat.code,
                    }))}
                  value={form.categoryIds}
                  onChange={(vals) =>
                    setForm((prev) => ({ ...prev, categoryIds: vals }))
                  }
                  placeholder="Search and select categories..."
                />
              </div>
            )}

            {form.applicableTo === "product" && (
              <div className="space-y-2">
                <Label>Select Products</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.productIds.includes(item.id)}
                        onCheckedChange={() => toggleProduct(item.id)}
                        id={`promo-product-${item.id}`}
                      />
                      <label
                        htmlFor={`promo-product-${item.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Label>Manual Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as Promotion["status"] })
                }
              >
                <SelectTrigger className="w-32" data-ocid="promotions.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">
                (Active/Upcoming/Expired computed from dates)
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="promotions.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="promotions.save_button">
              {editing ? "Update" : "Add"} Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promotion?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="promotions.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deletePromotion(deleteId!);
                setDeleteId(null);
                toast.success("Promotion deleted");
              }}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="promotions.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Check,
  ChevronsUpDown,
  Edit,
  FileDown,
  FileText,
  Percent,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { TaxRate } from "../store/useStore";

import {
  exportExcel as exportExcelUtil,
  exportPDF as exportPDFUtil,
} from "../utils/exportUtils";

const EMPTY_FORM = {
  name: "",
  rate: "",
  applicableTo: "all" as TaxRate["applicableTo"],
  categoryIds: [] as string[],
  productIds: [] as string[],
  status: "Active" as TaxRate["status"],
};

export default function TaxesPage() {
  const {
    taxes,
    items,
    itemCategories,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApplicable, setFilterApplicable] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const filtered = taxes.filter((t) => {
    const ms = t.name.toLowerCase().includes(search.toLowerCase());
    const mst = filterStatus === "all" || t.status === filterStatus;
    const ma =
      filterApplicable === "all" || t.applicableTo === filterApplicable;
    return ms && mst && ma;
  });

  const totalActive = taxes.filter((t) => t.status === "Active").length;
  const avgRate = taxes.length
    ? taxes.reduce((s, t) => s + t.rate, 0) / taxes.length
    : 0;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCategoryPickerOpen(false);
    setDialogOpen(true);
  };

  const openEdit = (t: TaxRate) => {
    setEditing(t);
    // categories in the store are category names; try to match by name to get IDs
    const matchedIds = t.categories
      .map((cName) => {
        const found = itemCategories.find(
          (ic) => ic.name === cName || ic.id === cName,
        );
        return found ? found.id : null;
      })
      .filter(Boolean) as string[];
    setForm({
      name: t.name,
      rate: t.rate.toString(),
      applicableTo: t.applicableTo,
      categoryIds:
        matchedIds.length > 0 ? matchedIds : t.categories.length > 0 ? [] : [],
      productIds: t.productIds,
      status: t.status,
    });
    setCategoryPickerOpen(false);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.rate) {
      toast.error("Name and Rate are required");
      return;
    }
    // Store categories as names for backward compatibility
    const categoryNames = form.categoryIds
      .map((id) => itemCategories.find((ic) => ic.id === id)?.name)
      .filter(Boolean) as string[];
    const data: Omit<TaxRate, "id"> = {
      name: form.name,
      rate: Number.parseFloat(form.rate) || 0,
      applicableTo: form.applicableTo,
      categories: categoryNames,
      productIds: form.productIds,
      status: form.status,
    };
    if (editing) {
      updateTaxRate(editing.id, data);
      toast.success("Tax rate updated");
    } else {
      addTaxRate(data);
      toast.success("Tax rate created");
    }
    setDialogOpen(false);
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
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
      "tax-rates.xlsx",
      "Tax Rates",
      ["Name", "Rate (%)", "Applies To", "Categories", "Status"],
      filtered.map((t) => [
        t.name,
        `${t.rate}%`,
        t.applicableTo,
        t.categories.join(", ") || "-",
        t.status,
      ]),
      { reportTitle: "Tax Rates", generatedBy: currentUser?.name },
    );
  };

  const exportPDF = () => {
    exportPDFUtil(
      "Tax Rates Report",
      ["Name", "Rate (%)", "Applies To", "Categories", "Status"],
      filtered.map((t) => [
        t.name,
        `${t.rate}%`,
        t.applicableTo,
        t.categories.join(", ") || "-",
        t.status,
      ]),
      "tax-rates.pdf",
      { generatedBy: currentUser?.name },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Tax Rates</h1>
            <PageHelp pageId="taxes" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage product and category tax rates
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="taxes.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Tax Rate
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Percent className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Taxes</p>
                <p className="text-2xl font-bold">{taxes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Percent className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Taxes</p>
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
              <Percent className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Average Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {avgRate.toFixed(1)}%
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
                placeholder="Search taxes..."
                className="pl-9"
                data-ocid="taxes.search_input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="taxes.select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterApplicable}
              onValueChange={setFilterApplicable}
            >
              <SelectTrigger className="w-44" data-ocid="taxes.select">
                <SelectValue placeholder="Applies To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="product">By Product</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              data-ocid="taxes.button"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              data-ocid="taxes.button"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table data-ocid="taxes.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate (%)</TableHead>
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
                    data-ocid="taxes.empty_state"
                  >
                    No tax rates found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t, i) => (
                  <TableRow key={t.id} data-ocid={`taxes.item.${i + 1}`}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-blue-700 font-semibold">
                        {t.rate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t.applicableTo === "all"
                          ? "All Products"
                          : t.applicableTo === "category"
                            ? "Category"
                            : "Product"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {t.applicableTo === "category" &&
                      t.categories.length > 0 ? (
                        t.categories.join(", ")
                      ) : t.applicableTo === "product" &&
                        t.productIds.length > 0 ? (
                        `${t.productIds.length} product(s)`
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(t)}
                          data-ocid={`taxes.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(t.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`taxes.delete_button.${i + 1}`}
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
          data-ocid="taxes.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Tax Rate" : "Add Tax Rate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. GST"
                  data-ocid="taxes.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Rate (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  placeholder="17"
                  data-ocid="taxes.input"
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
                    applicableTo: v as TaxRate["applicableTo"],
                    categoryIds: [],
                    productIds: [],
                  })
                }
              >
                <SelectTrigger data-ocid="taxes.select">
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
                  Search and select one or more categories this tax applies to.
                </p>
                <Popover
                  open={categoryPickerOpen}
                  onOpenChange={setCategoryPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      data-ocid="taxes.select"
                    >
                      {form.categoryIds.length === 0
                        ? "Select categories..."
                        : `${form.categoryIds.length} categor${form.categoryIds.length === 1 ? "y" : "ies"} selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No categories found.</CommandEmpty>
                        <CommandGroup>
                          {itemCategories
                            .filter((c) => c.status === "active")
                            .map((cat) => (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => toggleCategory(cat.id)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    form.categoryIds.includes(cat.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {cat.name}
                                <span className="ml-auto text-xs text-muted-foreground font-mono">
                                  {cat.code}
                                </span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {/* Selected categories as chips */}
                {form.categoryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.categoryIds.map((id) => {
                      const cat = itemCategories.find((c) => c.id === id);
                      return cat ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => toggleCategory(id)}
                            className="ml-1 rounded-full hover:bg-gray-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
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
                        id={`tax-product-${item.id}`}
                      />
                      <label
                        htmlFor={`tax-product-${item.id}`}
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
                  setForm({ ...form, status: v as TaxRate["status"] })
                }
              >
                <SelectTrigger className="w-32" data-ocid="taxes.select">
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
              data-ocid="taxes.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="taxes.save_button">
              {editing ? "Update" : "Add"} Tax Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tax rate?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="taxes.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTaxRate(deleteId!);
                setDeleteId(null);
                toast.success("Tax rate deleted");
              }}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="taxes.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

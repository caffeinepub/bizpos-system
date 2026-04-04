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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Barcode, Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { Item, ItemVariant } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

// Simple visual barcode renderer using canvas
function BarcodeCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 280;
    const height = 80;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    const bars: number[] = [];
    bars.push(1, 0, 1);
    for (let i = 0; i < value.length; i++) {
      const c = value.charCodeAt(i);
      const pattern = c.toString(2).padStart(8, "0");
      for (const bit of pattern) bars.push(Number(bit));
      bars.push(0);
    }
    bars.push(1, 0, 1);

    const barWidth = Math.max(1, Math.floor((width - 20) / bars.length));
    let x = 10;
    ctx.fillStyle = "black";
    for (const bar of bars) {
      if (bar === 1) ctx.fillRect(x, 5, barWidth, height - 20);
      x += barWidth;
    }

    ctx.fillStyle = "black";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(value, width / 2, height - 3);
  }, [value]);

  return <canvas ref={canvasRef} className="border rounded" />;
}

const EMPTY_VARIANT: Omit<ItemVariant, "id"> = {
  variantType: "",
  variantValue: "",
  skuSuffix: "",
  priceAdjustment: 0,
  quantity: 0,
  status: "active",
};

interface StockMovementEntry {
  id: string;
  itemId: string;
  type: string;
  reference: string;
  quantityChange: number;
  quantityAfter: number;
  warehouseId: string;
  warehouseName: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

function StockLedgerTab({ itemId }: { itemId: string }) {
  const movements: StockMovementEntry[] = (() => {
    try {
      const all: StockMovementEntry[] = JSON.parse(
        localStorage.getItem("bizpos_stock_movements") || "[]",
      );
      return all
        .filter((m) => m.itemId === itemId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  })();

  if (movements.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="items.empty_state"
      >
        <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p>No stock movements recorded yet</p>
        <p className="text-xs mt-1">
          Movements are recorded when items are sold, purchased, adjusted, or
          transferred
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Qty Change</TableHead>
            <TableHead className="text-right">Balance After</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((mv, i) => (
            <TableRow
              key={mv.id}
              data-ocid={`items.stock_ledger.item.${i + 1}`}
            >
              <TableCell className="text-sm">
                {new Date(mv.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    mv.type === "Sale"
                      ? "bg-red-100 text-red-700"
                      : mv.type === "Purchase"
                        ? "bg-green-100 text-green-700"
                        : mv.type === "GRN"
                          ? "bg-blue-100 text-blue-700"
                          : mv.type === "Transfer-In"
                            ? "bg-purple-100 text-purple-700"
                            : mv.type === "Transfer-Out"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {mv.type}
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {mv.reference}
              </TableCell>
              <TableCell
                className={`text-right font-semibold ${mv.quantityChange < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {mv.quantityChange > 0 ? "+" : ""}
                {mv.quantityChange}
              </TableCell>
              <TableCell className="text-right">{mv.quantityAfter}</TableCell>
              <TableCell className="text-sm">{mv.warehouseName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {mv.notes || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ItemsPage() {
  const {
    items,
    warehouses,
    itemCategories,
    itemBrands,
    itemUnits,
    addItem,
    updateItem,
    deleteItem,
    addLog,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [barcodeItem, setBarcodeItem] = useState<Item | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantForm, setVariantForm] =
    useState<Omit<ItemVariant, "id">>(EMPTY_VARIANT);
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(
    null,
  );

  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    categoryId: "",
    brandId: "",
    unitId: "",
    costPrice: "",
    salePrice: "",
    quantity: "0",
    warehouseId: "",
    reorderLevel: "10",
    reorderQty: "50",
  });

  const activeCategories = itemCategories.filter((c) => c.status === "active");
  const activeBrands = itemBrands.filter((b) => b.status === "active");
  const activeUnits = itemUnits.filter((u) => u.status === "active");

  const filtered = items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      filterWarehouse === "all" || i.warehouseId === filterWarehouse;
    const matchCategory =
      filterCategory === "all" ||
      i.categoryId === filterCategory ||
      i.category === filterCategory;
    const matchBrand = filterBrand === "all" || i.brandId === filterBrand;
    return matchSearch && matchWarehouse && matchCategory && matchBrand;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setVariants([]);
    setForm({
      sku: "",
      name: "",
      category: "",
      categoryId: "",
      brandId: "",
      unitId: activeUnits[0]?.id || "",
      costPrice: "",
      salePrice: "",
      quantity: "0",
      warehouseId: warehouses[0]?.id || "",
      reorderLevel: "10",
      reorderQty: "50",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setVariants(item.variants || []);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category || "",
      categoryId: item.categoryId || "",
      brandId: item.brandId || "",
      unitId: item.unitId || "",
      costPrice: item.costPrice.toString(),
      salePrice: item.salePrice.toString(),
      quantity: item.quantity.toString(),
      warehouseId: item.warehouseId,
      reorderLevel: (item.reorderLevel ?? 10).toString(),
      reorderQty: (item.reorderQty ?? 50).toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.sku || !form.name || !form.warehouseId) {
      toast.error("Fill all required fields");
      return;
    }
    // Resolve category name from categoryId for backward compat
    const selectedCat = activeCategories.find((c) => c.id === form.categoryId);
    const categoryName = selectedCat?.name || form.category || "";

    const itemData = {
      sku: form.sku,
      name: form.name,
      category: categoryName,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      unitId: form.unitId || undefined,
      variants: variants.length > 0 ? variants : undefined,
      costPrice: Number.parseFloat(form.costPrice) || 0,
      salePrice: Number.parseFloat(form.salePrice) || 0,
      quantity: Number.parseInt(form.quantity) || 0,
      warehouseId: form.warehouseId,
      reorderLevel: Number.parseInt(form.reorderLevel) || 10,
      reorderQty: Number.parseInt(form.reorderQty) || 50,
    };
    if (editingItem) {
      updateItem(editingItem.id, itemData);
      addLog("Inventory", "update", `Item updated: ${itemData.name}`);
      toast.success("Item updated");
    } else {
      addItem(itemData);
      addLog("Inventory", "create", `Item created: ${itemData.name}`);
      toast.success("Item created");
    }
    setDialogOpen(false);
  };

  const getWarehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name || "Unknown";

  const getBrandName = (brandId?: string) =>
    itemBrands.find((b) => b.id === brandId)?.name || "";

  const getUnitAbbr = (unitId?: string) =>
    itemUnits.find((u) => u.id === unitId)?.abbreviation || "";

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      deleteItem(id);
      addLog("Inventory", "delete", `Item deleted: ${id}`);
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${selectedIds.size} items`);
  };

  const handleBulkExportPDF = () => {
    const selectedItems = filtered.filter((i) => selectedIds.has(i.id));
    const rows = selectedItems.map((i) => [
      i.sku,
      i.name,
      i.category,
      getBrandName(i.brandId),
      getWarehouseName(i.warehouseId),
      i.costPrice.toLocaleString(),
      i.salePrice.toLocaleString(),
      i.quantity.toString(),
    ]);
    exportPDF(
      "Items Export",
      [
        "SKU",
        "Name",
        "Category",
        "Brand",
        "Warehouse",
        "Cost",
        "Sale Price",
        "Qty",
      ],
      rows,
      "items-export.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Items Export",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleBulkExportExcel = () => {
    const selectedItems = filtered.filter((i) => selectedIds.has(i.id));
    const rows = selectedItems.map((i) => [
      i.sku,
      i.name,
      i.category,
      getBrandName(i.brandId),
      getWarehouseName(i.warehouseId),
      i.costPrice,
      i.salePrice,
      i.quantity,
      i.reorderLevel ?? 10,
    ]);
    exportExcel(
      "items-export.xlsx",
      "Items",
      [
        "SKU",
        "Name",
        "Category",
        "Brand",
        "Warehouse",
        "Cost",
        "Sale Price",
        "Qty",
        "Reorder Level",
      ],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Items Export",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handlePrintBarcode = () => {
    if (!barcodeItem) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Barcode - ${barcodeItem.name}</title>
      <style>body{font-family:monospace;text-align:center;padding:20px;}canvas{display:block;margin:0 auto;}</style>
      </head><body>
      <h3>${barcodeItem.name}</h3>
      <p>SKU: ${barcodeItem.sku}</p>
    `);
    const canvas = document.getElementById(
      "barcode-print-canvas",
    ) as HTMLCanvasElement;
    if (canvas) win.document.write(`<img src="${canvas.toDataURL()}" />`);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  };

  // Variant handlers
  const handleAddVariant = () => {
    if (!variantForm.variantType || !variantForm.variantValue) {
      toast.error("Variant Type and Value are required");
      return;
    }
    const newVariant: ItemVariant = {
      ...variantForm,
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    if (editingVariantIdx !== null) {
      setVariants((prev) =>
        prev.map((v, i) => (i === editingVariantIdx ? newVariant : v)),
      );
      setEditingVariantIdx(null);
    } else {
      setVariants((prev) => [...prev, newVariant]);
    }
    setVariantForm(EMPTY_VARIANT);
    setShowVariantForm(false);
  };

  const handleEditVariant = (idx: number) => {
    const v = variants[idx];
    setVariantForm({
      variantType: v.variantType,
      variantValue: v.variantValue,
      skuSuffix: v.skuSuffix,
      priceAdjustment: v.priceAdjustment,
      quantity: v.quantity,
      status: v.status,
    });
    setEditingVariantIdx(idx);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const lowStockCount = items.filter((i) => {
    const level = i.reorderLevel;
    return level != null ? i.quantity <= level : i.quantity < 10;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Items</h1>
            <PageHelp pageId="items" />
          </div>
          <p className="text-gray-600 mt-1">Manage inventory items</p>
        </div>
        <Button onClick={openAdd} data-ocid="items.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Stock Value</p>
            <p className="text-2xl font-bold text-primary">
              {items
                .reduce((s, i) => s + i.quantity * i.costPrice, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="outline" onClick={handleBulkExportPDF}>
            Export PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkExportExcel}>
            Export Excel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            data-ocid="items.delete_button"
          >
            Delete Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            data-ocid="items.cancel_button"
          >
            Clear
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="items.search_input"
              />
            </div>
            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-40" data-ocid="items.select">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40" data-ocid="items.select">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-36" data-ocid="items.select">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {activeBrands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="items.table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selectedIds.size === filtered.length &&
                      filtered.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    data-ocid="items.checkbox"
                  />
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="items.empty_state"
                  >
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, i) => {
                  const isLowStock =
                    item.reorderLevel != null
                      ? item.quantity <= item.reorderLevel
                      : item.quantity < 10;
                  const unitAbbr = getUnitAbbr(item.unitId);
                  return (
                    <TableRow
                      key={item.id}
                      data-ocid={`items.item.${i + 1}`}
                      className={isLowStock ? "bg-orange-50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          data-ocid={`items.checkbox.${i + 1}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.variants && item.variants.length > 0 && (
                          <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            {item.variants.length} variants
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {item.category || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {getBrandName(item.brandId) || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getWarehouseName(item.warehouseId)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.costPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.salePrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            isLowStock
                              ? "destructive"
                              : item.quantity < 20
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {item.quantity}
                          {unitAbbr ? ` ${unitAbbr}` : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {item.reorderLevel ?? 10}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBarcodeItem(item)}
                            title="Barcode"
                            data-ocid={`items.secondary_button.${i + 1}`}
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                            data-ocid={`items.edit_button.${i + 1}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                            className="text-red-600 hover:bg-red-50"
                            data-ocid={`items.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Item Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="items.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details" data-ocid="items.tab">
                Details
              </TabsTrigger>
              <TabsTrigger value="variants" data-ocid="items.tab">
                Variants{variants.length > 0 ? ` (${variants.length})` : ""}
              </TabsTrigger>
              {editingItem && (
                <TabsTrigger value="stock-ledger" data-ocid="items.tab">
                  Stock Ledger
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="SKU-001"
                    data-ocid="items.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warehouse *</Label>
                  <Select
                    value={form.warehouseId}
                    onValueChange={(v) => setForm({ ...form, warehouseId: v })}
                  >
                    <SelectTrigger data-ocid="items.select">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    data-ocid="items.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId || "none"}
                    onValueChange={(v) => {
                      if (v === "none") {
                        setForm({ ...form, categoryId: "", category: "" });
                      } else {
                        const cat = activeCategories.find((c) => c.id === v);
                        setForm({
                          ...form,
                          categoryId: v,
                          category: cat?.name || "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-ocid="items.select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Category —</SelectItem>
                      {activeCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={form.brandId || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, brandId: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger data-ocid="items.select">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Brand —</SelectItem>
                      {activeBrands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit of Measure</Label>
                  <Select
                    value={form.unitId || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, unitId: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger data-ocid="items.select">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Unit —</SelectItem>
                      {activeUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cost Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: e.target.value })
                    }
                    data-ocid="items.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sale Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) =>
                      setForm({ ...form, salePrice: e.target.value })
                    }
                    data-ocid="items.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    data-ocid="items.input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) =>
                      setForm({ ...form, reorderLevel: e.target.value })
                    }
                    min={0}
                    data-ocid="items.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Qty</Label>
                  <Input
                    type="number"
                    value={form.reorderQty}
                    onChange={(e) =>
                      setForm({ ...form, reorderQty: e.target.value })
                    }
                    min={0}
                    data-ocid="items.input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="items.cancel_button"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} data-ocid="items.save_button">
                  {editingItem ? "Update" : "Add"} Item
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="variants" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Define variants like Size, Color, Weight for this item.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setVariantForm(EMPTY_VARIANT);
                    setEditingVariantIdx(null);
                    setShowVariantForm(true);
                  }}
                  data-ocid="items.secondary_button"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Variant
                </Button>
              </div>

              {showVariantForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <p className="font-medium text-sm">
                    {editingVariantIdx !== null
                      ? "Edit Variant"
                      : "New Variant"}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type *</Label>
                      <Input
                        value={variantForm.variantType}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            variantType: e.target.value,
                          })
                        }
                        placeholder="e.g. Size, Color"
                        data-ocid="items.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Value *</Label>
                      <Input
                        value={variantForm.variantValue}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            variantValue: e.target.value,
                          })
                        }
                        placeholder="e.g. Large, Red"
                        data-ocid="items.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SKU Suffix</Label>
                      <Input
                        value={variantForm.skuSuffix}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            skuSuffix: e.target.value,
                          })
                        }
                        placeholder="e.g. -L"
                        data-ocid="items.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price Adj (+/-)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variantForm.priceAdjustment}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            priceAdjustment:
                              Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        data-ocid="items.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stock Qty</Label>
                      <Input
                        type="number"
                        value={variantForm.quantity}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            quantity: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        data-ocid="items.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={variantForm.status}
                        onValueChange={(v) =>
                          setVariantForm({
                            ...variantForm,
                            status: v as "active" | "inactive",
                          })
                        }
                      >
                        <SelectTrigger data-ocid="items.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowVariantForm(false);
                        setEditingVariantIdx(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddVariant}
                      data-ocid="items.save_button"
                    >
                      {editingVariantIdx !== null ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              )}

              {variants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No variants yet. Click &quot;Add Variant&quot; to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>SKU Suffix</TableHead>
                      <TableHead className="text-right">Price Adj</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v, i) => (
                      <TableRow key={v.id} data-ocid={`items.item.${i + 1}`}>
                        <TableCell className="font-medium">
                          {v.variantType}
                        </TableCell>
                        <TableCell>{v.variantValue}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {v.skuSuffix || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              v.priceAdjustment >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {v.priceAdjustment >= 0 ? "+" : ""}
                            {v.priceAdjustment}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {v.quantity}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              v.status === "active" ? "default" : "secondary"
                            }
                            className={
                              v.status === "active"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : ""
                            }
                          >
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVariant(i)}
                              data-ocid={`items.edit_button.${i + 1}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVariant(i)}
                              className="text-red-600 hover:bg-red-50"
                              data-ocid={`items.delete_button.${i + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="items.cancel_button"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} data-ocid="items.save_button">
                  {editingItem ? "Update" : "Add"} Item
                </Button>
              </div>
            </TabsContent>

            {editingItem && (
              <TabsContent value="stock-ledger" className="space-y-4">
                <StockLedgerTab itemId={editingItem.id} />
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Barcode Dialog */}
      <Dialog open={!!barcodeItem} onOpenChange={() => setBarcodeItem(null)}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-sm"
          data-ocid="items.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Barcode
            </DialogTitle>
          </DialogHeader>
          {barcodeItem && (
            <div className="space-y-4 text-center">
              <div>
                <p className="font-semibold">{barcodeItem.name}</p>
                <p className="text-sm text-gray-500">SKU: {barcodeItem.sku}</p>
              </div>
              <div id="barcode-print-area">
                <BarcodeCanvas value={barcodeItem.sku} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setBarcodeItem(null)}
                  data-ocid="items.cancel_button"
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePrintBarcode}
                  data-ocid="items.secondary_button"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Print Barcode
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this item from inventory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteItem(deleteId!);
                addLog("Inventory", "delete", `Item deleted: ${deleteId}`);
                setDeleteId(null);
                toast.success("Item deleted");
              }}
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

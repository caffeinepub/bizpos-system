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
import { Barcode, Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { Item } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

// Simple visual barcode renderer using canvas
function BarcodeCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple Code-like pattern
    const width = 280;
    const height = 80;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Generate bar pattern from string chars
    const bars: number[] = [];
    // Start guard
    bars.push(1, 0, 1);
    for (let i = 0; i < value.length; i++) {
      const c = value.charCodeAt(i);
      const pattern = c.toString(2).padStart(8, "0");
      for (const bit of pattern) bars.push(Number(bit));
      bars.push(0); // separator
    }
    // End guard
    bars.push(1, 0, 1);

    const barWidth = Math.max(1, Math.floor((width - 20) / bars.length));
    let x = 10;
    ctx.fillStyle = "black";
    for (const bar of bars) {
      if (bar === 1) ctx.fillRect(x, 5, barWidth, height - 20);
      x += barWidth;
    }

    // Label
    ctx.fillStyle = "black";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(value, width / 2, height - 3);
  }, [value]);

  return <canvas ref={canvasRef} className="border rounded" />;
}

export default function ItemsPage() {
  const { items, warehouses, addItem, updateItem, deleteItem } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [barcodeItem, setBarcodeItem] = useState<Item | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    quantity: "",
    warehouseId: "",
    reorderLevel: "10",
    reorderQty: "50",
  });

  const filtered = items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      filterWarehouse === "all" || i.warehouseId === filterWarehouse;
    return matchSearch && matchWarehouse;
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
    setForm({
      sku: "",
      name: "",
      category: "",
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
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category || "",
      costPrice: item.costPrice.toString(),
      salePrice: item.salePrice.toString(),
      quantity: item.quantity.toString(),
      warehouseId: item.warehouseId,
      reorderLevel: ((item as any).reorderLevel ?? 10).toString(),
      reorderQty: ((item as any).reorderQty ?? 50).toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.sku || !form.name || !form.warehouseId) {
      toast.error("Fill all required fields");
      return;
    }
    const itemData = {
      sku: form.sku,
      name: form.name,
      category: form.category,
      costPrice: Number.parseFloat(form.costPrice) || 0,
      salePrice: Number.parseFloat(form.salePrice) || 0,
      quantity: Number.parseInt(form.quantity) || 0,
      warehouseId: form.warehouseId,
      reorderLevel: Number.parseInt(form.reorderLevel) || 10,
      reorderQty: Number.parseInt(form.reorderQty) || 50,
    };
    if (editingItem) {
      updateItem(editingItem.id, itemData);
      toast.success("Item updated");
    } else {
      addItem(itemData);
      toast.success("Item created");
    }
    setDialogOpen(false);
  };

  const getWarehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name || "Unknown";

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) deleteItem(id);
    setSelectedIds(new Set());
    toast.success(`Deleted ${selectedIds.size} items`);
  };

  const handleBulkExportPDF = () => {
    const selectedItems = filtered.filter((i) => selectedIds.has(i.id));
    const rows = selectedItems.map((i) => [
      i.sku,
      i.name,
      i.category,
      getWarehouseName(i.warehouseId),
      i.costPrice.toLocaleString(),
      i.salePrice.toLocaleString(),
      i.quantity.toString(),
    ]);
    exportPDF(
      "Items Export",
      ["SKU", "Name", "Category", "Warehouse", "Cost", "Sale Price", "Qty"],
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
      getWarehouseName(i.warehouseId),
      i.costPrice,
      i.salePrice,
      i.quantity,
      (i as any).reorderLevel ?? 10,
    ]);
    exportExcel(
      "items-export.xlsx",
      "Items",
      [
        "SKU",
        "Name",
        "Category",
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

  const lowStockCount = items.filter((i) => {
    const level = (i as any).reorderLevel;
    return level != null ? i.quantity <= level : i.quantity < 10;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
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
          >
            Deselect All
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="pl-9"
                data-ocid="items.search_input"
              />
            </div>
            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-48" data-ocid="items.select">
                <SelectValue placeholder="All Warehouses" />
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
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
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="items.empty_state"
                  >
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, i) => {
                  const isLowStock =
                    (item as any).reorderLevel != null
                      ? item.quantity <= (item as any).reorderLevel
                      : item.quantity < 10;
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
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {item.category || "—"}
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
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {(item as any).reorderLevel ?? 10}
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
        <DialogContent data-ocid="items.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g. Electronics"
                  data-ocid="items.input"
                />
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Dialog */}
      <Dialog open={!!barcodeItem} onOpenChange={() => setBarcodeItem(null)}>
        <DialogContent className="max-w-sm" data-ocid="items.dialog">
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

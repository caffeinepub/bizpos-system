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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AttachmentManager from "../components/AttachmentManager";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { Purchase, PurchaseItem } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Received: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

interface FormItem {
  _id: string;
  itemId: string;
  itemName: string;
  quantity: string;
  costPrice: string;
}

function newFormItem(): FormItem {
  return {
    _id: `${Date.now()}-${Math.random()}`,
    itemId: "",
    itemName: "",
    quantity: "1",
    costPrice: "0",
  };
}

type PurchaseForm = {
  supplierId: string;
  warehouseId: string;
  purchaseDate: string;
  status: Purchase["status"];
  notes: string;
  items: FormItem[];
};

export default function PurchasesPage() {
  const { currentUser } = useAuth();
  const {
    purchases,
    suppliers,
    warehouses,
    items: storeItems,
    addPurchase,
    updatePurchase,
    deletePurchase,
    addLog,
    settings,
  } = useStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);

  const emptyForm: PurchaseForm = {
    supplierId: "",
    warehouseId: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    status: "Pending",
    notes: "",
    items: [newFormItem()],
  };
  const [form, setForm] = useState<PurchaseForm>(emptyForm);

  const buildPurchaseMeta = () => {
    const filters = [
      search && { label: "Search", value: search },
      filterSupplier !== "all" && {
        label: "Supplier",
        value:
          suppliers.find((s) => s.id === filterSupplier)?.name ??
          filterSupplier,
      },
      filterStatus !== "all" && { label: "Status", value: filterStatus },
    ].filter(Boolean) as { label: string; value: string }[];
    return {
      companyName: settings?.companyName || "BizPOS System",
      generatedBy: currentUser?.name ?? "Unknown",
      filters,
    };
  };

  const handleExportPDF = () => {
    const rows = filtered.map((p) => [
      p.id,
      p.purchaseDate,
      p.supplierName,
      p.warehouseName,
      p.total.toLocaleString(),
      p.status,
    ]);
    exportPDF(
      "Purchases List",
      ["Bill#", "Date", "Supplier", "Warehouse", "Total", "Status"],
      rows,
      "purchases.pdf",
      buildPurchaseMeta(),
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((p) => [
      p.id,
      p.purchaseDate,
      p.supplierName,
      p.warehouseName,
      p.total,
      p.status,
    ]);
    exportExcel(
      "purchases.xlsx",
      "Purchases",
      ["Bill#", "Date", "Supplier", "Warehouse", "Total", "Status"],
      rows,
      { ...buildPurchaseMeta(), reportTitle: "Purchases List" },
    );
  };

  const filtered = purchases.filter((p) => {
    const matchSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSupplier =
      filterSupplier === "all" || p.supplierId === filterSupplier;
    return matchSearch && matchStatus && matchSupplier;
  });

  const openAdd = () => {
    setEditingPurchase(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Purchase) => {
    setEditingPurchase(p);
    setForm({
      supplierId: p.supplierId,
      warehouseId: p.warehouseId,
      purchaseDate: p.purchaseDate,
      status: p.status,
      notes: p.notes || "",
      items: p.items.map((i) => ({
        _id: `${Date.now()}-${Math.random()}`,
        itemId: i.itemId,
        itemName: i.itemName,
        quantity: i.quantity.toString(),
        costPrice: i.costPrice.toString(),
      })),
    });
    setDialogOpen(true);
  };

  const updateFormItem = (id: string, field: string, value: string) => {
    setForm((prev) => {
      const newItems = prev.items.map((item) => {
        if (item._id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "itemId") {
          const found = storeItems.find((i) => i.id === value);
          if (found) {
            updated.itemName = found.name;
            updated.costPrice = found.costPrice.toString();
          }
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  const calcTotal = () =>
    form.items.reduce(
      (s, i) =>
        s +
        (Number.parseFloat(i.quantity) || 0) *
          (Number.parseFloat(i.costPrice) || 0),
      0,
    );

  const handleSave = () => {
    if (!form.supplierId || !form.warehouseId) {
      toast.error("Supplier and warehouse are required");
      return;
    }
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    const warehouse = warehouses.find((w) => w.id === form.warehouseId);
    if (!supplier || !warehouse) return;
    const purchaseItems: PurchaseItem[] = form.items
      .filter((i) => i.itemId)
      .map((i) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        quantity: Number.parseFloat(i.quantity) || 0,
        costPrice: Number.parseFloat(i.costPrice) || 0,
        subtotal:
          (Number.parseFloat(i.quantity) || 0) *
          (Number.parseFloat(i.costPrice) || 0),
      }));
    if (purchaseItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    const total = purchaseItems.reduce((s, i) => s + i.subtotal, 0);
    if (editingPurchase) {
      updatePurchase(editingPurchase.id, {
        supplierId: form.supplierId,
        supplierName: supplier.name,
        warehouseId: form.warehouseId,
        warehouseName: warehouse.name,
        purchaseDate: form.purchaseDate,
        status: form.status,
        notes: form.notes,
        items: purchaseItems,
        total,
      });
      addLog("Purchases", "update", "Purchase updated");
      toast.success("Purchase updated");
    } else {
      const id = `PUR-${String(purchases.length + 1).padStart(3, "0")}`;
      addPurchase({
        id,
        supplierId: form.supplierId,
        supplierName: supplier.name,
        warehouseId: form.warehouseId,
        warehouseName: warehouse.name,
        purchaseDate: form.purchaseDate,
        items: purchaseItems,
        total,
        notes: form.notes,
        status: form.status,
        createdAt: new Date().toISOString(),
      });
      addLog("Purchases", "create", "Purchase created from supplier");
      toast.success("Purchase created");
    }
    setDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600 mt-1">
            Manage purchase orders and supplier receipts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="purchases.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="purchases.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button onClick={openAdd} data-ocid="purchases.open_modal_button">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-9"
                  data-ocid="purchases.search_input"
                />
              </div>
            </div>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-48" data-ocid="purchases.select">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-ocid="purchases.select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
                  data-ocid="purchases.empty_state"
                >
                  No purchases found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow key={p.id} data-ocid={`purchases.item.${i + 1}`}>
                  <TableCell className="font-mono font-medium">
                    {p.id}
                  </TableCell>
                  <TableCell>{p.supplierName}</TableCell>
                  <TableCell>{p.warehouseName}</TableCell>
                  <TableCell>{p.purchaseDate}</TableCell>
                  <TableCell>{p.items.length} items</TableCell>
                  <TableCell className="text-right font-semibold">
                    {p.total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[p.status]}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewPurchase(p);
                          setViewDialogOpen(true);
                        }}
                        data-ocid={`purchases.secondary_button.${i + 1}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(p)}
                        data-ocid={`purchases.edit_button.${i + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(p.id)}
                        className="text-red-600 hover:bg-red-50"
                        data-ocid={`purchases.delete_button.${i + 1}`}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-[90vw] xl:max-w-4xl max-h-[90vh] overflow-y-auto"
          data-ocid="purchases.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? "Edit Purchase" : "New Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm({ ...form, supplierId: v })}
                >
                  <SelectTrigger data-ocid="purchases.select">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select
                  value={form.warehouseId}
                  onValueChange={(v) => setForm({ ...form, warehouseId: v })}
                >
                  <SelectTrigger data-ocid="purchases.select">
                    <SelectValue placeholder="Select warehouse" />
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
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                  data-ocid="purchases.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Purchase["status"] })
                  }
                >
                  <SelectTrigger data-ocid="purchases.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                data-ocid="purchases.textarea"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Items</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      items: [...prev.items, newFormItem()],
                    }))
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Cost Price</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Select
                          value={item.itemId}
                          onValueChange={(v) =>
                            updateFormItem(item._id, "itemId", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {storeItems.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateFormItem(item._id, "quantity", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.costPrice}
                          onChange={(e) =>
                            updateFormItem(
                              item._id,
                              "costPrice",
                              e.target.value,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(
                          (Number.parseFloat(item.quantity) || 0) *
                          (Number.parseFloat(item.costPrice) || 0)
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {form.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                items: prev.items.filter(
                                  (i) => i._id !== item._id,
                                ),
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <div className="text-lg font-bold">
                  Total:{" "}
                  <span className="text-primary">
                    {calcTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="purchases.cancel_button"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="purchases.save_button">
                {editingPurchase ? "Update" : "Save"} Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl"
          data-ocid="purchases.dialog"
        >
          <DialogHeader>
            <DialogTitle>Purchase Details — {viewPurchase?.id}</DialogTitle>
          </DialogHeader>
          {viewPurchase && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Supplier:</span>{" "}
                      <strong>{viewPurchase.supplierName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Warehouse:</span>{" "}
                      <strong>{viewPurchase.warehouseName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>{" "}
                      <strong>{viewPurchase.purchaseDate}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>{" "}
                      <Badge className={STATUS_COLORS[viewPurchase.status]}>
                        {viewPurchase.status}
                      </Badge>
                    </div>
                  </div>
                  {viewPurchase.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      Notes: {viewPurchase.notes}
                    </p>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewPurchase.items.map((item, viewIdx) => (
                        <TableRow key={`${item.itemId}-${viewIdx}`}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.costPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.subtotal.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right text-lg font-bold">
                    Total: {viewPurchase.total.toLocaleString()}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="attachments">
                <AttachmentManager
                  moduleKey="purchases"
                  recordId={viewPurchase.id}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this purchase order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="purchases.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deletePurchase(deleteId!);
                addLog("Purchases", "delete", `Purchase deleted: ${deleteId}`);
                setDeleteId(null);
                toast.success("Purchase deleted");
              }}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="purchases.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

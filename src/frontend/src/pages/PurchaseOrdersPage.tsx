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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
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
import type { PurchaseOrder } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  "Partially Received": "bg-yellow-100 text-yellow-700",
  Received: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

interface FormItem {
  _id: string;
  productName: string;
  qty: string;
  unitCost: string;
}

function newFormItem(): FormItem {
  return {
    _id: `${Date.now()}-${Math.random()}`,
    productName: "",
    qty: "1",
    unitCost: "0",
  };
}

export default function PurchaseOrdersPage() {
  const { currentUser } = useAuth();
  const {
    purchaseOrders,
    suppliers,
    warehouses,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addPurchase,
  } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({
    supplierId: "",
    warehouseId: "",
    date: today,
    expectedDelivery: today,
    notes: "",
    status: "Draft" as PurchaseOrder["status"],
  });
  const [formItems, setFormItems] = useState<FormItem[]>([newFormItem()]);

  const filtered = purchaseOrders.filter((po) => {
    const matchSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || po.status === filterStatus;
    const matchSupplier =
      filterSupplier === "all" || po.supplierId === filterSupplier;
    return matchSearch && matchStatus && matchSupplier;
  });

  const openAdd = () => {
    setEditingPO(null);
    setForm({
      supplierId: "",
      warehouseId: "",
      date: today,
      expectedDelivery: today,
      notes: "",
      status: "Draft",
    });
    setFormItems([newFormItem()]);
    setDialogOpen(true);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setForm({
      supplierId: po.supplierId,
      warehouseId: po.warehouseId,
      date: po.date,
      expectedDelivery: po.expectedDelivery,
      notes: po.notes,
      status: po.status,
    });
    setFormItems(
      po.items.map((it) => ({
        _id: `${Date.now()}-${Math.random()}`,
        productName: it.productName,
        qty: String(it.qty),
        unitCost: String(it.unitCost),
      })),
    );
    setDialogOpen(true);
  };

  const calcTotal = () =>
    formItems.reduce((s, it) => s + Number(it.qty) * Number(it.unitCost), 0);

  const handleSave = () => {
    if (!form.supplierId || !form.warehouseId) {
      toast.error("Supplier and warehouse are required");
      return;
    }
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    const warehouse = warehouses.find((w) => w.id === form.warehouseId);
    const items = formItems
      .filter((it) => it.productName)
      .map((it) => ({
        productId: `prod-${it.productName}`,
        productName: it.productName,
        qty: Number(it.qty),
        unitCost: Number(it.unitCost),
      }));
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    const poData = {
      supplierId: form.supplierId,
      supplierName: supplier?.name ?? "",
      warehouseId: form.warehouseId,
      warehouseName: warehouse?.name ?? "",
      date: form.date,
      expectedDelivery: form.expectedDelivery,
      items,
      status: form.status,
      notes: form.notes,
      totalAmount: calcTotal(),
    };

    if (editingPO) {
      updatePurchaseOrder(editingPO.id, poData);
      toast.success("Purchase order updated");
    } else {
      addPurchaseOrder(poData);
      toast.success("Purchase order created");
    }
    setDialogOpen(false);
  };

  const convertToInvoice = (po: PurchaseOrder) => {
    addPurchase({
      id: `BILL-${Date.now().toString(36)}`,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      warehouseId: po.warehouseId,
      warehouseName: po.warehouseName,
      purchaseDate: po.date,
      items: po.items.map((it) => ({
        itemId: it.productId,
        itemName: it.productName,
        quantity: it.qty,
        costPrice: it.unitCost,
        subtotal: it.qty * it.unitCost,
      })),
      total: po.totalAmount,
      status: "Received",
      notes: `Converted from PO: ${po.poNumber}`,
      createdAt: new Date().toISOString(),
    });
    updatePurchaseOrder(po.id, { status: "Received" });
    toast.success("Converted to invoice and marked as Received");
  };

  const handleExportPDF = () => {
    const rows = filtered.map((po) => [
      po.poNumber,
      po.date,
      po.supplierName,
      po.warehouseName,
      po.items.length,
      po.totalAmount.toLocaleString(),
      po.status,
    ]);
    exportPDF(
      "Purchase Orders",
      ["PO#", "Date", "Supplier", "Warehouse", "Items", "Total", "Status"],
      rows,
      "purchase-orders.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          search && { label: "Search", value: search },
          filterSupplier !== "all" && {
            label: "Supplier",
            value:
              suppliers.find((s) => s.id === filterSupplier)?.name ??
              filterSupplier,
          },
          filterStatus !== "all" && { label: "Status", value: filterStatus },
        ].filter(Boolean) as { label: string; value: string }[],
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((po) => [
      po.poNumber,
      po.date,
      po.supplierName,
      po.warehouseName,
      po.items.length,
      po.totalAmount,
      po.status,
    ]);
    exportExcel(
      "purchase-orders.xlsx",
      "Purchase Orders",
      ["PO#", "Date", "Supplier", "Warehouse", "Items", "Total", "Status"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Purchase Orders",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          search && { label: "Search", value: search },
          filterSupplier !== "all" && {
            label: "Supplier",
            value:
              suppliers.find((s) => s.id === filterSupplier)?.name ??
              filterSupplier,
          },
          filterStatus !== "all" && { label: "Status", value: filterStatus },
        ].filter(Boolean) as { label: string; value: string }[],
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">
            Create and manage purchase orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="po.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="po.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button onClick={openAdd} data-ocid="po.open_modal_button">
            <Plus className="h-4 w-4 mr-2" /> New PO
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO#, supplier..."
            className="pl-9"
            data-ocid="po.search_input"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44" data-ocid="po.select">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {[
              "Draft",
              "Sent",
              "Partially Received",
              "Received",
              "Cancelled",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-44" data-ocid="po.select">
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
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Expected</TableHead>
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
                    className="text-center py-8 text-gray-400"
                    data-ocid="po.empty_state"
                  >
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((po, i) => (
                  <TableRow key={po.id} data-ocid={`po.item.${i + 1}`}>
                    <TableCell className="font-mono font-semibold text-blue-600">
                      {po.poNumber}
                    </TableCell>
                    <TableCell>{po.date}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{po.warehouseName}</TableCell>
                    <TableCell>{po.expectedDelivery}</TableCell>
                    <TableCell className="text-right font-mono">
                      {po.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[po.status]}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewPO(po)}
                          title="View"
                          data-ocid={`po.secondary_button.${i + 1}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(po)}
                          title="Edit"
                          data-ocid={`po.edit_button.${i + 1}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {po.status !== "Received" &&
                          po.status !== "Cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => convertToInvoice(po)}
                              title="Convert to Invoice"
                              className="text-green-600 hover:bg-green-50 text-xs px-2"
                              data-ocid={`po.primary_button.${i + 1}`}
                            >
                              → Invoice
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(po.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`po.delete_button.${i + 1}`}
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

      {/* View PO Sheet */}
      <Sheet open={!!viewPO} onOpenChange={() => setViewPO(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {viewPO && (
            <>
              <SheetHeader>
                <SheetTitle>Purchase Order: {viewPO.poNumber}</SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="details" className="mt-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Supplier:</span>{" "}
                        <strong>{viewPO.supplierName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Warehouse:</span>{" "}
                        <strong>{viewPO.warehouseName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>{" "}
                        {viewPO.date}
                      </div>
                      <div>
                        <span className="text-gray-500">Expected:</span>{" "}
                        {viewPO.expectedDelivery}
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>{" "}
                        <Badge className={STATUS_COLORS[viewPO.status]}>
                          {viewPO.status}
                        </Badge>
                      </div>
                    </div>
                    {viewPO.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {viewPO.notes}
                      </p>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Unit Cost
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewPO.items.map((it, idx) => (
                          <TableRow key={it.productId + String(idx)}>
                            <TableCell>{it.productName}</TableCell>
                            <TableCell className="text-right">
                              {it.qty}
                            </TableCell>
                            <TableCell className="text-right">
                              {it.unitCost.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {(it.qty * it.unitCost).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-gray-50">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right font-mono text-blue-700">
                            {viewPO.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="attachments">
                  <AttachmentManager
                    moduleKey="purchase-orders"
                    recordId={viewPO.id}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="po.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingPO ? "Edit Purchase Order" : "New Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm({ ...form, supplierId: v })}
                >
                  <SelectTrigger data-ocid="po.select">
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
                  <SelectTrigger data-ocid="po.select">
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
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  data-ocid="po.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) =>
                    setForm({ ...form, expectedDelivery: e.target.value })
                  }
                  data-ocid="po.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as PurchaseOrder["status"] })
                  }
                >
                  <SelectTrigger data-ocid="po.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Draft",
                      "Sent",
                      "Partially Received",
                      "Received",
                      "Cancelled",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
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
                data-ocid="po.textarea"
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormItems([...formItems, newFormItem()])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-28">Unit Cost</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formItems.map((it) => (
                    <TableRow key={it._id}>
                      <TableCell>
                        <Input
                          value={it.productName}
                          onChange={(e) =>
                            setFormItems(
                              formItems.map((f) =>
                                f._id === it._id
                                  ? { ...f, productName: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          placeholder="Product name"
                          className="h-8"
                          data-ocid="po.input"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={it.qty}
                          onChange={(e) =>
                            setFormItems(
                              formItems.map((f) =>
                                f._id === it._id
                                  ? { ...f, qty: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          className="h-8"
                          data-ocid="po.input"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={it.unitCost}
                          onChange={(e) =>
                            setFormItems(
                              formItems.map((f) =>
                                f._id === it._id
                                  ? { ...f, unitCost: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          className="h-8"
                          data-ocid="po.input"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {(
                          Number(it.qty) * Number(it.unitCost)
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {formItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormItems(
                                formItems.filter((f) => f._id !== it._id),
                              )
                            }
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="font-mono text-blue-700">
                      {calcTotal().toLocaleString()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="po.submit_button">
                {editingPO ? "Update" : "Create"} PO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this PO? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deletePurchaseOrder(deleteId!);
                setDeleteId(null);
                toast.success("PO deleted");
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

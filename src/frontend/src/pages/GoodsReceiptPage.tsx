import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import AttachmentManager from "../components/AttachmentManager";
import {
  type GRNItem,
  type GoodsReceiptNote,
  useStore,
} from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Received: "bg-blue-100 text-blue-700",
  "Quality Checked": "bg-yellow-100 text-yellow-700",
  Accepted: "bg-green-100 text-green-700",
  "Partially Accepted": "bg-orange-100 text-orange-700",
};

function getSessionUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("bizpos_session") || "{}").name || "Admin"
    );
  } catch {
    return "Admin";
  }
}

type FormData = Omit<GoodsReceiptNote, "id" | "grnNo" | "createdAt">;

const EMPTY_FORM: FormData = {
  poId: "",
  poNumber: "",
  supplierId: "",
  supplierName: "",
  warehouseId: "",
  warehouseName: "",
  receivedDate: new Date().toISOString().slice(0, 10),
  items: [
    {
      productId: "",
      productName: "",
      orderedQty: 0,
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      unitCost: 0,
    },
  ],
  status: "Draft",
  qualityNotes: "",
};

export default function GoodsReceiptPage() {
  const store = useStore();
  const { addStockMovement } = store;
  const grns = store.goodsReceiptNotes;
  const purchaseOrders = store.purchaseOrders;
  const warehouses = store.warehouses;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [viewGRN, setViewGRN] = useState<GoodsReceiptNote | null>(null);

  const filtered = grns.filter((g) => {
    const matchSearch =
      !search ||
      g.grnNo.toLowerCase().includes(search.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || g.status === filterStatus;
    const matchSupplier =
      !filterSupplier ||
      g.supplierName.toLowerCase().includes(filterSupplier.toLowerCase());
    const matchFrom = !filterFrom || g.receivedDate >= filterFrom;
    const matchTo = !filterTo || g.receivedDate <= filterTo;
    return matchSearch && matchStatus && matchSupplier && matchFrom && matchTo;
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }
  function openEdit(g: GoodsReceiptNote) {
    setForm({
      poId: g.poId,
      poNumber: g.poNumber,
      supplierId: g.supplierId,
      supplierName: g.supplierName,
      warehouseId: g.warehouseId,
      warehouseName: g.warehouseName,
      receivedDate: g.receivedDate,
      items: g.items,
      status: g.status,
      qualityNotes: g.qualityNotes,
    });
    setEditId(g.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.poNumber || !form.warehouseName) return;
    if (editId) {
      store.updateGoodsReceiptNote(editId, form);
    } else {
      store.addGoodsReceiptNote(form);
    }
    setShowForm(false);
  }

  function handlePOSelect(poId: string) {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      setForm((f) => ({
        ...f,
        poId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        items: po.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          orderedQty: it.qty,
          receivedQty: it.qty,
          acceptedQty: it.qty,
          rejectedQty: 0,
          unitCost: it.unitCost,
        })),
      }));
    }
  }

  function updateItem(
    idx: number,
    field: keyof GRNItem,
    value: string | number,
  ) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it,
      ),
    }));
  }

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          productId: "",
          productName: "",
          orderedQty: 0,
          receivedQty: 0,
          acceptedQty: 0,
          rejectedQty: 0,
          unitCost: 0,
        },
      ],
    }));
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function handleExportPDF() {
    exportPDF(
      "Goods Receipt Notes",
      ["GRN No", "PO No", "Supplier", "Warehouse", "Date", "Status"],
      filtered.map((g) => [
        g.grnNo,
        g.poNumber,
        g.supplierName,
        g.warehouseName,
        g.receivedDate,
        g.status,
      ]),
      "grn_list.pdf",
      { reportTitle: "Goods Receipt Notes", generatedBy: getSessionUser() },
    );
  }

  function handleExportExcel() {
    exportExcel(
      "grn_list.xlsx",
      "GRNs",
      ["GRN No", "PO No", "Supplier", "Warehouse", "Date", "Status"],
      filtered.map((g) => [
        g.grnNo,
        g.poNumber,
        g.supplierName,
        g.warehouseName,
        g.receivedDate,
        g.status,
      ]),
      { reportTitle: "Goods Receipt Notes", generatedBy: getSessionUser() },
    );
  }

  // Quality analysis
  const qualityRows = grns.map((g) => {
    const totalOrdered = g.items.reduce((s, it) => s + it.orderedQty, 0);
    const totalAccepted = g.items.reduce((s, it) => s + it.acceptedQty, 0);
    const totalRejected = g.items.reduce((s, it) => s + it.rejectedQty, 0);
    const totalReceived = g.items.reduce((s, it) => s + it.receivedQty, 0);
    const acceptRate =
      totalReceived > 0
        ? ((totalAccepted / totalReceived) * 100).toFixed(1)
        : "0.0";
    return {
      grnNo: g.grnNo,
      supplier: g.supplierName,
      totalOrdered,
      totalReceived,
      totalAccepted,
      totalRejected,
      acceptRate,
    };
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Goods Receipt Notes
          </h1>
          <p className="text-sm text-slate-500">
            Track received goods, quality checks, and acceptance
          </p>
        </div>
        <Button
          data-ocid="grn.primary_button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New GRN
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">GRN List</TabsTrigger>
          <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
            <Input
              data-ocid="grn.search_input"
              placeholder="Search GRN / PO no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Supplier name..."
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-44"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-ocid="grn.select" className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {[
                  "Draft",
                  "Received",
                  "Quality Checked",
                  "Accepted",
                  "Partially Accepted",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          </div>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "GRN No",
                    "PO No",
                    "Supplier",
                    "Warehouse",
                    "Date",
                    "Items",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-400"
                      data-ocid="grn.empty_state"
                    >
                      No GRNs found
                    </td>
                  </tr>
                )}
                {filtered.map((g, idx) => (
                  <tr
                    key={g.id}
                    className="border-b hover:bg-slate-50"
                    data-ocid={`grn.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {g.grnNo}
                    </td>
                    <td className="px-4 py-3">{g.poNumber}</td>
                    <td className="px-4 py-3">{g.supplierName}</td>
                    <td className="px-4 py-3">{g.warehouseName}</td>
                    <td className="px-4 py-3">{g.receivedDate}</td>
                    <td className="px-4 py-3">{g.items.length}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[g.status] || ""}`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewGRN(g)}
                        >
                          View
                        </Button>
                        {g.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(g)}
                          >
                            Edit
                          </Button>
                        )}
                        {g.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600"
                            onClick={() =>
                              (() => {
                                store.updateGoodsReceiptNote(g.id, {
                                  status: "Received",
                                });
                                // Update stock
                                try {
                                  const items = JSON.parse(
                                    localStorage.getItem("bizpos_items") ||
                                      "[]",
                                  );
                                  const updated = items.map(
                                    (it: { id: string; quantity: number }) => {
                                      const grnItem = g.items.find(
                                        (gi) => gi.productId === it.id,
                                      );
                                      if (grnItem)
                                        return {
                                          ...it,
                                          quantity:
                                            it.quantity + grnItem.receivedQty,
                                        };
                                      return it;
                                    },
                                  );
                                  localStorage.setItem(
                                    "bizpos_items",
                                    JSON.stringify(updated),
                                  );
                                } catch {
                                  /* ignore */
                                }
                              })()
                            }
                          >
                            Mark Received
                          </Button>
                        )}
                        {g.status === "Received" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-yellow-600"
                            onClick={() =>
                              store.updateGoodsReceiptNote(g.id, {
                                status: "Quality Checked",
                              })
                            }
                          >
                            QC
                          </Button>
                        )}
                        {g.status === "Quality Checked" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() =>
                              (() => {
                                // Only update stock if not already done in Received step
                                if (
                                  g.status !== "Received" &&
                                  g.status !== "Quality Checked"
                                ) {
                                  try {
                                    const items = JSON.parse(
                                      localStorage.getItem("bizpos_items") ||
                                        "[]",
                                    );
                                    const updated = items.map(
                                      (it: {
                                        id: string;
                                        quantity: number;
                                      }) => {
                                        const grnItem = g.items.find(
                                          (gi) => gi.productId === it.id,
                                        );
                                        if (grnItem)
                                          return {
                                            ...it,
                                            quantity:
                                              it.quantity + grnItem.acceptedQty,
                                          };
                                        return it;
                                      },
                                    );
                                    localStorage.setItem(
                                      "bizpos_items",
                                      JSON.stringify(updated),
                                    );
                                  } catch {
                                    /* ignore */
                                  }
                                }
                                store.updateGoodsReceiptNote(g.id, {
                                  status: "Accepted",
                                });
                                // Record stock movements for each accepted item
                                for (const grnItem of g.items) {
                                  if (grnItem.acceptedQty > 0) {
                                    addStockMovement({
                                      itemId: grnItem.productId || "",
                                      itemName: grnItem.productName,
                                      type: "GRN",
                                      reference: g.grnNo,
                                      quantityChange: grnItem.acceptedQty,
                                      quantityAfter: 0,
                                      warehouseId: g.warehouseId,
                                      warehouseName: g.warehouseName,
                                      notes: `GRN acceptance: ${g.grnNo}`,
                                    });
                                  }
                                }
                              })()
                            }
                          >
                            Accept
                          </Button>
                        )}
                        {g.status === "Draft" && (
                          <Button
                            data-ocid={`grn.delete_button.${idx + 1}`}
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => store.deleteGoodsReceiptNote(g.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "GRN No",
                    "Supplier",
                    "Ordered",
                    "Received",
                    "Accepted",
                    "Rejected",
                    "Acceptance Rate",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qualityRows.map((q) => (
                  <tr key={q.grnNo} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {q.grnNo}
                    </td>
                    <td className="px-4 py-3">{q.supplier}</td>
                    <td className="px-4 py-3">{q.totalOrdered}</td>
                    <td className="px-4 py-3">{q.totalReceived}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {q.totalAccepted}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-medium">
                      {q.totalRejected}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${q.acceptRate}%` }}
                          />
                        </div>
                        <span className="font-medium">{q.acceptRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="grn.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit" : "New"} Goods Receipt Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Order</Label>
                <Select value={form.poId} onValueChange={handlePOSelect}>
                  <SelectTrigger data-ocid="grn.select">
                    <SelectValue placeholder="Select PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} — {po.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>PO Number</Label>
                <Input
                  data-ocid="grn.input"
                  value={form.poNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, poNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Supplier Name</Label>
                <Input
                  data-ocid="grn.input"
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplierName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Warehouse</Label>
                <Select
                  value={form.warehouseId}
                  onValueChange={(v) => {
                    const w = warehouses.find((x) => x.id === v);
                    setForm((f) => ({
                      ...f,
                      warehouseId: v,
                      warehouseName: w?.name || v,
                    }));
                  }}
                >
                  <SelectTrigger data-ocid="grn.select">
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
              <div>
                <Label>Received Date</Label>
                <Input
                  data-ocid="grn.input"
                  type="date"
                  value={form.receivedDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, receivedDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      status: v as GoodsReceiptNote["status"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="grn.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Draft",
                      "Received",
                      "Quality Checked",
                      "Accepted",
                      "Partially Accepted",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Row
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Product",
                        "Ordered",
                        "Received",
                        "Accepted",
                        "Rejected",
                        "Unit Cost",
                        "",
                      ].map((h) => (
                        <th key={h} className="px-2 py-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((it, i) => (
                      <tr
                        key={
                          it.productName
                            ? `form-${it.productName}-${i}`
                            : `form-row-${i}`
                        }
                        className="border-t"
                      >
                        <td className="px-1 py-1">
                          <Input
                            value={it.productName}
                            onChange={(e) =>
                              updateItem(i, "productName", e.target.value)
                            }
                            placeholder="Name"
                            className="w-32"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number"
                            value={it.orderedQty}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "orderedQty",
                                Number(e.target.value),
                              )
                            }
                            className="w-16"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number"
                            value={it.receivedQty}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "receivedQty",
                                Number(e.target.value),
                              )
                            }
                            className="w-16"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number"
                            value={it.acceptedQty}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "acceptedQty",
                                Number(e.target.value),
                              )
                            }
                            className="w-16"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number"
                            value={it.rejectedQty}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "rejectedQty",
                                Number(e.target.value),
                              )
                            }
                            className="w-16"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number"
                            value={it.unitCost}
                            onChange={(e) =>
                              updateItem(i, "unitCost", Number(e.target.value))
                            }
                            className="w-24"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(i)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <Label>Quality Notes</Label>
              <Textarea
                data-ocid="grn.textarea"
                value={form.qualityNotes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qualityNotes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="grn.cancel_button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="grn.submit_button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewGRN} onOpenChange={() => setViewGRN(null)}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="grn.modal"
        >
          <DialogHeader>
            <DialogTitle>{viewGRN?.grnNo} — GRN Details</DialogTitle>
          </DialogHeader>
          {viewGRN && (
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details" data-ocid="grn.tab">
                  Details
                </TabsTrigger>
                <TabsTrigger value="attachments" data-ocid="grn.tab">
                  Attachments
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">PO No:</span>{" "}
                      {viewGRN.poNumber}
                    </div>
                    <div>
                      <span className="text-slate-500">Supplier:</span>{" "}
                      {viewGRN.supplierName}
                    </div>
                    <div>
                      <span className="text-slate-500">Warehouse:</span>{" "}
                      {viewGRN.warehouseName}
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>{" "}
                      {viewGRN.receivedDate}
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>{" "}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewGRN.status] || ""}`}
                      >
                        {viewGRN.status}
                      </span>
                    </div>
                  </div>
                  <table className="w-full border rounded text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "Product",
                          "Ordered",
                          "Received",
                          "Accepted",
                          "Rejected",
                        ].map((h) => (
                          <th key={h} className="px-3 py-2 text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewGRN.items.map((it, i) => (
                        <tr
                          key={
                            it.productName
                              ? `view-${it.productName}-${i}`
                              : `view-row-${i}`
                          }
                          className="border-t"
                        >
                          <td className="px-3 py-2">{it.productName}</td>
                          <td className="px-3 py-2">{it.orderedQty}</td>
                          <td className="px-3 py-2">{it.receivedQty}</td>
                          <td className="px-3 py-2 text-green-600">
                            {it.acceptedQty}
                          </td>
                          <td className="px-3 py-2 text-red-600">
                            {it.rejectedQty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {viewGRN.qualityNotes && (
                    <p>
                      <span className="font-medium">Notes:</span>{" "}
                      {viewGRN.qualityNotes}
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="attachments">
                <AttachmentManager moduleKey="grn" recordId={viewGRN.id} />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button
              data-ocid="grn.close_button"
              variant="outline"
              onClick={() => setViewGRN(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

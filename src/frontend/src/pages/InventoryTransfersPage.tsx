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
import {
  type InventoryTransfer,
  type TransferItem,
  useStore,
} from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
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

type FormData = Omit<InventoryTransfer, "id" | "transferNo" | "createdAt">;

const EMPTY_FORM: FormData = {
  fromWarehouseId: "",
  fromWarehouseName: "",
  toWarehouseId: "",
  toWarehouseName: "",
  transferDate: new Date().toISOString().slice(0, 10),
  items: [{ productId: "", productName: "", qty: 1 }],
  status: "Draft",
  notes: "",
};

export default function InventoryTransfersPage() {
  const store = useStore();
  const { addStockMovement } = store;
  const transfers = store.inventoryTransfers;
  const warehouses = store.warehouses;

  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("all");
  const [filterTo, setFilterTo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [viewTransfer, setViewTransfer] = useState<InventoryTransfer | null>(
    null,
  );

  const filtered = transfers.filter((t) => {
    const matchSearch =
      !search || t.transferNo.toLowerCase().includes(search.toLowerCase());
    const matchFrom =
      filterFrom === "all" || t.fromWarehouseName === filterFrom;
    const matchTo = filterTo === "all" || t.toWarehouseName === filterTo;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchDateFrom = !filterDateFrom || t.transferDate >= filterDateFrom;
    const matchDateTo = !filterDateTo || t.transferDate <= filterDateTo;
    return (
      matchSearch &&
      matchFrom &&
      matchTo &&
      matchStatus &&
      matchDateFrom &&
      matchDateTo
    );
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }
  function openEdit(t: InventoryTransfer) {
    setForm({
      fromWarehouseId: t.fromWarehouseId,
      fromWarehouseName: t.fromWarehouseName,
      toWarehouseId: t.toWarehouseId,
      toWarehouseName: t.toWarehouseName,
      transferDate: t.transferDate,
      items: t.items,
      status: t.status,
      notes: t.notes,
    });
    setEditId(t.id);
    setShowForm(true);
  }

  function handleSave() {
    if (
      !form.fromWarehouseName ||
      !form.toWarehouseName ||
      form.fromWarehouseId === form.toWarehouseId
    )
      return;
    if (editId) {
      store.updateInventoryTransfer(editId, form);
    } else {
      store.addInventoryTransfer(form);
    }
    setShowForm(false);
  }

  function updateItem(
    idx: number,
    field: keyof TransferItem,
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
      items: [...f.items, { productId: "", productName: "", qty: 1 }],
    }));
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function handleExportPDF() {
    exportPDF(
      "Inventory Transfers",
      ["Transfer No", "From", "To", "Date", "Items", "Status"],
      filtered.map((t) => [
        t.transferNo,
        t.fromWarehouseName,
        t.toWarehouseName,
        t.transferDate,
        t.items.length,
        t.status,
      ]),
      "inventory_transfers.pdf",
      { reportTitle: "Inventory Transfers", generatedBy: getSessionUser() },
    );
  }

  function handleExportExcel() {
    exportExcel(
      "inventory_transfers.xlsx",
      "Transfers",
      ["Transfer No", "From", "To", "Date", "Items", "Status"],
      filtered.map((t) => [
        t.transferNo,
        t.fromWarehouseName,
        t.toWarehouseName,
        t.transferDate,
        t.items.length,
        t.status,
      ]),
      { reportTitle: "Inventory Transfers", generatedBy: getSessionUser() },
    );
  }

  // History: completed transfers grouped by route
  const completedTransfers = transfers.filter((t) => t.status === "Completed");
  const routeMap: Record<string, { count: number; totalItems: number }> = {};
  for (const t of completedTransfers) {
    const key = `${t.fromWarehouseName} → ${t.toWarehouseName}`;
    if (!routeMap[key]) routeMap[key] = { count: 0, totalItems: 0 };
    routeMap[key].count++;
    routeMap[key].totalItems += t.items.reduce((s, it) => s + it.qty, 0);
  }

  const warehouseNames = Array.from(
    new Set(transfers.flatMap((t) => [t.fromWarehouseName, t.toWarehouseName])),
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Transfers
          </h1>
          <p className="text-sm text-slate-500">
            Transfer stock between warehouses
          </p>
        </div>
        <Button
          data-ocid="transfer.primary_button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Transfer
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Transfers List</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
            <Input
              data-ocid="transfer.search_input"
              placeholder="Search transfer no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44"
            />
            <Select value={filterFrom} onValueChange={setFilterFrom}>
              <SelectTrigger data-ocid="transfer.select" className="w-44">
                <SelectValue placeholder="From Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (From)</SelectItem>
                {warehouseNames.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTo} onValueChange={setFilterTo}>
              <SelectTrigger data-ocid="transfer.select" className="w-44">
                <SelectValue placeholder="To Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (To)</SelectItem>
                {warehouseNames.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-ocid="transfer.select" className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["Draft", "In Transit", "Completed", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
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
                    "Transfer No",
                    "From",
                    "To",
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
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-400"
                      data-ocid="transfer.empty_state"
                    >
                      No transfers found
                    </td>
                  </tr>
                )}
                {filtered.map((t, idx) => (
                  <tr
                    key={t.id}
                    className="border-b hover:bg-slate-50"
                    data-ocid={`transfer.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {t.transferNo}
                    </td>
                    <td className="px-4 py-3">{t.fromWarehouseName}</td>
                    <td className="px-4 py-3">{t.toWarehouseName}</td>
                    <td className="px-4 py-3">{t.transferDate}</td>
                    <td className="px-4 py-3">{t.items.length} items</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ""}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewTransfer(t)}
                        >
                          View
                        </Button>
                        {t.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(t)}
                          >
                            Edit
                          </Button>
                        )}
                        {t.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600"
                            onClick={() =>
                              store.updateInventoryTransfer(t.id, {
                                status: "In Transit",
                              })
                            }
                          >
                            Send
                          </Button>
                        )}
                        {t.status === "In Transit" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => {
                              store.updateInventoryTransfer(t.id, {
                                status: "Completed",
                              });
                              // Record stock movements for each transferred item
                              for (const tItem of t.items) {
                                addStockMovement({
                                  itemId: tItem.productId || "",
                                  itemName: tItem.productName,
                                  type: "Transfer-Out",
                                  reference: t.transferNo,
                                  quantityChange: -tItem.qty,
                                  quantityAfter: 0,
                                  warehouseId: t.fromWarehouseId,
                                  warehouseName: t.fromWarehouseName,
                                  notes: `Transfer to ${t.toWarehouseName}`,
                                });
                                addStockMovement({
                                  itemId: tItem.productId || "",
                                  itemName: tItem.productName,
                                  type: "Transfer-In",
                                  reference: t.transferNo,
                                  quantityChange: tItem.qty,
                                  quantityAfter: 0,
                                  warehouseId: t.toWarehouseId,
                                  warehouseName: t.toWarehouseName,
                                  notes: `Transfer from ${t.fromWarehouseName}`,
                                });
                              }
                            }}
                          >
                            Complete
                          </Button>
                        )}
                        {(t.status === "Draft" ||
                          t.status === "In Transit") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              store.updateInventoryTransfer(t.id, {
                                status: "Cancelled",
                              })
                            }
                          >
                            Cancel
                          </Button>
                        )}
                        {t.status === "Draft" && (
                          <Button
                            data-ocid={`transfer.delete_button.${idx + 1}`}
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => store.deleteInventoryTransfer(t.id)}
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

        <TabsContent value="history" className="mt-4">
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {["Route", "Total Transfers", "Total Items Transferred"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-medium text-slate-600"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(routeMap).length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No completed transfers
                    </td>
                  </tr>
                )}
                {Object.entries(routeMap).map(([route, data]) => (
                  <tr key={route} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {route}
                    </td>
                    <td className="px-4 py-3">{data.count}</td>
                    <td className="px-4 py-3">{data.totalItems}</td>
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
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="transfer.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit" : "New"} Inventory Transfer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Warehouse</Label>
                <Select
                  value={form.fromWarehouseId}
                  onValueChange={(v) => {
                    const w = warehouses.find((x) => x.id === v);
                    setForm((f) => ({
                      ...f,
                      fromWarehouseId: v,
                      fromWarehouseName: w?.name || v,
                    }));
                  }}
                >
                  <SelectTrigger data-ocid="transfer.select">
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
              <div>
                <Label>To Warehouse</Label>
                <Select
                  value={form.toWarehouseId}
                  onValueChange={(v) => {
                    const w = warehouses.find((x) => x.id === v);
                    setForm((f) => ({
                      ...f,
                      toWarehouseId: v,
                      toWarehouseName: w?.name || v,
                    }));
                  }}
                >
                  <SelectTrigger data-ocid="transfer.select">
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
              <div>
                <Label>Transfer Date</Label>
                <Input
                  data-ocid="transfer.input"
                  type="date"
                  value={form.transferDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, transferDate: e.target.value }))
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
                      status: v as InventoryTransfer["status"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="transfer.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Draft", "In Transit", "Completed", "Cancelled"].map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <table className="w-full text-sm border rounded">
                <thead className="bg-slate-50">
                  <tr>
                    {["Product", "Qty", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left">
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
                      <td className="px-2 py-1">
                        <Input
                          value={it.productName}
                          onChange={(e) =>
                            updateItem(i, "productName", e.target.value)
                          }
                          placeholder="Product name"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={it.qty}
                          onChange={(e) =>
                            updateItem(i, "qty", Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </td>
                      <td className="px-2 py-1">
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
            <div>
              <Label>Notes</Label>
              <Textarea
                data-ocid="transfer.textarea"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="transfer.cancel_button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="transfer.submit_button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewTransfer} onOpenChange={() => setViewTransfer(null)}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-xl"
          data-ocid="transfer.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {viewTransfer?.transferNo} — Transfer Details
            </DialogTitle>
          </DialogHeader>
          {viewTransfer && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">From:</span>{" "}
                  {viewTransfer.fromWarehouseName}
                </div>
                <div>
                  <span className="text-slate-500">To:</span>{" "}
                  {viewTransfer.toWarehouseName}
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>{" "}
                  {viewTransfer.transferDate}
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewTransfer.status] || ""}`}
                  >
                    {viewTransfer.status}
                  </span>
                </div>
              </div>
              <table className="w-full border rounded">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {viewTransfer.items.map((it, i) => (
                    <tr
                      key={
                        it.productName
                          ? `view-${it.productName}-${i}`
                          : `view-row-${i}`
                      }
                      className="border-t"
                    >
                      <td className="px-3 py-2">{it.productName}</td>
                      <td className="px-3 py-2">{it.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {viewTransfer.notes && (
                <p>
                  <span className="font-medium">Notes:</span>{" "}
                  {viewTransfer.notes}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="transfer.close_button"
              variant="outline"
              onClick={() => setViewTransfer(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

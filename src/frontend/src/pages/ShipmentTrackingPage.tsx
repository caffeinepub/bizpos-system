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
import { type Shipment, type ShipmentItem, useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-700",
  Shipped: "bg-blue-100 text-blue-700",
  "In Transit": "bg-amber-100 text-amber-700",
  Delivered: "bg-green-100 text-green-700",
  Delayed: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
  Inbound: "bg-purple-100 text-purple-700",
  Outbound: "bg-cyan-100 text-cyan-700",
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

type FormData = Omit<Shipment, "id" | "shipmentNo" | "createdAt">;

const EMPTY_FORM: FormData = {
  type: "Inbound",
  carrier: "",
  trackingNumber: "",
  origin: "",
  destination: "",
  expectedDate: "",
  actualDate: "",
  status: "Pending",
  linkedRefNo: "",
  items: [{ productName: "", qty: 1 }],
  notes: "",
};

function ShipmentTable({
  shipments,
  onView,
  onEdit,
  onDelete,
  onStatusUpdate,
}: {
  shipments: Shipment[];
  onView: (s: Shipment) => void;
  onEdit: (s: Shipment) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (s: Shipment) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filtered = shipments.filter((s) => {
    const matchSearch =
      !search ||
      s.shipmentNo.toLowerCase().includes(search.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(search.toLowerCase());
    const matchCarrier =
      !filterCarrier ||
      s.carrier.toLowerCase().includes(filterCarrier.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchFrom = !filterFrom || s.expectedDate >= filterFrom;
    const matchTo = !filterTo || s.expectedDate <= filterTo;
    return matchSearch && matchCarrier && matchStatus && matchFrom && matchTo;
  });

  function handleExportPDF() {
    exportPDF(
      "Shipment Tracking",
      [
        "Shipment No",
        "Type",
        "Carrier",
        "Tracking",
        "Origin → Dest",
        "Expected",
        "Status",
      ],
      filtered.map((s) => [
        s.shipmentNo,
        s.type,
        s.carrier,
        s.trackingNumber,
        `${s.origin} → ${s.destination}`,
        s.expectedDate,
        s.status,
      ]),
      "shipments.pdf",
      { reportTitle: "Shipment Tracking", generatedBy: getSessionUser() },
    );
  }

  function handleExportExcel() {
    exportExcel(
      "shipments.xlsx",
      "Shipments",
      [
        "Shipment No",
        "Type",
        "Carrier",
        "Tracking",
        "Origin",
        "Destination",
        "Expected",
        "Actual",
        "Status",
      ],
      filtered.map((s) => [
        s.shipmentNo,
        s.type,
        s.carrier,
        s.trackingNumber,
        s.origin,
        s.destination,
        s.expectedDate,
        s.actualDate,
        s.status,
      ]),
      { reportTitle: "Shipment Tracking", generatedBy: getSessionUser() },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
        <Input
          data-ocid="shipment.search_input"
          placeholder="Search shipment / tracking no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Input
          placeholder="Carrier..."
          value={filterCarrier}
          onChange={(e) => setFilterCarrier(e.target.value)}
          className="w-36"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger data-ocid="shipment.select" className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {["Pending", "Shipped", "In Transit", "Delivered", "Delayed"].map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ),
            )}
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
                "Shipment No",
                "Type",
                "Carrier",
                "Tracking No",
                "Route",
                "Expected",
                "Actual",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 text-left font-medium text-slate-600"
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
                  colSpan={9}
                  className="px-4 py-8 text-center text-slate-400"
                  data-ocid="shipment.empty_state"
                >
                  No shipments found
                </td>
              </tr>
            )}
            {filtered.map((s, idx) => (
              <tr
                key={s.id}
                className="border-b hover:bg-slate-50"
                data-ocid={`shipment.item.${idx + 1}`}
              >
                <td className="px-3 py-3 font-medium text-blue-600">
                  {s.shipmentNo}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[s.type]}`}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="px-3 py-3">{s.carrier}</td>
                <td className="px-3 py-3 font-mono text-xs">
                  {s.trackingNumber}
                </td>
                <td className="px-3 py-3 text-xs">
                  {s.origin} → {s.destination}
                </td>
                <td className="px-3 py-3">{s.expectedDate}</td>
                <td className="px-3 py-3">{s.actualDate || "—"}</td>
                <td className="px-3 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || ""}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onView(s)}>
                      View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600"
                      onClick={() => onStatusUpdate(s)}
                    >
                      Status
                    </Button>
                    <Button
                      data-ocid={`shipment.delete_button.${idx + 1}`}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => onDelete(s.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ShipmentTrackingPage() {
  const store = useStore();
  const shipments = store.shipments;

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [viewShipment, setViewShipment] = useState<Shipment | null>(null);
  const [statusUpdateShipment, setStatusUpdateShipment] =
    useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<Shipment["status"]>("Pending");

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }
  function openEdit(s: Shipment) {
    setForm({
      type: s.type,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      origin: s.origin,
      destination: s.destination,
      expectedDate: s.expectedDate,
      actualDate: s.actualDate,
      status: s.status,
      linkedRefNo: s.linkedRefNo,
      items: s.items,
      notes: s.notes,
    });
    setEditId(s.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.carrier || !form.origin || !form.destination) return;
    if (editId) {
      store.updateShipment(editId, form);
    } else {
      store.addShipment(form);
    }
    setShowForm(false);
  }

  function handleStatusUpdate() {
    if (statusUpdateShipment) {
      store.updateShipment(statusUpdateShipment.id, {
        status: newStatus,
        actualDate:
          newStatus === "Delivered"
            ? new Date().toISOString().slice(0, 10)
            : statusUpdateShipment.actualDate,
      });
    }
    setStatusUpdateShipment(null);
  }

  function updateItem(
    idx: number,
    field: keyof ShipmentItem,
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
      items: [...f.items, { productName: "", qty: 1 }],
    }));
  }
  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  const inbound = shipments.filter((s) => s.type === "Inbound");
  const outbound = shipments.filter((s) => s.type === "Outbound");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Shipment Tracking
          </h1>
          <p className="text-sm text-slate-500">
            Track inbound and outbound shipments
          </p>
        </div>
        <Button
          data-ocid="shipment.primary_button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Shipment
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({shipments.length})</TabsTrigger>
          <TabsTrigger value="inbound">Inbound ({inbound.length})</TabsTrigger>
          <TabsTrigger value="outbound">
            Outbound ({outbound.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <ShipmentTable
            shipments={shipments}
            onView={setViewShipment}
            onEdit={openEdit}
            onDelete={store.deleteShipment}
            onStatusUpdate={(s) => {
              setStatusUpdateShipment(s);
              setNewStatus(s.status);
            }}
          />
        </TabsContent>
        <TabsContent value="inbound" className="mt-4">
          <ShipmentTable
            shipments={inbound}
            onView={setViewShipment}
            onEdit={openEdit}
            onDelete={store.deleteShipment}
            onStatusUpdate={(s) => {
              setStatusUpdateShipment(s);
              setNewStatus(s.status);
            }}
          />
        </TabsContent>
        <TabsContent value="outbound" className="mt-4">
          <ShipmentTable
            shipments={outbound}
            onView={setViewShipment}
            onEdit={openEdit}
            onDelete={store.deleteShipment}
            onStatusUpdate={(s) => {
              setStatusUpdateShipment(s);
              setNewStatus(s.status);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="shipment.dialog"
        >
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "New"} Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as Shipment["type"] }))
                  }
                >
                  <SelectTrigger data-ocid="shipment.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Carrier</Label>
                <Input
                  data-ocid="shipment.input"
                  value={form.carrier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, carrier: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Tracking Number</Label>
                <Input
                  data-ocid="shipment.input"
                  value={form.trackingNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trackingNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Linked Ref No</Label>
                <Input
                  data-ocid="shipment.input"
                  value={form.linkedRefNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkedRefNo: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Origin</Label>
                <Input
                  data-ocid="shipment.input"
                  value={form.origin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, origin: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input
                  data-ocid="shipment.input"
                  value={form.destination}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, destination: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Expected Date</Label>
                <Input
                  data-ocid="shipment.input"
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expectedDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Actual Date</Label>
                <Input
                  data-ocid="shipment.input"
                  type="date"
                  value={form.actualDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, actualDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as Shipment["status"] }))
                  }
                >
                  <SelectTrigger data-ocid="shipment.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Pending",
                      "Shipped",
                      "In Transit",
                      "Delivered",
                      "Delayed",
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
                data-ocid="shipment.textarea"
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
              data-ocid="shipment.cancel_button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="shipment.submit_button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewShipment} onOpenChange={() => setViewShipment(null)}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-xl"
          data-ocid="shipment.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {viewShipment?.shipmentNo} — Shipment Details
            </DialogTitle>
          </DialogHeader>
          {viewShipment && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Type:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[viewShipment.type]}`}
                  >
                    {viewShipment.type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Carrier:</span>{" "}
                  {viewShipment.carrier}
                </div>
                <div>
                  <span className="text-slate-500">Tracking:</span>{" "}
                  <span className="font-mono">
                    {viewShipment.trackingNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewShipment.status] || ""}`}
                  >
                    {viewShipment.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Origin:</span>{" "}
                  {viewShipment.origin}
                </div>
                <div>
                  <span className="text-slate-500">Destination:</span>{" "}
                  {viewShipment.destination}
                </div>
                <div>
                  <span className="text-slate-500">Expected:</span>{" "}
                  {viewShipment.expectedDate}
                </div>
                <div>
                  <span className="text-slate-500">Actual:</span>{" "}
                  {viewShipment.actualDate || "—"}
                </div>
                {viewShipment.linkedRefNo && (
                  <div>
                    <span className="text-slate-500">Ref No:</span>{" "}
                    {viewShipment.linkedRefNo}
                  </div>
                )}
              </div>
              {viewShipment.items.length > 0 && (
                <table className="w-full border rounded">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewShipment.items.map((it) => (
                      <tr
                        key={it.productName || `row-${Math.random()}`}
                        className="border-t"
                      >
                        <td className="px-3 py-2">{it.productName}</td>
                        <td className="px-3 py-2">{it.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {viewShipment.notes && (
                <p>
                  <span className="font-medium">Notes:</span>{" "}
                  {viewShipment.notes}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="shipment.close_button"
              variant="outline"
              onClick={() => setViewShipment(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog
        open={!!statusUpdateShipment}
        onOpenChange={() => setStatusUpdateShipment(null)}
      >
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-sm"
          data-ocid="shipment.modal"
        >
          <DialogHeader>
            <DialogTitle>
              Update Status — {statusUpdateShipment?.shipmentNo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>New Status</Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as Shipment["status"])}
            >
              <SelectTrigger data-ocid="shipment.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Pending",
                  "Shipped",
                  "In Transit",
                  "Delivered",
                  "Delayed",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="shipment.cancel_button"
              onClick={() => setStatusUpdateShipment(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="shipment.confirm_button"
              onClick={handleStatusUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

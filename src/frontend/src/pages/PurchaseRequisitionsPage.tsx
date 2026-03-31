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
  type PurchaseRequisition,
  type RequisitionItem,
  useStore,
} from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "PO Issued": "bg-purple-100 text-purple-700",
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

type FormData = Omit<PurchaseRequisition, "id" | "requisitionNo" | "createdAt">;

const EMPTY_FORM: FormData = {
  date: new Date().toISOString().slice(0, 10),
  requestedBy: "",
  department: "",
  items: [{ productId: "", productName: "", qty: 1, estimatedCost: 0 }],
  priority: "Medium",
  status: "Draft",
  notes: "",
};

export default function PurchaseRequisitionsPage() {
  const store = useStore();
  const reqs = store.purchaseRequisitions;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [viewReq, setViewReq] = useState<PurchaseRequisition | null>(null);

  const filtered = reqs.filter((r) => {
    const matchSearch =
      !search ||
      r.requisitionNo.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchPriority =
      filterPriority === "all" || r.priority === filterPriority;
    const matchFrom = !filterFrom || r.date >= filterFrom;
    const matchTo = !filterTo || r.date <= filterTo;
    return matchSearch && matchStatus && matchPriority && matchFrom && matchTo;
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(r: PurchaseRequisition) {
    setForm({
      date: r.date,
      requestedBy: r.requestedBy,
      department: r.department,
      items: r.items,
      priority: r.priority,
      status: r.status,
      notes: r.notes,
    });
    setEditId(r.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.requestedBy || !form.department) return;
    if (editId) {
      store.updatePurchaseRequisition(editId, form);
    } else {
      store.addPurchaseRequisition(form);
    }
    setShowForm(false);
  }

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { productId: "", productName: "", qty: 1, estimatedCost: 0 },
      ],
    }));
  }

  function updateItem(
    idx: number,
    field: keyof RequisitionItem,
    value: string | number,
  ) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it,
      ),
    }));
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function totalCost(items: RequisitionItem[]) {
    return items.reduce((sum, it) => sum + it.qty * it.estimatedCost, 0);
  }

  function handleExportPDF() {
    const meta = {
      reportTitle: "Purchase Requisitions",
      generatedBy: getSessionUser(),
      filters: [
        { label: "Status", value: filterStatus },
        { label: "Priority", value: filterPriority },
      ],
    };
    exportPDF(
      "Purchase Requisitions",
      [
        "Req No",
        "Date",
        "Requested By",
        "Dept",
        "Priority",
        "Est. Cost",
        "Status",
      ],
      filtered.map((r) => [
        r.requisitionNo,
        r.date,
        r.requestedBy,
        r.department,
        r.priority,
        totalCost(r.items).toLocaleString(),
        r.status,
      ]),
      "purchase_requisitions.pdf",
      meta,
    );
  }

  function handleExportExcel() {
    const meta = {
      reportTitle: "Purchase Requisitions",
      generatedBy: getSessionUser(),
      filters: [{ label: "Status", value: filterStatus }],
    };
    exportExcel(
      "purchase_requisitions.xlsx",
      "Requisitions",
      [
        "Req No",
        "Date",
        "Requested By",
        "Dept",
        "Priority",
        "Est. Cost",
        "Status",
      ],
      filtered.map((r) => [
        r.requisitionNo,
        r.date,
        r.requestedBy,
        r.department,
        r.priority,
        totalCost(r.items),
        r.status,
      ]),
      meta,
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Purchase Requisitions
          </h1>
          <p className="text-sm text-slate-500">
            Manage internal purchase requests and approvals
          </p>
        </div>
        <Button
          data-ocid="req.primary_button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Requisition
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Requisitions List</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
            <Input
              data-ocid="req.search_input"
              placeholder="Search req no / requested by..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-ocid="req.select" className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {[
                  "Draft",
                  "Submitted",
                  "Approved",
                  "Rejected",
                  "PO Issued",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger data-ocid="req.select" className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {["Low", "Medium", "High", "Urgent"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
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
          {/* Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Req No",
                    "Date",
                    "Requested By",
                    "Department",
                    "Priority",
                    "Est. Cost",
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
                      data-ocid="req.empty_state"
                    >
                      No requisitions found
                    </td>
                  </tr>
                )}
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b hover:bg-slate-50"
                    data-ocid={`req.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {r.requisitionNo}
                    </td>
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{r.requestedBy}</td>
                    <td className="px-4 py-3">{r.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      PKR {totalCost(r.items).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewReq(r)}
                        >
                          View
                        </Button>
                        {r.status === "Draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </Button>
                        )}
                        {r.status === "Draft" && (
                          <Button
                            data-ocid={`req.secondary_button.${idx + 1}`}
                            size="sm"
                            variant="ghost"
                            className="text-blue-600"
                            onClick={() =>
                              store.updatePurchaseRequisition(r.id, {
                                status: "Submitted",
                              })
                            }
                          >
                            Submit
                          </Button>
                        )}
                        {r.status === "Submitted" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() =>
                              store.updatePurchaseRequisition(r.id, {
                                status: "Approved",
                              })
                            }
                          >
                            Approve
                          </Button>
                        )}
                        {r.status === "Submitted" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              store.updatePurchaseRequisition(r.id, {
                                status: "Rejected",
                              })
                            }
                          >
                            Reject
                          </Button>
                        )}
                        {r.status === "Draft" && (
                          <Button
                            data-ocid={`req.delete_button.${idx + 1}`}
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              store.deletePurchaseRequisition(r.id)
                            }
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
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="req.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit" : "New"} Purchase Requisition
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  data-ocid="req.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Requested By</Label>
                <Input
                  data-ocid="req.input"
                  value={form.requestedBy}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requestedBy: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  data-ocid="req.input"
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      priority: v as PurchaseRequisition["priority"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="req.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High", "Urgent"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Item
                </Button>
              </div>
              <table className="w-full text-sm border rounded">
                <thead className="bg-slate-50">
                  <tr>
                    {["Product", "Qty", "Est. Cost/Unit", "Total", ""].map(
                      (h) => (
                        <th key={h} className="px-3 py-2 text-left">
                          {h}
                        </th>
                      ),
                    )}
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
                          className="w-20"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={it.estimatedCost}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "estimatedCost",
                              Number(e.target.value),
                            )
                          }
                          className="w-28"
                        />
                      </td>
                      <td className="px-2 py-1 font-medium">
                        {(it.qty * it.estimatedCost).toLocaleString()}
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
              <div className="text-right mt-2 font-semibold text-slate-700">
                Total Estimated: PKR {totalCost(form.items).toLocaleString()}
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                data-ocid="req.textarea"
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
              data-ocid="req.cancel_button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="req.submit_button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewReq} onOpenChange={() => setViewReq(null)}>
        <DialogContent className="max-w-2xl" data-ocid="req.modal">
          <DialogHeader>
            <DialogTitle>Requisition: {viewReq?.requisitionNo}</DialogTitle>
          </DialogHeader>
          {viewReq && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Date:</span> {viewReq.date}
                </div>
                <div>
                  <span className="text-slate-500">Requested By:</span>{" "}
                  {viewReq.requestedBy}
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>{" "}
                  {viewReq.department}
                </div>
                <div>
                  <span className="text-slate-500">Priority:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[viewReq.priority]}`}
                  >
                    {viewReq.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewReq.status]}`}
                  >
                    {viewReq.status}
                  </span>
                </div>
              </div>
              <table className="w-full border rounded text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Product", "Qty", "Est. Cost", "Total"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewReq.items.map((it) => (
                    <tr key={it.productName || "item"} className="border-t">
                      <td className="px-3 py-2">{it.productName}</td>
                      <td className="px-3 py-2">{it.qty}</td>
                      <td className="px-3 py-2">
                        {it.estimatedCost.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {(it.qty * it.estimatedCost).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {viewReq.notes && (
                <p className="text-slate-600">
                  <span className="font-medium">Notes:</span> {viewReq.notes}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="req.close_button"
              variant="outline"
              onClick={() => setViewReq(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

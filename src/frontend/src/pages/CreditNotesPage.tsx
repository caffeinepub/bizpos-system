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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleSearchSelect } from "@/components/ui/multi-select";
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
import { Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

export interface CreditNote {
  id: string;
  noteNumber: string;
  customerId: string;
  customerName: string;
  saleRef: string;
  date: string;
  items: {
    itemId: string;
    itemName: string;
    qty: number;
    price: number;
    subtotal: number;
  }[];
  totalAmount: number;
  reason: string;
  status: "Draft" | "Posted";
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
}

interface SaleRecord {
  id: string;
  saleDate?: string;
  createdAt?: string;
  customerId?: string;
  customerName?: string;
  items?: { itemId: string; itemName: string; qty: number; price: number }[];
  total?: number;
}

const STORAGE_KEY = "bizpos_credit_notes";

function load(): CreditNote[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function save(data: CreditNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSales(): SaleRecord[] {
  try {
    return JSON.parse(localStorage.getItem("bizpos_sales") || "[]");
  } catch {
    return [];
  }
}

export default function CreditNotesPage() {
  const { customers, items, adjustStock, postJournalEntry, accountMapping } =
    useStore();
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<CreditNote[]>(load);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<CreditNote | null>(null);

  const [form, setForm] = useState({
    customerId: "",
    saleRef: "",
    date: new Date().toISOString().slice(0, 10),
    reason: "",
    items: [{ itemId: "", itemName: "", qty: 1, price: 0, subtotal: 0 }],
  });

  const reload = () => setNotes(load());

  // Sales filtered by selected customer
  const customerSales = loadSales().filter(
    (s) => !form.customerId || s.customerId === form.customerId,
  );

  const filtered = notes.filter((n) => {
    const matchSearch =
      n.noteNumber.toLowerCase().includes(search.toLowerCase()) ||
      n.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || n.status === filterStatus;
    const matchCustomer =
      filterCustomer === "all" || n.customerId === filterCustomer;
    return matchSearch && matchStatus && matchCustomer;
  });

  const openAdd = () => {
    setEditingNote(null);
    setForm({
      customerId: "",
      saleRef: "",
      date: new Date().toISOString().slice(0, 10),
      reason: "",
      items: [{ itemId: "", itemName: "", qty: 1, price: 0, subtotal: 0 }],
    });
    setDialogOpen(true);
  };

  const openEdit = (n: CreditNote) => {
    setEditingNote(n);
    setForm({
      customerId: n.customerId,
      saleRef: n.saleRef,
      date: n.date,
      reason: n.reason,
      items: n.items.map((i) => ({ ...i })),
    });
    setDialogOpen(true);
  };

  // When a sale is selected, auto-populate items
  const onSelectSale = (sale: SaleRecord) => {
    const saleItems = (sale.items || []).map((si) => ({
      itemId: si.itemId,
      itemName: si.itemName,
      qty: si.qty,
      price: si.price,
      subtotal: si.qty * si.price,
    }));
    setForm((f) => ({
      ...f,
      saleRef: sale.id,
      items:
        saleItems.length > 0
          ? saleItems
          : [{ itemId: "", itemName: "", qty: 1, price: 0, subtotal: 0 }],
    }));
  };

  const addFormItem = () =>
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { itemId: "", itemName: "", qty: 1, price: 0, subtotal: 0 },
      ],
    }));

  const removeFormItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateFormItem = (
    idx: number,
    field: string,
    value: string | number,
  ) => {
    setForm((f) => {
      const updated = f.items.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [field]: value };
        if (field === "itemId") {
          const found = items.find((it) => it.id === value);
          newItem.itemName = found ? found.name : "";
          newItem.price = found ? found.salePrice : 0;
          newItem.subtotal = newItem.qty * newItem.price;
        } else if (field === "qty" || field === "price") {
          const qty = field === "qty" ? Number(value) : newItem.qty;
          const price = field === "price" ? Number(value) : newItem.price;
          newItem.subtotal = qty * price;
        }
        return newItem;
      });
      return { ...f, items: updated };
    });
  };

  const totalAmount = form.items.reduce((s, i) => s + i.subtotal, 0);

  const handleSave = (status: "Draft" | "Posted") => {
    if (!form.customerId || !form.date || form.items.some((i) => !i.itemId)) {
      toast.error("Fill all required fields");
      return;
    }
    const customer = customers.find((c) => c.id === form.customerId);
    const all = load();
    const now = new Date().toISOString();
    const user = currentUser?.name ?? "System";

    if (editingNote) {
      if (editingNote.status === "Posted") {
        toast.error("Cannot edit a posted credit note");
        return;
      }
      const updated = all.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              customerId: form.customerId,
              customerName: customer?.name ?? "",
              saleRef: form.saleRef,
              date: form.date,
              reason: form.reason,
              items: form.items,
              totalAmount,
              status,
              modifiedBy: user,
              modifiedAt: now,
            }
          : n,
      );
      save(updated);
      toast.success("Credit note updated");
    } else {
      const existing = load();
      const num = String(existing.length + 1).padStart(3, "0");
      const newNote: CreditNote = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        noteNumber: `CN-${new Date().getFullYear()}-${num}`,
        customerId: form.customerId,
        customerName: customer?.name ?? "",
        saleRef: form.saleRef,
        date: form.date,
        reason: form.reason,
        items: form.items,
        totalAmount,
        status,
        createdBy: user,
        createdAt: now,
        modifiedBy: user,
        modifiedAt: now,
      };
      if (status === "Posted") {
        for (const item of form.items) {
          adjustStock(item.itemId, item.qty);
        }
        const salesRevId =
          accountMapping?.salesRevenueId || "acc-400-01-01-0001";
        const arId = accountMapping?.accountsReceivableId || "acc-100-02-04";
        postJournalEntry?.({
          date: newNote.date,
          reference: newNote.noteNumber,
          description: `Credit Note ${newNote.noteNumber} - ${newNote.customerName}`,
          lines: [
            {
              accountId: salesRevId,
              accountName: "PRODUCT SALES",
              debit: totalAmount,
              credit: 0,
            },
            {
              accountId: arId,
              accountName: "ACCOUNTS RECEIVABLE",
              debit: 0,
              credit: totalAmount,
            },
          ],
        });
      }
      save([...existing, newNote]);
      toast.success("Credit note created");
    }
    reload();
    setDialogOpen(false);
  };

  const handlePost = (n: CreditNote) => {
    if (n.status === "Posted") return;
    const all = load();
    const updated = all.map((x) =>
      x.id === n.id
        ? {
            ...x,
            status: "Posted" as const,
            modifiedBy: currentUser?.name ?? "System",
            modifiedAt: new Date().toISOString(),
          }
        : x,
    );
    for (const item of n.items) {
      adjustStock(item.itemId, item.qty);
    }
    const salesRevId = accountMapping?.salesRevenueId || "acc-400-01-01-0001";
    const arId = accountMapping?.accountsReceivableId || "acc-100-02-04";
    postJournalEntry?.({
      date: n.date,
      reference: n.noteNumber,
      description: `Credit Note ${n.noteNumber} - ${n.customerName}`,
      lines: [
        {
          accountId: salesRevId,
          accountName: "PRODUCT SALES",
          debit: n.totalAmount,
          credit: 0,
        },
        {
          accountId: arId,
          accountName: "ACCOUNTS RECEIVABLE",
          debit: 0,
          credit: n.totalAmount,
        },
      ],
    });
    save(updated);
    reload();
    toast.success("Credit note posted — stock restocked");
  };

  const handleDelete = (id: string) => {
    save(load().filter((n) => n.id !== id));
    reload();
    toast.success("Deleted");
    setDeleteId(null);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((n) => [
      n.noteNumber,
      n.date,
      n.customerName,
      n.saleRef,
      n.totalAmount.toLocaleString(),
      n.reason,
      n.status,
    ]);
    exportPDF(
      "Credit Notes",
      ["Note#", "Date", "Customer", "Sale Ref", "Amount", "Reason", "Status"],
      rows,
      "credit-notes.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Credit Notes",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((n) => [
      n.noteNumber,
      n.date,
      n.customerName,
      n.saleRef,
      n.totalAmount,
      n.reason,
      n.status,
      n.createdBy,
      n.createdAt,
    ]);
    exportExcel(
      "credit-notes.xlsx",
      "Credit Notes",
      [
        "Note#",
        "Date",
        "Customer",
        "Sale Ref",
        "Amount",
        "Reason",
        "Status",
        "Created By",
        "Created At",
      ],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Credit Notes",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Credit Notes</h1>
            <PageHelp pageId="credit-notes" />
          </div>
          <p className="text-gray-600 mt-1">
            Sales returns &amp; credit notes — restocks inventory on posting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={openAdd} data-ocid="credit_notes.primary_button">
            <Plus className="h-4 w-4 mr-2" />
            New Credit Note
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search by note# or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Posted">Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sale Ref</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="credit_notes.empty_state"
                  >
                    No credit notes found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((n, i) => (
                  <TableRow key={n.id} data-ocid={`credit_notes.item.${i + 1}`}>
                    <TableCell className="font-medium">
                      {n.noteNumber}
                    </TableCell>
                    <TableCell>{n.date}</TableCell>
                    <TableCell>{n.customerName}</TableCell>
                    <TableCell>{n.saleRef || "—"}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {n.reason}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {n.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          n.status === "Posted" ? "default" : "secondary"
                        }
                      >
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {n.createdBy}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {n.status === "Draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(n)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handlePost(n)}
                            >
                              Post
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteId(n.id)}
                          data-ocid={`credit_notes.delete_button.${i + 1}`}
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
          className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="credit_notes.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Credit Note" : "New Credit Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              <strong>How to use:</strong> Select the customer, then optionally
              pick the original sale to auto-fill return items. Adjust
              quantities and prices as needed before saving.
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Customer dropdown */}
              <div>
                <Label>Customer *</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) => {
                    setForm((f) => ({
                      ...f,
                      customerId: v,
                      saleRef: "",
                      items: [
                        {
                          itemId: "",
                          itemName: "",
                          qty: 1,
                          price: 0,
                          subtotal: 0,
                        },
                      ],
                    }));
                  }}
                >
                  <SelectTrigger data-ocid="credit_notes.select">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="credit_notes.input"
                />
              </div>

              {/* Original Sale — searchable combobox */}
              <div className="col-span-2">
                <Label>Original Sale (optional)</Label>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Select a sale to auto-fill return items. Leave blank to add
                  items manually.
                </p>
                <SingleSearchSelect
                  data-ocid="credit_notes.select"
                  options={customerSales.map((s) => ({
                    value: s.id,
                    label: s.id,
                    description: `${s.saleDate || s.createdAt?.slice(0, 10) || ""} • ${s.customerName || ""} • ${(s.total || 0).toLocaleString()}`,
                  }))}
                  value={form.saleRef}
                  onChange={(val) => {
                    if (val) {
                      const s = customerSales.find((x) => x.id === val);
                      if (s) onSelectSale(s);
                    } else {
                      setForm((f) => ({ ...f, saleRef: "" }));
                    }
                  }}
                  placeholder={
                    form.customerId
                      ? "Search sales for this customer..."
                      : "Select a customer first"
                  }
                  disabled={!form.customerId}
                  emptyMessage={
                    form.customerId
                      ? "No sales found for this customer."
                      : "Please select a customer first."
                  }
                />
                {form.saleRef && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline mt-1"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        saleRef: "",
                        items: [
                          {
                            itemId: "",
                            itemName: "",
                            qty: 1,
                            price: 0,
                            subtotal: 0,
                          },
                        ],
                      }))
                    }
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Reason */}
              <div className="col-span-2">
                <Label>Reason *</Label>
                <Input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="e.g. Damaged goods, Wrong item delivered"
                  data-ocid="credit_notes.input"
                />
              </div>
            </div>

            {/* Return Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Return Items</Label>
                <Button size="sm" variant="outline" onClick={addFormItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.map((item, idx) => (
                      <TableRow key={`item-row-${String(idx)}`}>
                        <TableCell className="min-w-[200px]">
                          {/* Searchable item picker */}
                          <SingleSearchSelect
                            options={items.map((it) => ({
                              value: it.id,
                              label: it.name,
                              description: it.sku || undefined,
                            }))}
                            value={item.itemId}
                            onChange={(val) =>
                              updateFormItem(idx, "itemId", val)
                            }
                            placeholder="Select item..."
                            emptyMessage="No items found."
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.qty}
                            min={1}
                            onChange={(e) =>
                              updateFormItem(idx, "qty", Number(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.price}
                            min={0}
                            onChange={(e) =>
                              updateFormItem(
                                idx,
                                "price",
                                Number(e.target.value),
                              )
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => removeFormItem(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-3">
                <div className="bg-gray-50 border rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-600 mr-3">
                    Total Return Amount:
                  </span>
                  <span className="font-bold text-lg">
                    {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {editingNote && (
              <p className="text-xs text-gray-500">
                Created by {editingNote.createdBy} on{" "}
                {new Date(editingNote.createdAt).toLocaleString()} | Last
                modified by {editingNote.modifiedBy} on{" "}
                {new Date(editingNote.modifiedAt).toLocaleString()}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="credit_notes.cancel_button"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave("Draft")}
                data-ocid="credit_notes.save_button"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave("Posted")}
                data-ocid="credit_notes.submit_button"
              >
                Save &amp; Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="credit_notes.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="credit_notes.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="credit_notes.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

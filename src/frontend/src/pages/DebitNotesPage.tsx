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
import { Card, CardContent } from "@/components/ui/card";
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
import { Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

export interface DebitNote {
  id: string;
  noteNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseRef: string;
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

const STORAGE_KEY = "bizpos_debit_notes";
function load(): DebitNote[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function save(data: DebitNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function DebitNotesPage() {
  const { suppliers, items, adjustStock, postJournalEntry, accountMapping } =
    useStore();
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<DebitNote[]>(load);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<DebitNote | null>(null);

  const [form, setForm] = useState({
    supplierId: "",
    purchaseRef: "",
    date: new Date().toISOString().slice(0, 10),
    reason: "",
    items: [{ itemId: "", itemName: "", qty: 1, price: 0, subtotal: 0 }],
  });

  const reload = () => setNotes(load());

  const filtered = notes.filter((n) => {
    const matchSearch =
      n.noteNumber.toLowerCase().includes(search.toLowerCase()) ||
      n.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || n.status === filterStatus;
    const matchSupplier =
      filterSupplier === "all" || n.supplierId === filterSupplier;
    return matchSearch && matchStatus && matchSupplier;
  });

  const openAdd = () => {
    setEditingNote(null);
    setForm({
      supplierId: "",
      purchaseRef: "",
      date: new Date().toISOString().slice(0, 10),
      reason: "",
      items: [{ itemId: "", itemName: "", qty: 1, price: 0, subtotal: 0 }],
    });
    setDialogOpen(true);
  };

  const openEdit = (n: DebitNote) => {
    setEditingNote(n);
    setForm({
      supplierId: n.supplierId,
      purchaseRef: n.purchaseRef,
      date: n.date,
      reason: n.reason,
      items: n.items.map((i) => ({ ...i })),
    });
    setDialogOpen(true);
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
          newItem.price = found ? found.costPrice : 0;
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
    if (!form.supplierId || !form.date || form.items.some((i) => !i.itemId)) {
      toast.error("Fill all required fields");
      return;
    }
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    const all = load();
    const now = new Date().toISOString();
    const user = currentUser?.name ?? "System";

    if (editingNote) {
      if (editingNote.status === "Posted") {
        toast.error("Cannot edit a posted debit note");
        return;
      }
      const updated = all.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              supplierId: form.supplierId,
              supplierName: supplier?.name ?? "",
              purchaseRef: form.purchaseRef,
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
      toast.success("Debit note updated");
    } else {
      const num = String(all.length + 1).padStart(3, "0");
      const newNote: DebitNote = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        noteNumber: `DN-${new Date().getFullYear()}-${num}`,
        supplierId: form.supplierId,
        supplierName: supplier?.name ?? "",
        purchaseRef: form.purchaseRef,
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
          adjustStock(item.itemId, -item.qty);
        }
        // Post journal: Dr Accounts Payable / Cr Inventory Asset
        const apId = accountMapping?.accountsPayableId || "acc-300-02-01-0001";
        const invId = accountMapping?.inventoryAssetId || "acc-100-02-03";
        postJournalEntry?.({
          date: newNote.date,
          reference: newNote.noteNumber,
          description: `Debit Note ${newNote.noteNumber} - ${newNote.supplierName}`,
          lines: [
            {
              accountId: apId,
              accountName: "ACCOUNTS PAYABLE",
              debit: totalAmount,
              credit: 0,
            },
            {
              accountId: invId,
              accountName: "STOCK IN HAND",
              debit: 0,
              credit: totalAmount,
            },
          ],
        });
      }
      save([...all, newNote]);
      toast.success("Debit note created");
    }
    reload();
    setDialogOpen(false);
  };

  const handlePost = (n: DebitNote) => {
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
      adjustStock(item.itemId, -item.qty);
    }
    // Post journal: Dr Accounts Payable / Cr Inventory Asset
    const apId = accountMapping?.accountsPayableId || "acc-300-02-01-0001";
    const invId = accountMapping?.inventoryAssetId || "acc-100-02-03";
    postJournalEntry?.({
      date: n.date,
      reference: n.noteNumber,
      description: `Debit Note ${n.noteNumber} - ${n.supplierName}`,
      lines: [
        {
          accountId: apId,
          accountName: "ACCOUNTS PAYABLE",
          debit: n.totalAmount,
          credit: 0,
        },
        {
          accountId: invId,
          accountName: "STOCK IN HAND",
          debit: 0,
          credit: n.totalAmount,
        },
      ],
    });
    save(updated);
    reload();
    toast.success("Debit note posted — stock reduced");
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
      n.supplierName,
      n.purchaseRef,
      n.totalAmount.toLocaleString(),
      n.reason,
      n.status,
    ]);
    exportPDF(
      "Debit Notes",
      [
        "Note#",
        "Date",
        "Supplier",
        "Purchase Ref",
        "Amount",
        "Reason",
        "Status",
      ],
      rows,
      "debit-notes.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Debit Notes",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((n) => [
      n.noteNumber,
      n.date,
      n.supplierName,
      n.purchaseRef,
      n.totalAmount,
      n.reason,
      n.status,
      n.createdBy,
      n.createdAt,
    ]);
    exportExcel(
      "debit-notes.xlsx",
      "Debit Notes",
      [
        "Note#",
        "Date",
        "Supplier",
        "Purchase Ref",
        "Amount",
        "Reason",
        "Status",
        "Created By",
        "Created At",
      ],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Debit Notes",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debit Notes</h1>
          <p className="text-gray-600 mt-1">
            Purchase returns & debit notes — reduces inventory on posting
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
          <Button onClick={openAdd} data-ocid="debit_notes.primary_button">
            <Plus className="h-4 w-4 mr-2" />
            New Debit Note
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search by note# or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-44">
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
                <TableHead>Supplier</TableHead>
                <TableHead>Purchase Ref</TableHead>
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
                    data-ocid="debit_notes.empty_state"
                  >
                    No debit notes found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((n, i) => (
                  <TableRow key={n.id} data-ocid={`debit_notes.item.${i + 1}`}>
                    <TableCell className="font-medium">
                      {n.noteNumber}
                    </TableCell>
                    <TableCell>{n.date}</TableCell>
                    <TableCell>{n.supplierName}</TableCell>
                    <TableCell>{n.purchaseRef || "—"}</TableCell>
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
                          data-ocid={`debit_notes.delete_button.${i + 1}`}
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
          data-ocid="debit_notes.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Debit Note" : "New Debit Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, supplierId: v }))
                  }
                >
                  <SelectTrigger data-ocid="debit_notes.select">
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
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="debit_notes.input"
                />
              </div>
              <div>
                <Label>Original Purchase Reference</Label>
                <Input
                  value={form.purchaseRef}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchaseRef: e.target.value }))
                  }
                  placeholder="e.g. PO-2026-001"
                  data-ocid="debit_notes.input"
                />
              </div>
              <div>
                <Label>Reason *</Label>
                <Input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Reason for return"
                  data-ocid="debit_notes.input"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Return Items</Label>
                <Button size="sm" variant="outline" onClick={addFormItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.items.map((item, idx) => (
                    <TableRow key={`${item.itemId}-${String(idx)}`}>
                      <TableCell>
                        <Select
                          value={item.itemId}
                          onValueChange={(v) =>
                            updateFormItem(idx, "itemId", v)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((it) => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            updateFormItem(idx, "price", Number(e.target.value))
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
              <div className="text-right mt-2 font-bold text-lg">
                Total: {totalAmount.toLocaleString()}
              </div>
            </div>
            {editingNote && (
              <p className="text-xs text-gray-500">
                Created by {editingNote.createdBy} on{" "}
                {new Date(editingNote.createdAt).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="debit_notes.cancel_button"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave("Draft")}
                data-ocid="debit_notes.save_button"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave("Posted")}
                data-ocid="debit_notes.submit_button"
              >
                Save &amp; Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="debit_notes.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debit Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="debit_notes.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="debit_notes.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

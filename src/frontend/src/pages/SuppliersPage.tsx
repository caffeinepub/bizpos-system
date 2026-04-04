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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AttachmentManager from "../components/AttachmentManager";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { Supplier } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

export default function SuppliersPage() {
  const { currentUser } = useAuth();
  const {
    suppliers,
    purchases,
    payments,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [ledgerSupplierId, setLedgerSupplierId] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingSupplier(null);
    setForm({ name: "", phone: "", email: "", address: "" });
    setDialogOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, form);
      toast.success("Supplier updated");
    } else {
      addSupplier(form);
      toast.success("Supplier added");
    }
    setDialogOpen(false);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((s) => [s.name, s.phone, s.email, s.address]);
    exportPDF(
      "Suppliers List",
      ["Name", "Phone", "Email", "Address"],
      rows,
      "suppliers.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Suppliers",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((s) => [s.name, s.phone, s.email, s.address]);
    exportExcel(
      "suppliers.xlsx",
      "Suppliers",
      ["Name", "Phone", "Email", "Address"],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Supplier List",
        generatedBy: currentUser?.name,
        filters: search ? [{ label: "Search", value: search }] : [],
      },
    );
  };

  // Supplier Ledger
  const ledgerEntries = useMemo(() => {
    if (!ledgerSupplierId) return [];
    const entries: {
      date: string;
      ref: string;
      type: string;
      debit: number;
      credit: number;
    }[] = [];

    // Opening balance
    try {
      const obs = JSON.parse(
        localStorage.getItem("bizpos_opening_balances") || "[]",
      );
      const ob = obs.find(
        (x: any) =>
          x.entityId === ledgerSupplierId && x.entityType === "supplier",
      );
      if (ob && ob.amount !== 0) {
        entries.push({
          date: ob.date,
          ref: "Opening Balance",
          type: "Opening",
          debit: ob.amount < 0 ? Math.abs(ob.amount) : 0,
          credit: ob.amount > 0 ? ob.amount : 0,
        });
      }
    } catch {
      /* ignore */
    }

    const supp = suppliers.find((s) => s.id === ledgerSupplierId);
    if (!supp) return entries;

    // Purchase invoices
    const suppPurchases = purchases.filter(
      (p) => p.supplierId === ledgerSupplierId,
    );
    for (const p of suppPurchases)
      entries.push({
        date: p.purchaseDate,
        ref: p.id,
        type: "Purchase",
        debit: 0,
        credit: p.total,
      });

    // Payments to supplier
    const suppPayments = payments.filter(
      (p) =>
        (p as any).supplierId === ledgerSupplierId ||
        (p as any).supplierName === supp.name,
    );
    for (const p of suppPayments)
      entries.push({
        date:
          (p as any).paymentDate || (p as any).createdAt?.slice(0, 10) || "",
        ref: p.id,
        type: "Payment",
        debit: p.amount,
        credit: 0,
      });

    // Debit notes
    try {
      const dns = JSON.parse(
        localStorage.getItem("bizpos_debit_notes") || "[]",
      );
      for (const dn of dns.filter(
        (x: any) => x.supplierId === ledgerSupplierId && x.status === "Posted",
      )) {
        entries.push({
          date: dn.date,
          ref: dn.noteNumber,
          type: "Debit Note",
          debit: dn.totalAmount,
          credit: 0,
        });
      }
    } catch {
      /* ignore */
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    return entries.map((e) => {
      balance += e.credit - e.debit;
      return { ...e, balance };
    });
  }, [ledgerSupplierId, suppliers, purchases, payments]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your supplier contacts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="suppliers.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="suppliers.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={openAdd} data-ocid="suppliers.open_modal_button">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" data-ocid="suppliers.tab">
            Supplier List
          </TabsTrigger>
          <TabsTrigger value="ledger" data-ocid="suppliers.tab">
            Supplier Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Supplier List ({filtered.length})
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suppliers..."
                  className="pl-9"
                  data-ocid="suppliers.search_input"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                        data-ocid="suppliers.empty_state"
                      >
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s, i) => (
                      <TableRow
                        key={s.id}
                        data-ocid={`suppliers.item.${i + 1}`}
                      >
                        <TableCell className="font-semibold">
                          {s.name}
                        </TableCell>
                        <TableCell>{s.phone}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell className="text-gray-600 max-w-48 truncate">
                          {s.address}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(s)}
                              data-ocid={`suppliers.edit_button.${i + 1}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(s.id)}
                              className="text-red-600 hover:bg-red-50"
                              data-ocid={`suppliers.delete_button.${i + 1}`}
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
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">Supplier Ledger</CardTitle>
                <Select
                  value={ledgerSupplierId}
                  onValueChange={setLedgerSupplierId}
                >
                  <SelectTrigger className="w-52" data-ocid="suppliers.select">
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
            </CardHeader>
            <CardContent>
              {!ledgerSupplierId ? (
                <p
                  className="text-center text-muted-foreground py-8"
                  data-ocid="suppliers.empty_state"
                >
                  Select a supplier to view their ledger
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((e, i) => (
                        <TableRow
                          key={`${e.ref}-${e.date}-${String(i)}`}
                          data-ocid={`suppliers.ledger.item.${i + 1}`}
                        >
                          <TableCell>{e.date}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {e.ref}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {e.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {e.debit > 0 ? e.debit.toLocaleString() : ""}
                          </TableCell>
                          <TableCell className="text-right">
                            {e.credit > 0 ? e.credit.toLocaleString() : ""}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${(e as any).balance > 0 ? "text-orange-600" : "text-green-600"}`}
                          >
                            {(e as any).balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="suppliers.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {editingSupplier && (
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="details">
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    data-ocid="suppliers.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      data-ocid="suppliers.input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      data-ocid="suppliers.input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    data-ocid="suppliers.input"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="suppliers.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    data-ocid="suppliers.submit_button"
                  >
                    {editingSupplier ? "Update" : "Add"} Supplier
                  </Button>
                </div>
              </div>
            </TabsContent>
            {editingSupplier && (
              <TabsContent value="attachments">
                <AttachmentManager
                  moduleKey="suppliers"
                  recordId={editingSupplier.id}
                />
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this supplier?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteSupplier(deleteId!);
                setDeleteId(null);
                toast.success("Supplier deleted");
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

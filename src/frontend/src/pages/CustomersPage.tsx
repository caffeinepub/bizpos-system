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
import type { Customer } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

interface CustomerGroup {
  id: string;
  name: string;
  discount: number;
  status: string;
}
function loadGroups(): CustomerGroup[] {
  try {
    return JSON.parse(localStorage.getItem("bizpos_customer_groups") || "[]");
  } catch {
    return [];
  }
}

export default function CustomersPage() {
  const { currentUser } = useAuth();
  const {
    customers,
    sales,
    payments,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addLog,
  } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [ledgerCustomerId, setLedgerCustomerId] = useState("");
  const groups = loadGroups();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    groupId: "",
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: "", phone: "", email: "", address: "", groupId: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      groupId: (c as any).groupId || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    const grp = groups.find((g) => g.id === form.groupId);
    const data = { ...form, groupName: grp?.name || "" };
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
      addLog("Customers", "update", "Customer updated");
      toast.success("Customer updated");
    } else {
      addCustomer(data);
      addLog("Customers", "create", "Customer created");
      toast.success("Customer added");
    }
    setDialogOpen(false);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((c) => [c.name, c.phone, c.email, c.address]);
    exportPDF(
      "Customers List",
      ["Name", "Phone", "Email", "Address"],
      rows,
      "customers.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Customers",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((c) => [c.name, c.phone, c.email, c.address]);
    exportExcel(
      "customers.xlsx",
      "Customers",
      ["Name", "Phone", "Email", "Address"],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Customer List",
        generatedBy: currentUser?.name,
        filters: search ? [{ label: "Search", value: search }] : [],
      },
    );
  };

  // Customer ledger
  const ledgerEntries = useMemo(() => {
    if (!ledgerCustomerId) return [];
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
          x.entityId === ledgerCustomerId && x.entityType === "customer",
      );
      if (ob && ob.amount !== 0) {
        entries.push({
          date: ob.date,
          ref: "Opening Balance",
          type: "Opening",
          debit: ob.amount > 0 ? ob.amount : 0,
          credit: ob.amount < 0 ? Math.abs(ob.amount) : 0,
        });
      }
    } catch {
      /* ignore */
    }

    const cust = customers.find((c) => c.id === ledgerCustomerId);
    if (!cust) return entries;

    // Sales invoices
    const custSales = sales.filter(
      (s) =>
        s.customerName === cust.name ||
        (s as any).customerId === ledgerCustomerId,
    );
    for (const s of custSales)
      entries.push({
        date: s.saleDate,
        ref: s.id,
        type: "Invoice",
        debit: s.total,
        credit: 0,
      });

    // Payments
    const custPayments = payments.filter(
      (p) =>
        (p as any).customerId === ledgerCustomerId ||
        (p as any).customerName === cust.name,
    );
    for (const p of custPayments)
      entries.push({
        date:
          (p as any).paymentDate || (p as any).createdAt?.slice(0, 10) || "",
        ref: p.id,
        type: "Payment",
        debit: 0,
        credit: p.amount,
      });

    // Credit notes
    try {
      const cns = JSON.parse(
        localStorage.getItem("bizpos_credit_notes") || "[]",
      );
      for (const cn of cns.filter(
        (x: any) => x.customerId === ledgerCustomerId && x.status === "Posted",
      )) {
        entries.push({
          date: cn.date,
          ref: cn.noteNumber,
          type: "Credit Note",
          debit: 0,
          credit: cn.totalAmount,
        });
      }
    } catch {
      /* ignore */
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));

    let balance = 0;
    return entries.map((e) => {
      balance += e.debit - e.credit;
      return { ...e, balance };
    });
  }, [ledgerCustomerId, customers, sales, payments]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer contacts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="customers.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="customers.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={openAdd} data-ocid="customers.open_modal_button">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" data-ocid="customers.tab">
            Customer List
          </TabsTrigger>
          <TabsTrigger value="ledger" data-ocid="customers.tab">
            Customer Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Customer List ({filtered.length})
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="pl-9"
                  data-ocid="customers.search_input"
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
                    <TableHead>Group</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                        data-ocid="customers.empty_state"
                      >
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c, i) => (
                      <TableRow
                        key={c.id}
                        data-ocid={`customers.item.${i + 1}`}
                      >
                        <TableCell className="font-semibold">
                          {c.name}
                        </TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>
                          {(c as any).groupName && (
                            <Badge variant="outline" className="text-xs">
                              {(c as any).groupName}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-48 truncate">
                          {c.address}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(c)}
                              data-ocid={`customers.edit_button.${i + 1}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(c.id)}
                              className="text-red-600 hover:bg-red-50"
                              data-ocid={`customers.delete_button.${i + 1}`}
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
                <CardTitle className="text-base">Customer Ledger</CardTitle>
                <Select
                  value={ledgerCustomerId}
                  onValueChange={setLedgerCustomerId}
                >
                  <SelectTrigger className="w-52" data-ocid="customers.select">
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
            </CardHeader>
            <CardContent>
              {!ledgerCustomerId ? (
                <p
                  className="text-center text-muted-foreground py-8"
                  data-ocid="customers.empty_state"
                >
                  Select a customer to view their ledger
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
                          data-ocid={`customers.ledger.item.${i + 1}`}
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
                            className={`text-right font-medium ${(e as any).balance > 0 ? "text-red-600" : "text-green-600"}`}
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
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {editingCustomer && (
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
                    data-ocid="customers.input"
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
                      data-ocid="customers.input"
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
                      data-ocid="customers.input"
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
                    data-ocid="customers.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Group</Label>
                  <Select
                    value={form.groupId || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, groupId: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger data-ocid="customers.select">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Group</SelectItem>
                      {groups
                        .filter((g) => g.status === "Active")
                        .map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({g.discount}% off)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="customers.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    data-ocid="customers.submit_button"
                  >
                    {editingCustomer ? "Update" : "Add"} Customer
                  </Button>
                </div>
              </div>
            </TabsContent>
            {editingCustomer && (
              <TabsContent value="attachments">
                <AttachmentManager
                  moduleKey="customers"
                  recordId={editingCustomer.id}
                />
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this customer? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteCustomer(deleteId!);
                addLog("Customers", "delete", `Customer deleted: ${deleteId}`);
                setDeleteId(null);
                toast.success("Customer deleted");
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

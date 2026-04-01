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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Store,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("bizpos-store-updated"));
}

function generateId() {
  return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>(() =>
    load<Company[]>("bizpos_companies", []),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    status: "Active" as "Active" | "Inactive",
  });

  const reload = () => setCompanies(load<Company[]>("bizpos_companies", []));

  const filtered = companies.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditingCompany(null);
    setForm({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      status: "Active",
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditingCompany(c);
    setForm({
      name: c.name,
      code: c.code,
      address: c.address,
      phone: c.phone,
      email: c.email,
      status: c.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.code) {
      toast.error("Name and Code are required");
      return;
    }
    const existing = load<Company[]>("bizpos_companies", []);
    if (editingCompany) {
      const updated = existing.map((c) =>
        c.id === editingCompany.id ? { ...c, ...form } : c,
      );
      save("bizpos_companies", updated);
      toast.success("Company updated");
    } else {
      const newCompany: Company = { id: generateId(), ...form };
      save("bizpos_companies", [...existing, newCompany]);
      toast.success("Company added");
    }
    reload();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const existing = load<Company[]>("bizpos_companies", []);
    save(
      "bizpos_companies",
      existing.filter((c) => c.id !== id),
    );
    toast.success("Company deleted");
    reload();
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            Manage all companies in the system
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="companies.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Hierarchy Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
        <Building2 className="h-4 w-4 text-blue-700" />
        <span className="font-semibold text-blue-700">Companies</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <Warehouse className="h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={() => navigate({ to: "/warehouses" })}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Warehouses
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <Store className="h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={() => navigate({ to: "/shops" })}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Shops
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl font-bold">{companies.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">
                {companies.filter((c) => c.status === "Active").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Building2 className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold">
                {companies.filter((c) => c.status === "Inactive").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Companies</CardTitle>
            <div className="flex gap-3 items-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search companies..."
                  className="pl-9"
                  data-ocid="companies.search_input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-ocid="companies.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="companies.empty_state"
                  >
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((company, i) => (
                  <TableRow
                    key={company.id}
                    data-ocid={`companies.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {company.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {company.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {company.address}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {company.phone}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {company.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          company.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: "/warehouses" })}
                          data-ocid={`companies.secondary_button.${i + 1}`}
                          title="View Warehouses"
                        >
                          <Warehouse className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(company)}
                          data-ocid={`companies.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(company.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`companies.delete_button.${i + 1}`}
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
        <DialogContent className="max-w-lg" data-ocid="companies.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Alpha Retail Group"
                  data-ocid="companies.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="ARG"
                  data-ocid="companies.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, New York"
                data-ocid="companies.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1-555-0100"
                  data-ocid="companies.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@company.com"
                  data-ocid="companies.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "Active" | "Inactive" })
                }
              >
                <SelectTrigger data-ocid="companies.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="companies.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="companies.save_button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="companies.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="companies.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600"
              data-ocid="companies.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

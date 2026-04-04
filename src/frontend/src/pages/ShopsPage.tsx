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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useStore } from "../store/useStore";
import type { Shop } from "../store/useStore";

export default function ShopsPage() {
  const { shops, warehouses, users, addShop, updateShop, deleteShop } =
    useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    warehouseId: "",
    status: "Active" as "Active" | "Inactive",
    assignedUserIds: [] as string[],
  });

  const openAdd = () => {
    setEditingShop(null);
    setForm({
      name: "",
      code: "",
      address: "",
      warehouseId: "",
      status: "Active",
      assignedUserIds: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (shop: Shop) => {
    setEditingShop(shop);
    setForm({
      name: shop.name,
      code: shop.code,
      address: shop.address,
      warehouseId: shop.warehouseId,
      status: shop.status,
      assignedUserIds: [...shop.assignedUserIds],
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.code || !form.warehouseId) {
      toast.error("Name, Code, and Warehouse are required");
      return;
    }
    const warehouse = warehouses.find((w) => w.id === form.warehouseId);
    if (!warehouse) return;
    if (editingShop) {
      updateShop(editingShop.id, { ...form, warehouseName: warehouse.name });
      toast.success("Shop updated");
    } else {
      addShop({ ...form, warehouseName: warehouse.name });
      toast.success("Shop added");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteShop(id);
    toast.success("Shop deleted");
    setDeleteId(null);
  };

  const toggleUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId],
    }));
  };

  const filtered = shops.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      filterWarehouse === "all" || s.warehouseId === filterWarehouse;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchWarehouse && matchStatus;
  });

  const totalByWarehouse = warehouses.map((w) => ({
    name: w.name,
    count: shops.filter((s) => s.warehouseId === w.id).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shops</h1>
          <p className="text-gray-600 mt-1">
            Manage shop locations within warehouses
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="shops.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {/* Hierarchy Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={() => navigate({ to: "/companies" })}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Companies
        </button>
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
        <Store className="h-4 w-4 text-blue-700" />
        <span className="font-semibold text-blue-700">Shops</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Shops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {shops.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {shops.filter((s) => s.status === "Active").length}
            </div>
          </CardContent>
        </Card>
        {totalByWarehouse.slice(0, 2).map((tw) => (
          <Card key={tw.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {tw.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{tw.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <CardTitle>All Shops</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name / code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                  data-ocid="shops.search_input"
                />
              </div>
              <Select
                value={filterWarehouse}
                onValueChange={setFilterWarehouse}
              >
                <SelectTrigger className="w-36" data-ocid="shops.select">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" data-ocid="shops.status.select">
                  <SelectValue placeholder="Status" />
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
                <TableHead>Warehouse</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow data-ocid="shops.empty_state">
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-400 py-8"
                  >
                    No shops found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((shop, idx) => (
                <TableRow key={shop.id} data-ocid={`shops.item.${idx + 1}`}>
                  <TableCell className="font-mono text-sm">
                    {shop.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-400" />
                      {shop.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/warehouses" })}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      {shop.warehouseName}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {shop.address || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        shop.status === "Active" ? "default" : "secondary"
                      }
                      className={
                        shop.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : ""
                      }
                    >
                      {shop.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{shop.assignedUserIds.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(shop)}
                        data-ocid={`shops.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => setDeleteId(shop.id)}
                        data-ocid={`shops.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-xl"
          data-ocid="shops.dialog"
        >
          <DialogHeader>
            <DialogTitle>{editingShop ? "Edit Shop" : "Add Shop"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Shop Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Main Branch"
                data-ocid="shops.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Shop Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SH-001"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Warehouse *</Label>
              <Select
                value={form.warehouseId}
                onValueChange={(v) => setForm({ ...form, warehouseId: v })}
              >
                <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "Active" | "Inactive" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Assigned Users</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${u.id}`}
                      checked={form.assignedUserIds.includes(u.id)}
                      onCheckedChange={() => toggleUser(u.id)}
                    />
                    <label
                      htmlFor={`user-${u.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {u.name}{" "}
                      <span className="text-gray-400">({u.email})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="shops.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="shops.save_button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="shops.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shop</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="shops.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600"
              data-ocid="shops.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

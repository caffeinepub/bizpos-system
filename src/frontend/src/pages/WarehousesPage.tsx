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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Edit,
  ExternalLink,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import type { Warehouse } from "../store/useStore";

export default function WarehousesPage() {
  const { warehouses, shops, addWarehouse, updateWarehouse, deleteWarehouse } =
    useStore();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    location: "",
    status: "Active" as "Active" | "Inactive",
  });

  const openAdd = () => {
    setEditingWarehouse(null);
    setForm({ name: "", location: "", status: "Active" });
    setDialogOpen(true);
  };
  const openEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setForm({ name: w.name, location: w.location, status: w.status });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    if (editingWarehouse) {
      updateWarehouse(editingWarehouse.id, form);
      toast.success("Warehouse updated");
    } else {
      addWarehouse(form);
      toast.success("Warehouse added");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteWarehouse(id);
    toast.success("Warehouse deleted");
    setDeleteId(null);
  };

  const selectedWarehouse = warehouses.find(
    (w) => w.id === selectedWarehouseId,
  );
  const warehouseShops = selectedWarehouseId
    ? shops.filter((s) => s.warehouseId === selectedWarehouseId)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600 mt-1">Manage warehouse locations</p>
        </div>
        <Button onClick={openAdd} data-ocid="warehouses.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList data-ocid="warehouses.tab">
          <TabsTrigger value="list">Warehouses</TabsTrigger>
          <TabsTrigger value="shops">Shops by Warehouse</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Warehouses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shops</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((w, idx) => (
                    <TableRow
                      key={w.id}
                      data-ocid={`warehouses.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {w.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {w.location}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            w.status === "Active" ? "default" : "secondary"
                          }
                          className={
                            w.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : ""
                          }
                        >
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {shops.filter((s) => s.warehouseId === w.id).length}{" "}
                        shops
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(w)}
                            data-ocid={`warehouses.edit_button.${idx + 1}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setDeleteId(w.id)}
                            data-ocid={`warehouses.delete_button.${idx + 1}`}
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
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          <div className="flex gap-3 items-center">
            <Label>Select Warehouse:</Label>
            <Select
              value={selectedWarehouseId ?? ""}
              onValueChange={(v) => setSelectedWarehouseId(v)}
            >
              <SelectTrigger className="w-56" data-ocid="warehouses.select">
                <SelectValue placeholder="Choose a warehouse" />
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

          {selectedWarehouse && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Shops in {selectedWarehouse.name}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: "/shops" })}
                    data-ocid="warehouses.secondary_button"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage All Shops
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseShops.length === 0 && (
                      <TableRow data-ocid="warehouses.empty_state">
                        <TableCell
                          colSpan={5}
                          className="text-center text-gray-400 py-6"
                        >
                          No shops in this warehouse
                        </TableCell>
                      </TableRow>
                    )}
                    {warehouseShops.map((shop, idx) => (
                      <TableRow
                        key={shop.id}
                        data-ocid={`warehouses.row.${idx + 1}`}
                      >
                        <TableCell className="font-mono text-sm">
                          {shop.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {shop.name}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {shop.address}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              shop.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {shop.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{shop.assignedUserIds.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="warehouses.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-ocid="warehouses.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="warehouses.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="warehouses.save_button">
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
        <AlertDialogContent data-ocid="warehouses.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the warehouse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="warehouses.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600"
              data-ocid="warehouses.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

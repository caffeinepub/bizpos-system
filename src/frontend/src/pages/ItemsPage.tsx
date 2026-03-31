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
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import type { Item } from "../store/useStore";

export default function ItemsPage() {
  const { items, warehouses, addItem, updateItem, deleteItem } = useStore();
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    quantity: "",
    warehouseId: "",
  });

  const filtered = items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      filterWarehouse === "all" || i.warehouseId === filterWarehouse;
    return matchSearch && matchWarehouse;
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      sku: "",
      name: "",
      category: "",
      costPrice: "",
      salePrice: "",
      quantity: "0",
      warehouseId: warehouses[0]?.id || "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category || "",
      costPrice: item.costPrice.toString(),
      salePrice: item.salePrice.toString(),
      quantity: item.quantity.toString(),
      warehouseId: item.warehouseId,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.sku || !form.name || !form.warehouseId) {
      toast.error("Fill all required fields");
      return;
    }
    const itemData = {
      sku: form.sku,
      name: form.name,
      category: form.category,
      costPrice: Number.parseFloat(form.costPrice) || 0,
      salePrice: Number.parseFloat(form.salePrice) || 0,
      quantity: Number.parseInt(form.quantity) || 0,
      warehouseId: form.warehouseId,
    };
    if (editingItem) {
      updateItem(editingItem.id, itemData);
      toast.success("Item updated");
    } else {
      addItem(itemData);
      toast.success("Item created");
    }
    setDialogOpen(false);
  };

  const getWarehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name || "Unknown";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600 mt-1">Manage inventory items</p>
        </div>
        <Button onClick={openAdd} data-ocid="items.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">
              {items.filter((i) => i.quantity < 10).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Stock Value</p>
            <p className="text-2xl font-bold text-primary">
              {items
                .reduce((s, i) => s + i.quantity * i.costPrice, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="pl-9"
                data-ocid="items.search_input"
              />
            </div>
            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-48" data-ocid="items.select">
                <SelectValue placeholder="All Warehouses" />
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="items.empty_state"
                  >
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, i) => (
                  <TableRow key={item.id} data-ocid={`items.item.${i + 1}`}>
                    <TableCell className="font-mono text-sm">
                      {item.sku}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {item.category || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                    <TableCell className="text-right">
                      {item.costPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.salePrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          item.quantity < 10
                            ? "destructive"
                            : item.quantity < 20
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {item.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                          data-ocid={`items.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`items.delete_button.${i + 1}`}
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
        <DialogContent data-ocid="items.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU-001"
                  data-ocid="items.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select
                  value={form.warehouseId}
                  onValueChange={(v) => setForm({ ...form, warehouseId: v })}
                >
                  <SelectTrigger data-ocid="items.select">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-ocid="items.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g. Electronics"
                  data-ocid="items.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                  data-ocid="items.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) =>
                    setForm({ ...form, salePrice: e.target.value })
                  }
                  data-ocid="items.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  data-ocid="items.input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="items.cancel_button"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="items.save_button">
                {editingItem ? "Update" : "Add"} Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this item from inventory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteItem(deleteId!);
                setDeleteId(null);
                toast.success("Item deleted");
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

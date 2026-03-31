import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Package, Search } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store/useStore";

export default function WarehouseStockPage() {
  const { items, warehouses } = useStore();
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = items.filter((i) => {
    const matchWarehouse =
      selectedWarehouse === "all" || i.warehouseId === selectedWarehouse;
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase());
    return matchWarehouse && matchSearch;
  });

  const totalValue = filtered.reduce((s, i) => s + i.quantity * i.costPrice, 0);
  const totalQty = filtered.reduce((s, i) => s + i.quantity, 0);

  const getWarehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name || "Unknown";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Stock</h1>
        <p className="text-gray-600 mt-1">
          View stock levels across warehouses
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Quantity</p>
            <p className="text-2xl font-bold text-primary">
              {totalQty.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Stock Value</p>
            <p className="text-2xl font-bold text-green-600">
              {totalValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Select
              value={selectedWarehouse}
              onValueChange={setSelectedWarehouse}
            >
              <SelectTrigger
                className="w-56"
                data-ocid="warehouse_stock.select"
              >
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="pl-9"
                data-ocid="warehouse_stock.search_input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="warehouse_stock.empty_state"
                  >
                    No stock found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, i) => (
                  <TableRow
                    key={item.id}
                    data-ocid={`warehouse_stock.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm">
                      {item.sku}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
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
                      {item.costPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(item.quantity * item.costPrice).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

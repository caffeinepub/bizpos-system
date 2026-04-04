import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

interface AdjustmentLog {
  id: string;
  itemName: string;
  type: string;
  quantity: number;
  reason: string;
  date: string;
}

export default function StockAdjustmentPage() {
  const {
    items,
    warehouses,
    adjustStock,
    addStockMovement,
    postJournalEntry,
    accountMapping,
  } = useStore();
  const [warehouseId, setWarehouseId] = useState("all");
  const [itemId, setItemId] = useState("");
  const [adjustType, setAdjustType] = useState<"Add" | "Remove">("Add");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [logs, setLogs] = useState<AdjustmentLog[]>([]);

  const warehouseItems =
    warehouseId === "all"
      ? items
      : items.filter((i) => i.warehouseId === warehouseId);
  const selectedItem = items.find((i) => i.id === itemId);

  const handleSave = () => {
    if (!itemId) {
      toast.error("Please select an item");
      return;
    }
    const qty = Number.parseInt(quantity) || 0;
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (
      adjustType === "Remove" &&
      selectedItem &&
      qty > selectedItem.quantity
    ) {
      toast.error(
        `Cannot remove more than current stock (${selectedItem.quantity})`,
      );
      return;
    }
    const adjustmentQty = adjustType === "Add" ? qty : -qty;
    adjustStock(itemId, adjustmentQty);
    const warehouseName =
      warehouses.find((w) => w.id === selectedItem?.warehouseId)?.name || "";
    const newQty = selectedItem
      ? Math.max(0, selectedItem.quantity + adjustmentQty)
      : 0;
    const adjRef = `ADJ-${Date.now()}`;
    addStockMovement({
      itemId,
      itemName: selectedItem?.name || "",
      type: "Adjustment",
      reference: adjRef,
      quantityChange: adjustmentQty,
      quantityAfter: newQty,
      warehouseId: selectedItem?.warehouseId || "",
      warehouseName,
      notes: reason || "Manual adjustment",
    });

    // Post journal entry for the cost value of the adjustment
    const costValue = (selectedItem?.costPrice ?? 0) * qty;
    if (costValue !== 0 && postJournalEntry) {
      const invId = accountMapping?.inventoryAssetId || "acc-100-02-03";
      const adjAccountId = "acc-600-01-04";
      const today = new Date().toISOString().slice(0, 10);
      if (adjustType === "Add") {
        postJournalEntry({
          date: today,
          reference: adjRef,
          description: `Stock Adjustment (Add): ${selectedItem?.name}`,
          lines: [
            {
              accountId: invId,
              accountName: "STOCK IN HAND",
              debit: costValue,
              credit: 0,
            },
            {
              accountId: adjAccountId,
              accountName: "INVENTORY ADJUSTMENT",
              debit: 0,
              credit: costValue,
            },
          ],
        });
      } else {
        postJournalEntry({
          date: today,
          reference: adjRef,
          description: `Stock Adjustment (Remove): ${selectedItem?.name}`,
          lines: [
            {
              accountId: adjAccountId,
              accountName: "INVENTORY ADJUSTMENT",
              debit: costValue,
              credit: 0,
            },
            {
              accountId: invId,
              accountName: "STOCK IN HAND",
              debit: 0,
              credit: costValue,
            },
          ],
        });
      }
    }

    setLogs((prev) => [
      {
        id: Date.now().toString(),
        itemName: selectedItem?.name || "",
        type: adjustType,
        quantity: qty,
        reason,
        date: new Date().toLocaleDateString(),
      },
      ...prev.slice(0, 9),
    ]);
    toast.success(
      `Stock ${adjustType === "Add" ? "added" : "removed"} successfully`,
    );
    setItemId("");
    setQuantity("1");
    setReason("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Stock Adjustment</h1>
          <PageHelp pageId="stock-adjustment" />
        </div>
        <p className="text-gray-600 mt-1">Add or remove stock quantities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Adjust Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Warehouse Filter</Label>
              <Select
                value={warehouseId}
                onValueChange={(v) => {
                  setWarehouseId(v);
                  setItemId("");
                }}
              >
                <SelectTrigger data-ocid="stock_adj.select">
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
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger data-ocid="stock_adj.select">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseItems.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} (Current: {i.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedItem && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-gray-600">Current Stock:</span>{" "}
                <strong>{selectedItem.quantity}</strong>
                {selectedItem.costPrice ? (
                  <span className="ml-4 text-gray-500">
                    Cost Price: {selectedItem.costPrice.toLocaleString()}
                  </span>
                ) : null}
              </div>
            )}
            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <Select
                value={adjustType}
                onValueChange={(v) => setAdjustType(v as "Add" | "Remove")}
              >
                <SelectTrigger data-ocid="stock_adj.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Add">Add Stock</SelectItem>
                  <SelectItem value="Remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                data-ocid="stock_adj.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for adjustment..."
                rows={2}
                data-ocid="stock_adj.textarea"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full"
              data-ocid="stock_adj.submit_button"
            >
              Save Adjustment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No adjustments yet
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{log.itemName}</p>
                      {log.reason && (
                        <p className="text-xs text-gray-500">{log.reason}</p>
                      )}
                      <p className="text-xs text-gray-400">{log.date}</p>
                    </div>
                    <Badge
                      className={
                        log.type === "Add"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {log.type === "Add" ? "+" : "-"}
                      {log.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

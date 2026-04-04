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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useNavigate } from "@tanstack/react-router";
import { Download, Eye, FileSpreadsheet, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function SalesListPage() {
  const { sales, warehouses, shops, deleteSale, addLog } = useStore();
  const { currentUser, getAccessibleShopIds } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const accessibleShopIds = getAccessibleShopIds();
  const filtered = sales.filter((s) => {
    const matchSearch =
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      filterWarehouse === "all" || s.warehouseId === filterWarehouse;
    const matchType = filterType === "all" || s.saleType === filterType;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchShop =
      accessibleShopIds.length === 0 ||
      !s.shopId ||
      accessibleShopIds.includes(s.shopId as string);
    return (
      matchSearch && matchWarehouse && matchType && matchStatus && matchShop
    );
  });

  const totalSales = filtered.reduce((s, sale) => s + sale.total, 0);
  const totalCollected = filtered.reduce((s, sale) => s + sale.paidAmount, 0);
  const totalBalance = filtered.reduce((s, sale) => s + sale.balanceDue, 0);

  const handleExportPDF = () => {
    const rows = filtered.map((s) => [
      s.id,
      s.saleDate,
      s.customerName,
      s.shopName || shops.find((sh) => sh.id === s.shopId)?.name || "—",
      s.warehouseName,
      s.items.length,
      s.total.toLocaleString(),
      s.paidAmount.toLocaleString(),
      s.balanceDue.toLocaleString(),
      s.status,
    ]);
    const wh = warehouses.find((w) => w.id === filterWarehouse);
    const filters = [
      search && { label: "Search", value: search },
      filterWarehouse !== "all" && {
        label: "Warehouse",
        value: wh?.name ?? filterWarehouse,
      },
      filterType !== "all" && { label: "Type", value: filterType },
      filterStatus !== "all" && { label: "Status", value: filterStatus },
    ].filter(Boolean) as { label: string; value: string }[];
    exportPDF(
      "Sales List",
      [
        "Invoice#",
        "Date",
        "Customer",
        "Shop",
        "Warehouse",
        "Items",
        "Total",
        "Paid",
        "Balance",
        "Status",
      ],
      rows,
      "sales-list.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((s) => [
      s.id,
      s.saleDate,
      s.customerName,
      s.shopName || shops.find((sh) => sh.id === s.shopId)?.name || "—",
      s.warehouseName,
      s.items.length,
      s.total,
      s.paidAmount,
      s.balanceDue,
      s.status,
    ]);
    const wh = warehouses.find((w) => w.id === filterWarehouse);
    const filters = [
      search && { label: "Search", value: search },
      filterWarehouse !== "all" && {
        label: "Warehouse",
        value: wh?.name ?? filterWarehouse,
      },
      filterType !== "all" && { label: "Type", value: filterType },
      filterStatus !== "all" && { label: "Status", value: filterStatus },
    ].filter(Boolean) as { label: string; value: string }[];
    exportExcel(
      "sales-list.xlsx",
      "Sales",
      [
        "Invoice#",
        "Date",
        "Customer",
        "Shop",
        "Warehouse",
        "Items",
        "Total",
        "Paid",
        "Balance",
        "Status",
      ],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Sales List",
        generatedBy: currentUser?.name ?? "Unknown",
        filters,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
            <PageHelp pageId="sales" />
          </div>
          <p className="text-gray-600 mt-1">
            View and manage all sales transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="sales.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="sales.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-primary">
            {totalSales.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">
            {totalCollected.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Balance Due</p>
          <p className="text-2xl font-bold text-red-600">
            {totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sales..."
                className="pl-9"
                data-ocid="sales.search_input"
              />
            </div>
            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-44" data-ocid="sales.select">
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32" data-ocid="sales.select">
                <SelectValue placeholder="Sale Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-ocid="sales.select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="sales.empty_state"
                >
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sale, i) => (
                <TableRow key={sale.id} data-ocid={`sales.item.${i + 1}`}>
                  <TableCell className="font-mono font-medium">
                    {sale.id}
                  </TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>
                    {sale.shopName ||
                      shops.find((sh) => sh.id === sale.shopId)?.name ||
                      "—"}
                  </TableCell>
                  <TableCell>{sale.warehouseName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.saleType}</Badge>
                  </TableCell>
                  <TableCell>{sale.items.length}</TableCell>
                  <TableCell className="text-right font-medium">
                    {sale.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        sale.balanceDue > 0
                          ? "text-red-600 font-medium"
                          : "text-green-600"
                      }
                    >
                      {sale.balanceDue.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[sale.status]}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.saleDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: `/sales/${sale.id}` })}
                        data-ocid={`sales.secondary_button.${i + 1}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(sale.id)}
                        className="text-red-600 hover:bg-red-50"
                        data-ocid={`sales.delete_button.${i + 1}`}
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
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this sale record? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteSale(deleteId!);
                addLog("Sales", "delete", `Sale deleted: ${deleteId}`);
                setDeleteId(null);
                toast.success("Sale deleted");
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

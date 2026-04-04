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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { ShiftClosing } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

export default function ShiftClosingPage() {
  const {
    shops,
    shifts,
    sales,
    shiftClosings,
    addShiftClosing,
    updateShiftClosing,
  } = useStore();
  const { currentUser } = useAuth();

  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id ?? "");
  const [openingCash, setOpeningCash] = useState("");
  const [openDate, setOpenDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [openingShiftId, setOpeningShiftId] = useState(shifts[0]?.id ?? "");

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<ShiftClosing | null>(null);

  const [dateFilter, setDateFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const today = new Date().toISOString().slice(0, 10);
  const openShift = shiftClosings.find(
    (sc) => sc.shopId === selectedShopId && sc.status === "Open",
  );

  // Compute sales for open shift's shop and date
  const shiftDate = openShift?.date ?? today;
  const todaySales = sales.filter((s) => {
    if (!openShift) return false;
    return s.shopId === openShift.shopId && s.saleDate === shiftDate;
  });

  const totalSalesAmount = todaySales.reduce((sum, s) => sum + s.total, 0);

  // Sales by payment mode (simplified - use "Cash" for Cash type, "Other" otherwise)
  const salesByMode: { mode: string; amount: number; count: number }[] = [];
  for (const s of todaySales) {
    const mode = s.saleType === "Cash" ? "Cash" : "Card/Transfer";
    const existing = salesByMode.find((m) => m.mode === mode);
    if (existing) {
      existing.amount += s.total;
      existing.count += 1;
    } else salesByMode.push({ mode, amount: s.total, count: 1 });
  }

  // Also compute from raw sales data filtering by paymentMethod
  const rawCashSales = sales
    .filter(
      (s) =>
        openShift &&
        s.shopId === openShift.shopId &&
        s.saleDate === shiftDate &&
        s.saleType === "Cash",
    )
    .reduce((sum, s) => sum + s.total, 0);
  const cashSales =
    rawCashSales || (salesByMode.find((m) => m.mode === "Cash")?.amount ?? 0);

  const handleOpenShift = () => {
    if (!selectedShopId || !openingShiftId) {
      toast.error("Select shop and shift");
      return;
    }
    const shopName = shops.find((s) => s.id === selectedShopId)?.name ?? "";
    const shiftName = shifts.find((s) => s.id === openingShiftId)?.name ?? "";
    const count =
      shiftClosings.filter((sc) => sc.shopId === selectedShopId).length + 1;
    addShiftClosing({
      closingNumber: `SC-${openDate}-${String(count).padStart(3, "0")}`,
      shopId: selectedShopId,
      shopName,
      shiftId: openingShiftId,
      shiftName,
      date: openDate,
      openedBy: currentUser?.name ?? "System",
      closedBy: "",
      openingCash: Number(openingCash) || 0,
      closingCash: 0,
      expectedCash: 0,
      cashVariance: 0,
      totalSales: 0,
      totalTransactions: 0,
      salesByPaymentMode: [],
      status: "Open",
      notes: "",
      openedAt: new Date().toISOString(),
      closedAt: "",
    });
    toast.success("Shift opened successfully");
    setOpeningCash("");
  };

  const handleCloseShift = () => {
    if (!openShift) return;
    const cash = Number(closingCash) || 0;
    const expectedCash = openShift.openingCash + cashSales;
    const variance = cash - expectedCash;
    updateShiftClosing(openShift.id, {
      closingCash: cash,
      expectedCash,
      cashVariance: variance,
      totalSales: totalSalesAmount,
      totalTransactions: todaySales.length,
      salesByPaymentMode: salesByMode,
      closedBy: currentUser?.name ?? "System",
      closedAt: new Date().toISOString(),
      status: "Closed",
      notes: closingNotes,
    });
    toast.success("Shift closed successfully");
    setCloseDialogOpen(false);
    setClosingCash("");
    setClosingNotes("");
  };

  const filteredHistory = shiftClosings
    .filter((sc) => {
      const matchDate = !dateFilter || sc.date === dateFilter;
      const matchShop = shopFilter === "All" || sc.shopId === shopFilter;
      const matchStatus = statusFilter === "All" || sc.status === statusFilter;
      return matchDate && matchShop && matchStatus;
    })
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));

  const handleExport = () => {
    exportExcel(
      "shift-closings.xlsx",
      "Shift Closings",
      [
        "Number",
        "Shop",
        "Shift",
        "Date",
        "Opened By",
        "Closed By",
        "Opening Cash",
        "Closing Cash",
        "Variance",
        "Total Sales",
        "Status",
      ],
      filteredHistory.map((sc) => [
        sc.closingNumber,
        sc.shopName,
        sc.shiftName,
        sc.date,
        sc.openedBy,
        sc.closedBy || "—",
        sc.openingCash,
        sc.closingCash,
        sc.cashVariance,
        sc.totalSales,
        sc.status,
      ]),
      {
        companyName: "BizPOS System",
        reportTitle: "Shift Closings",
        generatedBy: currentUser?.name,
      },
    );
  };

  const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shift Closing</h1>
        <p className="text-gray-600 mt-1">
          Manage daily shift opening and closing
        </p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" data-ocid="shift_closing.tab">
            Active Shift
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="shift_closing.tab">
            Closing History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="mb-4">
            <Label>Select Shop</Label>
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger className="w-64" data-ocid="shift_closing.select">
                <SelectValue placeholder="Select shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!openShift ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Open New Shift
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <Label>Shift</Label>
                    <Select
                      value={openingShiftId}
                      onValueChange={setOpeningShiftId}
                    >
                      <SelectTrigger data-ocid="shift_closing.select">
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {shifts
                          .filter((s) => s.status === "Active")
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={openDate}
                      onChange={(e) => setOpenDate(e.target.value)}
                      data-ocid="shift_closing.input"
                    />
                  </div>
                  <div>
                    <Label>Opening Cash (PKR)</Label>
                    <Input
                      type="number"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button
                  className="mt-4"
                  onClick={handleOpenShift}
                  data-ocid="shift_closing.primary_button"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Open Shift
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-bold text-lg text-green-800">
                          Shift Open: {openShift.shiftName}
                        </h3>
                        <Badge className="bg-green-100 text-green-700">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-green-700">
                        Shop: <strong>{openShift.shopName}</strong>
                      </p>
                      <p className="text-sm text-green-700">
                        Opened by: <strong>{openShift.openedBy}</strong>
                      </p>
                      <p className="text-sm text-green-700">
                        Opened at:{" "}
                        <strong>
                          {new Date(openShift.openedAt).toLocaleString()}
                        </strong>
                      </p>
                      <p className="text-sm text-green-700">
                        Opening Cash:{" "}
                        <strong>{fmt(openShift.openingCash)}</strong>
                      </p>
                    </div>
                    <Button
                      onClick={() => setCloseDialogOpen(true)}
                      className="bg-red-600 hover:bg-red-700"
                      data-ocid="shift_closing.primary_button"
                    >
                      Close Shift
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {todaySales.length}
                        </p>
                        <p className="text-sm text-gray-500">
                          Transactions Today
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {fmt(totalSalesAmount)}
                        </p>
                        <p className="text-sm text-gray-500">Total Sales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{fmt(cashSales)}</p>
                        <p className="text-sm text-gray-500">Cash Sales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {salesByMode.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Payment Mode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mode</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByMode.map((m) => (
                          <TableRow key={m.mode}>
                            <TableCell>{m.mode}</TableCell>
                            <TableCell>{m.count}</TableCell>
                            <TableCell>{fmt(m.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
                data-ocid="shift_closing.input"
              />
              <Select value={shopFilter} onValueChange={setShopFilter}>
                <SelectTrigger
                  className="w-44"
                  data-ocid="shift_closing.select"
                >
                  <SelectValue placeholder="All Shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Shops</SelectItem>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportPDF(
                    "Shift Closings",
                    [
                      "Number",
                      "Shop",
                      "Date",
                      "Opening Cash",
                      "Closing Cash",
                      "Variance",
                      "Sales",
                      "Status",
                    ],
                    filteredHistory.map((sc) => [
                      sc.closingNumber,
                      sc.shopName,
                      sc.date,
                      sc.openingCash,
                      sc.closingCash,
                      sc.cashVariance,
                      sc.totalSales,
                      sc.status,
                    ]),
                    "shift-closings.pdf",
                    {
                      companyName: "BizPOS System",
                      generatedBy: currentUser?.name,
                    },
                  )
                }
              >
                PDF
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Closing #</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Opened By</TableHead>
                    <TableHead>Opening Cash</TableHead>
                    <TableHead>Closing Cash</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="text-center py-8 text-gray-500"
                        data-ocid="shift_closing.empty_state"
                      >
                        No closings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((sc, idx) => (
                      <TableRow
                        key={sc.id}
                        data-ocid={`shift_closing.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {sc.closingNumber}
                        </TableCell>
                        <TableCell>{sc.shopName}</TableCell>
                        <TableCell>{sc.shiftName}</TableCell>
                        <TableCell>{sc.date}</TableCell>
                        <TableCell>{sc.openedBy}</TableCell>
                        <TableCell>{fmt(sc.openingCash)}</TableCell>
                        <TableCell>
                          {sc.status === "Closed" ? fmt(sc.closingCash) : "—"}
                        </TableCell>
                        <TableCell>
                          {sc.status === "Closed" ? (
                            <span
                              className={
                                sc.cashVariance >= 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {sc.cashVariance >= 0 ? "+" : ""}
                              {fmt(sc.cashVariance)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{fmt(sc.totalSales)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              sc.status === "Open"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {sc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewRecord(sc);
                              setViewDialogOpen(true);
                            }}
                            data-ocid={`shift_closing.button.${idx + 1}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Close Shift Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent data-ocid="shift_closing.dialog">
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {openShift && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p>
                  Shop: <strong>{openShift.shopName}</strong>
                </p>
                <p>
                  Shift: <strong>{openShift.shiftName}</strong>
                </p>
                <p>
                  Opening Cash: <strong>{fmt(openShift.openingCash)}</strong>
                </p>
                <p>
                  Cash Sales Today: <strong>{fmt(cashSales)}</strong>
                </p>
                <p>
                  Expected Closing Cash:{" "}
                  <strong>{fmt(openShift.openingCash + cashSales)}</strong>
                </p>
              </div>
            )}
            <div>
              <Label>Actual Closing Cash (PKR) *</Label>
              <Input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="Enter cash count"
                data-ocid="shift_closing.input"
              />
            </div>
            {closingCash && openShift && (
              <div
                className={`rounded-lg p-3 ${Number(closingCash) - (openShift.openingCash + cashSales) >= 0 ? "bg-green-50" : "bg-red-50"}`}
              >
                <p className="text-sm font-medium">
                  Variance:{" "}
                  <strong
                    className={
                      Number(closingCash) -
                        (openShift.openingCash + cashSales) >=
                      0
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {Number(closingCash) -
                      (openShift.openingCash + cashSales) >=
                    0
                      ? "+"
                      : ""}
                    {fmt(
                      Number(closingCash) - (openShift.openingCash + cashSales),
                    )}
                  </strong>
                </p>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                data-ocid="shift_closing.textarea"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleCloseShift}
                data-ocid="shift_closing.confirm_button"
              >
                Confirm Close Shift
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCloseDialogOpen(false)}
                data-ocid="shift_closing.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="shift_closing.dialog">
          <DialogHeader>
            <DialogTitle>Shift Closing Report</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Closing #</span>
                  <p className="font-medium">{viewRecord.closingNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date</span>
                  <p className="font-medium">{viewRecord.date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Shop</span>
                  <p className="font-medium">{viewRecord.shopName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Shift</span>
                  <p className="font-medium">{viewRecord.shiftName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Opened By</span>
                  <p className="font-medium">{viewRecord.openedBy}</p>
                </div>
                <div>
                  <span className="text-gray-500">Closed By</span>
                  <p className="font-medium">{viewRecord.closedBy || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Opening Cash</span>
                  <p className="font-medium">{fmt(viewRecord.openingCash)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Closing Cash</span>
                  <p className="font-medium">
                    {viewRecord.status === "Closed"
                      ? fmt(viewRecord.closingCash)
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Expected Cash</span>
                  <p className="font-medium">
                    {viewRecord.status === "Closed"
                      ? fmt(viewRecord.expectedCash)
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Variance</span>
                  <p
                    className={`font-bold ${viewRecord.cashVariance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {viewRecord.status === "Closed"
                      ? `${viewRecord.cashVariance >= 0 ? "+" : ""}${fmt(viewRecord.cashVariance)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Sales</span>
                  <p className="font-medium">{fmt(viewRecord.totalSales)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Transactions</span>
                  <p className="font-medium">{viewRecord.totalTransactions}</p>
                </div>
              </div>
              {viewRecord.salesByPaymentMode.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Sales Breakdown</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mode</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewRecord.salesByPaymentMode.map((m) => (
                        <TableRow key={m.mode}>
                          <TableCell>{m.mode}</TableCell>
                          <TableCell>{m.count}</TableCell>
                          <TableCell>{fmt(m.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {viewRecord.notes && (
                <div>
                  <p className="text-gray-500">Notes</p>
                  <p>{viewRecord.notes}</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
                data-ocid="shift_closing.close_button"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { DollarSign, Receipt, Search } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

export default function PaymentHistoryPage() {
  const { payments, paymentModes } = useStore();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.saleId.toLowerCase().includes(search.toLowerCase());
    const matchMode = filterMode === "all" || p.paymentModeId === filterMode;
    const matchFrom = !dateFrom || p.date >= dateFrom;
    const matchTo = !dateTo || p.date <= dateTo;
    return matchSearch && matchMode && matchFrom && matchTo;
  });

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <PageHelp pageId="payment-history" />
        </div>
        <p className="text-gray-600 mt-1">All recorded payment transactions</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {totalAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9"
                data-ocid="payment_history.search_input"
              />
            </div>
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger
                className="w-44"
                data-ocid="payment_history.select"
              >
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {paymentModes.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    {pm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
              placeholder="From"
              data-ocid="payment_history.input"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
              placeholder="To"
              data-ocid="payment_history.input"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="payment_history.empty_state"
                  >
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => (
                  <TableRow
                    key={p.id}
                    data-ocid={`payment_history.item.${i + 1}`}
                  >
                    <TableCell className="font-mono">{p.id}</TableCell>
                    <TableCell className="font-mono">{p.saleId}</TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell>{p.warehouseName}</TableCell>
                    <TableCell>{p.paymentModeName}</TableCell>
                    <TableCell>{p.date}</TableCell>
                    <TableCell className="text-gray-500">
                      {p.reference || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {p.amount.toLocaleString()}
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

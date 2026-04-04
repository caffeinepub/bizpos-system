import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Download, ExternalLink, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";
import type { CreditNote } from "./CreditNotesPage";

function loadCreditNotes(): CreditNote[] {
  try {
    return JSON.parse(localStorage.getItem("bizpos_credit_notes") || "[]");
  } catch {
    return [];
  }
}

export default function SalesReturnsPage() {
  const { customers, settings } = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notes] = useState<CreditNote[]>(loadCreditNotes);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = notes.filter((n) => {
    const matchSearch =
      n.noteNumber.toLowerCase().includes(search.toLowerCase()) ||
      n.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || n.status === filterStatus;
    const matchCustomer =
      filterCustomer === "all" || n.customerId === filterCustomer;
    const matchDate =
      (!dateFrom || n.date >= dateFrom) && (!dateTo || n.date <= dateTo);
    return matchSearch && matchStatus && matchCustomer && matchDate;
  });

  const totalAmount = filtered.reduce((s, n) => s + n.totalAmount, 0);

  const handleExportPDF = () => {
    const rows = filtered.map((n) => [
      n.noteNumber,
      n.date,
      n.customerName,
      n.saleRef,
      n.totalAmount.toLocaleString(),
      n.reason,
      n.status,
    ]);
    exportPDF(
      "Sales Returns Report",
      ["Note#", "Date", "Customer", "Sale Ref", "Amount", "Reason", "Status"],
      rows,
      "sales-returns.pdf",
      {
        companyName: settings?.companyName || "BizPOS",
        reportTitle: "Sales Returns",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((n) => [
      n.noteNumber,
      n.date,
      n.customerName,
      n.saleRef,
      n.totalAmount,
      n.reason,
      n.status,
    ]);
    exportExcel(
      "sales-returns.xlsx",
      "Sales Returns",
      ["Note#", "Date", "Customer", "Sale Ref", "Amount", "Reason", "Status"],
      rows,
      {
        companyName: settings?.companyName || "BizPOS",
        reportTitle: "Sales Returns",
        generatedBy: currentUser?.name,
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Returns</h1>
          <p className="text-gray-600 mt-1">
            View all credit notes and sales returns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={() => navigate({ to: "/credit-notes" })}
            data-ocid="sales_returns.primary_button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Credit Notes
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-48"
            />
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Posted">Posted</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
              placeholder="To"
            />
          </div>

          <div className="mb-3 text-sm text-gray-600">
            <strong>{filtered.length}</strong> returns | Total Amount:{" "}
            <strong>{totalAmount.toLocaleString()}</strong>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sale Ref</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="sales_returns.empty_state"
                  >
                    No sales returns found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((n, i) => (
                  <TableRow
                    key={n.id}
                    data-ocid={`sales_returns.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {n.noteNumber}
                    </TableCell>
                    <TableCell>{n.date}</TableCell>
                    <TableCell>{n.customerName}</TableCell>
                    <TableCell>{n.saleRef || "—"}</TableCell>
                    <TableCell className="max-w-40 truncate">
                      {n.reason}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {n.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          n.status === "Posted" ? "default" : "secondary"
                        }
                      >
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {n.createdBy}
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

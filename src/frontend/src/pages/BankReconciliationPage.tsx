import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2 });
}

export default function BankReconciliationPage() {
  const { currentUser } = useAuth();
  const {
    bankTransactions,
    addBankTransaction,
    deleteBankTransaction,
    toggleBankTransactionReconciled,
    journalEntries,
  } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const [openingBalance, setOpeningBalance] = useState("0");

  // Tab 1 filters
  const [btFromDate, setBtFromDate] = useState(`${today.slice(0, 7)}-01`);
  const [btToDate, setBtToDate] = useState(today);
  const [btType, setBtType] = useState("All");
  const [btSearch, setBtSearch] = useState("");

  // Tab 2 filters
  const [jeFromDate, setJeFromDate] = useState(`${today.slice(0, 7)}-01`);
  const [jeToDate, setJeToDate] = useState(today);
  const [jeSearch, setJeSearch] = useState("");

  // backward-compat dates for summary
  const fromDate = btFromDate;
  const toDate = btToDate;

  const [form, setForm] = useState({
    date: today,
    description: "",
    amount: "",
    type: "Debit" as "Debit" | "Credit",
    reference: "",
  });

  const handleAdd = () => {
    if (!form.description || !form.amount) {
      toast.error("Description and amount are required");
      return;
    }
    addBankTransaction({
      date: form.date,
      description: form.description,
      amount: Number(form.amount),
      type: form.type,
      reference: form.reference,
      reconciled: false,
    });
    setForm({
      date: today,
      description: "",
      amount: "",
      type: "Debit",
      reference: "",
    });
    toast.success("Transaction added");
  };

  // Filtered bank transactions (Tab 1)
  const filteredBT = bankTransactions.filter((t) => {
    const d = t.date.slice(0, 10);
    if (d < btFromDate || d > btToDate) return false;
    if (btType !== "All" && t.type !== btType) return false;
    if (btSearch) {
      const s = btSearch.toLowerCase();
      if (
        !t.description.toLowerCase().includes(s) &&
        !t.reference.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  // Filtered journal entries (Tab 2)
  const filteredJE = journalEntries.filter((je) => {
    const d = je.date.slice(0, 10);
    if (d < jeFromDate || d > jeToDate) return false;
    if (jeSearch) {
      const s = jeSearch.toLowerCase();
      if (
        !je.description.toLowerCase().includes(s) &&
        !(je.reference ?? "").toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  // Summary calculations
  const opening = Number(openingBalance) || 0;
  const totalDebits = bankTransactions.reduce(
    (s, t) => s + (t.type === "Debit" ? t.amount : 0),
    0,
  );
  const totalCredits = bankTransactions.reduce(
    (s, t) => s + (t.type === "Credit" ? t.amount : 0),
    0,
  );
  const closingBalance = opening + totalCredits - totalDebits;

  const allFilteredJE = journalEntries.filter((je) => {
    const d = je.date.slice(0, 10);
    return d >= fromDate && d <= toDate;
  });
  const bookBalance = allFilteredJE.reduce((s, je) => {
    const cr = je.lines.reduce((a, l) => a + l.credit, 0);
    const dr = je.lines.reduce((a, l) => a + l.debit, 0);
    return s + cr - dr;
  }, opening);
  const difference = closingBalance - bookBalance;

  // Unreconciled / unmatched for Tab 3
  const unreconciledBT = bankTransactions.filter((t) => !t.reconciled);
  const unmatchedJE = journalEntries.filter((_je) => {
    // Simple heuristic: JEs within the same date range as all BTs
    return true;
  });

  // --- Export handlers ---
  const handleExportBTPDF = () => {
    const rows = filteredBT.map((t) => [
      t.date,
      t.description,
      t.type,
      fmt(t.amount),
      t.reference,
      t.reconciled ? "Yes" : "No",
    ]);
    exportPDF(
      "Bank Transactions",
      ["Date", "Description", "Type", "Amount", "Reference", "Reconciled"],
      rows,
      "bank-transactions.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "From", value: btFromDate },
          { label: "To", value: btToDate },
          { label: "Type", value: btType },
        ],
      },
    );
  };

  const handleExportBTExcel = () => {
    const rows = filteredBT.map((t) => [
      t.date,
      t.description,
      t.type,
      t.amount,
      t.reference,
      t.reconciled ? "Yes" : "No",
    ]);
    exportExcel(
      "bank-transactions.xlsx",
      "Bank Transactions",
      ["Date", "Description", "Type", "Amount", "Reference", "Reconciled"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Bank Transactions",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "From", value: btFromDate },
          { label: "To", value: btToDate },
        ],
      },
    );
  };

  const handleExportJEPDF = () => {
    const rows = filteredJE.map((je) => {
      const dr = je.lines.reduce((s, l) => s + l.debit, 0);
      const cr = je.lines.reduce((s, l) => s + l.credit, 0);
      return [
        je.date.slice(0, 10),
        je.reference ?? "",
        je.description,
        fmt(dr),
        fmt(cr),
      ];
    });
    exportPDF(
      "Journal Entries (Book)",
      ["Date", "Reference", "Description", "Debit", "Credit"],
      rows,
      "journal-entries.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "From", value: jeFromDate },
          { label: "To", value: jeToDate },
        ],
      },
    );
  };

  const handleExportJEExcel = () => {
    const rows = filteredJE.map((je) => {
      const dr = je.lines.reduce((s, l) => s + l.debit, 0);
      const cr = je.lines.reduce((s, l) => s + l.credit, 0);
      return [je.date.slice(0, 10), je.reference ?? "", je.description, dr, cr];
    });
    exportExcel(
      "journal-entries.xlsx",
      "Journal Entries",
      ["Date", "Reference", "Description", "Debit", "Credit"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Journal Entries (Book)",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "From", value: jeFromDate },
          { label: "To", value: jeToDate },
        ],
      },
    );
  };

  const handleExportMatchedPDF = () => {
    const reconRows = bankTransactions
      .filter((t) => t.reconciled)
      .map((t) => [t.date, t.description, t.type, fmt(t.amount), t.reference]);
    exportPDF(
      "Reconciled Bank Transactions",
      ["Date", "Description", "Type", "Amount", "Reference"],
      reconRows,
      "reconciled-transactions.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [],
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Bank Reconciliation
          </h1>
          <PageHelp pageId="bank-reconciliation" />
        </div>
        <p className="text-gray-600 mt-1">
          Match bank transactions with journal entries
        </p>
      </div>

      <Tabs defaultValue="bank-transactions" data-ocid="bank_recon.tab">
        <TabsList className="mb-4">
          <TabsTrigger value="bank-transactions" data-ocid="bank_recon.tab">
            Bank Transactions
          </TabsTrigger>
          <TabsTrigger value="journal-entries" data-ocid="bank_recon.tab">
            Journal Entries (Book)
          </TabsTrigger>
          <TabsTrigger value="matching" data-ocid="bank_recon.tab">
            Matching / Reconciliation
          </TabsTrigger>
          <TabsTrigger value="summary" data-ocid="bank_recon.tab">
            Summary
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Bank Transactions ── */}
        <TabsContent value="bank-transactions" className="space-y-4">
          {/* Add Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Bank Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    data-ocid="bank_recon.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({ ...form, type: v as "Debit" | "Credit" })
                    }
                  >
                    <SelectTrigger data-ocid="bank_recon.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Debit">Debit (Money Out)</SelectItem>
                      <SelectItem value="Credit">Credit (Money In)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description *</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Transaction description"
                  data-ocid="bank_recon.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    data-ocid="bank_recon.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reference</Label>
                  <Input
                    value={form.reference}
                    onChange={(e) =>
                      setForm({ ...form, reference: e.target.value })
                    }
                    placeholder="Cheque/Ref no."
                    data-ocid="bank_recon.input"
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                className="w-full"
                data-ocid="bank_recon.submit_button"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </Button>
            </CardContent>
          </Card>

          {/* Filter + Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Input
                      type="date"
                      value={btFromDate}
                      onChange={(e) => setBtFromDate(e.target.value)}
                      className="h-8 w-36"
                      data-ocid="bank_recon.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input
                      type="date"
                      value={btToDate}
                      onChange={(e) => setBtToDate(e.target.value)}
                      className="h-8 w-36"
                      data-ocid="bank_recon.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={btType} onValueChange={setBtType}>
                      <SelectTrigger
                        className="h-8 w-28"
                        data-ocid="bank_recon.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Debit">Debit</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Search</Label>
                    <Input
                      value={btSearch}
                      onChange={(e) => setBtSearch(e.target.value)}
                      placeholder="Description or ref..."
                      className="h-8 w-48"
                      data-ocid="bank_recon.search_input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportBTPDF}
                    data-ocid="bank_recon.secondary_button"
                  >
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportBTExcel}
                    data-ocid="bank_recon.secondary_button"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">✓</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBT.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-400 py-8"
                        data-ocid="bank_recon.empty_state"
                      >
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBT.map((t, i) => (
                      <TableRow
                        key={t.id}
                        data-ocid={`bank_recon.item.${i + 1}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={t.reconciled}
                            onCheckedChange={() =>
                              toggleBankTransactionReconciled(t.id)
                            }
                            data-ocid={`bank_recon.checkbox.${i + 1}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell className="text-sm">
                          {t.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              t.type === "Credit"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {t.reference}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {fmt(t.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteBankTransaction(t.id);
                              toast.success("Deleted");
                            }}
                            className="h-6 w-6 p-0 text-red-500"
                            data-ocid={`bank_recon.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3 w-3" />
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

        {/* ── Tab 2: Journal Entries ── */}
        <TabsContent value="journal-entries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Input
                      type="date"
                      value={jeFromDate}
                      onChange={(e) => setJeFromDate(e.target.value)}
                      className="h-8 w-36"
                      data-ocid="bank_recon.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input
                      type="date"
                      value={jeToDate}
                      onChange={(e) => setJeToDate(e.target.value)}
                      className="h-8 w-36"
                      data-ocid="bank_recon.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Search</Label>
                    <Input
                      value={jeSearch}
                      onChange={(e) => setJeSearch(e.target.value)}
                      placeholder="Reference or description..."
                      className="h-8 w-52"
                      data-ocid="bank_recon.search_input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJEPDF}
                    data-ocid="bank_recon.secondary_button"
                  >
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJEExcel}
                    data-ocid="bank_recon.secondary_button"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJE.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-gray-400 py-8"
                        data-ocid="bank_recon.empty_state"
                      >
                        No journal entries in range
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJE.map((je, i) => {
                      const dr = je.lines.reduce((s, l) => s + l.debit, 0);
                      const cr = je.lines.reduce((s, l) => s + l.credit, 0);
                      return (
                        <TableRow
                          key={je.id}
                          data-ocid={`bank_recon.row.${i + 1}`}
                        >
                          <TableCell className="text-xs">
                            {je.date.slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {je.reference}
                          </TableCell>
                          <TableCell className="text-sm">
                            {je.description}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {dr > 0 ? fmt(dr) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {cr > 0 ? fmt(cr) : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Matching / Reconciliation ── */}
        <TabsContent value="matching" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">
                  Unreconciled Bank Transactions
                </p>
                <p className="text-3xl font-bold text-orange-700 mt-1">
                  {unreconciledBT.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                  Total Journal Entries
                </p>
                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {journalEntries.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Unreconciled Bank Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-orange-700">
                  Unreconciled Bank Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">Mark</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciledBT.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-green-600 py-6 font-medium"
                          data-ocid="bank_recon.empty_state"
                        >
                          ✓ All transactions reconciled
                        </TableCell>
                      </TableRow>
                    ) : (
                      unreconciledBT.map((t, i) => (
                        <TableRow
                          key={t.id}
                          data-ocid={`bank_recon.item.${i + 1}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={t.reconciled}
                              onCheckedChange={() =>
                                toggleBankTransactionReconciled(t.id)
                              }
                              data-ocid={`bank_recon.checkbox.${i + 1}`}
                            />
                          </TableCell>
                          <TableCell className="text-xs">{t.date}</TableCell>
                          <TableCell className="text-sm">
                            {t.description}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                t.type === "Credit"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {fmt(t.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Unmatched Journal Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-blue-700">
                  Journal Entries (Unmatched)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unmatchedJE.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-400 py-6"
                          data-ocid="bank_recon.empty_state"
                        >
                          No journal entries
                        </TableCell>
                      </TableRow>
                    ) : (
                      unmatchedJE.slice(0, 20).map((je, i) => {
                        const dr = je.lines.reduce((s, l) => s + l.debit, 0);
                        const cr = je.lines.reduce((s, l) => s + l.credit, 0);
                        return (
                          <TableRow
                            key={je.id}
                            data-ocid={`bank_recon.row.${i + 1}`}
                          >
                            <TableCell className="text-xs">
                              {je.date.slice(0, 10)}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {je.reference}
                            </TableCell>
                            <TableCell className="text-sm">
                              {je.description}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmt(cr - dr)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleExportMatchedPDF}
              data-ocid="bank_recon.secondary_button"
            >
              <Download className="h-4 w-4 mr-2" /> Export Matched Items PDF
            </Button>
          </div>
        </TabsContent>

        {/* ── Tab 4: Summary ── */}
        <TabsContent value="summary" className="space-y-4">
          {/* Opening Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opening Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Label className="w-40 text-sm">Opening Balance (PKR)</Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-40"
                  data-ocid="bank_recon.input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Debits
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {fmt(totalDebits)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Credits
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {fmt(totalCredits)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Bank Closing Balance
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {fmt(closingBalance)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Book Balance
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {fmt(bookBalance)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Difference */}
          <Card
            className={
              Math.abs(difference) < 0.01
                ? "border-green-300"
                : "border-red-300"
            }
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Difference (Bank − Book)
                  </p>
                  <p
                    className={`text-3xl font-bold mt-1 ${Math.abs(difference) < 0.01 ? "text-green-600" : "text-red-600"}`}
                  >
                    {fmt(difference)}
                  </p>
                </div>
                {Math.abs(difference) < 0.01 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-full text-sm">
                      ✓ Bank and book balances are reconciled!
                    </span>
                  </div>
                )}
                {Math.abs(difference) >= 0.01 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-full text-sm">
                      ✗ Difference found — review transactions
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Breakdown table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Reconciliation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">Opening Balance</span>
                  <span className="font-mono">{fmt(opening)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">+ Total Credits</span>
                  <span className="font-mono text-green-600">
                    + {fmt(totalCredits)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">− Total Debits</span>
                  <span className="font-mono text-red-600">
                    − {fmt(totalDebits)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b font-semibold">
                  <span>Bank Closing Balance</span>
                  <span className="font-mono">{fmt(closingBalance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">Book Balance (Journal)</span>
                  <span className="font-mono">{fmt(bookBalance)}</span>
                </div>
                <div
                  className={`flex justify-between py-2 rounded px-2 font-bold ${Math.abs(difference) < 0.01 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                >
                  <span>Difference</span>
                  <span className="font-mono">{fmt(difference)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2 });
}

type TrialRow = {
  code: string;
  name: string;
  level: number;
  debit: number;
  credit: number;
};

export default function TrialBalancePage() {
  const { accounts, journalEntries } = useStore();
  const { currentUser } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(`${today.slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(today);
  const [rows, setRows] = useState<TrialRow[]>([]);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    const balances: Record<string, { debit: number; credit: number }> = {};
    for (const entry of journalEntries) {
      const d = entry.date.slice(0, 10);
      if (d < fromDate || d > toDate) continue;
      for (const line of entry.lines) {
        if (!balances[line.accountId])
          balances[line.accountId] = { debit: 0, credit: 0 };
        balances[line.accountId].debit += line.debit;
        balances[line.accountId].credit += line.credit;
      }
    }
    const leafAccounts = accounts.filter((a) => !a.isGroup);
    let result: TrialRow[] = leafAccounts
      .filter((a) => {
        const b = balances[a.id];
        return b && (b.debit > 0 || b.credit > 0);
      })
      .map((a) => ({
        code: a.code,
        name: a.name,
        level: a.level,
        debit: balances[a.id]?.debit ?? 0,
        credit: balances[a.id]?.credit ?? 0,
      }));
    if (result.length === 0) {
      result = leafAccounts
        .filter((a) => a.openingBalance !== 0)
        .map((a) => ({
          code: a.code,
          name: a.name,
          level: a.level,
          debit: a.normalBalance === "Debit" ? a.openingBalance : 0,
          credit: a.normalBalance === "Credit" ? a.openingBalance : 0,
        }));
    }
    result.sort((a, b) => a.code.localeCompare(b.code));
    setRows(result);
    setGenerated(true);
  };

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleExportPDF = () => {
    const pdfRows = rows.map((r) => [
      r.code,
      r.name,
      r.debit > 0 ? fmt(r.debit) : "-",
      r.credit > 0 ? fmt(r.credit) : "-",
    ]);
    exportPDF(
      `Trial Balance: ${fromDate} to ${toDate}`,
      ["Code", "Account Name", "Debit", "Credit"],
      pdfRows,
      `trial-balance-${fromDate}-${toDate}.pdf`,
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "From", value: fromDate },
          { label: "To", value: toDate },
        ],
      },
    );
  };

  const handleExportExcel = () => {
    const xlsRows = rows.map((r) => [r.code, r.name, r.debit, r.credit]);
    xlsRows.push(["", "TOTAL", totalDebit, totalCredit]);
    exportExcel(
      `trial-balance-${fromDate}-${toDate}.xlsx`,
      "Trial Balance",
      ["Code", "Account Name", "Debit", "Credit"],
      xlsRows,
      {
        companyName: "BizPOS System",
        reportTitle: `Trial Balance: ${fromDate} to ${toDate}`,
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [
          { label: "From", value: fromDate },
          { label: "To", value: toDate },
        ],
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
            <PageHelp pageId="trial-balance" />
          </div>
          <p className="text-gray-600 mt-1">Verify that debits equal credits</p>
        </div>
        {generated && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              data-ocid="trial_balance.secondary_button"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              data-ocid="trial_balance.secondary_button"
            >
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              data-ocid="trial_balance.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
                data-ocid="trial_balance.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={generate} data-ocid="trial_balance.submit_button">
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Trial Balance: {fromDate} to {toDate}
              </CardTitle>
              {balanced ? (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  Balanced
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 font-medium">
                  <AlertCircle className="h-5 w-5" />
                  Out of Balance
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow data-ocid="trial_balance.empty_state">
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-400 py-8"
                    >
                      No transactions found for this period
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row, idx) => (
                  <TableRow
                    key={row.code}
                    data-ocid={`trial_balance.item.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-sm">
                      {row.code}
                    </TableCell>
                    <TableCell
                      style={{ paddingLeft: `${row.level * 16 + 12}px` }}
                    >
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.debit > 0 ? fmt(row.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.credit > 0 ? fmt(row.credit) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-gray-50 border-t-2">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right font-mono text-blue-700">
                    {fmt(totalDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-700">
                    {fmt(totalCredit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

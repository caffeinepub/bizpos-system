import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Account } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2 });
}

export default function ProfitLossPage() {
  const { accounts, journalEntries } = useStore();
  const { currentUser } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [generated, setGenerated] = useState(false);

  // Compute account balances from journal entries for selected date range
  const computeBalances = (): Record<string, number> => {
    const balanceMap: Record<string, number> = {};
    for (const entry of journalEntries) {
      const d = entry.date.slice(0, 10);
      if (d < fromDate || d > toDate) continue;
      for (const line of entry.lines) {
        const acc = accounts.find((a) => a.id === line.accountId);
        if (!acc) continue;
        if (!balanceMap[line.accountId]) balanceMap[line.accountId] = 0;
        if (acc.normalBalance === "Debit") {
          balanceMap[line.accountId] += line.debit - line.credit;
        } else {
          balanceMap[line.accountId] += line.credit - line.debit;
        }
      }
    }
    return balanceMap;
  };

  const getBalance = (
    acc: Account,
    balanceMap: Record<string, number>,
  ): number => {
    if (balanceMap[acc.id] !== undefined) return Math.abs(balanceMap[acc.id]);
    // Fall back to currentBalance if no journal entries for this period
    return Math.abs(acc.currentBalance);
  };

  const income = accounts.filter((a) => a.type === "Income" && !a.isGroup);
  const cogs = accounts.filter((a) => a.type === "COGS" && !a.isGroup);
  const expenses = accounts.filter((a) => a.type === "Expense" && !a.isGroup);

  // Always compute balances for display (after Generate)
  const balanceMap = generated ? computeBalances() : {};

  // Only show accounts with non-zero balance in the period
  const incomeWithBalance = generated
    ? income.filter((a) => getBalance(a, balanceMap) > 0)
    : income.filter((a) => Math.abs(a.currentBalance) > 0);
  const cogsWithBalance = generated
    ? cogs.filter((a) => getBalance(a, balanceMap) > 0)
    : cogs.filter((a) => Math.abs(a.currentBalance) > 0);
  const expensesWithBalance = generated
    ? expenses.filter((a) => getBalance(a, balanceMap) > 0)
    : expenses.filter((a) => Math.abs(a.currentBalance) > 0);

  const totalIncome = incomeWithBalance.reduce(
    (s, a) => s + getBalance(a, balanceMap),
    0,
  );
  const totalCOGS = cogsWithBalance.reduce(
    (s, a) => s + getBalance(a, balanceMap),
    0,
  );
  const grossProfit = totalIncome - totalCOGS;
  const totalExpenses = expensesWithBalance.reduce(
    (s, a) => s + getBalance(a, balanceMap),
    0,
  );
  const netIncome = grossProfit - totalExpenses;

  const handleExportPDF = () => {
    const bm = computeBalances();
    const rows: (string | number)[][] = [
      ...incomeWithBalance.map((a) => ["Income", a.name, getBalance(a, bm)]),
      ["Total Income", "", totalIncome],
      ...cogsWithBalance.map((a) => ["COGS", a.name, getBalance(a, bm)]),
      ["Total COGS", "", totalCOGS],
      ["Gross Profit", "", grossProfit],
      ...expensesWithBalance.map((a) => ["Expense", a.name, getBalance(a, bm)]),
      ["Total Expenses", "", totalExpenses],
      ["Net Income", "", netIncome],
    ];
    exportPDF(
      `Profit & Loss: ${fromDate} to ${toDate}`,
      ["Section", "Account", "Amount"],
      rows,
      `profit-loss-${fromDate}-${toDate}.pdf`,
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
    const bm = computeBalances();
    const rows: (string | number)[][] = [
      ...incomeWithBalance.map((a) => ["Income", a.name, getBalance(a, bm)]),
      ["Total Income", "", totalIncome],
      ...cogsWithBalance.map((a) => ["COGS", a.name, getBalance(a, bm)]),
      ["Total COGS", "", totalCOGS],
      ["Gross Profit", "", grossProfit],
      ...expensesWithBalance.map((a) => ["Expense", a.name, getBalance(a, bm)]),
      ["Total Expenses", "", totalExpenses],
      ["Net Income", "", netIncome],
    ];
    exportExcel(
      `profit-loss-${fromDate}-${toDate}.xlsx`,
      "Profit & Loss",
      ["Section", "Account", "Amount"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: `Profit & Loss: ${fromDate} to ${toDate}`,
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
            <h1 className="text-3xl font-bold text-gray-900">
              Profit &amp; Loss
            </h1>
            <PageHelp pageId="profit-loss" />
          </div>
          <p className="text-gray-600 mt-1">
            Income statement for the selected period — computed from journal
            entries
          </p>
        </div>
        {generated && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              data-ocid="profit_loss.secondary_button"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              data-ocid="profit_loss.secondary_button"
            >
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              data-ocid="profit_loss.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setGenerated(false);
                }}
                className="w-40"
                data-ocid="profit_loss.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setGenerated(false);
                }}
                className="w-40"
              />
            </div>
            <Button
              onClick={() => setGenerated(true)}
              data-ocid="profit_loss.submit_button"
            >
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {generated && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              Profit &amp; Loss: {fromDate} to {toDate}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="font-semibold text-gray-700 bg-green-50 px-2 py-1 rounded">
                Income
              </p>
              {incomeWithBalance.map((a) => (
                <div key={a.id} className="flex justify-between px-2 text-sm">
                  <span className="text-gray-600">{a.name}</span>
                  <span className="font-mono text-green-700">
                    {fmt(getBalance(a, balanceMap))}
                  </span>
                </div>
              ))}
              {incomeWithBalance.length === 0 && (
                <div className="text-xs text-gray-400 px-2">
                  No income recorded for this period
                </div>
              )}
              <div className="flex justify-between px-2 font-bold text-sm border-t mt-1 pt-1 text-green-700">
                <span>Total Income</span>
                <span className="font-mono">{fmt(totalIncome)}</span>
              </div>
            </div>
            {cogsWithBalance.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-gray-700 bg-yellow-50 px-2 py-1 rounded">
                  Cost of Goods Sold
                </p>
                {cogsWithBalance.map((a) => (
                  <div key={a.id} className="flex justify-between px-2 text-sm">
                    <span className="text-gray-600">{a.name}</span>
                    <span className="font-mono text-red-600">
                      {fmt(getBalance(a, balanceMap))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between px-2 font-bold text-sm border-t mt-1 pt-1 text-red-600">
                  <span>Total COGS</span>
                  <span className="font-mono">{fmt(totalCOGS)}</span>
                </div>
              </div>
            )}
            <Separator />
            <div className="flex justify-between px-2 font-bold text-base">
              <span>Gross Profit</span>
              <span
                className={`font-mono ${
                  grossProfit >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {fmt(grossProfit)}
              </span>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="font-semibold text-gray-700 bg-red-50 px-2 py-1 rounded">
                Operating Expenses
              </p>
              {expensesWithBalance.map((a) => (
                <div key={a.id} className="flex justify-between px-2 text-sm">
                  <span className="text-gray-600">{a.name}</span>
                  <span className="font-mono text-red-600">
                    {fmt(getBalance(a, balanceMap))}
                  </span>
                </div>
              ))}
              {expensesWithBalance.length === 0 && (
                <div className="text-xs text-gray-400 px-2">
                  No expenses recorded for this period
                </div>
              )}
              <div className="flex justify-between px-2 font-bold text-sm border-t mt-1 pt-1 text-red-600">
                <span>Total Expenses</span>
                <span className="font-mono">{fmt(totalExpenses)}</span>
              </div>
            </div>
            <Separator />
            <div
              className={`flex justify-between px-2 font-bold text-xl rounded p-3 ${
                netIncome >= 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span>Net Income</span>
              <span className="font-mono">{fmt(netIncome)}</span>
            </div>
            {journalEntries.filter(
              (e) =>
                e.date.slice(0, 10) >= fromDate &&
                e.date.slice(0, 10) <= toDate,
            ).length === 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠ No journal entries found for this period. Balances shown from
                account opening balances. Record transactions to see live
                P&amp;L.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

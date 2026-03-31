import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2 });
}

export default function ProfitLossPage() {
  const { accounts } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [generated, setGenerated] = useState(false);

  const income = accounts.filter((a) => a.type === "Income" && !a.isGroup);
  const cogs = accounts.filter((a) => a.type === "COGS" && !a.isGroup);
  const expenses = accounts.filter((a) => a.type === "Expense" && !a.isGroup);

  const totalIncome = income.reduce(
    (s, a) => s + Math.abs(a.currentBalance),
    0,
  );
  const totalCOGS = cogs.reduce((s, a) => s + Math.abs(a.currentBalance), 0);
  const grossProfit = totalIncome - totalCOGS;
  const totalExpenses = expenses.reduce(
    (s, a) => s + Math.abs(a.currentBalance),
    0,
  );
  const netIncome = grossProfit - totalExpenses;

  const handleExportPDF = () => {
    const rows: (string | number)[][] = [
      ...income.map((a) => ["Income", a.name, Math.abs(a.currentBalance)]),
      ["Total Income", "", totalIncome],
      ...cogs.map((a) => ["COGS", a.name, Math.abs(a.currentBalance)]),
      ["Total COGS", "", totalCOGS],
      ["Gross Profit", "", grossProfit],
      ...expenses.map((a) => ["Expense", a.name, Math.abs(a.currentBalance)]),
      ["Total Expenses", "", totalExpenses],
      ["Net Income", "", netIncome],
    ];
    exportPDF(
      `Profit & Loss: ${fromDate} to ${toDate}`,
      ["Section", "Account", "Amount"],
      rows,
      `profit-loss-${fromDate}-${toDate}.pdf`,
    );
  };

  const handleExportExcel = () => {
    const rows: (string | number)[][] = [
      ...income.map((a) => ["Income", a.name, Math.abs(a.currentBalance)]),
      ["Total Income", "", totalIncome],
      ...cogs.map((a) => ["COGS", a.name, Math.abs(a.currentBalance)]),
      ["Total COGS", "", totalCOGS],
      ["Gross Profit", "", grossProfit],
      ...expenses.map((a) => ["Expense", a.name, Math.abs(a.currentBalance)]),
      ["Total Expenses", "", totalExpenses],
      ["Net Income", "", netIncome],
    ];
    exportExcel(
      `profit-loss-${fromDate}-${toDate}.xlsx`,
      "Profit & Loss",
      ["Section", "Account", "Amount"],
      rows,
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Profit &amp; Loss
          </h1>
          <p className="text-gray-600 mt-1">
            Income statement for the selected period
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
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
                data-ocid="profit_loss.input"
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
              {income.map((a) => (
                <div key={a.id} className="flex justify-between px-2 text-sm">
                  <span className="text-gray-600">{a.name}</span>
                  <span className="font-mono text-green-700">
                    {fmt(Math.abs(a.currentBalance))}
                  </span>
                </div>
              ))}
              {income.length === 0 && (
                <div className="text-xs text-gray-400 px-2">
                  No income accounts with balance
                </div>
              )}
              <div className="flex justify-between px-2 font-bold text-sm border-t mt-1 pt-1 text-green-700">
                <span>Total Income</span>
                <span className="font-mono">{fmt(totalIncome)}</span>
              </div>
            </div>
            {cogs.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-gray-700 bg-yellow-50 px-2 py-1 rounded">
                  Cost of Goods Sold
                </p>
                {cogs.map((a) => (
                  <div key={a.id} className="flex justify-between px-2 text-sm">
                    <span className="text-gray-600">{a.name}</span>
                    <span className="font-mono text-red-600">
                      {fmt(Math.abs(a.currentBalance))}
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
                className={`font-mono ${grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}
              >
                {fmt(grossProfit)}
              </span>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="font-semibold text-gray-700 bg-red-50 px-2 py-1 rounded">
                Operating Expenses
              </p>
              {expenses.map((a) => (
                <div key={a.id} className="flex justify-between px-2 text-sm">
                  <span className="text-gray-600">{a.name}</span>
                  <span className="font-mono text-red-600">
                    {fmt(Math.abs(a.currentBalance))}
                  </span>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-xs text-gray-400 px-2">
                  No expense accounts with balance
                </div>
              )}
              <div className="flex justify-between px-2 font-bold text-sm border-t mt-1 pt-1 text-red-600">
                <span>Total Expenses</span>
                <span className="font-mono">{fmt(totalExpenses)}</span>
              </div>
            </div>
            <Separator />
            <div
              className={`flex justify-between px-2 font-bold text-xl rounded p-3 ${netIncome >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              <span>Net Income</span>
              <span className="font-mono">{fmt(netIncome)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import type { Account } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2 });
}

function groupAccounts(accounts: Account[], type: Account["type"]) {
  return accounts.filter(
    (a) => a.type === type && !a.isGroup && a.currentBalance !== 0,
  );
}

export default function BalanceSheetPage() {
  const { accounts } = useStore();
  const { currentUser } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf] = useState(today);
  const [generated, setGenerated] = useState(false);

  const assets = groupAccounts(accounts, "Asset");
  const liabilities = groupAccounts(accounts, "Liability");
  const equity = groupAccounts(accounts, "Equity");

  const currentAssets = assets.filter((a) => {
    const p = accounts.find((x) => x.id === a.parentId);
    const gp = p ? accounts.find((x) => x.id === p.parentId) : null;
    const names = [a.name, p?.name ?? "", gp?.name ?? ""]
      .join(" ")
      .toLowerCase();
    return (
      names.includes("current") ||
      names.includes("cash") ||
      names.includes("receivable") ||
      names.includes("inventory")
    );
  });
  const fixedAssets = assets.filter((a) => !currentAssets.includes(a));
  const currentLiabilities = liabilities.filter((a) => {
    const p = accounts.find((x) => x.id === a.parentId);
    const names = [a.name, p?.name ?? ""].join(" ").toLowerCase();
    return (
      names.includes("current") ||
      names.includes("payable") ||
      names.includes("short")
    );
  });
  const longTermLiabilities = liabilities.filter(
    (a) => !currentLiabilities.includes(a),
  );

  const totalCurrentAssets = currentAssets.reduce(
    (s, a) => s + a.currentBalance,
    0,
  );
  const totalFixedAssets = fixedAssets.reduce(
    (s, a) => s + a.currentBalance,
    0,
  );
  const totalAssets = assets.reduce((s, a) => s + a.currentBalance, 0);
  const totalCurrentLiab = currentLiabilities.reduce(
    (s, a) => s + a.currentBalance,
    0,
  );
  const totalLongTermLiab = longTermLiabilities.reduce(
    (s, a) => s + a.currentBalance,
    0,
  );
  const totalLiabilities = liabilities.reduce(
    (s, a) => s + a.currentBalance,
    0,
  );
  const totalEquity = equity.reduce((s, a) => s + a.currentBalance, 0);
  const totalLiabEquity = totalLiabilities + totalEquity;
  const balanced = Math.abs(totalAssets - totalLiabEquity) < 0.01;

  const buildRows = () => [
    ["ASSETS", "", ""] as (string | number)[],
    ...currentAssets.map((a): (string | number)[] => [
      "Current Assets",
      a.name,
      a.currentBalance,
    ]),
    ["Total Current Assets", "", totalCurrentAssets],
    ...fixedAssets.map((a): (string | number)[] => [
      "Fixed Assets",
      a.name,
      a.currentBalance,
    ]),
    ["Total Fixed Assets", "", totalFixedAssets],
    ["TOTAL ASSETS", "", totalAssets],
    ["LIABILITIES", "", ""],
    ...currentLiabilities.map((a): (string | number)[] => [
      "Current Liabilities",
      a.name,
      a.currentBalance,
    ]),
    ["Total Current Liabilities", "", totalCurrentLiab],
    ...longTermLiabilities.map((a): (string | number)[] => [
      "Long-term Liabilities",
      a.name,
      a.currentBalance,
    ]),
    ["Total Long-term Liabilities", "", totalLongTermLiab],
    ...equity.map((a): (string | number)[] => [
      "Equity",
      a.name,
      a.currentBalance,
    ]),
    ["Total Equity", "", totalEquity],
    ["TOTAL LIABILITIES + EQUITY", "", totalLiabEquity],
  ];

  const handleExportPDF = () => {
    exportPDF(
      `Balance Sheet as of ${asOf}`,
      ["Section", "Account", "Amount"],
      buildRows(),
      `balance-sheet-${asOf}.pdf`,
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [{ label: "As of Date", value: asOf }],
      },
    );
  };

  const handleExportExcel = () => {
    exportExcel(
      `balance-sheet-${asOf}.xlsx`,
      "Balance Sheet",
      ["Section", "Account", "Amount"],
      buildRows(),
      {
        companyName: "BizPOS System",
        reportTitle: `Balance Sheet as of ${asOf}`,
        generatedBy: currentUser?.name ?? "Unknown",
        filters: [{ label: "As of Date", value: asOf }],
      },
    );
  };

  const Section = ({
    title,
    items,
    total,
    color,
  }: { title: string; items: Account[]; total: number; color: string }) => (
    <div className="space-y-1">
      <p className="font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded">
        {title}
      </p>
      {items.map((a) => (
        <div key={a.id} className="flex justify-between px-2 text-sm">
          <span className="text-gray-600">{a.name}</span>
          <span className="font-mono">{fmt(a.currentBalance)}</span>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-xs text-gray-400 px-2">No accounts</div>
      )}
      <div
        className={`flex justify-between px-2 font-bold text-sm border-t mt-1 pt-1 ${color}`}
      >
        <span>Total {title}</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600 mt-1">Assets = Liabilities + Equity</p>
        </div>
        {generated && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              data-ocid="balance_sheet.secondary_button"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              data-ocid="balance_sheet.secondary_button"
            >
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              data-ocid="balance_sheet.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>As of Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="space-y-1.5">
              <Label>As of</Label>
              <Input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="w-40"
                data-ocid="balance_sheet.input"
              />
            </div>
            <Button
              onClick={() => setGenerated(true)}
              data-ocid="balance_sheet.submit_button"
            >
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {generated && (
        <>
          <div className="flex items-center gap-2">
            {balanced ? (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                Balance Sheet is Balanced
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="h-5 w-5" />
                Imbalanced — Assets: {fmt(totalAssets)} vs Liab+Equity:{" "}
                {fmt(totalLiabEquity)}
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Section
                  title="Current Assets"
                  items={currentAssets}
                  total={totalCurrentAssets}
                  color="text-blue-600"
                />
                <Section
                  title="Fixed Assets"
                  items={fixedAssets}
                  total={totalFixedAssets}
                  color="text-blue-600"
                />
                <Separator />
                <div className="flex justify-between font-bold text-base px-2">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono text-blue-700">
                    {fmt(totalAssets)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">
                  Liabilities &amp; Equity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Section
                  title="Current Liabilities"
                  items={currentLiabilities}
                  total={totalCurrentLiab}
                  color="text-red-600"
                />
                <Section
                  title="Long-term Liabilities"
                  items={longTermLiabilities}
                  total={totalLongTermLiab}
                  color="text-red-600"
                />
                <Separator />
                <Section
                  title="Equity"
                  items={equity}
                  total={totalEquity}
                  color="text-green-600"
                />
                <Separator />
                <div className="flex justify-between font-bold text-base px-2">
                  <span>TOTAL LIABILITIES + EQUITY</span>
                  <span className="font-mono text-red-700">
                    {fmt(totalLiabEquity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

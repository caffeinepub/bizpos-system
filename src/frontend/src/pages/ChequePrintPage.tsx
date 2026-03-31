import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { exportExcel, exportPDF } from "../utils/exportUtils";

interface BankAccount {
  id: string;
  accountNumber: string;
  accountTitle: string;
  bankId: string;
}
interface ChequeBook {
  id: string;
  chequebookNumber: string;
  bankAccountId: string;
  status: string;
}
interface ChequeLeaf {
  id: string;
  chequebookId: string;
  leafNumber: number;
  status: string;
}
interface ChequeTemplate {
  id: string;
  name: string;
  bankId: string;
  chequeWidth: number;
  chequeHeight: number;
  bgColor: string;
  fields: Record<
    string,
    { x: number; y: number; w?: number; fontSize?: number }
  >;
}
interface PrintRecord {
  id: string;
  chequebookId: string;
  leafId: string;
  leafNumber: number;
  bankAccountId: string;
  payeeName: string;
  amount: number;
  amountWords: string;
  date: string;
  memo: string;
  templateId: string;
  printedAt: string;
  printedBy: string;
}

const LS_ACCOUNTS = "bizpos_bank_accounts";
const LS_BOOKS = "bizpos_cheque_books";
const LS_LEAVES = "bizpos_cheque_leaves";
const LS_TEMPLATES = "bizpos_cheque_templates";
const LS_HISTORY = "bizpos_cheque_print_history";

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function save<T>(key: string, d: T[]) {
  localStorage.setItem(key, JSON.stringify(d));
}

// Number to words
const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
function toWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : "");
  if (n < 1000)
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${toWords(n % 100)}` : ""}`;
  if (n < 100000)
    return `${toWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${toWords(n % 1000)}` : ""}`;
  if (n < 10000000)
    return `${toWords(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${toWords(n % 100000)}` : ""}`;
  return `${toWords(Math.floor(n / 10000000))} Crore${n % 10000000 ? ` ${toWords(n % 10000000)}` : ""}`;
}
function numToWords(amount: number): string {
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  return toWords(intPart) + (decPart > 0 ? ` and ${decPart}/100` : " Only");
}

export default function ChequePrintPage() {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [books, setBooks] = useState<ChequeBook[]>([]);
  const [leaves, setLeaves] = useState<ChequeLeaf[]>([]);
  const [templates, setTemplates] = useState<ChequeTemplate[]>([]);
  const [history, setHistory] = useState<PrintRecord[]>([]);

  const [selAccount, setSelAccount] = useState("");
  const [selBook, setSelBook] = useState("");
  const [selLeaf, setSelLeaf] = useState("");
  const [selTemplate, setSelTemplate] = useState("");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [amountWords, setAmountWords] = useState("");
  const [chequeDate, setChequeDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [memo, setMemo] = useState("");
  const [histSearch, setHistSearch] = useState("");
  const [histAccount, setHistAccount] = useState("all");
  const [histDateFrom, setHistDateFrom] = useState("");
  const [histDateTo, setHistDateTo] = useState("");

  useEffect(() => {
    setAccounts(load<BankAccount>(LS_ACCOUNTS));
    setBooks(load<ChequeBook>(LS_BOOKS));
    setLeaves(load<ChequeLeaf>(LS_LEAVES));
    setTemplates(load<ChequeTemplate>(LS_TEMPLATES));
    setHistory(load<PrintRecord>(LS_HISTORY));
  }, []);

  const filteredBooks = books.filter(
    (b) => b.bankAccountId === selAccount && b.status === "active",
  );
  const filteredLeaves = leaves.filter(
    (l) => l.chequebookId === selBook && l.status === "available",
  );
  const _selectedAccount = accounts.find((a) => a.id === selAccount);
  const selectedTemplate = templates.find((t) => t.id === selTemplate);

  function handleAmountChange(val: string) {
    setAmount(val);
    const n = Number.parseFloat(val);
    if (!Number.isNaN(n)) setAmountWords(numToWords(n));
    else setAmountWords("");
  }

  function generatePDF(record?: PrintRecord) {
    const tpl = record
      ? templates.find((t) => t.id === record.templateId)
      : selectedTemplate;
    if (!tpl) {
      alert("Template not found.");
      return;
    }
    const rec = record || {
      payeeName: payee,
      amount: Number.parseFloat(amount) || 0,
      amountWords,
      date: chequeDate,
      memo,
      leafNumber: leaves.find((l) => l.id === selLeaf)?.leafNumber || 0,
    };
    const account = accounts.find(
      (a) => a.id === (record?.bankAccountId || selAccount),
    );

    const JsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
    const doc = new JsPDF({
      unit: "mm",
      format: [tpl.chequeWidth, tpl.chequeHeight],
      orientation: "landscape",
    });
    // Background
    doc.setFillColor(tpl.bgColor);
    doc.rect(0, 0, tpl.chequeWidth, tpl.chequeHeight, "F");

    const f = tpl.fields;
    doc.setTextColor("#000000");

    // Bank Name
    if (f.bankName) {
      doc.setFontSize(f.bankName.fontSize || 9);
      doc.text(
        String(rec.leafNumber ? `Cheque #${rec.leafNumber}` : ""),
        f.bankName.x,
        f.bankName.y,
      );
    }
    // Date
    if (f.date) {
      doc.setFontSize(f.date.fontSize || 10);
      doc.text(rec.date, f.date.x, f.date.y);
    }
    // Payee
    if (f.payeeName) {
      doc.setFontSize(f.payeeName.fontSize || 11);
      doc.text(rec.payeeName, f.payeeName.x, f.payeeName.y, {
        maxWidth: f.payeeName.w,
      });
    }
    // Amount Words
    if (f.amountWords) {
      doc.setFontSize(f.amountWords.fontSize || 10);
      doc.text(rec.amountWords, f.amountWords.x, f.amountWords.y, {
        maxWidth: f.amountWords.w,
      });
    }
    // Amount Numbers
    if (f.amountNumbers) {
      doc.setFontSize(f.amountNumbers.fontSize || 12);
      doc.text(
        rec.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        f.amountNumbers.x,
        f.amountNumbers.y,
      );
    }
    // Account Number
    if (f.accountNumber && account) {
      doc.setFontSize(f.accountNumber.fontSize || 9);
      doc.text(account.accountNumber, f.accountNumber.x, f.accountNumber.y);
    }
    // Memo
    if (f.memo && rec.memo) {
      doc.setFontSize(f.memo.fontSize || 9);
      doc.text(rec.memo, f.memo.x, f.memo.y, { maxWidth: f.memo.w });
    }
    // Signature Line
    if (f.signatureLine) {
      doc.setDrawColor("#000000");
      doc.line(
        f.signatureLine.x,
        f.signatureLine.y,
        f.signatureLine.x + (f.signatureLine.w || 55),
        f.signatureLine.y,
      );
    }

    doc.save(`cheque_${(rec as any).leafNumber || "print"}.pdf`);
  }

  function printCheque() {
    if (
      !selAccount ||
      !selBook ||
      !selLeaf ||
      !selTemplate ||
      !payee ||
      !amount
    ) {
      alert("Please fill all required fields.");
      return;
    }
    const leaf = leaves.find((l) => l.id === selLeaf);
    if (!leaf) return;
    generatePDF();
    // Mark leaf used
    const updatedLeaves = leaves.map((l) =>
      l.id === selLeaf
        ? {
            ...l,
            status: "used",
            dateUsed: new Date().toISOString().slice(0, 10),
          }
        : l,
    );
    save(LS_LEAVES, updatedLeaves);
    setLeaves(updatedLeaves);
    // Record history
    const rec: PrintRecord = {
      id: `ph${Date.now()}`,
      chequebookId: selBook,
      leafId: selLeaf,
      leafNumber: leaf.leafNumber,
      bankAccountId: selAccount,
      payeeName: payee,
      amount: Number.parseFloat(amount) || 0,
      amountWords,
      date: chequeDate,
      memo,
      templateId: selTemplate,
      printedAt: new Date().toISOString(),
      printedBy: currentUser?.name || "",
    };
    const updatedHistory = [rec, ...history];
    save(LS_HISTORY, updatedHistory);
    setHistory(updatedHistory);
    // Reset leaf selection
    setSelLeaf("");
    // Update book status if exhausted
    const book = books.find((b) => b.id === selBook);
    if (book) {
      const remaining = updatedLeaves.filter(
        (l) => l.chequebookId === selBook && l.status === "available",
      ).length;
      if (remaining === 0) {
        const updatedBooks = books.map((b) =>
          b.id === selBook ? { ...b, status: "exhausted" } : b,
        );
        save(LS_BOOKS, updatedBooks);
        setBooks(updatedBooks);
      }
    }
  }

  const filteredHistory = history.filter(
    (h) =>
      (histAccount === "all" || h.bankAccountId === histAccount) &&
      (histSearch === "" ||
        h.payeeName.toLowerCase().includes(histSearch.toLowerCase())) &&
      (!histDateFrom || h.date >= histDateFrom) &&
      (!histDateTo || h.date <= histDateTo),
  );

  function voidCheque(id: string) {
    const rec = history.find((h) => h.id === id);
    if (!rec) return;
    const updatedLeaves = leaves.map((l) =>
      l.id === rec.leafId ? { ...l, status: "voided" } : l,
    );
    save(LS_LEAVES, updatedLeaves);
    setLeaves(updatedLeaves);
  }

  function exportHistExcel() {
    exportExcel(
      "cheque_history.xlsx",
      "Cheque History",
      [
        "Cheque No.",
        "Account",
        "Payee",
        "Amount",
        "Date",
        "Memo",
        "Printed By",
        "Printed At",
      ],
      filteredHistory.map((h) => [
        h.leafNumber,
        accounts.find((a) => a.id === h.bankAccountId)?.accountTitle || "",
        h.payeeName,
        h.amount,
        h.date,
        h.memo,
        h.printedBy,
        new Date(h.printedAt).toLocaleString(),
      ]),
      { generatedBy: currentUser?.name },
    );
  }
  function exportHistPDF() {
    exportPDF(
      "Cheque Print History",
      ["Cheque No.", "Account", "Payee", "Amount", "Date", "Printed At"],
      filteredHistory.map((h) => [
        h.leafNumber,
        accounts.find((a) => a.id === h.bankAccountId)?.accountTitle || "",
        h.payeeName,
        h.amount,
        h.date,
        new Date(h.printedAt).toLocaleString(),
      ]),
      "cheque_history.pdf",
      { generatedBy: currentUser?.name },
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cheque Print</h1>
      <Tabs defaultValue="print">
        <TabsList className="mb-4">
          <TabsTrigger value="print">Print Cheque</TabsTrigger>
          <TabsTrigger value="history">Print History</TabsTrigger>
        </TabsList>

        <TabsContent value="print">
          <div className="max-w-2xl bg-white rounded-lg border shadow-sm p-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>1. Bank Account *</Label>
                  <Select
                    value={selAccount}
                    onValueChange={(v) => {
                      setSelAccount(v);
                      setSelBook("");
                      setSelLeaf("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.accountTitle} ({a.accountNumber})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>2. Cheque Book *</Label>
                  <Select
                    value={selBook}
                    onValueChange={(v) => {
                      setSelBook(v);
                      setSelLeaf("");
                    }}
                    disabled={!selAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cheque book" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBooks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.chequebookNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>3. Cheque Leaf (Available) *</Label>
                  <Select
                    value={selLeaf}
                    onValueChange={setSelLeaf}
                    disabled={!selBook}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leaf" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLeaves.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          #{l.leafNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>4. Cheque Date *</Label>
                  <Input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>5. Payee Name *</Label>
                <Input
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="Pay to the order of..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>6. Amount (Numbers) *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Amount in Words (auto, editable)</Label>
                  <Input
                    value={amountWords}
                    onChange={(e) => setAmountWords(e.target.value)}
                    placeholder="Auto-filled"
                  />
                </div>
              </div>

              <div>
                <Label>7. Memo / Remarks</Label>
                <Input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label>8. Cheque Template *</Label>
                <Select value={selTemplate} onValueChange={setSelTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  Template: <strong>{selectedTemplate.name}</strong> —{" "}
                  {selectedTemplate.chequeWidth}×{selectedTemplate.chequeHeight}
                  mm
                </div>
              )}

              <div className="pt-2 border-t">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={printCheque}
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Generate & Download Cheque PDF
                </Button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  The selected cheque leaf will be marked as Used after
                  generating the PDF.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 flex gap-3 border-b flex-wrap justify-between">
              <div className="flex gap-3 flex-wrap">
                <Input
                  placeholder="Search by payee..."
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  className="w-48"
                />
                <Select value={histAccount} onValueChange={setHistAccount}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={histDateFrom}
                  onChange={(e) => setHistDateFrom(e.target.value)}
                  className="w-36"
                />
                <Input
                  type="date"
                  value={histDateTo}
                  onChange={(e) => setHistDateTo(e.target.value)}
                  className="w-36"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportHistExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportHistPDF}>
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      "Cheque No.",
                      "Bank Account",
                      "Payee Name",
                      "Amount",
                      "Date",
                      "Memo",
                      "Printed By",
                      "Printed At",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-medium text-gray-600"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-8 text-gray-400"
                      >
                        No print history
                      </td>
                    </tr>
                  )}
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">#{h.leafNumber}</td>
                      <td className="px-4 py-3">
                        {accounts.find((a) => a.id === h.bankAccountId)
                          ?.accountTitle || h.bankAccountId}
                      </td>
                      <td className="px-4 py-3 font-medium">{h.payeeName}</td>
                      <td className="px-4 py-3">{h.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">{h.date}</td>
                      <td className="px-4 py-3 text-gray-500">{h.memo}</td>
                      <td className="px-4 py-3">{h.printedBy}</td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(h.printedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generatePDF(h)}
                            title="Re-print"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 text-xs"
                            onClick={() => voidCheque(h.id)}
                          >
                            Void
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

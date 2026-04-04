import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Printer,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

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
interface TemplateField {
  fieldName: string;
  prefix: string;
  postfix: string;
  fieldSize: number;
  fieldWidth: number;
  xAxis: number;
  yAxis: number;
}
interface ChequeTemplate {
  id: string;
  name: string;
  bankId: string;
  // new format
  chequeHeightInches?: number;
  chequeWidthInches?: number;
  fields:
    | TemplateField[]
    | Record<string, { x: number; y: number; w?: number; fontSize?: number }>;
  // old format (kept for migration)
  chequeWidth?: number;
  chequeHeight?: number;
  bgColor?: string;
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

interface BulkRow {
  leafId: string;
  leafNumber: number;
  selected: boolean;
  payee: string;
  amount: string;
  amountWords: string;
  date: string;
  memo: string;
}

interface ImportChequeRow {
  Payee?: string;
  Amount?: string | number;
  "Date (YYYY-MM-DD)"?: string;
  Memo?: string;
  _valid?: boolean;
  _error?: string;
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

// Helper: get cheque dimensions in mm
function getChequeDimsMm(tpl: ChequeTemplate): { w: number; h: number } {
  if (tpl.chequeWidthInches && tpl.chequeHeightInches) {
    return {
      w: tpl.chequeWidthInches * 25.4,
      h: tpl.chequeHeightInches * 25.4,
    };
  }
  return { w: tpl.chequeWidth || 176, h: tpl.chequeHeight || 83 };
}

function printChequeOnDoc(
  doc: any,
  tpl: ChequeTemplate,
  data: {
    payeeName: string;
    amount: number;
    amountWords: string;
    date: string;
    memo: string;
    leafNumber: number;
    accountNumber: string;
  },
) {
  const dims = getChequeDimsMm(tpl);
  doc.setFillColor(tpl.bgColor || "#ffffff");
  doc.rect(0, 0, dims.w, dims.h, "F");
  doc.setTextColor("#000000");

  if (Array.isArray(tpl.fields)) {
    // New format: TemplateField[]
    const fieldValueMap: Record<string, string> = {
      Amount: data.amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Date: data.date,
      Payee: data.payeeName,
      Rupees: data.amountWords,
      Bearer: data.payeeName,
    };
    for (const fld of tpl.fields as TemplateField[]) {
      const rawVal = fieldValueMap[fld.fieldName] ?? "";
      const displayVal = (fld.prefix || "") + rawVal + (fld.postfix || "");
      if (!displayVal.trim()) continue;
      doc.setFontSize(fld.fieldSize || 10);
      doc.text(displayVal, fld.xAxis, fld.yAxis, {
        maxWidth: fld.fieldWidth || undefined,
      });
    }
  } else {
    // Old format: Record<string, FieldConfig>
    const f = tpl.fields as Record<
      string,
      { x: number; y: number; w?: number; fontSize?: number }
    >;
    if (f.bankName) {
      doc.setFontSize(f.bankName.fontSize || 9);
      doc.text(
        data.leafNumber ? `Cheque #${data.leafNumber}` : "",
        f.bankName.x,
        f.bankName.y,
      );
    }
    if (f.date) {
      doc.setFontSize(f.date.fontSize || 10);
      doc.text(data.date, f.date.x, f.date.y);
    }
    if (f.payeeName) {
      doc.setFontSize(f.payeeName.fontSize || 11);
      doc.text(data.payeeName, f.payeeName.x, f.payeeName.y, {
        maxWidth: f.payeeName.w,
      });
    }
    if (f.amountWords) {
      doc.setFontSize(f.amountWords.fontSize || 10);
      doc.text(data.amountWords, f.amountWords.x, f.amountWords.y, {
        maxWidth: f.amountWords.w,
      });
    }
    if (f.amountNumbers) {
      doc.setFontSize(f.amountNumbers.fontSize || 12);
      doc.text(
        data.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        f.amountNumbers.x,
        f.amountNumbers.y,
      );
    }
    if (f.accountNumber && data.accountNumber) {
      doc.setFontSize(f.accountNumber.fontSize || 9);
      doc.text(data.accountNumber, f.accountNumber.x, f.accountNumber.y);
    }
    if (f.memo && data.memo) {
      doc.setFontSize(f.memo.fontSize || 9);
      doc.text(data.memo, f.memo.x, f.memo.y, { maxWidth: f.memo.w });
    }
    if (f.signatureLine) {
      doc.setDrawColor("#000000");
      doc.line(
        f.signatureLine.x,
        f.signatureLine.y,
        f.signatureLine.x + (f.signatureLine.w || 55),
        f.signatureLine.y,
      );
    }
  }
}

export default function ChequePrintPage() {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [books, setBooks] = useState<ChequeBook[]>([]);
  const [leaves, setLeaves] = useState<ChequeLeaf[]>([]);
  const [templates, setTemplates] = useState<ChequeTemplate[]>([]);
  const [history, setHistory] = useState<PrintRecord[]>([]);

  // Single print state
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

  // History filter state
  const [histSearch, setHistSearch] = useState("");
  const [histAccount, setHistAccount] = useState("all");
  const [histDateFrom, setHistDateFrom] = useState("");
  const [histDateTo, setHistDateTo] = useState("");

  // Bulk print state
  const [bulkAccount, setBulkAccount] = useState("");
  const [bulkBook, setBulkBook] = useState("");
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSubTab, setBulkSubTab] = useState<"manual" | "import">("manual");
  const [importChequeRows, setImportChequeRows] = useState<ImportChequeRow[]>(
    [],
  );
  const [importChequeDone, setImportChequeDone] = useState<number | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);

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
  const selectedTemplate = templates.find((t) => t.id === selTemplate);

  function handleAmountChange(val: string) {
    setAmount(val);
    const n = Number.parseFloat(val);
    if (!Number.isNaN(n)) setAmountWords(numToWords(n));
    else setAmountWords("");
  }

  function getJsPDF() {
    return (window as any).jspdf?.jsPDF || (window as any).jsPDF;
  }

  function generateSinglePDF(record?: PrintRecord) {
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

    const JsPDF = getJsPDF();
    const doc = new JsPDF({
      unit: "mm",
      format: [getChequeDimsMm(tpl).w, getChequeDimsMm(tpl).h],
      orientation: "landscape",
    });

    printChequeOnDoc(doc, tpl, {
      payeeName: rec.payeeName,
      amount: rec.amount,
      amountWords: rec.amountWords,
      date: rec.date,
      memo: rec.memo,
      leafNumber: (rec as any).leafNumber || 0,
      accountNumber: account?.accountNumber || "",
    });

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
    generateSinglePDF();
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
    setSelLeaf("");
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

  // ---- Bulk print helpers ----
  const bulkFilteredBooks = books.filter(
    (b) => b.bankAccountId === bulkAccount && b.status === "active",
  );
  const bulkAvailableLeaves = leaves.filter(
    (l) => l.chequebookId === bulkBook && l.status === "available",
  );

  function buildBulkRows(bookId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const available = leaves.filter(
      (l) => l.chequebookId === bookId && l.status === "available",
    );
    setBulkRows(
      available.map((l) => ({
        leafId: l.id,
        leafNumber: l.leafNumber,
        selected: false,
        payee: "",
        amount: "",
        amountWords: "",
        date: today,
        memo: "",
      })),
    );
  }

  function updateBulkRow(idx: number, patch: Partial<BulkRow>) {
    setBulkRows((rows) =>
      rows.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, ...patch };
        // Auto-compute amountWords if amount changed
        if (patch.amount !== undefined) {
          const n = Number.parseFloat(patch.amount);
          updated.amountWords = !Number.isNaN(n) ? numToWords(n) : "";
        }
        return updated;
      }),
    );
  }

  const allSelected = bulkRows.length > 0 && bulkRows.every((r) => r.selected);
  const selectedCount = bulkRows.filter((r) => r.selected).length;

  function toggleSelectAll(checked: boolean) {
    setBulkRows((rows) => rows.map((r) => ({ ...r, selected: checked })));
  }

  // ---- Cheque data import from Excel ----
  function downloadChequeTemplate() {
    const XLSX = (window as any).XLSX;
    const headers = ["Payee", "Amount", "Date (YYYY-MM-DD)", "Memo"];
    const sample = [
      "John Doe",
      15000,
      new Date().toISOString().slice(0, 10),
      "Office Supplies",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cheques");
    XLSX.writeFile(wb, "cheque_data_import_template.xlsx");
  }

  function handleChequeFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportChequeDone(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const XLSX = (window as any).XLSX;
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: ImportChequeRow[] = XLSX.utils.sheet_to_json(ws, {
        defval: "",
      });
      const validated = rows.map((r) => {
        const hasPayee = !!(r.Payee && String(r.Payee).trim());
        const hasAmount = !!(
          r.Amount !== "" &&
          r.Amount !== undefined &&
          !Number.isNaN(Number(r.Amount))
        );
        const valid = hasPayee && hasAmount;
        return {
          ...r,
          _valid: valid,
          _error: !hasPayee
            ? "Payee required"
            : !hasAmount
              ? "Amount required"
              : "",
        };
      });
      setImportChequeRows(validated);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  function applyImportedRows() {
    const valid = importChequeRows.filter((r) => r._valid);
    if (valid.length === 0 || !bulkBook) return;
    const available = leaves.filter(
      (l) => l.chequebookId === bulkBook && l.status === "available",
    );
    const newRows: BulkRow[] = valid.slice(0, available.length).map((r, i) => {
      const amt = String(r.Amount ?? "");
      const n = Number.parseFloat(amt);
      return {
        leafId: available[i].id,
        leafNumber: available[i].leafNumber,
        selected: true,
        payee: String(r.Payee ?? ""),
        amount: amt,
        amountWords: !Number.isNaN(n) ? numToWords(n) : "",
        date: String(
          r["Date (YYYY-MM-DD)"] ?? new Date().toISOString().slice(0, 10),
        ),
        memo: String(r.Memo ?? ""),
      };
    });
    setBulkRows(newRows);
    setImportChequeDone(newRows.length);
    setBulkSubTab("manual");
  }

  async function generateBulkPDF() {
    const selected = bulkRows.filter((r) => r.selected);
    if (selected.length === 0) {
      alert("Please select at least one cheque.");
      return;
    }
    if (!bulkTemplate) {
      alert("Please select a cheque template.");
      return;
    }
    const tpl = templates.find((t) => t.id === bulkTemplate);
    if (!tpl) {
      alert("Template not found.");
      return;
    }
    const account = accounts.find((a) => a.id === bulkAccount);

    setBulkGenerating(true);
    try {
      const JsPDF = getJsPDF();
      const doc = new JsPDF({
        unit: "mm",
        format: [getChequeDimsMm(tpl).w, getChequeDimsMm(tpl).h],
        orientation: "landscape",
      });

      const now = new Date();
      const newHistory: PrintRecord[] = [];
      let updatedLeaves = [...leaves];

      selected.forEach((row, idx) => {
        if (idx > 0) {
          doc.addPage(
            [getChequeDimsMm(tpl).w, getChequeDimsMm(tpl).h],
            "landscape",
          );
        }
        printChequeOnDoc(doc, tpl, {
          payeeName: row.payee,
          amount: Number.parseFloat(row.amount) || 0,
          amountWords: row.amountWords,
          date: row.date,
          memo: row.memo,
          leafNumber: row.leafNumber,
          accountNumber: account?.accountNumber || "",
        });

        // Mark leaf as used
        updatedLeaves = updatedLeaves.map((l) =>
          l.id === row.leafId
            ? {
                ...l,
                status: "used",
                dateUsed: now.toISOString().slice(0, 10),
              }
            : l,
        );

        newHistory.push({
          id: `ph${Date.now()}_${idx}`,
          chequebookId: bulkBook,
          leafId: row.leafId,
          leafNumber: row.leafNumber,
          bankAccountId: bulkAccount,
          payeeName: row.payee,
          amount: Number.parseFloat(row.amount) || 0,
          amountWords: row.amountWords,
          date: row.date,
          memo: row.memo,
          templateId: bulkTemplate,
          printedAt: now.toISOString(),
          printedBy: currentUser?.name || "",
        });
      });

      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      doc.save(`bulk_cheques_${dateStr}.pdf`);

      // Persist
      save(LS_LEAVES, updatedLeaves);
      setLeaves(updatedLeaves);
      const updatedHistory = [...newHistory, ...history];
      save(LS_HISTORY, updatedHistory);
      setHistory(updatedHistory);

      // Refresh bulk rows (remove used ones)
      buildBulkRows(bulkBook);
    } finally {
      setBulkGenerating(false);
    }
  }

  // ---- History ----
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
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cheque Print</h1>
        <PageHelp pageId="cheque-print" />
      </div>
      <Tabs defaultValue="print">
        <TabsList className="mb-4">
          <TabsTrigger value="print">
            <Printer className="w-4 h-4 mr-1" />
            Print Cheque
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Layers className="w-4 h-4 mr-1" />
            Bulk Print
          </TabsTrigger>
          <TabsTrigger value="history">Print History</TabsTrigger>
        </TabsList>

        {/* ===== Single Print ===== */}
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
                      {accounts.map((a) => (
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
                  data-ocid="cheque_print.primary_button"
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

        {/* ===== Bulk Print ===== */}
        <TabsContent value="bulk">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="font-semibold text-gray-700 mb-4">
              Bulk Cheque Print
            </h2>

            {/* Shared selectors */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label>Bank Account *</Label>
                <Select
                  value={bulkAccount}
                  onValueChange={(v) => {
                    setBulkAccount(v);
                    setBulkBook("");
                    setBulkRows([]);
                    setImportChequeRows([]);
                    setImportChequeDone(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountTitle} ({a.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cheque Book *</Label>
                <Select
                  value={bulkBook}
                  onValueChange={(v) => {
                    setBulkBook(v);
                    buildBulkRows(v);
                    setImportChequeRows([]);
                    setImportChequeDone(null);
                  }}
                  disabled={!bulkAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cheque book" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulkFilteredBooks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.chequebookNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cheque Template *</Label>
                <Select value={bulkTemplate} onValueChange={setBulkTemplate}>
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
            </div>

            {/* Sub-tab switcher */}
            <div className="flex gap-1 mb-5 border-b">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  bulkSubTab === "manual"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setBulkSubTab("manual")}
                data-ocid="cheque_bulk.tab"
              >
                Manual Entry
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors $
                  bulkSubTab === "import"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"`}
                onClick={() => setBulkSubTab("import")}
                data-ocid="cheque_bulk.tab"
              >
                Import from Excel
              </button>
            </div>

            {/* === Manual Entry sub-tab === */}
            {bulkSubTab === "manual" && (
              <div>
                {importChequeDone !== null && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    {importChequeDone} cheque row
                    {importChequeDone !== 1 ? "s" : ""} imported from Excel —
                    review and edit below before generating PDF.
                  </div>
                )}
                {/* Info bar */}
                {bulkRows.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {bulkAvailableLeaves.length} available leaves
                      </Badge>
                      <Badge className="text-sm px-3 py-1 bg-blue-600">
                        {selectedCount} selected
                      </Badge>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={generateBulkPDF}
                      disabled={bulkGenerating || selectedCount === 0}
                      data-ocid="cheque_print.primary_button"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      {bulkGenerating
                        ? "Generating..."
                        : `Generate Bulk PDF (${selectedCount} cheque${selectedCount !== 1 ? "s" : ""})`}
                    </Button>
                  </div>
                )}

                {bulkRows.length === 0 && bulkBook && (
                  <div className="text-center py-12 text-gray-400">
                    No available cheque leaves in this book.
                  </div>
                )}
                {bulkRows.length === 0 && !bulkBook && (
                  <div className="text-center py-12 text-gray-400">
                    Select an account and cheque book to load available leaves.
                  </div>
                )}

                {bulkRows.length > 0 && (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-3 w-10">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={(c) =>
                                toggleSelectAll(c === true)
                              }
                              data-ocid="cheque_print.checkbox"
                            />
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">
                            Leaf #
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">
                            Payee Name *
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">
                            Amount *
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">
                            Amount in Words
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">
                            Date *
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">
                            Memo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, idx) => (
                          <tr
                            key={row.leafId}
                            className={`border-b ${row.selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                            data-ocid={`cheque_print.item.${idx + 1}`}
                          >
                            <td className="px-3 py-2">
                              <Checkbox
                                checked={row.selected}
                                onCheckedChange={(c) =>
                                  updateBulkRow(idx, { selected: c === true })
                                }
                                data-ocid={`cheque_print.checkbox.${idx + 1}`}
                              />
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-600">
                              #{row.leafNumber}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.payee}
                                onChange={(e) =>
                                  updateBulkRow(idx, { payee: e.target.value })
                                }
                                placeholder="Payee name"
                                className={`h-8 min-w-[150px] $row.payee === "" && row.selected ? "border-red-400" : ""`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={row.amount}
                                onChange={(e) =>
                                  updateBulkRow(idx, { amount: e.target.value })
                                }
                                placeholder="0.00"
                                className={`h-8 w-28 $row.amount === "" && row.selected ? "border-red-400" : ""`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.amountWords}
                                onChange={(e) =>
                                  updateBulkRow(idx, {
                                    amountWords: e.target.value,
                                  })
                                }
                                placeholder="Auto-filled"
                                className="h-8 min-w-[180px]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  updateBulkRow(idx, { date: e.target.value })
                                }
                                className="h-8 w-36"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.memo}
                                onChange={(e) =>
                                  updateBulkRow(idx, { memo: e.target.value })
                                }
                                placeholder="Optional"
                                className="h-8 min-w-[120px]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Generate button at bottom when no info bar */}
                {bulkRows.length > 0 && selectedCount > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={generateBulkPDF}
                      disabled={bulkGenerating || selectedCount === 0}
                      data-ocid="cheque_bulk.primary_button"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      {bulkGenerating
                        ? "Generating..."
                        : `Generate Bulk PDF (${selectedCount} cheque${selectedCount !== 1 ? "s" : ""})`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* === Import from Excel sub-tab === */}
            {bulkSubTab === "import" && (
              <div className="max-w-3xl">
                {/* Step 1: Download */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-1">
                    Step 1 — Download Template
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Download the Excel template with 4 columns: Payee, Amount,
                    Date (YYYY-MM-DD), Memo. Fill in your cheque data, then
                    upload it below.
                  </p>
                  <Button
                    variant="outline"
                    className="border-blue-400 text-blue-700 hover:bg-blue-100"
                    onClick={downloadChequeTemplate}
                    data-ocid="cheque_import.upload_button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel Template
                  </Button>
                </div>

                {/* Step 2: Upload */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">
                    Step 2 — Upload Filled Excel File
                  </h3>
                  {!bulkBook && (
                    <p className="text-sm text-amber-600 mb-2">
                      ⚠ Please select a Cheque Book above before uploading.
                    </p>
                  )}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer $
                      bulkBook
                        ? "border-gray-300 hover:border-blue-400"
                        : "border-gray-200 opacity-60 pointer-events-none"`}
                    onClick={() => bulkFileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") bulkFileInputRef.current?.click();
                    }}
                    data-ocid="cheque_import.dropzone"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to select an .xlsx file
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Columns: Payee, Amount, Date (YYYY-MM-DD), Memo
                    </p>
                  </div>
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleChequeFileUpload}
                  />
                </div>

                {/* Preview table */}
                {importChequeRows.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-700">
                        Step 3 — Review &amp; Apply ({importChequeRows.length}{" "}
                        rows, {importChequeRows.filter((r) => !r._valid).length}{" "}
                        errors)
                      </h3>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={applyImportedRows}
                        disabled={
                          !importChequeRows.some((r) => r._valid) || !bulkBook
                        }
                        data-ocid="cheque_import.submit_button"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Apply {importChequeRows.filter((r) => r._valid).length}{" "}
                        Valid Row(s) to Table
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Clicking "Apply" will populate the Manual Entry table with
                      these rows (matched to available cheque leaves). You can
                      edit them there before generating the PDF.
                    </p>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 w-10">
                              ✓
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">
                              Payee
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">
                              Amount
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">
                              Date
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">
                              Memo
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">
                              Error
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {importChequeRows.map((row, idx) => (
                            <tr
                              key={`icrow-$idx-$String(row.Payee ?? "")`}
                              className={`border-b ${row._valid ? "hover:bg-gray-50" : "bg-red-50"}`}
                              data-ocid={`cheque_import.item.${idx + 1}`}
                            >
                              <td className="px-3 py-2">
                                {row._valid ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </td>
                              <td
                                className={`px-3 py-2 $!row._valid && !row.Payee ? "text-red-600 font-medium" : ""`}
                              >
                                {String(row.Payee ?? "")}
                              </td>
                              <td
                                className={`px-3 py-2 $!row._valid && (row.Amount === "" || row.Amount === undefined) ? "text-red-600 font-medium" : ""`}
                              >
                                {String(row.Amount ?? "")}
                              </td>
                              <td className="px-3 py-2">
                                {String(row["Date (YYYY-MM-DD)"] ?? "")}
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {String(row.Memo ?? "")}
                              </td>
                              <td className="px-3 py-2 text-red-500 text-xs">
                                {row._error}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== History ===== */}
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
                        data-ocid="cheque_history.empty_state"
                      >
                        No print history
                      </td>
                    </tr>
                  )}
                  {filteredHistory.map((h, idx) => (
                    <tr
                      key={h.id}
                      className="border-b hover:bg-gray-50"
                      data-ocid={`cheque_history.item.${idx + 1}`}
                    >
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
                            onClick={() => generateSinglePDF(h)}
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

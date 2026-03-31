import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  exportExcel as utilExportExcel,
  exportPDF as utilExportPDF,
} from "../utils/exportUtils";

interface BankAccount {
  id: string;
  accountNumber: string;
  accountTitle: string;
}
interface ChequeBook {
  id: string;
  chequebookNumber: string;
  bankAccountId: string;
  seriesStart: number;
  seriesEnd: number;
  issueDate: string;
  status: "active" | "exhausted" | "cancelled";
}
interface ChequeLeaf {
  id: string;
  chequebookId: string;
  leafNumber: number;
  status: "available" | "used" | "voided" | "cancelled";
  dateUsed?: string;
}

const LS_BOOKS = "bizpos_cheque_books";
const LS_LEAVES = "bizpos_cheque_leaves";
const LS_ACCOUNTS = "bizpos_bank_accounts";

const SEED_BOOKS: ChequeBook[] = [
  {
    id: "cb1",
    chequebookNumber: "CB-2024-001",
    bankAccountId: "ba1",
    seriesStart: 1001,
    seriesEnd: 1010,
    issueDate: "2024-01-15",
    status: "active",
  },
  {
    id: "cb2",
    chequebookNumber: "CB-2024-002",
    bankAccountId: "ba2",
    seriesStart: 2001,
    seriesEnd: 2010,
    issueDate: "2024-02-01",
    status: "active",
  },
];

function genLeaves(bookId: string, start: number, end: number): ChequeLeaf[] {
  const leaves: ChequeLeaf[] = [];
  for (let i = start; i <= end; i++) {
    leaves.push({
      id: `${bookId}-${i}`,
      chequebookId: bookId,
      leafNumber: i,
      status: "available",
    });
  }
  return leaves;
}

function loadBooks(): ChequeBook[] {
  const stored = localStorage.getItem(LS_BOOKS);
  if (!stored) {
    const leaves: ChequeLeaf[] = [
      ...genLeaves("cb1", 1001, 1010),
      ...genLeaves("cb2", 2001, 2010),
    ];
    localStorage.setItem(LS_BOOKS, JSON.stringify(SEED_BOOKS));
    const existLeaves = JSON.parse(localStorage.getItem(LS_LEAVES) || "[]");
    if (!existLeaves.length)
      localStorage.setItem(LS_LEAVES, JSON.stringify(leaves));
    return SEED_BOOKS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
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

const leafStatusColor: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  used: "bg-blue-100 text-blue-700",
  voided: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};
const bookStatusColor: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  exhausted: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function ChequeBooksPage() {
  const { currentUser } = useAuth();
  const [books, setBooks] = useState<ChequeBook[]>([]);
  const [leaves, setLeaves] = useState<ChequeLeaf[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    chequebookNumber: "",
    bankAccountId: "",
    seriesStart: "",
    seriesEnd: "",
    issueDate: new Date().toISOString().slice(0, 10),
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [leafBookFilter, setLeafBookFilter] = useState("all");
  const [leafStatusFilter, setLeafStatusFilter] = useState("all");
  const [bookSearch, setBookSearch] = useState("");

  useEffect(() => {
    setBooks(loadBooks());
    setLeaves(load<ChequeLeaf>(LS_LEAVES));
    setAccounts(load<BankAccount>(LS_ACCOUNTS));
  }, []);

  function acctLabel(id: string) {
    const a = accounts.find((x) => x.id === id);
    return a ? `${a.accountTitle} (${a.accountNumber})` : id;
  }
  function usedCount(bookId: string) {
    return leaves.filter(
      (l) => l.chequebookId === bookId && l.status === "used",
    ).length;
  }
  function totalLeaves(b: ChequeBook) {
    return b.seriesEnd - b.seriesStart + 1;
  }

  function saveBook() {
    if (
      !form.chequebookNumber ||
      !form.bankAccountId ||
      !form.seriesStart ||
      !form.seriesEnd
    )
      return;
    const start = Number.parseInt(form.seriesStart);
    const end = Number.parseInt(form.seriesEnd);
    if (end < start) return;
    const id = `cb${Date.now()}`;
    const newBook: ChequeBook = {
      id,
      chequebookNumber: form.chequebookNumber,
      bankAccountId: form.bankAccountId,
      seriesStart: start,
      seriesEnd: end,
      issueDate: form.issueDate,
      status: "active",
    };
    const newLeaves = genLeaves(id, start, end);
    const updatedBooks = [...books, newBook];
    const updatedLeaves = [...leaves, ...newLeaves];
    save(LS_BOOKS, updatedBooks);
    save(LS_LEAVES, updatedLeaves);
    setBooks(updatedBooks);
    setLeaves(updatedLeaves);
    setOpen(false);
  }

  function cancelBook(id: string) {
    const used = leaves.filter(
      (l) => l.chequebookId === id && l.status === "used",
    ).length;
    if (used > 0) {
      alert("Cannot cancel: cheques already used.");
      return;
    }
    const u = books.map((b) =>
      b.id === id ? { ...b, status: "cancelled" } : b,
    ) as ChequeBook[];
    save(LS_BOOKS, u);
    setBooks(u);
  }
  function delBook(id: string) {
    const u = books.filter((b) => b.id !== id);
    const ul = leaves.filter((l) => l.chequebookId !== id);
    save(LS_BOOKS, u);
    save(LS_LEAVES, ul);
    setBooks(u);
    setLeaves(ul);
    setDeleteId(null);
  }

  function voidLeaf(id: string) {
    const u = leaves.map((l) =>
      l.id === id ? { ...l, status: "voided" } : l,
    ) as ChequeLeaf[];
    save(LS_LEAVES, u);
    setLeaves(u);
  }
  function cancelLeaf(id: string) {
    const u = leaves.map((l) =>
      l.id === id ? { ...l, status: "cancelled" } : l,
    ) as ChequeLeaf[];
    save(LS_LEAVES, u);
    setLeaves(u);
  }

  const filteredBooks = books.filter(
    (b) =>
      b.chequebookNumber.toLowerCase().includes(bookSearch.toLowerCase()) ||
      acctLabel(b.bankAccountId)
        .toLowerCase()
        .includes(bookSearch.toLowerCase()),
  );
  const filteredLeaves = leaves.filter(
    (l) =>
      (leafBookFilter === "all" || l.chequebookId === leafBookFilter) &&
      (leafStatusFilter === "all" || l.status === leafStatusFilter),
  );

  function exportBooksExcel() {
    utilExportExcel(
      "cheque_books.xlsx",
      "Cheque Books",
      [
        "Book No.",
        "Account",
        "From",
        "To",
        "Total",
        "Used",
        "Issue Date",
        "Status",
      ],
      filteredBooks.map((b) => [
        b.chequebookNumber,
        acctLabel(b.bankAccountId),
        b.seriesStart,
        b.seriesEnd,
        totalLeaves(b),
        usedCount(b.id),
        b.issueDate,
        b.status,
      ]),
      { generatedBy: currentUser?.name },
    );
  }
  function exportBooksPDF() {
    utilExportPDF(
      "Cheque Books",
      [
        "Book No.",
        "Account",
        "Series",
        "Total",
        "Used",
        "Issue Date",
        "Status",
      ],
      filteredBooks.map((b) => [
        b.chequebookNumber,
        acctLabel(b.bankAccountId),
        `${b.seriesStart}-${b.seriesEnd}`,
        totalLeaves(b),
        usedCount(b.id),
        b.issueDate,
        b.status,
      ]),
      "cheque_books.pdf",
      { generatedBy: currentUser?.name },
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cheque Books</h1>
      </div>
      <Tabs defaultValue="books">
        <TabsList className="mb-4">
          <TabsTrigger value="books">Cheque Books</TabsTrigger>
          <TabsTrigger value="leaves">Cheque Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 flex gap-3 border-b justify-between flex-wrap">
              <div className="flex gap-3">
                <Input
                  placeholder="Search..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportBooksExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportBooksPDF}>
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setForm({
                      chequebookNumber: "",
                      bankAccountId: "",
                      seriesStart: "",
                      seriesEnd: "",
                      issueDate: new Date().toISOString().slice(0, 10),
                    });
                    setOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Issue Cheque Book
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      "Cheque Book No.",
                      "Bank Account",
                      "Series Start",
                      "Series End",
                      "Total",
                      "Used",
                      "Issue Date",
                      "Status",
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
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-8 text-gray-400"
                      >
                        No cheque books
                      </td>
                    </tr>
                  )}
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {b.chequebookNumber}
                      </td>
                      <td className="px-4 py-3">
                        {acctLabel(b.bankAccountId)}
                      </td>
                      <td className="px-4 py-3">{b.seriesStart}</td>
                      <td className="px-4 py-3">{b.seriesEnd}</td>
                      <td className="px-4 py-3">{totalLeaves(b)}</td>
                      <td className="px-4 py-3">{usedCount(b.id)}</td>
                      <td className="px-4 py-3">{b.issueDate}</td>
                      <td className="px-4 py-3">
                        <Badge className={bookStatusColor[b.status]}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {b.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-600 text-xs"
                              onClick={() => cancelBook(b.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => setDeleteId(b.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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

        <TabsContent value="leaves">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 flex gap-3 border-b flex-wrap justify-between">
              <div className="flex gap-3">
                <Select
                  value={leafBookFilter}
                  onValueChange={setLeafBookFilter}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Cheque Books" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cheque Books</SelectItem>
                    {books.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.chequebookNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={leafStatusFilter}
                  onValueChange={setLeafStatusFilter}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {["available", "used", "voided", "cancelled"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    utilExportExcel(
                      "cheque_leaves.xlsx",
                      "Cheque Leaves",
                      ["Book", "Leaf No.", "Status", "Date Used"],
                      filteredLeaves.map((l) => [
                        books.find((b) => b.id === l.chequebookId)
                          ?.chequebookNumber || "",
                        l.leafNumber,
                        l.status,
                        l.dateUsed || "",
                      ]),
                      { generatedBy: currentUser?.name },
                    );
                  }}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Excel
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      "Cheque Book",
                      "Leaf Number",
                      "Status",
                      "Date Used",
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
                  {filteredLeaves.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-400"
                      >
                        No leaves found
                      </td>
                    </tr>
                  )}
                  {filteredLeaves.map((l) => (
                    <tr key={l.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {books.find((b) => b.id === l.chequebookId)
                          ?.chequebookNumber || l.chequebookId}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        {l.leafNumber}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={leafStatusColor[l.status]}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {l.dateUsed || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {l.status === "available" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 text-xs"
                              onClick={() => voidLeaf(l.id)}
                            >
                              Void
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-500 text-xs"
                              onClick={() => cancelLeaf(l.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Cheque Book</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Cheque Book Number *</Label>
              <Input
                value={form.chequebookNumber}
                onChange={(e) =>
                  setForm({ ...form, chequebookNumber: e.target.value })
                }
                placeholder="e.g. CB-2024-003"
              />
            </div>
            <div>
              <Label>Bank Account *</Label>
              <Select
                value={form.bankAccountId}
                onValueChange={(v) => setForm({ ...form, bankAccountId: v })}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Series Start *</Label>
                <Input
                  type="number"
                  value={form.seriesStart}
                  onChange={(e) =>
                    setForm({ ...form, seriesStart: e.target.value })
                  }
                  placeholder="e.g. 3001"
                />
              </div>
              <div>
                <Label>Series End *</Label>
                <Input
                  type="number"
                  value={form.seriesEnd}
                  onChange={(e) =>
                    setForm({ ...form, seriesEnd: e.target.value })
                  }
                  placeholder="e.g. 3025"
                />
              </div>
            </div>
            <div>
              <Label>Issue Date *</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm({ ...form, issueDate: e.target.value })
                }
              />
            </div>
            {form.seriesStart &&
              form.seriesEnd &&
              Number.parseInt(form.seriesEnd) >=
                Number.parseInt(form.seriesStart) && (
                <p className="text-sm text-blue-600">
                  {Number.parseInt(form.seriesEnd) -
                    Number.parseInt(form.seriesStart) +
                    1}{" "}
                  cheque leaves will be generated
                </p>
              )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={saveBook}
              >
                Issue Cheque Book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cheque Book</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This will also delete all associated leaves. Proceed?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => delBook(deleteId!)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { FileSpreadsheet, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { exportExcel, exportPDF } from "../utils/exportUtils";

interface Bank {
  id: string;
  name: string;
}
interface Branch {
  id: string;
  bankId: string;
  branchName: string;
}
interface COAAccount {
  id: string;
  code: string;
  name: string;
  parentId?: string;
}
interface BankAccount {
  id: string;
  accountNumber: string;
  accountTitle: string;
  accountType: "Current" | "Savings" | "Fixed" | "Overdraft";
  bankId: string;
  branchId: string;
  coaLedgerId: string;
  openingBalance: number;
  currency: string;
  status: "active" | "inactive";
}

const SEED_ACCOUNTS: BankAccount[] = [
  {
    id: "ba1",
    accountNumber: "0123456789",
    accountTitle: "Main Operations Account",
    accountType: "Current",
    bankId: "b1",
    branchId: "br1",
    coaLedgerId: "",
    openingBalance: 500000,
    currency: "PKR",
    status: "active",
  },
  {
    id: "ba2",
    accountNumber: "9876543210",
    accountTitle: "Payroll Account",
    accountType: "Savings",
    bankId: "b2",
    branchId: "br3",
    coaLedgerId: "",
    openingBalance: 200000,
    currency: "PKR",
    status: "active",
  },
  {
    id: "ba3",
    accountNumber: "1111222233",
    accountTitle: "Tax Reserve Account",
    accountType: "Fixed",
    bankId: "b3",
    branchId: "br5",
    coaLedgerId: "",
    openingBalance: 100000,
    currency: "PKR",
    status: "active",
  },
  {
    id: "ba4",
    accountNumber: "4444555566",
    accountTitle: "USD Operations",
    accountType: "Current",
    bankId: "b1",
    branchId: "br2",
    coaLedgerId: "",
    openingBalance: 10000,
    currency: "USD",
    status: "active",
  },
];

const LS_KEY = "bizpos_bank_accounts";
const LS_BANKS = "bizpos_banks";
const LS_BRANCHES = "bizpos_bank_branches";
const LS_COA = "bizpos_accounts_v4";
const _SEED_KEY = "bizpos_seeded_bank_v1";

function loadBA(): BankAccount[] {
  const stored = localStorage.getItem(LS_KEY);
  if (!stored) {
    localStorage.setItem(LS_KEY, JSON.stringify(SEED_ACCOUNTS));
    return SEED_ACCOUNTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
function saveBA(d: BankAccount[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}
function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function getLeafAccounts(accounts: COAAccount[]): COAAccount[] {
  const _ids = new Set(accounts.map((a) => a.id));
  const hasChildren = new Set(
    accounts.filter((a) => a.parentId).map((a) => a.parentId!),
  );
  return accounts.filter((a) => !hasChildren.has(a.id));
}

const typeColors: Record<string, string> = {
  Current: "bg-blue-100 text-blue-700",
  Savings: "bg-green-100 text-green-700",
  Fixed: "bg-yellow-100 text-yellow-700",
  Overdraft: "bg-red-100 text-red-700",
};

const emptyForm = {
  accountNumber: "",
  accountTitle: "",
  accountType: "Current" as BankAccount["accountType"],
  bankId: "",
  branchId: "",
  coaLedgerId: "",
  openingBalance: 0,
  currency: "PKR",
  status: "active" as BankAccount["status"],
};

export default function BankAccountsPage() {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [coaLeaves, setCoaLeaves] = useState<COAAccount[]>([]);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBanks(load<Bank>(LS_BANKS));
    setBranches(load<Branch>(LS_BRANCHES));
    setCoaLeaves(getLeafAccounts(load<COAAccount>(LS_COA)));
    setAccounts(loadBA());
  }, []);

  const filteredBranches = branches.filter(
    (b) => !form.bankId || b.bankId === form.bankId,
  );
  const filtered = accounts.filter(
    (a) =>
      (bankFilter === "all" || a.bankId === bankFilter) &&
      (typeFilter === "all" || a.accountType === typeFilter) &&
      (a.accountNumber.includes(search) ||
        a.accountTitle.toLowerCase().includes(search.toLowerCase())),
  );

  function bankName(id: string) {
    return banks.find((b) => b.id === id)?.name || id;
  }
  function branchName(id: string) {
    return branches.find((b) => b.id === id)?.branchName || id;
  }
  function coaName(id: string) {
    const a = coaLeaves.find((c) => c.id === id);
    return a ? `${a.code} - ${a.name}` : "";
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(a: BankAccount) {
    setEditing(a);
    setForm({
      accountNumber: a.accountNumber,
      accountTitle: a.accountTitle,
      accountType: a.accountType,
      bankId: a.bankId,
      branchId: a.branchId,
      coaLedgerId: a.coaLedgerId,
      openingBalance: a.openingBalance,
      currency: a.currency,
      status: a.status,
    });
    setOpen(true);
  }
  function save() {
    if (!form.accountNumber || !form.accountTitle || !form.bankId) return;
    let updated: BankAccount[];
    if (editing) {
      updated = accounts.map((a) =>
        a.id === editing.id ? { ...editing, ...form } : a,
      );
    } else {
      updated = [...accounts, { ...form, id: `ba${Date.now()}` }];
    }
    saveBA(updated);
    setAccounts(updated);
    setOpen(false);
  }
  function del(id: string) {
    const u = accounts.filter((a) => a.id !== id);
    saveBA(u);
    setAccounts(u);
    setDeleteId(null);
  }

  function doExportExcel() {
    exportExcel(
      "bank_accounts.xlsx",
      "Bank Accounts",
      [
        "Account Number",
        "Account Title",
        "Type",
        "Bank",
        "Branch",
        "COA Ledger",
        "Currency",
        "Opening Balance",
        "Status",
      ],
      filtered.map((a) => [
        a.accountNumber,
        a.accountTitle,
        a.accountType,
        bankName(a.bankId),
        branchName(a.branchId),
        coaName(a.coaLedgerId),
        a.currency,
        a.openingBalance,
        a.status,
      ]),
      { generatedBy: currentUser?.name },
    );
  }
  function doExportPDF() {
    exportPDF(
      "Bank Accounts",
      [
        "Account No.",
        "Title",
        "Type",
        "Bank",
        "Currency",
        "Opening Balance",
        "Status",
      ],
      filtered.map((a) => [
        a.accountNumber,
        a.accountTitle,
        a.accountType,
        bankName(a.bankId),
        a.currency,
        a.openingBalance,
        a.status,
      ]),
      "bank_accounts.pdf",
      { generatedBy: currentUser?.name },
    );
  }

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const totalBanksCovered = new Set(accounts.map((a) => a.bankId)).size;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bank Accounts</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={doExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={doExportPDF}>
            <FileText className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openAdd}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Accounts",
            value: totalAccounts,
            color: "text-blue-600",
          },
          {
            label: "Active Accounts",
            value: activeAccounts,
            color: "text-green-600",
          },
          {
            label: "Banks Covered",
            value: totalBanksCovered,
            color: "text-purple-600",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-lg border shadow-sm p-4"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 flex gap-3 border-b flex-wrap">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Banks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Banks</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {["Current", "Savings", "Fixed", "Overdraft"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Account Number",
                  "Title",
                  "Type",
                  "Bank",
                  "Branch",
                  "COA Ledger",
                  "Currency",
                  "Opening Bal.",
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">
                    No accounts found
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{a.accountNumber}</td>
                  <td className="px-4 py-3 font-medium">{a.accountTitle}</td>
                  <td className="px-4 py-3">
                    <Badge className={typeColors[a.accountType]}>
                      {a.accountType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{bankName(a.bankId)}</td>
                  <td className="px-4 py-3">{branchName(a.branchId)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {coaName(a.coaLedgerId) || (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{a.currency}</td>
                  <td className="px-4 py-3">
                    {a.openingBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        a.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => setDeleteId(a.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Bank Account" : "Add Bank Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Account Number *</Label>
                <Input
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({ ...form, accountNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Account Title *</Label>
                <Input
                  value={form.accountTitle}
                  onChange={(e) =>
                    setForm({ ...form, accountTitle: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Account Type *</Label>
                <Select
                  value={form.accountType}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      accountType: v as BankAccount["accountType"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Current", "Savings", "Fixed", "Overdraft"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["PKR", "USD", "EUR", "GBP"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bank *</Label>
                <Select
                  value={form.bankId}
                  onValueChange={(v) =>
                    setForm({ ...form, bankId: v, branchId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branch</Label>
                <Select
                  value={form.branchId}
                  onValueChange={(v) => setForm({ ...form, branchId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>COA Ledger Account</Label>
              <Select
                value={form.coaLedgerId}
                onValueChange={(v) => setForm({ ...form, coaLedgerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ledger account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {coaLeaves.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  value={form.openingBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      openingBalance: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as BankAccount["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={save}>
                {editing ? "Update" : "Add"} Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Delete this bank account?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => del(deleteId!)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

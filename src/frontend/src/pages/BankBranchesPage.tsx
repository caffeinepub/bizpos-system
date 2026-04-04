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

import PageHelp from "@/components/PageHelp";

interface Bank {
  id: string;
  name: string;
  code: string;
}
interface Branch {
  id: string;
  bankId: string;
  branchName: string;
  branchCode: string;
  address: string;
  phone: string;
  ifscCode: string;
  managerName: string;
  status: "active" | "inactive";
}

const SEED_BRANCHES: Branch[] = [
  {
    id: "br1",
    bankId: "b1",
    branchName: "Main Branch",
    branchCode: "NBP-001",
    address: "I.I. Chundrigar Road, Karachi",
    phone: "021-99220101",
    ifscCode: "NBP0001",
    managerName: "Ahmed Khan",
    status: "active",
  },
  {
    id: "br2",
    bankId: "b1",
    branchName: "Gulshan Branch",
    branchCode: "NBP-002",
    address: "Gulshan-e-Iqbal, Karachi",
    phone: "021-99220102",
    ifscCode: "NBP0002",
    managerName: "Sara Ali",
    status: "active",
  },
  {
    id: "br3",
    bankId: "b2",
    branchName: "HBL Main",
    branchCode: "HBL-001",
    address: "HBL Plaza, Karachi",
    phone: "021-32460111",
    ifscCode: "HBL0001",
    managerName: "Bilal Raza",
    status: "active",
  },
  {
    id: "br4",
    bankId: "b2",
    branchName: "DHA Branch",
    branchCode: "HBL-002",
    address: "Phase 6, DHA, Karachi",
    phone: "021-35244400",
    ifscCode: "HBL0002",
    managerName: "Nadia Siddiqui",
    status: "active",
  },
  {
    id: "br5",
    bankId: "b3",
    branchName: "UBL City",
    branchCode: "UBL-001",
    address: "City Campus, Karachi",
    phone: "021-111825001",
    ifscCode: "UBL0001",
    managerName: "Tariq Mehmood",
    status: "active",
  },
];

const LS_BRANCHES = "bizpos_bank_branches";
const LS_BANKS = "bizpos_banks";
const SEED_KEY = "bizpos_seeded_bank_v1";

function loadBanks(): Bank[] {
  try {
    return JSON.parse(localStorage.getItem(LS_BANKS) || "[]");
  } catch {
    return [];
  }
}
function loadBranches(): Branch[] {
  if (!localStorage.getItem(SEED_KEY)) return SEED_BRANCHES;
  const stored = localStorage.getItem(LS_BRANCHES);
  if (!stored) {
    localStorage.setItem(LS_BRANCHES, JSON.stringify(SEED_BRANCHES));
    return SEED_BRANCHES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
function saveBranches(d: Branch[]) {
  localStorage.setItem(LS_BRANCHES, JSON.stringify(d));
}

const emptyForm = {
  bankId: "",
  branchName: "",
  branchCode: "",
  address: "",
  phone: "",
  ifscCode: "",
  managerName: "",
  status: "active" as Branch["status"],
};

export default function BankBranchesPage() {
  const { currentUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBanks(loadBanks());
    setBranches(loadBranches());
  }, []);

  const filtered = branches.filter(
    (b) =>
      (bankFilter === "all" || b.bankId === bankFilter) &&
      (b.branchName.toLowerCase().includes(search.toLowerCase()) ||
        b.branchCode.toLowerCase().includes(search.toLowerCase())),
  );

  function bankName(id: string) {
    return banks.find((b) => b.id === id)?.name || id;
  }
  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(b: Branch) {
    setEditing(b);
    setForm({
      bankId: b.bankId,
      branchName: b.branchName,
      branchCode: b.branchCode,
      address: b.address,
      phone: b.phone,
      ifscCode: b.ifscCode,
      managerName: b.managerName,
      status: b.status,
    });
    setOpen(true);
  }
  function save() {
    if (!form.bankId || !form.branchName || !form.branchCode) return;
    let updated: Branch[];
    if (editing) {
      updated = branches.map((b) =>
        b.id === editing.id ? { ...editing, ...form } : b,
      );
    } else {
      updated = [...branches, { ...form, id: `br${Date.now()}` }];
    }
    saveBranches(updated);
    setBranches(updated);
    setOpen(false);
  }
  function del(id: string) {
    const u = branches.filter((b) => b.id !== id);
    saveBranches(u);
    setBranches(u);
    setDeleteId(null);
  }

  function doExportExcel() {
    exportExcel(
      "bank_branches.xlsx",
      "Branches",
      [
        "Branch Name",
        "Branch Code",
        "Bank",
        "IFSC/Routing",
        "Manager",
        "Phone",
        "Status",
      ],
      filtered.map((b) => [
        b.branchName,
        b.branchCode,
        bankName(b.bankId),
        b.ifscCode,
        b.managerName,
        b.phone,
        b.status,
      ]),
      { generatedBy: currentUser?.name },
    );
  }
  function doExportPDF() {
    exportPDF(
      "Bank Branches",
      ["Branch Name", "Code", "Bank", "IFSC", "Manager", "Phone", "Status"],
      filtered.map((b) => [
        b.branchName,
        b.branchCode,
        bankName(b.bankId),
        b.ifscCode,
        b.managerName,
        b.phone,
        b.status,
      ]),
      "bank_branches.pdf",
      { generatedBy: currentUser?.name },
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">Bank Branches</h1>
          <PageHelp pageId="bank-branches" />
        </div>
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
            Add Branch
          </Button>
        </div>
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
            <SelectTrigger className="w-48">
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
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Branch Name",
                  "Code",
                  "Bank",
                  "IFSC/Routing",
                  "Manager",
                  "Phone",
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
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No branches found
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.branchName}</td>
                  <td className="px-4 py-3">{b.branchCode}</td>
                  <td className="px-4 py-3">{bankName(b.bankId)}</td>
                  <td className="px-4 py-3">{b.ifscCode}</td>
                  <td className="px-4 py-3">{b.managerName}</td>
                  <td className="px-4 py-3">{b.phone}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        b.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Bank *</Label>
              <Select
                value={form.bankId}
                onValueChange={(v) => setForm({ ...form, bankId: v })}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={form.branchName}
                  onChange={(e) =>
                    setForm({ ...form, branchName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Branch Code *</Label>
                <Input
                  value={form.branchCode}
                  onChange={(e) =>
                    setForm({ ...form, branchCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IFSC/Routing Code</Label>
                <Input
                  value={form.ifscCode}
                  onChange={(e) =>
                    setForm({ ...form, ifscCode: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Manager Name</Label>
                <Input
                  value={form.managerName}
                  onChange={(e) =>
                    setForm({ ...form, managerName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Branch["status"] })
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
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={save}>
                {editing ? "Update" : "Add"} Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Delete this branch? This cannot be undone.
          </p>
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

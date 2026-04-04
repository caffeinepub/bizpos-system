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
import {
  Download,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  exportExcel as utilExportExcel,
  exportPDF as utilExportPDF,
} from "../utils/exportUtils";

interface Bank {
  id: string;
  name: string;
  code: string;
  swift: string;
  address: string;
  phone: string;
  status: "active" | "inactive";
}

const SEED: Bank[] = [
  {
    id: "b1",
    name: "National Bank of Pakistan",
    code: "NBP",
    swift: "NBPAPKKA",
    address: "NBP Head Office, I.I. Chundrigar Road, Karachi",
    phone: "021-99220100",
    status: "active",
  },
  {
    id: "b2",
    name: "Habib Bank Limited",
    code: "HBL",
    swift: "HABBPKKA",
    address: "HBL Plaza, I.I. Chundrigar Road, Karachi",
    phone: "021-111425786",
    status: "active",
  },
  {
    id: "b3",
    name: "United Bank Limited",
    code: "UBL",
    swift: "UNILPKKA",
    address: "UBL Head Office, Karachi",
    phone: "021-111825500",
    status: "active",
  },
];

const LS_KEY = "bizpos_banks";
const SEED_KEY = "bizpos_seeded_bank_v1";

function loadBanks(): Bank[] {
  if (!localStorage.getItem(SEED_KEY)) {
    localStorage.setItem(LS_KEY, JSON.stringify(SEED));
    localStorage.setItem(SEED_KEY, "1");
  }
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveBanks(data: Bank[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export default function BanksPage() {
  const { currentUser } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    swift: "",
    address: "",
    phone: "",
    status: "active" as Bank["status"],
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBanks(loadBanks());
  }, []);

  const filtered = banks.filter(
    (b) =>
      (statusFilter === "all" || b.status === statusFilter) &&
      (b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase())),
  );

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      code: "",
      swift: "",
      address: "",
      phone: "",
      status: "active",
    });
    setOpen(true);
  }
  function openEdit(b: Bank) {
    setEditing(b);
    setForm({
      name: b.name,
      code: b.code,
      swift: b.swift,
      address: b.address,
      phone: b.phone,
      status: b.status,
    });
    setOpen(true);
  }
  function save() {
    if (!form.name || !form.code) return;
    let updated: Bank[];
    if (editing) {
      updated = banks.map((b) =>
        b.id === editing.id ? { ...editing, ...form } : b,
      );
    } else {
      updated = [...banks, { ...form, id: `b${Date.now()}` }];
    }
    saveBanks(updated);
    setBanks(updated);
    setOpen(false);
  }
  function del(id: string) {
    const u = banks.filter((b) => b.id !== id);
    saveBanks(u);
    setBanks(u);
    setDeleteId(null);
  }
  function toggleStatus(b: Bank) {
    const u = banks.map((x) =>
      x.id === b.id
        ? { ...x, status: x.status === "active" ? "inactive" : "active" }
        : x,
    ) as Bank[];
    saveBanks(u);
    setBanks(u);
  }

  function doExportExcel() {
    utilExportExcel(
      "banks.xlsx",
      "Banks",
      ["Name", "Code", "SWIFT/BIC", "Address", "Phone", "Status"],
      filtered.map((b) => [
        b.name,
        b.code,
        b.swift,
        b.address,
        b.phone,
        b.status,
      ]),
      { generatedBy: currentUser?.name },
    );
  }
  function doExportPDF() {
    utilExportPDF(
      "Banks",
      ["Name", "Code", "SWIFT/BIC", "Phone", "Status"],
      filtered.map((b) => [b.name, b.code, b.swift, b.phone, b.status]),
      "banks.pdf",
      { generatedBy: currentUser?.name },
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banks</h1>
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
            Add Bank
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 flex gap-3 border-b">
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Name",
                  "Code",
                  "SWIFT/BIC",
                  "Address",
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
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No banks found
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.code}</td>
                  <td className="px-4 py-3">{b.swift}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {b.address}
                  </td>
                  <td className="px-4 py-3">{b.phone}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        b.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }
                      onClick={() => toggleStatus(b)}
                      style={{ cursor: "pointer" }}
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
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Bank" : "Add Bank"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bank Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SWIFT/BIC</Label>
                <Input
                  value={form.swift}
                  onChange={(e) => setForm({ ...form, swift: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as Bank["status"] })
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={save}>
                {editing ? "Update" : "Add"} Bank
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Bank</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this bank? This cannot be undone.
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

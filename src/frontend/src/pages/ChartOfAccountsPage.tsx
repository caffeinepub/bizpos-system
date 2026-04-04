import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// XLSX loaded via CDN
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XLSX = (window as any).XLSX;
import type { Account } from "../store/useStore";
import { useStore } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

// ─── Types ───────────────────────────────────────────────────────────────────
type AccType = Account["type"];
type ContextAction = "add" | "edit" | "delete" | "view";
interface CtxMenu {
  x: number;
  y: number;
  node: Account;
  actions: ContextAction[];
}
interface FormState {
  id?: string;
  code: string;
  name: string;
  type: AccType;
  parentId: string;
  openingBalance: number;
  description: string;
  status: "Active" | "Inactive";
  normalBalance: "Debit" | "Credit";
  isGroup: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TYPE_LABELS: AccType[] = [
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expense",
  "COGS",
];

const TYPE_BADGE: Record<AccType, string> = {
  Asset: "bg-blue-100 text-blue-800",
  Liability: "bg-red-100 text-red-800",
  Equity: "bg-purple-100 text-purple-800",
  Income: "bg-green-100 text-green-800",
  Expense: "bg-rose-100 text-rose-800",
  COGS: "bg-orange-100 text-orange-800",
};

const NORMAL_BALANCE_DEFAULT: Record<AccType, "Debit" | "Credit"> = {
  Asset: "Debit",
  Expense: "Debit",
  COGS: "Debit",
  Liability: "Credit",
  Equity: "Credit",
  Income: "Credit",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLevel(acc: Account, all: Account[]): number {
  const map = new Map(all.map((a) => [a.id, a]));
  let lvl = 0;
  let cur: Account | undefined = acc;
  while (cur?.parentId) {
    lvl++;
    cur = map.get(cur.parentId);
    if (lvl > 10) break;
  }
  return lvl;
}

function hasChildren(id: string, all: Account[]): boolean {
  return all.some((a) => a.parentId === id);
}

function getChildren(parentId: string | undefined, all: Account[]): Account[] {
  return all
    .filter((a) => a.parentId === parentId)
    .sort((a, b) => a.code.localeCompare(b.code));
}

function isLeaf(acc: Account, all: Account[]): boolean {
  return !hasChildren(acc.id, all);
}

// ─── TreeNode component ───────────────────────────────────────────────────────
interface TreeNodeProps {
  node: Account;
  all: Account[];
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onContext: (e: React.MouseEvent, node: Account) => void;
}

function TreeNode({
  node,
  all,
  depth,
  expanded,
  onToggle,
  onContext,
}: TreeNodeProps) {
  const children = getChildren(node.id, all);
  const isOpen = expanded.has(node.id);
  const level = depth;
  const isLeafNode = children.length === 0;

  const levelColors = [
    "font-bold text-gray-900",
    "font-semibold text-blue-800",
    "font-medium text-gray-700",
    "text-gray-600",
  ];

  return (
    <>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-blue-50 select-none ${
          level === 0 ? "bg-gray-50" : ""
        }`}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
        role="treeitem"
        onContextMenu={(e) => {
          e.preventDefault();
          onContext(e, node);
        }}
        onClick={() => {
          if (!isLeafNode) onToggle(node.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (!isLeafNode) onToggle(node.id);
          }
        }}
      >
        {/* Expand/Collapse icon */}
        <span className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0">
          {!isLeafNode ? (
            isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-300 mx-auto" />
          )}
        </span>

        {/* Folder icon */}
        <span className="text-base flex-shrink-0">
          {!isLeafNode ? (isOpen ? "📂" : "📁") : "📄"}
        </span>

        {/* Code */}
        <span className="font-mono text-xs text-gray-500 flex-shrink-0 w-24">
          {node.code}
        </span>

        {/* Name */}
        <span className={`text-sm flex-1 ${levelColors[Math.min(level, 3)]}`}>
          {node.name}
        </span>

        {/* Type badge */}
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${TYPE_BADGE[node.type]}`}
        >
          {node.type}
        </span>

        {/* Status */}
        <span
          className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
            node.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {node.status}
        </span>
      </div>

      {/* Children */}
      {isOpen &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            all={all}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onContext={onContext}
          />
        ))}
    </>
  );
}

// ─── Account Form ─────────────────────────────────────────────────────────────
interface AccountFormProps {
  form: FormState;
  onChange: (f: FormState) => void;
  all: Account[];
  mode: "add" | "edit";
  parentLocked?: boolean;
}

function AccountForm({ form, onChange, all, parentLocked }: AccountFormProps) {
  const set = (k: keyof FormState, v: unknown) => onChange({ ...form, [k]: v });

  // Auto-suggest next available code based on parent
  const suggestCode = () => {
    const parentAcc = form.parentId
      ? all.find((a) => a.id === form.parentId)
      : undefined;
    if (!parentAcc) {
      // Root L0: suggest next 100, 200, 300, ...
      const roots = all.filter((a) => !a.parentId);
      const maxPrefix = roots.reduce((max, a) => {
        const n = Number.parseInt(a.code, 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const next = Math.ceil((maxPrefix + 1) / 100) * 100;
      set("code", String(next));
      return;
    }
    const parentCode = parentAcc.code;
    const parts = parentCode.split("-");
    const siblings = all.filter((a) => a.parentId === form.parentId);
    if (parts.length === 1) {
      // Parent is L0 (e.g. "100") → suggest "100-01", "100-02"
      const maxSuffix = siblings.reduce((max, a) => {
        const sibParts = a.code.split("-");
        if (sibParts.length < 2) return max;
        const n = Number.parseInt(sibParts[1], 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      set("code", `${parentCode}-${String(maxSuffix + 1).padStart(2, "0")}`);
    } else if (parts.length === 2) {
      // Parent is L1 (e.g. "100-01") → suggest "100-01-01"
      const maxSuffix = siblings.reduce((max, a) => {
        const sibParts = a.code.split("-");
        if (sibParts.length < 3) return max;
        const n = Number.parseInt(sibParts[2], 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      set("code", `${parentCode}-${String(maxSuffix + 1).padStart(2, "0")}`);
    } else if (parts.length === 3) {
      // Parent is L2 (e.g. "100-01-01") → suggest "100-01-01-0001"
      const maxSuffix = siblings.reduce((max, a) => {
        const sibParts = a.code.split("-");
        if (sibParts.length < 4) return max;
        const n = Number.parseInt(sibParts[3], 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      set("code", `${parentCode}-${String(maxSuffix + 1).padStart(4, "0")}`);
    }
  };

  // Eligible parents: nodes at level < 3 (so children will be at max level 3)
  const eligibleParents = all
    .filter((a) => {
      const lvl = getLevel(a, all);
      return lvl < 3; // L0, L1, or L2 can be parents
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const parentAcc = form.parentId
    ? all.find((a) => a.id === form.parentId)
    : undefined;
  const childLevel = parentAcc ? getLevel(parentAcc, all) + 1 : 0;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Code *</Label>
          <div className="flex gap-2">
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="e.g. 100-01-01"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={suggestCode}
              title="Auto-suggest next code"
            >
              Auto
            </Button>
          </div>
        </div>
        <div>
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Account name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type *</Label>
          <Select
            value={form.type}
            onValueChange={(v) => {
              const nb = NORMAL_BALANCE_DEFAULT[v as AccType];
              onChange({ ...form, type: v as AccType, normalBalance: nb });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_LABELS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Parent Account</Label>
          <Select
            value={form.parentId || "none"}
            onValueChange={(v) => set("parentId", v === "none" ? "" : v)}
            disabled={parentLocked}
          >
            <SelectTrigger>
              <SelectValue placeholder="(Root level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">(Root level — L0)</SelectItem>
              {eligibleParents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.parentId && (
            <p className="text-xs text-blue-600 mt-1">
              Will be placed at Level {childLevel}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Normal Balance</Label>
          <Select
            value={form.normalBalance}
            onValueChange={(v) => set("normalBalance", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Debit">Debit</SelectItem>
              <SelectItem value="Credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Opening Balance</Label>
          <Input
            type="number"
            value={form.openingBalance}
            onChange={(e) =>
              set("openingBalance", Number.parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Is Group Account</Label>
          <Select
            value={form.isGroup ? "yes" : "no"}
            onValueChange={(v) => set("isGroup", v === "yes")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes (can have children)</SelectItem>
              <SelectItem value="no">No (leaf/detail account)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => set("status", v as "Active" | "Inactive")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Optional description"
        />
      </div>
    </div>
  );
}

// ─── BLANK FORM ───────────────────────────────────────────────────────────────
function blankForm(parentId = "", type: AccType = "Asset"): FormState {
  return {
    code: "",
    name: "",
    type,
    parentId,
    openingBalance: 0,
    description: "",
    status: "Active",
    normalBalance: NORMAL_BALANCE_DEFAULT[type],
    isGroup: false,
  };
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ChartOfAccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<FormState>(blankForm());
  const [viewAcc, setViewAcc] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [importRows, setImportRows] = useState<
    { code: string; name: string; errors: string[] }[]
  >([]);
  const [importPreview, setImportPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Close context menu on click anywhere
  useEffect(() => {
    const handler = () => setCtxMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () => setExpanded(new Set(accounts.map((a) => a.id)));
  const collapseAll = () => setExpanded(new Set());

  // ── Context menu handler ──
  const handleContext = (e: React.MouseEvent, node: Account) => {
    e.preventDefault();
    const level = getLevel(node, accounts);
    const leaf = isLeaf(node, accounts);
    const actions: ContextAction[] = [];
    if (level < 3) actions.push("add"); // can add child if L0, L1, or L2
    actions.push("edit");
    if (leaf) actions.push("delete"); // delete only if no children
    if (leaf) actions.push("view"); // view only for leaf nodes
    setCtxMenu({ x: e.clientX, y: e.clientY, node, actions });
  };

  // ── CRUD ops ──
  const openAdd = (parentId = "", type: AccType = "Asset") => {
    setForm(blankForm(parentId, type));
    setFormMode("add");
    setFormOpen(true);
    setCtxMenu(null);
  };

  const openEdit = (acc: Account) => {
    setForm({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      parentId: acc.parentId || "",
      openingBalance: acc.openingBalance,
      description: acc.description || "",
      status: acc.status,
      normalBalance: acc.normalBalance,
      isGroup: acc.isGroup,
    });
    setFormMode("edit");
    setFormOpen(true);
    setCtxMenu(null);
  };

  const saveForm = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    const duplicate = accounts.find(
      (a) => a.code === form.code.trim() && a.id !== form.id,
    );
    if (duplicate) {
      toast.error("Account code already exists");
      return;
    }

    if (formMode === "add") {
      addAccount({
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        parentId: form.parentId || undefined,
        openingBalance: form.openingBalance,
        currentBalance: form.openingBalance,
        description: form.description,
        status: form.status,
        normalBalance: form.normalBalance,
        isGroup: form.isGroup,
        level: 0, // store computes dynamically
      });
      toast.success("Account added");
    } else {
      updateAccount(form.id!, {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        parentId: form.parentId || undefined,
        openingBalance: form.openingBalance,
        description: form.description,
        status: form.status,
        normalBalance: form.normalBalance,
        isGroup: form.isGroup,
      });
      toast.success("Account updated");
    }
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteAccount(deleteTarget.id);
    toast.success("Account deleted");
    setDeleteTarget(null);
  };

  // ── Root nodes for tree ──
  const roots = getChildren(undefined, accounts);

  // ── Leaf nodes for tab 2 ──
  const leafNodes = accounts
    .filter((a) => isLeaf(a, accounts))
    .filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (
        search &&
        !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.code.includes(search)
      )
        return false;
      return true;
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  // ── Excel template download ──
  const downloadTemplate = () => {
    if (!XLSX) {
      toast.error("Spreadsheet library not loaded. Please refresh the page.");
      return;
    }
    const wb = XLSX.utils.book_new();

    // L0 Root Accounts sheet
    const l0Data = [
      ["CODE", "TITLE"],
      ["100", "ASSETS"],
      ["200", "CAPITAL AND RESERVES"],
      ["300", "LIABILITIES"],
      ["400", "REVENUE"],
      ["500", "COST OF GOODS"],
      ["600", "ADMINISTRATIVE EXPENSES"],
      ["800", "FINANCIAL CHARGES"],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(l0Data),
      "L0_Root_Accounts",
    );

    // L1 Accounts sheet
    const l1Data = [
      ["CODE", "TITLE"],
      ["100-01", "NON-CURRENT ASSETS"],
      ["100-02", "CURRENT ASSETS"],
      ["200-01", "PARTNERS CAPITAL"],
      ["300-01", "LONG TERM LIABILITIES"],
      ["300-02", "SHORT TERM LIABILITIES"],
      ["400-01", "OPERATIONAL REVENUE"],
      ["400-02", "OTHER INCOME"],
      ["500-01", "DIRECT COST"],
      ["600-01", "OPERATIONAL EXPENSES"],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(l1Data),
      "L1_Accounts",
    );

    // L2 Accounts sheet
    const l2Data = [
      ["CODE", "TITLE"],
      ["100-01-01", "PROPERTY PLANT AND EQUIPMENT"],
      ["100-01-02", "LAND"],
      ["100-01-03", "VEHICLE"],
      ["100-01-04", "LAND AND BUILDING"],
      ["100-01-05", "CONOPY"],
      ["100-02-01", "CASH AND EQUIVALENTS"],
      ["100-02-02", "BANKS"],
      ["100-02-03", "STOCK IN HAND"],
      ["200-01-01", "ACCUMULATED CAPITAL"],
      ["300-01-01", "LONG TERM LOANS"],
      ["300-02-01", "TRADE AND OTHER PAYABLES"],
      ["400-01-01", "SALES REVENUE"],
      ["500-01-01", "COST OF GOODS SOLD"],
      ["600-01-01", "SALARIES AND WAGES"],
      ["600-01-02", "UTILITIES"],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(l2Data),
      "L2_Accounts",
    );

    // L3 Leaf Accounts sheet
    const l3Data = [
      ["CODE", "TITLE"],
      ["100-01-05-0001", "WINDOWS"],
      ["100-01-05-0002", "WINDOW"],
      ["100-02-02-0001", "MAIN ACCOUNT"],
      ["100-02-02-0002", "SAVING ACCOUNT"],
      ["200-01-01-0001", "PARTNER A CAPITAL"],
      ["300-02-01-0001", "ACCOUNTS PAYABLE"],
      ["400-01-01-0001", "PRODUCT SALES"],
      ["600-01-01-0001", "STAFF SALARIES"],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(l3Data),
      "L3_Leaf_Accounts",
    );

    XLSX.writeFile(wb, "COA_Import_Template.xlsx");
    toast.success("Template downloaded");
  };

  // ── Excel import ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!XLSX) {
        toast.error("Spreadsheet library not loaded. Please refresh the page.");
        return;
      }
      try {
        const wb = XLSX.read(ev.target?.result as ArrayBuffer, {
          type: "array",
        });
        const rows: { code: string; name: string; errors: string[] }[] = [];

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws, {
            defval: "",
          }) as Record<string, string>[];
          for (const row of data) {
            const rowData = row as Record<string, string>;
            const code = (rowData.CODE || rowData.code || "").toString().trim();
            const name = (
              rowData.TITLE ||
              rowData.title ||
              rowData.NAME ||
              rowData.name ||
              ""
            )
              .toString()
              .trim();
            if (!code && !name) continue;
            const errs: string[] = [];
            if (!code) errs.push("Missing CODE");
            if (!name) errs.push("Missing TITLE");
            rows.push({ code, name, errors: errs });
          }
        }

        setImportRows(rows);
        setImportPreview(true);
      } catch {
        toast.error("Failed to read Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Infer type from code prefix
  function inferType(code: string): AccType {
    const prefix = code.split("-")[0];
    if (prefix.startsWith("1")) return "Asset";
    if (prefix.startsWith("2")) return "Equity";
    if (prefix.startsWith("3")) return "Liability";
    if (prefix.startsWith("4")) return "Income";
    if (prefix.startsWith("5")) return "COGS";
    if (
      prefix.startsWith("6") ||
      prefix.startsWith("7") ||
      prefix.startsWith("8")
    )
      return "Expense";
    return "Asset";
  }

  // Find parent by code pattern: 100-01-02 -> parent is 100-01, which parent is 100
  function findParentId(code: string, allAccs: Account[]): string | undefined {
    const parts = code.split("-");
    if (parts.length <= 1) return undefined;
    const parentCode = parts.slice(0, -1).join("-");
    return allAccs.find((a) => a.code === parentCode)?.id;
  }

  const processImport = () => {
    const validRows = importRows.filter((r) => r.errors.length === 0);
    let imported = 0;
    let skipped = 0;
    // Sort by code length to ensure parents are created before children
    const sorted = [...validRows].sort(
      (a, b) => a.code.length - b.code.length || a.code.localeCompare(b.code),
    );

    // We need fresh state each iteration
    const current = [...accounts];
    for (const row of sorted) {
      if (current.find((a) => a.code === row.code)) {
        skipped++;
        continue;
      }
      const type = inferType(row.code);
      const parentId = findParentId(row.code, current);
      const parts = row.code.split("-");
      const isGroup = parts.length < 4; // L0, L1, and L2 are groups; L3 is leaf
      const newAcc: Omit<Account, "id"> = {
        code: row.code,
        name: row.name,
        type,
        parentId,
        openingBalance: 0,
        currentBalance: 0,
        status: "Active",
        normalBalance: NORMAL_BALANCE_DEFAULT[type],
        isGroup,
        level: parts.length - 1,
        description: "",
      };
      // Use addAccount but we need the id to attach children
      // Use a temp id trick: directly push to current array
      const id = `acc-import-${Date.now()}-${imported}`;
      current.push({ ...newAcc, id });
      addAccount(newAcc);
      imported++;
    }

    toast.success(
      `Imported ${imported} accounts, skipped ${skipped} duplicates`,
    );
    setImportPreview(false);
    setImportRows([]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Chart of Accounts
          </h1>
          <PageHelp pageId="chart-of-accounts" />
        </div>
        <Button
          onClick={() => openAdd()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-1" /> Add Account
        </Button>
      </div>

      <Tabs defaultValue="tree">
        <TabsList className="mb-2">
          <TabsTrigger value="tree">🌳 Tree View</TabsTrigger>
          <TabsTrigger value="list">📋 Leaf Accounts</TabsTrigger>
          <TabsTrigger value="import">📥 Import Excel</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Tree View ─────────────────────────────────────────── */}
        <TabsContent value="tree">
          <div className="border rounded-lg bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
              <span className="text-sm font-medium text-gray-600">
                Tree View
              </span>
              <span className="text-xs text-gray-400">
                (Right-click any node for options)
              </span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={expandAll}>
                  Expand All
                </Button>
                <Button size="sm" variant="outline" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 px-4 py-2 border-b bg-gray-50 text-xs">
              <span className="text-gray-500">Right-click nodes for:</span>
              <span className="text-blue-600 font-medium">
                Add Child (L0-L1)
              </span>
              <span className="text-yellow-600 font-medium">
                Edit (any level)
              </span>
              <span className="text-red-600 font-medium">
                Delete (leaf only)
              </span>
              <span className="text-green-600 font-medium">
                View (leaf only)
              </span>
            </div>

            {/* Tree */}
            <div className="p-2 min-h-[400px] font-mono text-sm">
              {roots.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  No accounts. Click "Add Account" to start.
                </p>
              )}
              {roots.map((root) => (
                <TreeNode
                  key={root.id}
                  node={root}
                  all={accounts}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggle}
                  onContext={handleContext}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: Leaf Accounts ──────────────────────────────────────── */}
        <TabsContent value="list">
          <div className="border rounded-lg bg-white shadow-sm">
            <div className="flex items-center gap-3 p-3 border-b bg-gray-50 rounded-t-lg flex-wrap">
              <span className="text-sm font-medium text-gray-600">
                Leaf / Detail Accounts
              </span>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2 top-2.5 text-gray-400"
                />
                <Input
                  className="pl-7 h-8 w-48 text-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {TYPE_LABELS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Button
                  size="sm"
                  onClick={() => openAdd()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">
                      Code
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600">
                      Name
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600">
                      Normal Bal
                    </th>
                    <th className="text-right p-3 font-medium text-gray-600">
                      Opening Bal
                    </th>
                    <th className="text-center p-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-center p-3 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leafNodes.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-gray-400"
                      >
                        No leaf accounts found.
                      </td>
                    </tr>
                  )}
                  {leafNodes.map((acc) => (
                    <tr key={acc.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs text-gray-600">
                        {acc.code}
                      </td>
                      <td className="p-3 font-medium">{acc.name}</td>
                      <td className="p-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE[acc.type]}`}
                        >
                          {acc.type}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {acc.normalBalance}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {acc.openingBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            acc.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="View"
                            className="p-1 rounded hover:bg-green-50 text-green-600"
                            onClick={() => setViewAcc(acc)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            className="p-1 rounded hover:bg-blue-50 text-blue-600"
                            onClick={() => openEdit(acc)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="p-1 rounded hover:bg-red-50 text-red-600"
                            onClick={() => setDeleteTarget(acc)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 3: Import ─────────────────────────────────────────────── */}
        <TabsContent value="import">
          <div className="border rounded-lg bg-white shadow-sm p-6 space-y-6">
            <div className="flex items-start gap-6 flex-wrap">
              {/* Download Template */}
              <div className="flex-1 min-w-[280px] border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-800">
                    Download Template
                  </h3>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Download the Excel template with four sheets:
                  <br />• <strong>L0_Root_Accounts</strong> — root (e.g. 100)
                  <br />• <strong>L1_Accounts</strong> — L1 (e.g. 100-01)
                  <br />• <strong>L2_Accounts</strong> — L2 (e.g. 100-01-01)
                  <br />• <strong>L3_Leaf_Accounts</strong> — leaf (e.g.
                  100-01-05-0001)
                  <br />
                  Columns:{" "}
                  <code className="bg-blue-100 px-1 rounded">CODE</code> and{" "}
                  <code className="bg-blue-100 px-1 rounded">TITLE</code>
                </p>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="border-blue-400 text-blue-700 hover:bg-blue-100"
                >
                  <Download size={14} className="mr-1" /> Download Template
                </Button>
              </div>

              {/* Upload */}
              <div className="flex-1 min-w-[280px] border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={20} className="text-green-600" />
                  <h3 className="font-semibold text-green-800">
                    Import from Excel
                  </h3>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Upload an .xlsx file with CODE and TITLE columns.
                  <br />
                  Parent accounts are matched by code prefix (e.g. 100-01 is
                  child of 100).
                  <br />
                  Duplicate codes are skipped automatically.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  onClick={() => fileRef.current?.click()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload size={14} className="mr-1" /> Choose Excel File
                </Button>
              </div>
            </div>

            {/* Format reference */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-3">
                Format Reference
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-medium text-gray-600 mb-2">
                    Level 1 Accounts (Sheet 1)
                  </p>
                  <table className="w-full border-collapse border text-xs">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border p-1">CODE</th>
                        <th className="border p-1">TITLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1 font-mono">100-01</td>
                        <td className="border p-1">NON-CURRENT ASSETS</td>
                      </tr>
                      <tr>
                        <td className="border p-1 font-mono">100-02</td>
                        <td className="border p-1">CURRENT ASSETS</td>
                      </tr>
                      <tr>
                        <td className="border p-1 font-mono">200-01</td>
                        <td className="border p-1">PARTNER'S CAPITAL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="font-medium text-gray-600 mb-2">
                    Level 2 Accounts (Sheet 2)
                  </p>
                  <table className="w-full border-collapse border text-xs">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border p-1">CODE</th>
                        <th className="border p-1">TITLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1 font-mono">100-01-01</td>
                        <td className="border p-1">PROPERTY PLANT AND EQUIP</td>
                      </tr>
                      <tr>
                        <td className="border p-1 font-mono">100-01-02</td>
                        <td className="border p-1">LAND</td>
                      </tr>
                      <tr>
                        <td className="border p-1 font-mono">100-02-01</td>
                        <td className="border p-1">CASH & EQUIVALENTS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Context Menu ────────────────────────────────────────────────── */}
      {ctxMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          role="presentation"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        >
          <div className="px-3 py-1.5 border-b">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {ctxMenu.node.code}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[180px]">
              {ctxMenu.node.name}
            </p>
          </div>
          {ctxMenu.actions.includes("add") && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2"
              onClick={() => openAdd(ctxMenu.node.id, ctxMenu.node.type)}
            >
              <Plus size={14} /> Add Child Account
            </button>
          )}
          {ctxMenu.actions.includes("edit") && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 text-yellow-700 flex items-center gap-2"
              onClick={() => openEdit(ctxMenu.node)}
            >
              <Edit2 size={14} /> Edit Account
            </button>
          )}
          {ctxMenu.actions.includes("delete") && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
              onClick={() => {
                setDeleteTarget(ctxMenu.node);
                setCtxMenu(null);
              }}
            >
              <Trash2 size={14} /> Delete Account
            </button>
          )}
          {ctxMenu.actions.includes("view") && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
              onClick={() => {
                setViewAcc(ctxMenu.node);
                setCtxMenu(null);
              }}
            >
              <Eye size={14} /> View Details
            </button>
          )}
        </div>
      )}

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "add" ? "Add Account" : "Edit Account"}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            form={form}
            onChange={setForm}
            all={accounts}
            mode={formMode}
            parentLocked={formMode === "edit"}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!viewAcc} onOpenChange={() => setViewAcc(null)}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          {viewAcc && (
            <div className="space-y-3 text-sm">
              {[
                ["Code", viewAcc.code],
                ["Name", viewAcc.name],
                ["Type", viewAcc.type],
                ["Level", `L${getLevel(viewAcc, accounts)}`],
                ["Normal Balance", viewAcc.normalBalance],
                ["Opening Balance", viewAcc.openingBalance.toLocaleString()],
                ["Current Balance", viewAcc.currentBalance.toLocaleString()],
                ["Status", viewAcc.status],
                ["Description", viewAcc.description || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex">
                  <span className="w-36 text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <strong>
                {deleteTarget?.code} — {deleteTarget?.name}
              </strong>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Import Preview Dialog ────────────────────────────────────────── */}
      <Dialog open={importPreview} onOpenChange={setImportPreview}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Import Preview — {importRows.length} rows found
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto border rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">CODE</th>
                  <th className="p-2 text-left">TITLE</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((r, i) => (
                  <tr
                    key={`row-${r.code}-${i}`}
                    className={`border-t ${r.errors.length > 0 ? "bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="p-2 font-mono">
                      {r.code || <span className="text-red-500">missing</span>}
                    </td>
                    <td className="p-2">
                      {r.name || <span className="text-red-500">missing</span>}
                    </td>
                    <td className="p-2">
                      {r.errors.length === 0 ? (
                        <span className="text-green-600">✓ Ready</span>
                      ) : (
                        <span className="text-red-600">
                          {r.errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-gray-500">
              {importRows.filter((r) => r.errors.length === 0).length} valid,{" "}
              {importRows.filter((r) => r.errors.length > 0).length} with errors
              (will be skipped)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportPreview(false)}>
                Cancel
              </Button>
              <Button
                onClick={processImport}
                className="bg-green-600 hover:bg-green-700"
              >
                Import Valid Rows
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

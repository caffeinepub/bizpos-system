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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Info,
  Layers,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { Account, ItemCategory } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

export default function ItemCategoriesPage() {
  const {
    itemCategories,
    items,
    accounts,
    addItemCategory,
    updateItemCategory,
    deleteItemCategory,
  } = useStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<ItemCategory | null>(null);
  const [showAccountMapping, setShowAccountMapping] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    parentId: "",
    seqNo: "",
    status: "active" as "active" | "inactive",
    inventoryAccountId: "",
    cogsAccountId: "",
    salesAccountId: "",
  });

  // Get leaf accounts by type for dropdowns
  const leafAccountsByType = (types: Account["type"][]) =>
    accounts
      .filter(
        (a) => !a.isGroup && a.status === "Active" && types.includes(a.type),
      )
      .sort((a, b) => a.code.localeCompare(b.code));

  const inventoryAccounts = leafAccountsByType(["Asset"]);
  const cogsAccounts = leafAccountsByType(["COGS"]);
  const salesAccounts = leafAccountsByType(["Income"]);

  const getAccountName = (id?: string) => {
    if (!id) return "—";
    return accounts.find((a) => a.id === id)?.name || "—";
  };

  // Sort by seqNo then name
  const filtered = itemCategories
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const sa = a.seqNo ?? 999;
      const sb = b.seqNo ?? 999;
      return sa !== sb ? sa - sb : a.name.localeCompare(b.name);
    });

  const getParentName = (parentId?: string) => {
    if (!parentId) return "—";
    return itemCategories.find((c) => c.id === parentId)?.name || "—";
  };

  const suggestCode = () => {
    const max = itemCategories.reduce((acc, c) => {
      const num = Number.parseInt(c.code.replace(/\D/g, "") || "0");
      return Math.max(acc, num);
    }, 0);
    return `CAT-${String(max + 1).padStart(3, "0")}`;
  };

  const suggestSeqNo = () => {
    const max = itemCategories.reduce(
      (acc, c) => Math.max(acc, c.seqNo ?? 0),
      0,
    );
    return String(max + 1);
  };

  const openAdd = () => {
    setEditingCat(null);
    setShowAccountMapping(false);
    setForm({
      code: suggestCode(),
      name: "",
      description: "",
      parentId: "",
      seqNo: suggestSeqNo(),
      status: "active",
      inventoryAccountId: "",
      cogsAccountId: "",
      salesAccountId: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (cat: ItemCategory) => {
    setEditingCat(cat);
    // Auto-expand account mapping section if the category already has custom accounts set
    setShowAccountMapping(
      !!(cat.inventoryAccountId || cat.cogsAccountId || cat.salesAccountId),
    );
    setForm({
      code: cat.code,
      name: cat.name,
      description: cat.description || "",
      parentId: cat.parentId || "",
      seqNo: String(cat.seqNo ?? ""),
      status: cat.status,
      inventoryAccountId: cat.inventoryAccountId || "",
      cogsAccountId: cat.cogsAccountId || "",
      salesAccountId: cat.salesAccountId || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    const isDuplicate = itemCategories.some(
      (c) => c.code === form.code.trim() && c.id !== editingCat?.id,
    );
    if (isDuplicate) {
      toast.error("Category code already exists");
      return;
    }
    const data: Omit<ItemCategory, "id"> = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      parentId: form.parentId || undefined,
      seqNo: Number.parseInt(form.seqNo) || 99,
      status: form.status,
      inventoryAccountId: form.inventoryAccountId || undefined,
      cogsAccountId: form.cogsAccountId || undefined,
      salesAccountId: form.salesAccountId || undefined,
    };
    if (editingCat) {
      updateItemCategory(editingCat.id, data);
      toast.success("Category updated");
    } else {
      addItemCategory(data);
      toast.success("Category created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const inUse = items.some((i) => i.categoryId === id);
    if (inUse) {
      toast.error("Cannot delete: category is used by one or more items");
      setDeleteId(null);
      return;
    }
    const hasChildren = itemCategories.some((c) => c.parentId === id);
    if (hasChildren) {
      toast.error("Cannot delete: category has sub-categories");
      setDeleteId(null);
      return;
    }
    deleteItemCategory(id);
    toast.success("Category deleted");
    setDeleteId(null);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((c) => [
      String(c.seqNo ?? ""),
      c.code,
      c.name,
      getParentName(c.parentId),
      c.description || "",
      getAccountName(c.inventoryAccountId),
      getAccountName(c.cogsAccountId),
      getAccountName(c.salesAccountId),
      c.status,
    ]);
    exportPDF(
      "Item Categories",
      [
        "Seq",
        "Code",
        "Name",
        "Parent",
        "Description",
        "Inv. Acct",
        "COGS Acct",
        "Sales Acct",
        "Status",
      ],
      rows,
      "item-categories.pdf",
      {
        companyName: "BizPOS",
        reportTitle: "Item Categories",
        generatedBy: currentUser?.name,
      },
    );
  };

  const handleExportExcel = () => {
    const rows = filtered.map((c) => [
      String(c.seqNo ?? ""),
      c.code,
      c.name,
      getParentName(c.parentId),
      c.description || "",
      getAccountName(c.inventoryAccountId),
      getAccountName(c.cogsAccountId),
      getAccountName(c.salesAccountId),
      c.status,
    ]);
    exportExcel(
      "item-categories.xlsx",
      "Categories",
      [
        "Seq",
        "Code",
        "Name",
        "Parent",
        "Description",
        "Inv. Acct",
        "COGS Acct",
        "Sales Acct",
        "Status",
      ],
      rows,
      {
        companyName: "BizPOS",
        reportTitle: "Item Categories",
        generatedBy: currentUser?.name,
      },
    );
  };

  const AccountSelect = ({
    value,
    onChange,
    options,
    placeholder,
    ocid,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: Account[];
    placeholder: string;
    ocid: string;
  }) => (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
    >
      <SelectTrigger data-ocid={ocid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Use System Default —</SelectItem>
        {options.map((acc) => (
          <SelectItem key={acc.id} value={acc.id}>
            <span className="font-mono text-xs text-gray-400 mr-1">
              {acc.code}
            </span>
            {acc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
            Item Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product categories. Set Seq No to control the order shown in
            POS. Map accounts to override default COA mapping per category.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            Excel
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            data-ocid="item_categories.primary_button"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="item_categories.search_input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className="w-36"
                data-ocid="item_categories.select"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="item_categories.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Seq</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Inv. Acct</TableHead>
                  <TableHead>COGS Acct</TableHead>
                  <TableHead>Sales Acct</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                      data-ocid="item_categories.empty_state"
                    >
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cat, i) => (
                    <TableRow
                      key={cat.id}
                      data-ocid={`item_categories.item.${i + 1}`}
                    >
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                          {cat.seqNo ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {cat.code}
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getParentName(cat.parentId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {cat.description || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cat.inventoryAccountId ? (
                          <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                            {getAccountName(cat.inventoryAccountId)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Default</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cat.cogsAccountId ? (
                          <span className="inline-block bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-xs">
                            {getAccountName(cat.cogsAccountId)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Default</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cat.salesAccountId ? (
                          <span className="inline-block bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                            {getAccountName(cat.salesAccountId)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Default</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cat.status === "active" ? "default" : "secondary"
                          }
                          className={
                            cat.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ""
                          }
                        >
                          {cat.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(cat)}
                            data-ocid={`item_categories.edit_button.${i + 1}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(cat.id)}
                            className="text-red-600 hover:bg-red-50"
                            data-ocid={`item_categories.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl"
          data-ocid="item_categories.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CAT-001"
                  data-ocid="item_categories.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Seq No</Label>
                <Input
                  type="number"
                  value={form.seqNo}
                  onChange={(e) => setForm({ ...form, seqNo: e.target.value })}
                  placeholder="1"
                  min="1"
                  data-ocid="item_categories.input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Electronics"
                data-ocid="item_categories.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional)</Label>
              <Select
                value={form.parentId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, parentId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger data-ocid="item_categories.select">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    — No Parent (Top Level) —
                  </SelectItem>
                  {itemCategories
                    .filter((c) => c.id !== editingCat?.id)
                    .sort((a, b) => (a.seqNo ?? 999) - (b.seqNo ?? 999))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                data-ocid="item_categories.input"
              />
            </div>

            {/* Account Mapping Section - Collapsible Advanced Option */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAccountMapping(!showAccountMapping)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {showAccountMapping ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Advanced: Accounting Accounts
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                </div>
              </button>

              {showAccountMapping && (
                <div className="p-4 space-y-4 border-t bg-white">
                  {/* Plain-language explanation */}
                  <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                    <div>
                      <p className="font-medium mb-1">What is this?</p>
                      <p className="text-xs leading-relaxed">
                        When items in this category are bought or sold, the
                        system automatically records the transaction in your
                        accounting books. By default, it uses the accounts set
                        in <strong>Accounting → Account Mapping</strong>.
                      </p>
                      <p className="text-xs leading-relaxed mt-1">
                        Use these fields <strong>only</strong> if this category
                        needs different accounts than the system default — for
                        example, if you track electronics inventory separately
                        from clothing inventory in your accounts.
                        <strong> Leave blank to use system defaults.</strong>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">
                        Inventory Asset Account
                      </Label>
                      <p className="text-xs text-gray-500">
                        The balance sheet account where the stock value of this
                        category is recorded.
                      </p>
                      <AccountSelect
                        value={form.inventoryAccountId}
                        onChange={(v) =>
                          setForm({ ...form, inventoryAccountId: v })
                        }
                        options={inventoryAccounts}
                        placeholder="— Use system default —"
                        ocid="item_categories.select"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">
                        Cost of Goods Sold (COGS) Account
                      </Label>
                      <p className="text-xs text-gray-500">
                        The expense account charged when an item from this
                        category is sold (records the cost of the item sold).
                      </p>
                      <AccountSelect
                        value={form.cogsAccountId}
                        onChange={(v) => setForm({ ...form, cogsAccountId: v })}
                        options={cogsAccounts}
                        placeholder="— Use system default —"
                        ocid="item_categories.select"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">
                        Sales Revenue Account
                      </Label>
                      <p className="text-xs text-gray-500">
                        The income account credited with the selling price when
                        an item from this category is sold.
                      </p>
                      <AccountSelect
                        value={form.salesAccountId}
                        onChange={(v) =>
                          setForm({ ...form, salesAccountId: v })
                        }
                        options={salesAccounts}
                        placeholder="— Use system default —"
                        ocid="item_categories.select"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "active" | "inactive" })
                }
              >
                <SelectTrigger data-ocid="item_categories.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                data-ocid="item_categories.save_button"
              >
                {editingCat ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="item_categories.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteId!)}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="item_categories.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

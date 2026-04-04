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
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  accountId: string;
  accountName: string;
  status: "Active" | "Inactive";
}

const STORAGE_KEY = "bizpos_expense_categories";
function load(): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed: ExpenseCategory[] = [
        {
          id: "ec1",
          name: "Utilities",
          description: "Electricity, water, internet",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec2",
          name: "Rent",
          description: "Office and warehouse rent",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec3",
          name: "Transport",
          description: "Transport and logistics costs",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec4",
          name: "Office Supplies",
          description: "Stationery and office items",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec5",
          name: "Marketing",
          description: "Advertising and promotions",
          accountId: "",
          accountName: "",
          status: "Active",
        },
        {
          id: "ec6",
          name: "Maintenance",
          description: "Equipment and facility maintenance",
          accountId: "",
          accountName: "",
          status: "Active",
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function save(data: ExpenseCategory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function ExpenseCategoriesPage() {
  const { accounts } = useStore();
  const expenseAccounts = accounts.filter(
    (a) => a.type === "Expense" || a.type === "COGS",
  );
  const [categories, setCategories] = useState<ExpenseCategory[]>(load);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    accountId: "",
    status: "Active" as "Active" | "Inactive",
  });

  const reload = () => setCategories(load());
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingCat(null);
    setForm({ name: "", description: "", accountId: "", status: "Active" });
    setDialogOpen(true);
  };

  const openEdit = (c: ExpenseCategory) => {
    setEditingCat(c);
    setForm({
      name: c.name,
      description: c.description,
      accountId: c.accountId,
      status: c.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    const acc = accounts.find((a) => a.id === form.accountId);
    const all = load();
    if (editingCat) {
      const updated = all.map((c) =>
        c.id === editingCat.id
          ? {
              ...c,
              name: form.name,
              description: form.description,
              accountId: form.accountId,
              accountName: acc?.name ?? "",
              status: form.status,
            }
          : c,
      );
      save(updated);
      toast.success("Category updated");
    } else {
      const newCat: ExpenseCategory = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        name: form.name,
        description: form.description,
        accountId: form.accountId,
        accountName: acc?.name ?? "",
        status: form.status,
      };
      save([...all, newCat]);
      toast.success("Category created");
    }
    reload();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    save(load().filter((c) => c.id !== id));
    reload();
    setDeleteId(null);
    toast.success("Deleted");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Expense Categories
            </h1>
            <PageHelp pageId="expense-categories" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage expense categories and COA mappings
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="expense_categories.primary_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-4">
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
              data-ocid="expense_categories.search_input"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>COA Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="expense_categories.empty_state"
                  >
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c, i) => (
                  <TableRow
                    key={c.id}
                    data-ocid={`expense_categories.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {c.description}
                    </TableCell>
                    <TableCell>
                      {c.accountName || (
                        <span className="text-gray-400">Not mapped</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(c)}
                          data-ocid={`expense_categories.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteId(c.id)}
                          data-ocid={`expense_categories.delete_button.${i + 1}`}
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="expense_categories.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Edit Category" : "New Expense Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Utilities"
                data-ocid="expense_categories.input"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                data-ocid="expense_categories.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>COA Account</Label>
                <Select
                  value={form.accountId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, accountId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger data-ocid="expense_categories.select">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {expenseAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: "Active" | "Inactive") =>
                    setForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger data-ocid="expense_categories.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="expense_categories.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                data-ocid="expense_categories.submit_button"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="expense_categories.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="expense_categories.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="expense_categories.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

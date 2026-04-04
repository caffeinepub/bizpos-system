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

import PageHelp from "@/components/PageHelp";

export interface CustomerGroup {
  id: string;
  name: string;
  description: string;
  discount: number;
  status: "Active" | "Inactive";
}

const STORAGE_KEY = "bizpos_customer_groups";
function load(): CustomerGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed: CustomerGroup[] = [
        {
          id: "cg1",
          name: "Retail",
          description: "Standard retail customers",
          discount: 0,
          status: "Active",
        },
        {
          id: "cg2",
          name: "Wholesale",
          description: "Wholesale buyers with volume discounts",
          discount: 5,
          status: "Active",
        },
        {
          id: "cg3",
          name: "VIP",
          description: "VIP customers with premium discounts",
          discount: 10,
          status: "Active",
        },
        {
          id: "cg4",
          name: "Corporate",
          description: "Corporate accounts",
          discount: 8,
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
function save(data: CustomerGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>(load);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    discount: "",
    status: "Active" as "Active" | "Inactive",
  });

  const reload = () => setGroups(load());

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingGroup(null);
    setForm({ name: "", description: "", discount: "0", status: "Active" });
    setDialogOpen(true);
  };

  const openEdit = (g: CustomerGroup) => {
    setEditingGroup(g);
    setForm({
      name: g.name,
      description: g.description,
      discount: g.discount.toString(),
      status: g.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    const all = load();
    if (editingGroup) {
      const updated = all.map((g) =>
        g.id === editingGroup.id
          ? {
              ...g,
              name: form.name,
              description: form.description,
              discount: Number(form.discount),
              status: form.status,
            }
          : g,
      );
      save(updated);
      toast.success("Group updated");
    } else {
      const newGroup: CustomerGroup = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        name: form.name,
        description: form.description,
        discount: Number(form.discount),
        status: form.status,
      };
      save([...all, newGroup]);
      toast.success("Group created");
    }
    reload();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    save(load().filter((g) => g.id !== id));
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
              Customer Groups
            </h1>
            <PageHelp pageId="customer-groups" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage customer segments with pricing tiers
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="customer_groups.primary_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-4">
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
              data-ocid="customer_groups.search_input"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default Discount %</TableHead>
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
                    data-ocid="customer_groups.empty_state"
                  >
                    No groups found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((g, i) => (
                  <TableRow
                    key={g.id}
                    data-ocid={`customer_groups.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {g.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{g.discount}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          g.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {g.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(g)}
                          data-ocid={`customer_groups.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteId(g.id)}
                          data-ocid={`customer_groups.delete_button.${i + 1}`}
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
          data-ocid="customer_groups.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Customer Group" : "New Customer Group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Wholesale"
                data-ocid="customer_groups.input"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Group description"
                data-ocid="customer_groups.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Default Discount %</Label>
                <Input
                  type="number"
                  value={form.discount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discount: e.target.value }))
                  }
                  min={0}
                  max={100}
                  data-ocid="customer_groups.input"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: "Active" | "Inactive") =>
                    setForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger data-ocid="customer_groups.select">
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
                data-ocid="customer_groups.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                data-ocid="customer_groups.submit_button"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="customer_groups.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="customer_groups.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="customer_groups.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

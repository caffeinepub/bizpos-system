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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import type { Role } from "../store/useStore";

const ALL_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "Point of Sale" },
  { key: "sales", label: "Sales Management" },
  { key: "purchases", label: "Purchase Management" },
  { key: "inventory", label: "Inventory Management" },
  { key: "warehouse", label: "Warehouse Management" },
  { key: "shops", label: "Shops Management" },
  { key: "accounts", label: "Accounts & Accounting" },
  { key: "payments", label: "Payment Management" },
  { key: "reports", label: "Reports & Analytics" },
  { key: "employees", label: "Employee Management" },
  { key: "salary_processing", label: "Salary Processing" },
  { key: "trial_balance", label: "Trial Balance" },
  { key: "balance_sheet", label: "Balance Sheet" },
  { key: "profit_loss", label: "Profit & Loss" },
  { key: "users", label: "User Management" },
  { key: "roles", label: "Roles Management" },
  { key: "settings", label: "System Settings" },
  { key: "customers", label: "Customers" },
  { key: "purchase_orders", label: "Purchase Orders" },
  { key: "bank_reconciliation", label: "Bank Reconciliation" },
  { key: "departments", label: "Departments" },
  { key: "designations", label: "Designations" },
  { key: "allowance_types", label: "Allowance Types" },
  { key: "salary_slips", label: "Salary Slips" },
  { key: "shifts", label: "Shift Management" },
  { key: "shift_closing", label: "Shift Closing" },
  { key: "attendance", label: "Attendance" },
  { key: "tickets", label: "Ticket Management" },
];

export default function RolesPage() {
  const { roles, addRole, updateRole, deleteRole } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const openAdd = () => {
    setEditingRole(null);
    setForm({ name: "", description: "", permissions: ["dashboard"] });
    setDialogOpen(true);
  };
  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
    setDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const selectAll = () =>
    setForm((prev) => ({
      ...prev,
      permissions: ALL_PERMISSIONS.map((p) => p.key),
    }));
  const deselectAll = () => setForm((prev) => ({ ...prev, permissions: [] }));

  const handleSave = () => {
    if (!form.name) {
      toast.error("Role name is required");
      return;
    }
    if (editingRole) {
      updateRole(editingRole.id, {
        name: form.name,
        description: form.description,
        permissions: form.permissions,
      });
      toast.success("Role updated");
    } else {
      addRole({
        name: form.name,
        description: form.description,
        permissions: form.permissions,
      });
      toast.success("Role created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (id === "role-admin") {
      toast.error("Cannot delete Admin role");
      return;
    }
    deleteRole(id);
    toast.success("Role deleted");
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="roles.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            All Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role, idx) => (
                <TableRow key={role.id} data-ocid={`roles.item.${idx + 1}`}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    {role.permissions.includes("all") ? (
                      <Badge className="bg-blue-100 text-blue-700">
                        Full Access
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {role.permissions.length} permissions
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(role)}
                        data-ocid={`roles.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {role.id !== "role-admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => setDeleteId(role.id)}
                          data-ocid={`roles.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="roles.dialog">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Role Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-ocid="roles.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-3 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {ALL_PERMISSIONS.map((perm) => (
                  <div key={perm.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${perm.key}`}
                      checked={form.permissions.includes(perm.key)}
                      onCheckedChange={() => togglePermission(perm.key)}
                      data-ocid={"roles.checkbox"}
                    />
                    <label
                      htmlFor={`perm-${perm.key}`}
                      className="text-sm cursor-pointer"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                className="flex-1"
                data-ocid="roles.save_button"
              >
                Save Role
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="roles.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="roles.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Users with this role will lose
              access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="roles.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600"
              data-ocid="roles.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

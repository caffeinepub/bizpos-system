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

type PermissionGroup = {
  group: string;
  permissions: { key: string; label: string }[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: "General",
    permissions: [
      { key: "dashboard", label: "Dashboard" },
      { key: "reports", label: "Reports & Analytics" },
      { key: "logs", label: "System Logs" },
      { key: "settings", label: "System Settings" },
    ],
  },
  {
    group: "POS & Sales",
    permissions: [
      { key: "pos", label: "Point of Sale" },
      { key: "sales", label: "Sales Management" },
      { key: "sales_returns", label: "Sales Returns" },
      { key: "credit_notes", label: "Credit Notes" },
      { key: "payments", label: "Payment Management" },
    ],
  },
  {
    group: "Customers",
    permissions: [
      { key: "customers", label: "Customers" },
      { key: "customer_groups", label: "Customer Groups" },
    ],
  },
  {
    group: "Purchases & Suppliers",
    permissions: [
      { key: "purchases", label: "Purchase Invoices / Bills" },
      { key: "purchase_orders", label: "Purchase Orders" },
      { key: "purchase_returns", label: "Purchase Returns" },
      { key: "debit_notes", label: "Debit Notes" },
      { key: "suppliers", label: "Suppliers" },
    ],
  },
  {
    group: "Pricing",
    permissions: [
      { key: "taxes", label: "Tax Rates" },
      { key: "discounts", label: "Discounts" },
      { key: "promotions", label: "Promotions" },
    ],
  },
  {
    group: "Inventory",
    permissions: [
      { key: "inventory", label: "Items / Inventory" },
      { key: "stock_adjustment", label: "Stock Adjustment" },
      { key: "warehouse_stock", label: "Warehouse Stock View" },
    ],
  },
  {
    group: "Warehouse & Hierarchy",
    permissions: [
      { key: "companies", label: "Companies" },
      { key: "warehouse", label: "Warehouses" },
      { key: "shops", label: "Shops" },
    ],
  },
  {
    group: "Accounting",
    permissions: [
      { key: "accounts", label: "Chart of Accounts" },
      { key: "journal_entries", label: "Journal Entries" },
      { key: "opening_balances", label: "Opening Balances" },
      { key: "financial_years", label: "Financial Years" },
      { key: "expenses", label: "Expenses" },
      { key: "expense_categories", label: "Expense Categories" },
      { key: "bank_reconciliation", label: "Bank Reconciliation" },
      { key: "trial_balance", label: "Trial Balance" },
      { key: "balance_sheet", label: "Balance Sheet" },
      { key: "profit_loss", label: "Profit & Loss" },
    ],
  },
  {
    group: "Banking",
    permissions: [
      { key: "banks", label: "Banks" },
      { key: "bank_branches", label: "Bank Branches" },
      { key: "bank_accounts", label: "Bank Accounts" },
      { key: "cheque_books", label: "Cheque Books" },
      { key: "cheque_templates", label: "Cheque Templates" },
      { key: "cheque_print", label: "Cheque Print" },
    ],
  },
  {
    group: "HR & Payroll",
    permissions: [
      { key: "employees", label: "Employees" },
      { key: "salary_processing", label: "Salary Processing" },
      { key: "leave_management", label: "Leave Management" },
      { key: "departments", label: "Departments" },
      { key: "designations", label: "Designations" },
      { key: "allowance_types", label: "Allowance Types" },
      { key: "salary_slips", label: "Salary Slips" },
      { key: "shifts", label: "Shift Management" },
      { key: "shift_closing", label: "Shift Closing" },
      { key: "attendance", label: "Attendance" },
    ],
  },
  {
    group: "Supply Chain",
    permissions: [
      { key: "purchase_requisitions", label: "Purchase Requisitions" },
      { key: "goods_receipt", label: "Goods Receipt Notes" },
      { key: "inventory_transfers", label: "Inventory Transfers" },
      { key: "shipments", label: "Shipment Tracking" },
      { key: "supplier_performance", label: "Supplier Performance" },
    ],
  },
  {
    group: "Admin",
    permissions: [
      { key: "users", label: "User Management" },
      { key: "roles", label: "Roles Management" },
      { key: "tickets", label: "Ticket Management" },
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

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

  const toggleGroup = (group: PermissionGroup) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allChecked = groupKeys.every((k) => form.permissions.includes(k));
    setForm((prev) => ({
      ...prev,
      permissions: allChecked
        ? prev.permissions.filter((k) => !groupKeys.includes(k))
        : [...new Set([...prev.permissions, ...groupKeys])],
    }));
  };

  const selectAll = () =>
    setForm((prev) => ({ ...prev, permissions: ALL_PERMISSION_KEYS }));
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
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="roles.dialog"
        >
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Permissions ({form.permissions.length} of{" "}
                  {ALL_PERMISSION_KEYS.length} selected)
                </Label>
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

              <div className="border rounded-md divide-y max-h-[420px] overflow-y-auto">
                {PERMISSION_GROUPS.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key);
                  const checkedCount = groupKeys.filter((k) =>
                    form.permissions.includes(k),
                  ).length;
                  const allChecked = checkedCount === groupKeys.length;
                  const someChecked = checkedCount > 0 && !allChecked;
                  return (
                    <div key={group.group} className="p-3">
                      <div
                        className="flex items-center gap-2 mb-2 cursor-pointer select-none"
                        onClick={() => toggleGroup(group)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && toggleGroup(group)
                        }
                      >
                        <Checkbox
                          checked={allChecked}
                          data-state={
                            someChecked
                              ? "indeterminate"
                              : allChecked
                                ? "checked"
                                : "unchecked"
                          }
                          className="pointer-events-none"
                        />
                        <span className="text-sm font-semibold text-gray-700">
                          {group.group}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({checkedCount}/{groupKeys.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pl-6 sm:grid-cols-3">
                        {group.permissions.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`perm-${perm.key}`}
                              checked={form.permissions.includes(perm.key)}
                              onCheckedChange={() => togglePermission(perm.key)}
                              data-ocid="roles.checkbox"
                            />
                            <label
                              htmlFor={`perm-${perm.key}`}
                              className="text-sm cursor-pointer text-gray-600"
                            >
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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

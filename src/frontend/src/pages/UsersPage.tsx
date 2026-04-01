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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Search, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import type { User } from "../store/useStore";

export default function UsersPage() {
  const { users, roles, addUser, updateUser, deleteUser } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    status: "Active" as "Active" | "Inactive",
    isSuperUser: false,
    assignedCompanyId: "",
    assignedWarehouseIds: [] as string[],
    assignedShopIds: [] as string[],
  });

  const warehouses: { id: string; name: string; companyId?: string }[] =
    (() => {
      try {
        return JSON.parse(localStorage.getItem("bizpos_warehouses") || "[]");
      } catch {
        return [];
      }
    })();

  const companies: { id: string; name: string }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_companies") || "[]");
    } catch {
      return [];
    }
  })();

  const allShops: { id: string; name: string; warehouseId: string }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("bizpos_shops") || "[]");
    } catch {
      return [];
    }
  })();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      password: "",
      roleId: roles[0]?.id || "",
      status: "Active",
      isSuperUser: false,
      assignedCompanyId: "",
      assignedWarehouseIds: [],
      assignedShopIds: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      roleId: user.roleId,
      status: user.status,
      isSuperUser: user.isSuperUser === true,
      assignedCompanyId:
        (user as unknown as { assignedCompanyId?: string }).assignedCompanyId ??
        "",
      assignedWarehouseIds: user.assignedWarehouseIds ?? [],
      assignedShopIds:
        (user as unknown as { assignedShopIds?: string[] }).assignedShopIds ??
        [],
    });
    setDialogOpen(true);
  };

  const toggleWarehouse = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assignedWarehouseIds: prev.assignedWarehouseIds.includes(id)
        ? prev.assignedWarehouseIds.filter((w) => w !== id)
        : [...prev.assignedWarehouseIds, id],
    }));
  };

  const toggleShop = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assignedShopIds: prev.assignedShopIds.includes(id)
        ? prev.assignedShopIds.filter((s) => s !== id)
        : [...prev.assignedShopIds, id],
    }));
  };

  const handleSave = () => {
    if (!form.name || !form.email || !form.roleId) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!editingUser && !form.password) {
      toast.error("Password is required for new users");
      return;
    }
    if (editingUser) {
      const update: Partial<User> = {
        name: form.name,
        email: form.email,
        roleId: form.roleId,
        status: form.status,
        isSuperUser: form.isSuperUser,
        assignedCompanyId: form.isSuperUser
          ? undefined
          : form.assignedCompanyId || undefined,
        assignedWarehouseIds: form.assignedWarehouseIds,
        assignedShopIds: form.isSuperUser ? [] : form.assignedShopIds,
      };
      if (form.password) update.password = form.password;
      updateUser(editingUser.id, update);
      toast.success("User updated successfully");
    } else {
      addUser({
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: form.roleId,
        status: form.status,
        isSuperUser: form.isSuperUser,
        assignedCompanyId: form.isSuperUser
          ? undefined
          : form.assignedCompanyId || undefined,
        assignedWarehouseIds: form.assignedWarehouseIds,
        assignedShopIds: form.isSuperUser ? [] : form.assignedShopIds,
      });
      toast.success("User created successfully");
    }
    setDialogOpen(false);
  };

  const getRoleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.name || "Unknown";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and their access
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="users.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "Active").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "Inactive").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Super Users</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.isSuperUser).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Users</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
                data-ocid="users.search_input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Super User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="users.empty_state"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user, i) => (
                  <TableRow key={user.id} data-ocid={`users.item.${i + 1}`}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.isSuperUser ? (
                        <span className="text-purple-600 text-xs font-medium">
                          All Companies
                        </span>
                      ) : (
                        companies.find(
                          (c) =>
                            c.id ===
                            (user as unknown as { assignedCompanyId?: string })
                              .assignedCompanyId,
                        )?.name || <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleName(user.roleId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isSuperUser ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Super User
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          user.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          data-ocid={`users.edit_button.${i + 1}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(user.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`users.delete_button.${i + 1}`}
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
        <DialogContent className="max-w-lg" data-ocid="users.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                data-ocid="users.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@company.com"
                data-ocid="users.input"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {editingUser
                  ? "New Password (leave blank to keep)"
                  : "Password *"}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                data-ocid="users.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={form.roleId}
                onValueChange={(v) => setForm({ ...form, roleId: v })}
              >
                <SelectTrigger data-ocid="users.select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "Active" | "Inactive" })
                }
              >
                <SelectTrigger data-ocid="users.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Super User Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <div>
                  <Label className="text-sm font-medium text-purple-900">
                    Super User
                  </Label>
                  <p className="text-xs text-purple-600">
                    Can switch between multiple warehouses
                  </p>
                </div>
              </div>
              <Switch
                checked={form.isSuperUser}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    isSuperUser: v,
                    assignedWarehouseIds: v ? form.assignedWarehouseIds : [],
                  })
                }
                data-ocid="users.switch"
              />
            </div>

            {/* Company Assignment (shown only when not Super User) */}
            {!form.isSuperUser && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Company *</Label>
                <select
                  value={form.assignedCompanyId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assignedCompanyId: e.target.value,
                      assignedWarehouseIds: [],
                      assignedShopIds: [],
                    })
                  }
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  data-ocid="users.select"
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Warehouse Assignment */}
            {!form.isSuperUser && form.assignedCompanyId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Assigned Warehouses
                </Label>
                <p className="text-xs text-gray-500">
                  Leave all unchecked for access to all company warehouses
                </p>
                <div className="border rounded-lg divide-y max-h-36 overflow-y-auto">
                  {warehouses
                    .filter(
                      (w) =>
                        !w.companyId || w.companyId === form.assignedCompanyId,
                    )
                    .map((wh) => (
                      <div
                        key={wh.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <Checkbox
                          id={`wh-${wh.id}`}
                          checked={form.assignedWarehouseIds.includes(wh.id)}
                          onCheckedChange={() => toggleWarehouse(wh.id)}
                          data-ocid="users.checkbox"
                        />
                        <label
                          htmlFor={`wh-${wh.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {wh.name}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Shop Assignment */}
            {!form.isSuperUser && form.assignedCompanyId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned Shops</Label>
                <p className="text-xs text-gray-500">
                  Leave all unchecked for access to all warehouses&apos; shops
                </p>
                <div className="border rounded-lg divide-y max-h-36 overflow-y-auto">
                  {allShops
                    .filter((s) => {
                      const wh = warehouses.find((w) => w.id === s.warehouseId);
                      return (
                        !wh?.companyId ||
                        wh.companyId === form.assignedCompanyId
                      );
                    })
                    .map((shop) => (
                      <div
                        key={shop.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <Checkbox
                          id={`shop-${shop.id}`}
                          checked={form.assignedShopIds.includes(shop.id)}
                          onCheckedChange={() => toggleShop(shop.id)}
                          data-ocid="users.checkbox"
                        />
                        <label
                          htmlFor={`shop-${shop.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {shop.name}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Warehouse Assignment for Super Users */}
            {form.isSuperUser && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Warehouse Access</Label>
                <p className="text-xs text-gray-500">
                  Select warehouses this super user can access (none = all)
                </p>
                <div className="border rounded-lg divide-y max-h-36 overflow-y-auto">
                  {warehouses.map((wh) => (
                    <div
                      key={wh.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Checkbox
                        id={`wh-su-${wh.id}`}
                        checked={form.assignedWarehouseIds.includes(wh.id)}
                        onCheckedChange={() => toggleWarehouse(wh.id)}
                        data-ocid="users.checkbox"
                      />
                      <label
                        htmlFor={`wh-su-${wh.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {wh.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="users.cancel_button"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} data-ocid="users.save_button">
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="users.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteUser(deleteId!);
                setDeleteId(null);
                toast.success("User deleted");
              }}
              className="bg-red-600 hover:bg-red-700"
              data-ocid="users.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

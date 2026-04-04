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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lock, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: "Open" | "Closed";
  closedBy?: string;
  closedAt?: string;
}

const STORAGE_KEY = "bizpos_financial_years";
function load(): FinancialYear[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed: FinancialYear[] = [
        {
          id: "fy1",
          name: "FY 2025-26",
          startDate: "2025-04-01",
          endDate: "2026-03-31",
          isCurrent: true,
          status: "Open",
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
function save(data: FinancialYear[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function FinancialYearsPage() {
  const { currentUser } = useAuth();
  const [years, setYears] = useState<FinancialYear[]>(load);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);
  const [editingYear, setEditingYear] = useState<FinancialYear | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  const reload = () => setYears(load());

  const openAdd = () => {
    setEditingYear(null);
    setForm({ name: "", startDate: "", endDate: "" });
    setDialogOpen(true);
  };

  const openEdit = (y: FinancialYear) => {
    if (y.status === "Closed") {
      toast.error("Cannot edit a closed financial year");
      return;
    }
    setEditingYear(y);
    setForm({ name: y.name, startDate: y.startDate, endDate: y.endDate });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error("Fill all required fields");
      return;
    }
    if (form.startDate >= form.endDate) {
      toast.error("End date must be after start date");
      return;
    }
    const all = load();
    const now = new Date().toISOString();
    if (editingYear) {
      const updated = all.map((y) =>
        y.id === editingYear.id ? { ...y, ...form } : y,
      );
      save(updated);
      toast.success("Financial year updated");
    } else {
      const newYear: FinancialYear = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        ...form,
        isCurrent: false,
        status: "Open",
      };
      void now;
      save([...all, newYear]);
      toast.success("Financial year created");
    }
    reload();
    setDialogOpen(false);
  };

  const handleSetCurrent = (id: string) => {
    const all = load();
    const updated = all.map((y) => ({ ...y, isCurrent: y.id === id }));
    save(updated);
    reload();
    toast.success("Set as current financial year");
  };

  const handleClose = (id: string) => {
    const all = load();
    const updated = all.map((y) =>
      y.id === id
        ? {
            ...y,
            status: "Closed" as const,
            closedBy: currentUser?.name ?? "System",
            closedAt: new Date().toISOString(),
          }
        : y,
    );
    save(updated);
    reload();
    setCloseConfirmId(null);
    toast.success("Financial year closed — transactions locked");
  };

  const handleDelete = (id: string) => {
    const year = years.find((y) => y.id === id);
    if (year?.status === "Closed") {
      toast.error("Cannot delete a closed financial year");
      return;
    }
    save(load().filter((y) => y.id !== id));
    reload();
    setDeleteId(null);
    toast.success("Deleted");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Years</h1>
          <p className="text-gray-600 mt-1">
            Manage financial periods and close year-end accounts
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="financial_years.primary_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Financial Year
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Closed By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="financial_years.empty_state"
                  >
                    No financial years
                  </TableCell>
                </TableRow>
              ) : (
                years.map((y, i) => (
                  <TableRow
                    key={y.id}
                    data-ocid={`financial_years.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{y.name}</TableCell>
                    <TableCell>{y.startDate}</TableCell>
                    <TableCell>{y.endDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={y.status === "Open" ? "default" : "secondary"}
                      >
                        {y.status === "Closed" ? (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Closed
                          </>
                        ) : (
                          "Open"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {y.isCurrent ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Current
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={y.status === "Closed"}
                          onClick={() => handleSetCurrent(y.id)}
                          data-ocid={`financial_years.toggle.${i + 1}`}
                        >
                          Set Current
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {y.closedBy ? `${y.closedBy}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {y.status === "Open" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(y)}
                              data-ocid={`financial_years.edit_button.${i + 1}`}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setCloseConfirmId(y.id)}
                              data-ocid={`financial_years.delete_button.${i + 1}`}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Close Year
                            </Button>
                          </>
                        )}
                        {y.status === "Open" && !y.isCurrent && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => setDeleteId(y.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
        <DialogContent data-ocid="financial_years.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingYear ? "Edit Financial Year" : "New Financial Year"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Year Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. FY 2026-27"
                data-ocid="financial_years.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  data-ocid="financial_years.input"
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  data-ocid="financial_years.input"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="financial_years.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                data-ocid="financial_years.submit_button"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!closeConfirmId}
        onOpenChange={() => setCloseConfirmId(null)}
      >
        <AlertDialogContent data-ocid="financial_years.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Close Financial Year?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock all transactions in this period. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="financial_years.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => closeConfirmId && handleClose(closeConfirmId)}
              data-ocid="financial_years.confirm_button"
            >
              Close Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="financial_years.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Financial Year?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="financial_years.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="financial_years.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

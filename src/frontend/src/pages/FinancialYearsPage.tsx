import PageHelp from "@/components/PageHelp";
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
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Minus,
  Plus,
  Star,
  Trash2,
  Unlock,
} from "lucide-react";
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
  months?: MonthRecord[];
}

export interface MonthRecord {
  monthIndex: number; // 0 = Jan, 11 = Dec
  year: number;
  label: string; // e.g. "Apr 2025"
  status: "Open" | "Closed";
  closedBy?: string;
  closedAt?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STORAGE_KEY = "bizpos_financial_years";

function generateMonths(startDate: string, endDate: string): MonthRecord[] {
  const months: MonthRecord[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    months.push({
      monthIndex: cur.getMonth(),
      year: cur.getFullYear(),
      label: `${MONTH_NAMES[cur.getMonth()].slice(0, 3)} ${cur.getFullYear()}`,
      status: "Open",
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

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
          months: generateMonths("2025-04-01", "2026-03-31"),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    // Ensure existing records have months generated
    const parsed: FinancialYear[] = JSON.parse(raw);
    return parsed.map((fy) => ({
      ...fy,
      months:
        fy.months && fy.months.length > 0
          ? fy.months
          : generateMonths(fy.startDate, fy.endDate),
    }));
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
  const [closeMonthTarget, setCloseMonthTarget] = useState<{
    fyId: string;
    monthIndex: number;
    year: number;
  } | null>(null);
  const [editingYear, setEditingYear] = useState<FinancialYear | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  // Track which financial year rows are expanded to show months
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const reload = () => setYears(load());

  const toggleExpand = (id: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    if (editingYear) {
      const updated = all.map((y) =>
        y.id === editingYear.id
          ? {
              ...y,
              name: form.name,
              startDate: form.startDate,
              endDate: form.endDate,
              months: generateMonths(form.startDate, form.endDate),
            }
          : y,
      );
      save(updated);
      toast.success("Financial year updated");
    } else {
      const newYear: FinancialYear = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        ...form,
        isCurrent: false,
        status: "Open",
        months: generateMonths(form.startDate, form.endDate),
      };
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

  const handleCloseYear = (id: string) => {
    const all = load();
    const updated = all.map((y) =>
      y.id === id
        ? {
            ...y,
            status: "Closed" as const,
            closedBy: currentUser?.name ?? "System",
            closedAt: new Date().toISOString(),
            // Also close all months
            months: (y.months || []).map((m) => ({
              ...m,
              status: "Closed" as const,
              closedBy:
                m.status === "Open"
                  ? (currentUser?.name ?? "System")
                  : m.closedBy,
              closedAt:
                m.status === "Open" ? new Date().toISOString() : m.closedAt,
            })),
          }
        : y,
    );
    save(updated);
    reload();
    setCloseConfirmId(null);
    toast.success("Financial year closed — all periods locked");
  };

  const handleToggleMonth = (
    fyId: string,
    monthIndex: number,
    year: number,
  ) => {
    const all = load();
    const fy = all.find((y) => y.id === fyId);
    if (!fy) return;
    if (fy.status === "Closed") {
      toast.error("Cannot change month status in a closed financial year");
      return;
    }
    const month = (fy.months || []).find(
      (m) => m.monthIndex === monthIndex && m.year === year,
    );
    if (!month) return;

    if (month.status === "Open") {
      // Confirm close
      setCloseMonthTarget({ fyId, monthIndex, year });
    } else {
      // Reopen month
      const updated = all.map((y) =>
        y.id === fyId
          ? {
              ...y,
              months: (y.months || []).map((m) =>
                m.monthIndex === monthIndex && m.year === year
                  ? {
                      ...m,
                      status: "Open" as const,
                      closedBy: undefined,
                      closedAt: undefined,
                    }
                  : m,
              ),
            }
          : y,
      );
      save(updated);
      reload();
      toast.success(`${month.label} re-opened`);
    }
  };

  const confirmCloseMonth = () => {
    if (!closeMonthTarget) return;
    const { fyId, monthIndex, year } = closeMonthTarget;
    const all = load();
    const updated = all.map((fy) =>
      fy.id === fyId
        ? {
            ...fy,
            months: (fy.months || []).map((m) =>
              m.monthIndex === monthIndex && m.year === year
                ? {
                    ...m,
                    status: "Closed" as const,
                    closedBy: currentUser?.name ?? "System",
                    closedAt: new Date().toISOString(),
                  }
                : m,
            ),
          }
        : fy,
    );
    save(updated);
    reload();
    setCloseMonthTarget(null);
    toast.success("Month period closed");
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

  // Find the month label for the close confirmation dialog
  const closeMonthLabel = closeMonthTarget
    ? (years
        .find((y) => y.id === closeMonthTarget.fyId)
        ?.months?.find(
          (m) =>
            m.monthIndex === closeMonthTarget.monthIndex &&
            m.year === closeMonthTarget.year,
        )?.label ?? "month")
    : "month";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Years
            </h1>
            <PageHelp pageId="financial-years" />
          </div>
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
        <CardContent className="pt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Year Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Months</TableHead>
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
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="financial_years.empty_state"
                  >
                    No financial years
                  </TableCell>
                </TableRow>
              ) : (
                years.map((y, i) => {
                  const isExpanded = expandedYears.has(y.id);
                  const months = y.months || [];
                  const openMonths = months.filter(
                    (m) => m.status === "Open",
                  ).length;
                  const closedMonths = months.filter(
                    (m) => m.status === "Closed",
                  ).length;

                  return (
                    <>
                      {/* Financial Year Row */}
                      <TableRow
                        key={y.id}
                        className="cursor-pointer hover:bg-gray-50"
                        data-ocid={`financial_years.item.${i + 1}`}
                      >
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(y.id)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                            title={isExpanded ? "Hide months" : "Show months"}
                          >
                            {isExpanded ? (
                              <Minus className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Plus className="h-4 w-4 text-blue-600" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            {y.name}
                          </div>
                        </TableCell>
                        <TableCell>{y.startDate}</TableCell>
                        <TableCell>{y.endDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
                              {openMonths} Open
                            </span>
                            {closedMonths > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
                                {closedMonths} Closed
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              y.status === "Open" ? "default" : "secondary"
                            }
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
                          {y.closedBy ? y.closedBy : "—"}
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

                      {/* Month Rows (expanded) */}
                      {isExpanded &&
                        months.map((m) => (
                          <TableRow
                            key={`${y.id}-${m.year}-${m.monthIndex}`}
                            className="bg-blue-50/40 hover:bg-blue-50 border-l-2 border-l-blue-200"
                          >
                            <TableCell />
                            <TableCell className="pl-10">
                              <span className="text-sm font-medium text-gray-700">
                                {m.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-400">
                              —
                            </TableCell>
                            <TableCell className="text-xs text-gray-400">
                              —
                            </TableCell>
                            <TableCell />
                            <TableCell>
                              <Badge
                                variant={
                                  m.status === "Open" ? "outline" : "secondary"
                                }
                                className={
                                  m.status === "Open"
                                    ? "border-green-300 text-green-700 bg-green-50"
                                    : ""
                                }
                              >
                                {m.status === "Closed" ? (
                                  <>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Closed
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Open
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell />
                            <TableCell className="text-xs text-gray-500">
                              {m.closedBy ?? "—"}
                            </TableCell>
                            <TableCell>
                              {y.status === "Open" && (
                                <Button
                                  size="sm"
                                  variant={
                                    m.status === "Open" ? "outline" : "ghost"
                                  }
                                  className={
                                    m.status === "Open"
                                      ? "text-orange-600 border-orange-300 hover:bg-orange-50"
                                      : "text-green-600 hover:bg-green-50"
                                  }
                                  onClick={() =>
                                    handleToggleMonth(
                                      y.id,
                                      m.monthIndex,
                                      m.year,
                                    )
                                  }
                                >
                                  {m.status === "Open" ? (
                                    <>
                                      <Lock className="h-3 w-3 mr-1" />
                                      Close
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="h-3 w-3 mr-1" />
                                      Re-open
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
          data-ocid="financial_years.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingYear ? "Edit Financial Year" : "New Financial Year"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
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

      {/* Close Year Confirm */}
      <AlertDialog
        open={!!closeConfirmId}
        onOpenChange={() => setCloseConfirmId(null)}
      >
        <AlertDialogContent data-ocid="financial_years.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Close Financial Year?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock all transactions in this period and close all open
              months. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="financial_years.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => closeConfirmId && handleCloseYear(closeConfirmId)}
              data-ocid="financial_years.confirm_button"
            >
              Close Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Month Confirm */}
      <AlertDialog
        open={!!closeMonthTarget}
        onOpenChange={() => setCloseMonthTarget(null)}
      >
        <AlertDialogContent data-ocid="financial_years.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Close {closeMonthLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing this month will lock all transactions in this period. You
              can re-open it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseMonth}>
              Close Month
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
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

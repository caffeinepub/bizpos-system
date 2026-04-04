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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { EmployeeShiftAssignment, Shift } from "../store/useStore";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ShiftForm = Omit<Shift, "id">;
type AssignForm = Omit<EmployeeShiftAssignment, "id">;

const EMPTY_SHIFT: ShiftForm = {
  name: "",
  startTime: "08:00",
  endTime: "16:00",
  breakMinutes: 60,
  activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  status: "Active",
};

const EMPTY_ASSIGN: AssignForm = {
  employeeId: "",
  shiftId: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
  notes: "",
};

function computeDuration(start: string, end: string, breakMins: number) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  mins -= breakMins;
  if (mins < 0) mins = 0;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function ShiftsPage() {
  const {
    shifts,
    shiftAssignments,
    employees,
    addShift,
    updateShift,
    deleteShift,
    addShiftAssignment,
    updateShiftAssignment,
    deleteShiftAssignment,
  } = useStore();
  const { currentUser } = useAuth();
  const [shiftSheetOpen, setShiftSheetOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState<ShiftForm>(EMPTY_SHIFT);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [editingAssignId, setEditingAssignId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState<AssignForm>(EMPTY_ASSIGN);
  const [deleteAssignId, setDeleteAssignId] = useState<string | null>(null);

  const openAddShift = () => {
    setEditingShiftId(null);
    setShiftForm(EMPTY_SHIFT);
    setShiftSheetOpen(true);
  };
  const openEditShift = (s: Shift) => {
    setEditingShiftId(s.id);
    setShiftForm({
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes,
      activeDays: [...s.activeDays],
      status: s.status,
    });
    setShiftSheetOpen(true);
  };
  const handleSaveShift = () => {
    if (!shiftForm.name) {
      toast.error("Shift name is required");
      return;
    }
    if (editingShiftId) {
      updateShift(editingShiftId, shiftForm);
      toast.success("Shift updated");
    } else {
      addShift(shiftForm);
      toast.success("Shift added");
    }
    setShiftSheetOpen(false);
  };

  const toggleDay = (day: string) => {
    setShiftForm((p) => ({
      ...p,
      activeDays: p.activeDays.includes(day)
        ? p.activeDays.filter((d) => d !== day)
        : [...p.activeDays, day],
    }));
  };

  const openAddAssign = () => {
    setEditingAssignId(null);
    setAssignForm(EMPTY_ASSIGN);
    setAssignSheetOpen(true);
  };
  const openEditAssign = (a: EmployeeShiftAssignment) => {
    setEditingAssignId(a.id);
    setAssignForm({
      employeeId: a.employeeId,
      shiftId: a.shiftId,
      effectiveFrom: a.effectiveFrom,
      effectiveTo: a.effectiveTo,
      notes: a.notes,
    });
    setAssignSheetOpen(true);
  };
  const handleSaveAssign = () => {
    if (!assignForm.employeeId || !assignForm.shiftId) {
      toast.error("Employee and Shift are required");
      return;
    }
    if (editingAssignId) {
      updateShiftAssignment(editingAssignId, assignForm);
      toast.success("Assignment updated");
    } else {
      addShiftAssignment(assignForm);
      toast.success("Assignment added");
    }
    setAssignSheetOpen(false);
  };

  const getEmpName = (id: string) =>
    employees.find((e) => e.id === id)?.name ?? id;
  const getShiftName = (id: string) =>
    shifts.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Shift Management
            </h1>
            <PageHelp pageId="shifts" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage shifts and employee assignments
          </p>
        </div>
      </div>

      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts" data-ocid="shifts.tab">
            Shift Definitions
          </TabsTrigger>
          <TabsTrigger value="assignments" data-ocid="shifts.tab">
            Shift Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">{shifts.length} shifts defined</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportExcel(
                    "shifts.xlsx",
                    "Shifts",
                    [
                      "Name",
                      "Start",
                      "End",
                      "Break",
                      "Duration",
                      "Days",
                      "Status",
                    ],
                    shifts.map((s) => [
                      s.name,
                      s.startTime,
                      s.endTime,
                      s.breakMinutes,
                      computeDuration(s.startTime, s.endTime, s.breakMinutes),
                      s.activeDays.join(", "),
                      s.status,
                    ]),
                    {
                      companyName: "BizPOS System",
                      generatedBy: currentUser?.name,
                    },
                  )
                }
              >
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportPDF(
                    "Shifts",
                    ["Name", "Start", "End", "Duration", "Status"],
                    shifts.map((s) => [
                      s.name,
                      s.startTime,
                      s.endTime,
                      computeDuration(s.startTime, s.endTime, s.breakMinutes),
                      s.status,
                    ]),
                    "shifts.pdf",
                    {
                      companyName: "BizPOS System",
                      generatedBy: currentUser?.name,
                    },
                  )
                }
              >
                PDF
              </Button>
              <Button
                onClick={openAddShift}
                data-ocid="shifts.open_modal_button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Active Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                        data-ocid="shifts.empty_state"
                      >
                        No shifts defined
                      </TableCell>
                    </TableRow>
                  ) : (
                    shifts.map((s, idx) => (
                      <TableRow key={s.id} data-ocid={`shifts.item.${idx + 1}`}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {s.name}
                        </TableCell>
                        <TableCell>{s.startTime}</TableCell>
                        <TableCell>{s.endTime}</TableCell>
                        <TableCell>{s.breakMinutes} min</TableCell>
                        <TableCell>
                          {computeDuration(
                            s.startTime,
                            s.endTime,
                            s.breakMinutes,
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {s.activeDays.join(", ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              s.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }
                            onClick={() =>
                              updateShift(s.id, {
                                status:
                                  s.status === "Active" ? "Inactive" : "Active",
                              })
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditShift(s)}
                              data-ocid={`shifts.edit_button.${idx + 1}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => setDeleteShiftId(s.id)}
                              data-ocid={`shifts.delete_button.${idx + 1}`}
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
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {shiftAssignments.length} assignments
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportExcel(
                    "shift-assignments.xlsx",
                    "Shift Assignments",
                    ["Employee", "Shift", "From", "To", "Notes"],
                    shiftAssignments.map((a) => [
                      getEmpName(a.employeeId),
                      getShiftName(a.shiftId),
                      a.effectiveFrom,
                      a.effectiveTo,
                      a.notes,
                    ]),
                    {
                      companyName: "BizPOS System",
                      generatedBy: currentUser?.name,
                    },
                  )
                }
              >
                Excel
              </Button>
              <Button
                onClick={openAddAssign}
                data-ocid="shifts.open_modal_button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                        data-ocid="shifts.empty_state"
                      >
                        No assignments
                      </TableCell>
                    </TableRow>
                  ) : (
                    shiftAssignments.map((a, idx) => (
                      <TableRow key={a.id} data-ocid={`shifts.item.${idx + 1}`}>
                        <TableCell>{getEmpName(a.employeeId)}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700">
                            {getShiftName(a.shiftId)}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.effectiveFrom}</TableCell>
                        <TableCell>{a.effectiveTo || "—"}</TableCell>
                        <TableCell className="text-gray-500 max-w-xs truncate">
                          {a.notes}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditAssign(a)}
                              data-ocid={`shifts.edit_button.${idx + 1}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => setDeleteAssignId(a.id)}
                              data-ocid={`shifts.delete_button.${idx + 1}`}
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
        </TabsContent>
      </Tabs>

      {/* Shift Sheet */}
      <Sheet open={shiftSheetOpen} onOpenChange={setShiftSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingShiftId ? "Edit Shift" : "Add Shift"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Shift Name *</Label>
              <Input
                value={shiftForm.name}
                onChange={(e) =>
                  setShiftForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Morning Shift"
                data-ocid="shifts.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) =>
                    setShiftForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) =>
                    setShiftForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Break (minutes)</Label>
              <Input
                type="number"
                value={shiftForm.breakMinutes}
                onChange={(e) =>
                  setShiftForm((p) => ({
                    ...p,
                    breakMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label className="mb-2 block">Active Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-1">
                    <Checkbox
                      id={`day-${day}`}
                      checked={shiftForm.activeDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                      data-ocid="shifts.checkbox"
                    />
                    <Label htmlFor={`day-${day}`} className="text-sm">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={shiftForm.status}
                onValueChange={(v) =>
                  setShiftForm((p) => ({
                    ...p,
                    status: v as "Active" | "Inactive",
                  }))
                }
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
            {shiftForm.startTime && shiftForm.endTime && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Duration:{" "}
                  <strong>
                    {computeDuration(
                      shiftForm.startTime,
                      shiftForm.endTime,
                      shiftForm.breakMinutes,
                    )}
                  </strong>{" "}
                  (after {shiftForm.breakMinutes} min break)
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSaveShift}
                data-ocid="shifts.save_button"
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShiftSheetOpen(false)}
                data-ocid="shifts.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Assignment Sheet */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingAssignId ? "Edit Assignment" : "Add Assignment"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Employee *</Label>
              <Select
                value={assignForm.employeeId}
                onValueChange={(v) =>
                  setAssignForm((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger data-ocid="shifts.select">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === "Active")
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shift *</Label>
              <Select
                value={assignForm.shiftId}
                onValueChange={(v) =>
                  setAssignForm((p) => ({ ...p, shiftId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts
                    .filter((s) => s.status === "Active")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Effective From</Label>
                <Input
                  type="date"
                  value={assignForm.effectiveFrom}
                  onChange={(e) =>
                    setAssignForm((p) => ({
                      ...p,
                      effectiveFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={assignForm.effectiveTo}
                  onChange={(e) =>
                    setAssignForm((p) => ({
                      ...p,
                      effectiveTo: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSaveAssign}
                data-ocid="shifts.save_button"
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAssignSheetOpen(false)}
                data-ocid="shifts.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteShiftId}
        onOpenChange={(o) => !o && setDeleteShiftId(null)}
      >
        <AlertDialogContent data-ocid="shifts.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the shift definition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="shifts.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteShiftId && deleteShift(deleteShiftId);
                toast.success("Shift deleted");
                setDeleteShiftId(null);
              }}
              data-ocid="shifts.confirm_button"
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteAssignId}
        onOpenChange={(o) => !o && setDeleteAssignId(null)}
      >
        <AlertDialogContent data-ocid="shifts.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the shift assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="shifts.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAssignId && deleteShiftAssignment(deleteAssignId);
                toast.success("Assignment deleted");
                setDeleteAssignId(null);
              }}
              data-ocid="shifts.confirm_button"
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

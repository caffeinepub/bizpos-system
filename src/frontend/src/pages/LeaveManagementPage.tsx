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
import {
  CalendarDays,
  Check,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AttachmentManager from "../components/AttachmentManager";
import type { LeaveRequest, LeaveType } from "../store/useStore";
import { useStore } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

const STATUS_COLORS: Record<LeaveRequest["status"], string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function dateDiff(from: string, to: string): number {
  const d1 = new Date(from);
  const d2 = new Date(to);
  const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export default function LeaveManagementPage() {
  const {
    employees,
    leaveTypes,
    leaveRequests,
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
  } = useStore();

  // ---- Leave Requests state ----
  const [reqSheetOpen, setReqSheetOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<LeaveRequest | null>(null);
  const [deleteReqId, setDeleteReqId] = useState<string | null>(null);
  const [approveDialog, setApproveDialog] = useState<{
    id: string;
    action: "Approved" | "Rejected";
  } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [searchReq, setSearchReq] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLeaveType, setFilterLeaveType] = useState("all");

  const [reqForm, setReqForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  // ---- Leave Types state ----
  const [ltSheetOpen, setLtSheetOpen] = useState(false);
  const [editingLt, setEditingLt] = useState<LeaveType | null>(null);
  const [deleteLtId, setDeleteLtId] = useState<string | null>(null);
  const [ltForm, setLtForm] = useState({
    name: "",
    daysAllowedPerYear: 0,
    description: "",
    isActive: true,
  });

  // ---- Computed ----
  const filteredRequests = leaveRequests.filter((r) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(searchReq.toLowerCase()) ||
      r.leaveTypeName.toLowerCase().includes(searchReq.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchType =
      filterLeaveType === "all" || r.leaveTypeId === filterLeaveType;
    return matchSearch && matchStatus && matchType;
  });

  const summaryCards = [
    {
      label: "Total Requests",
      value: leaveRequests.length,
      color: "text-blue-600",
    },
    {
      label: "Pending",
      value: leaveRequests.filter((r) => r.status === "Pending").length,
      color: "text-yellow-600",
    },
    {
      label: "Approved",
      value: leaveRequests.filter((r) => r.status === "Approved").length,
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: leaveRequests.filter((r) => r.status === "Rejected").length,
      color: "text-red-600",
    },
  ];

  // ---- Leave Balances ----
  const balanceData = employees.flatMap((emp) =>
    leaveTypes
      .filter((lt) => lt.isActive)
      .map((lt) => {
        const used = leaveRequests
          .filter(
            (r) =>
              r.employeeId === emp.id &&
              r.leaveTypeId === lt.id &&
              r.status === "Approved",
          )
          .reduce((s, r) => s + r.days, 0);
        const remaining =
          lt.daysAllowedPerYear === 0
            ? "N/A"
            : String(Math.max(0, lt.daysAllowedPerYear - used));
        return {
          emp: emp.name,
          empId: emp.employeeId,
          lt: lt.name,
          allowed: lt.daysAllowedPerYear,
          used,
          remaining,
        };
      })
      .filter((b) => b.used > 0 || b.allowed > 0),
  );

  // ---- Handlers: Leave Requests ----
  const openAddReq = () => {
    setEditingReq(null);
    setReqForm({
      employeeId: "",
      leaveTypeId: "",
      fromDate: "",
      toDate: "",
      reason: "",
    });
    setReqSheetOpen(true);
  };

  const openEditReq = (req: LeaveRequest) => {
    setEditingReq(req);
    setReqForm({
      employeeId: req.employeeId,
      leaveTypeId: req.leaveTypeId,
      fromDate: req.fromDate,
      toDate: req.toDate,
      reason: req.reason,
    });
    setReqSheetOpen(true);
  };

  const handleSaveReq = () => {
    if (
      !reqForm.employeeId ||
      !reqForm.leaveTypeId ||
      !reqForm.fromDate ||
      !reqForm.toDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    const emp = employees.find((e) => e.id === reqForm.employeeId);
    const lt = leaveTypes.find((l) => l.id === reqForm.leaveTypeId);
    const days = dateDiff(reqForm.fromDate, reqForm.toDate);
    if (editingReq) {
      updateLeaveRequest(editingReq.id, {
        ...reqForm,
        employeeName: emp?.name ?? "",
        leaveTypeName: lt?.name ?? "",
        days,
      });
      toast.success("Leave request updated");
    } else {
      addLeaveRequest({
        ...reqForm,
        employeeName: emp?.name ?? "",
        leaveTypeName: lt?.name ?? "",
        days,
        status: "Pending",
        remarks: "",
      });
      toast.success("Leave request submitted");
    }
    setReqSheetOpen(false);
  };

  const handleApproveReject = () => {
    if (!approveDialog) return;
    updateLeaveRequest(approveDialog.id, {
      status: approveDialog.action,
      remarks,
    });
    toast.success(`Leave request ${approveDialog.action.toLowerCase()}`);
    setApproveDialog(null);
    setRemarks("");
  };

  // ---- Handlers: Leave Types ----
  const openAddLt = () => {
    setEditingLt(null);
    setLtForm({
      name: "",
      daysAllowedPerYear: 0,
      description: "",
      isActive: true,
    });
    setLtSheetOpen(true);
  };

  const openEditLt = (lt: LeaveType) => {
    setEditingLt(lt);
    setLtForm({
      name: lt.name,
      daysAllowedPerYear: lt.daysAllowedPerYear,
      description: lt.description,
      isActive: lt.isActive,
    });
    setLtSheetOpen(true);
  };

  const handleSaveLt = () => {
    if (!ltForm.name) {
      toast.error("Name is required");
      return;
    }
    if (editingLt) {
      updateLeaveType(editingLt.id, ltForm);
      toast.success("Leave type updated");
    } else {
      addLeaveType(ltForm);
      toast.success("Leave type added");
    }
    setLtSheetOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Leave Management
            </h1>
            <PageHelp pageId="leave-management" />
          </div>
          <p className="text-gray-600 mt-1">
            Manage employee leave requests and balances
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList data-ocid="leave.tab">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>

        {/* ---- Tab 1: Requests ---- */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Leave Requests
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employee..."
                      value={searchReq}
                      onChange={(e) => setSearchReq(e.target.value)}
                      className="pl-8 w-44"
                      data-ocid="leave.search_input"
                    />
                  </div>
                  <Select
                    value={filterLeaveType}
                    onValueChange={setFilterLeaveType}
                  >
                    <SelectTrigger className="w-40" data-ocid="leave.select">
                      <SelectValue placeholder="Leave Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={openAddReq}
                    data-ocid="leave.open_modal_button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Request
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table data-ocid="leave.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 && (
                    <TableRow data-ocid="leave.empty_state">
                      <TableCell
                        colSpan={8}
                        className="text-center text-gray-400 py-8"
                      >
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredRequests.map((req, idx) => (
                    <TableRow key={req.id} data-ocid={`leave.item.${idx + 1}`}>
                      <TableCell className="font-medium">
                        {req.employeeName}
                      </TableCell>
                      <TableCell>{req.leaveTypeName}</TableCell>
                      <TableCell>{req.fromDate}</TableCell>
                      <TableCell>{req.toDate}</TableCell>
                      <TableCell className="font-mono">{req.days}</TableCell>
                      <TableCell className="text-gray-600 max-w-[150px] truncate">
                        {req.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[req.status]}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {req.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => {
                                  setApproveDialog({
                                    id: req.id,
                                    action: "Approved",
                                  });
                                  setRemarks("");
                                }}
                                data-ocid={`leave.confirm_button.${idx + 1}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => {
                                  setApproveDialog({
                                    id: req.id,
                                    action: "Rejected",
                                  });
                                  setRemarks("");
                                }}
                                data-ocid={`leave.cancel_button.${idx + 1}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditReq(req)}
                                data-ocid={`leave.edit_button.${idx + 1}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setDeleteReqId(req.id)}
                            data-ocid={`leave.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab 2: Balances ---- */}
        <TabsContent value="balances" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Allowed / Year</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-400 py-8"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                  {balanceData.map((b, idx) => (
                    <TableRow
                      key={`${b.empId}-${b.lt}`}
                      data-ocid={`leave.balance.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-sm">
                        {b.empId}
                      </TableCell>
                      <TableCell className="font-medium">{b.emp}</TableCell>
                      <TableCell>{b.lt}</TableCell>
                      <TableCell>
                        {b.allowed === 0 ? "Unlimited" : b.allowed}
                      </TableCell>
                      <TableCell className="font-mono text-orange-600">
                        {b.used}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            b.remaining === "N/A"
                              ? "text-gray-400"
                              : "font-mono text-green-600 font-medium"
                          }
                        >
                          {b.remaining}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab 3: Leave Types ---- */}
        <TabsContent value="types" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Leave Types</CardTitle>
                <Button
                  onClick={openAddLt}
                  data-ocid="leave.types.open_modal_button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Days / Year</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((lt, idx) => (
                    <TableRow
                      key={lt.id}
                      data-ocid={`leave.type.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>
                        {lt.daysAllowedPerYear === 0
                          ? "Unlimited"
                          : lt.daysAllowedPerYear}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {lt.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            lt.isActive
                              ? "bg-green-100 text-green-700 cursor-pointer"
                              : "bg-gray-100 text-gray-600 cursor-pointer"
                          }
                          onClick={() =>
                            updateLeaveType(lt.id, { isActive: !lt.isActive })
                          }
                        >
                          {lt.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditLt(lt)}
                            data-ocid={`leave.type.edit_button.${idx + 1}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setDeleteLtId(lt.id)}
                            data-ocid={`leave.type.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Add/Edit Request Sheet ---- */}
      <Sheet open={reqSheetOpen} onOpenChange={setReqSheetOpen}>
        <SheetContent
          className="w-full sm:max-w-md overflow-y-auto"
          data-ocid="leave.sheet"
        >
          <SheetHeader>
            <SheetTitle>
              {editingReq ? "Edit Leave Request" : "New Leave Request"}
            </SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {editingReq && (
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="details">
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Employee *</Label>
                  <Select
                    value={reqForm.employeeId}
                    onValueChange={(v) =>
                      setReqForm({ ...reqForm, employeeId: v })
                    }
                  >
                    <SelectTrigger data-ocid="leave.select">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.status === "Active")
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.employeeId} — {e.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Leave Type *</Label>
                  <Select
                    value={reqForm.leaveTypeId}
                    onValueChange={(v) =>
                      setReqForm({ ...reqForm, leaveTypeId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes
                        .filter((l) => l.isActive)
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>From Date *</Label>
                    <Input
                      type="date"
                      value={reqForm.fromDate}
                      onChange={(e) =>
                        setReqForm({ ...reqForm, fromDate: e.target.value })
                      }
                      data-ocid="leave.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>To Date *</Label>
                    <Input
                      type="date"
                      value={reqForm.toDate}
                      onChange={(e) =>
                        setReqForm({ ...reqForm, toDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                {reqForm.fromDate && reqForm.toDate && (
                  <p className="text-sm text-blue-600 font-medium">
                    Duration: {dateDiff(reqForm.fromDate, reqForm.toDate)}{" "}
                    day(s)
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label>Reason</Label>
                  <Textarea
                    value={reqForm.reason}
                    onChange={(e) =>
                      setReqForm({ ...reqForm, reason: e.target.value })
                    }
                    rows={3}
                    data-ocid="leave.textarea"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveReq}
                    className="flex-1"
                    data-ocid="leave.submit_button"
                  >
                    {editingReq ? "Update" : "Submit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReqSheetOpen(false)}
                    data-ocid="leave.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </TabsContent>
            {editingReq && (
              <TabsContent value="attachments">
                <AttachmentManager moduleKey="leave" recordId={editingReq.id} />
              </TabsContent>
            )}
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* ---- Add/Edit Leave Type Sheet ---- */}
      <Sheet open={ltSheetOpen} onOpenChange={setLtSheetOpen}>
        <SheetContent
          className="w-full sm:max-w-md"
          data-ocid="leave.type.sheet"
        >
          <SheetHeader>
            <SheetTitle>
              {editingLt ? "Edit Leave Type" : "Add Leave Type"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={ltForm.name}
                onChange={(e) => setLtForm({ ...ltForm, name: e.target.value })}
                data-ocid="leave.type.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Days Allowed Per Year (0 = Unlimited / Unpaid)</Label>
              <Input
                type="number"
                value={ltForm.daysAllowedPerYear}
                onChange={(e) =>
                  setLtForm({
                    ...ltForm,
                    daysAllowedPerYear: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={ltForm.description}
                onChange={(e) =>
                  setLtForm({ ...ltForm, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveLt}
                className="flex-1"
                data-ocid="leave.type.submit_button"
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setLtSheetOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Approve/Reject Dialog */}
      <AlertDialog
        open={!!approveDialog}
        onOpenChange={() => setApproveDialog(null)}
      >
        <AlertDialogContent data-ocid="leave.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approveDialog?.action === "Approved" ? "Approve" : "Reject"}{" "}
              Leave Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Add remarks (optional) before{" "}
              {approveDialog?.action === "Approved" ? "approving" : "rejecting"}{" "}
              this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="leave.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveReject}
              className={
                approveDialog?.action === "Approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              data-ocid="leave.confirm_button"
            >
              {approveDialog?.action === "Approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Request Dialog */}
      <AlertDialog
        open={!!deleteReqId}
        onOpenChange={() => setDeleteReqId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteReqId) {
                  deleteLeaveRequest(deleteReqId);
                  toast.success("Deleted");
                  setDeleteReqId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Leave Type Dialog */}
      <AlertDialog open={!!deleteLtId} onOpenChange={() => setDeleteLtId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteLtId) {
                  deleteLeaveType(deleteLtId);
                  toast.success("Deleted");
                  setDeleteLtId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

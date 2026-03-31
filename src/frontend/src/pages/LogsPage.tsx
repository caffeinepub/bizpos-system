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
import { Activity, Download, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Log } from "../store/useStore";
import { useStore } from "../store/useStore";

const ACTION_COLORS: Record<Log["action"], string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-purple-100 text-purple-700",
  logout: "bg-gray-100 text-gray-600",
  view: "bg-yellow-100 text-yellow-700",
};

const MODULES = [
  "Auth",
  "Sales",
  "Purchases",
  "Inventory",
  "Employees",
  "Payroll",
  "Leave",
  "Payments",
  "Expenses",
  "Accounts",
  "COA",
  "Warehouses",
  "Shops",
  "Roles",
  "Users",
  "Reports",
  "POS",
  "Suppliers",
];

export default function LogsPage() {
  const { logs, clearLogs } = useStore();
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Suppress unused tick warning - used for re-render trigger
  void tick;

  const today = new Date().toISOString().slice(0, 10);

  const filtered = logs
    .slice()
    .reverse()
    .filter((log) => {
      const matchSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase());
      const matchModule = filterModule === "all" || log.module === filterModule;
      const matchAction = filterAction === "all" || log.action === filterAction;
      const logDate = log.timestamp.slice(0, 10);
      const matchFrom = !fromDate || logDate >= fromDate;
      const matchTo = !toDate || logDate <= toDate;
      return matchSearch && matchModule && matchAction && matchFrom && matchTo;
    });

  const todayCount = logs.filter((l) => l.timestamp.startsWith(today)).length;
  const loginCount = logs.filter((l) => l.action === "login").length;

  const summaryCards = [
    { label: "Total Logs", value: logs.length, color: "text-blue-600" },
    { label: "Today's Activity", value: todayCount, color: "text-green-600" },
    { label: "Total Logins", value: loginCount, color: "text-purple-600" },
    {
      label: "Filtered Results",
      value: filtered.length,
      color: "text-orange-600",
    },
  ];

  const handleExportCSV = () => {
    const headers = ["Timestamp", "User", "Module", "Action", "Details"];
    const rows = filtered.map((l) => [
      l.timestamp,
      l.user,
      l.module,
      l.action,
      `"${l.details.replace(/"/g, "'")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_logs_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exported");
  };

  const handleClearLogs = () => {
    clearLogs();
    toast.success("All logs cleared");
    setClearDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">
            Audit trail of all system activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            data-ocid="logs.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setClearDialogOpen(true)}
            data-ocid="logs.delete_button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-44"
                  data-ocid="logs.search_input"
                />
              </div>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="w-36" data-ocid="logs.select">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {MODULES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-36"
                placeholder="From"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-36"
                placeholder="To"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-ocid="logs.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow data-ocid="logs.empty_state">
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-400 py-8"
                    >
                      No log entries found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((log, idx) => (
                  <TableRow key={log.id} data-ocid={`logs.item.${idx + 1}`}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.user}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {log.module}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action]}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Clear Logs Confirmation */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent data-ocid="logs.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {logs.length} log entries. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="logs.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleClearLogs}
              data-ocid="logs.confirm_button"
            >
              Clear All Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

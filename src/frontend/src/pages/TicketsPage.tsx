import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Download,
  FileSpreadsheet,
  MessageSquare,
  Plus,
  Search,
  Send,
  Ticket,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AttachmentManager from "../components/AttachmentManager";
import { useAuth } from "../context/AuthContext";
import { exportExcel, exportPDF } from "../utils/exportUtils";

type TicketType = "IT Helpdesk" | "Customer Support";
type TicketPriority = "Low" | "Medium" | "High" | "Critical";
type TicketStatus = "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed";

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface TicketRecord {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string;
  reporter: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  Open: "bg-blue-100 text-blue-800",
  Assigned: "bg-purple-100 text-purple-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-600",
};

const STATUS_FLOW: TicketStatus[] = [
  "Open",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

const SEED_TICKETS: TicketRecord[] = [
  {
    id: "TKT-001",
    type: "IT Helpdesk",
    title: "Cannot access email",
    description: "User is unable to login to email since morning.",
    priority: "High",
    status: "Open",
    assignee: "Ahmad Ali",
    reporter: "Sara Khan",
    createdAt: "2026-03-25T08:00:00Z",
    updatedAt: "2026-03-25T08:00:00Z",
    comments: [],
  },
  {
    id: "TKT-002",
    type: "Customer Support",
    title: "Invoice discrepancy",
    description: "Customer reports wrong amount on invoice #INV-2023.",
    priority: "Medium",
    status: "Assigned",
    assignee: "Bilal Ahmed",
    reporter: "Support Team",
    createdAt: "2026-03-24T09:30:00Z",
    updatedAt: "2026-03-25T10:00:00Z",
    comments: [
      {
        id: "c1",
        author: "Bilal Ahmed",
        text: "Reviewing the invoice now.",
        createdAt: "2026-03-25T10:00:00Z",
      },
    ],
  },
  {
    id: "TKT-003",
    type: "IT Helpdesk",
    title: "Printer not working",
    description: "Office printer on floor 2 is offline.",
    priority: "Low",
    status: "In Progress",
    assignee: "Usman Tariq",
    reporter: "Fatima Malik",
    createdAt: "2026-03-23T11:00:00Z",
    updatedAt: "2026-03-24T09:00:00Z",
    comments: [],
  },
  {
    id: "TKT-004",
    type: "Customer Support",
    title: "Refund request",
    description: "Customer requesting refund for order #ORD-4521.",
    priority: "High",
    status: "Resolved",
    assignee: "Nadia Qureshi",
    reporter: "Customer Portal",
    createdAt: "2026-03-20T14:00:00Z",
    updatedAt: "2026-03-26T08:00:00Z",
    comments: [
      {
        id: "c2",
        author: "Nadia Qureshi",
        text: "Refund processed and sent.",
        createdAt: "2026-03-26T08:00:00Z",
      },
    ],
  },
  {
    id: "TKT-005",
    type: "IT Helpdesk",
    title: "VPN connection issue",
    description: "Remote employee cannot connect to VPN.",
    priority: "Critical",
    status: "Open",
    assignee: "",
    reporter: "Kamran Hussain",
    createdAt: "2026-03-27T07:30:00Z",
    updatedAt: "2026-03-27T07:30:00Z",
    comments: [],
  },
  {
    id: "TKT-006",
    type: "Customer Support",
    title: "Wrong item delivered",
    description: "Customer received wrong product in their order.",
    priority: "High",
    status: "In Progress",
    assignee: "Sara Khan",
    reporter: "Support Team",
    createdAt: "2026-03-22T10:00:00Z",
    updatedAt: "2026-03-25T14:00:00Z",
    comments: [],
  },
  {
    id: "TKT-007",
    type: "IT Helpdesk",
    title: "Software license expiring",
    description: "Adobe license expires next week.",
    priority: "Medium",
    status: "Assigned",
    assignee: "Ahmad Ali",
    reporter: "IT Manager",
    createdAt: "2026-03-18T09:00:00Z",
    updatedAt: "2026-03-20T11:00:00Z",
    comments: [],
  },
  {
    id: "TKT-008",
    type: "Customer Support",
    title: "Delivery delay complaint",
    description: "Order #ORD-5102 is 5 days overdue.",
    priority: "Medium",
    status: "Closed",
    assignee: "Bilal Ahmed",
    reporter: "Customer Portal",
    createdAt: "2026-03-10T08:00:00Z",
    updatedAt: "2026-03-18T16:00:00Z",
    comments: [
      {
        id: "c3",
        author: "Bilal Ahmed",
        text: "Resolved and customer informed.",
        createdAt: "2026-03-18T16:00:00Z",
      },
    ],
  },
  {
    id: "TKT-009",
    type: "IT Helpdesk",
    title: "Server performance slow",
    description: "ERP system is very slow since the update.",
    priority: "Critical",
    status: "In Progress",
    assignee: "Usman Tariq",
    reporter: "Operations Manager",
    createdAt: "2026-03-26T13:00:00Z",
    updatedAt: "2026-03-27T09:00:00Z",
    comments: [],
  },
  {
    id: "TKT-010",
    type: "Customer Support",
    title: "Payment not reflected",
    description: "Customer payment made 2 days ago not showing in system.",
    priority: "High",
    status: "Assigned",
    assignee: "Nadia Qureshi",
    reporter: "Accounts Team",
    createdAt: "2026-03-25T15:00:00Z",
    updatedAt: "2026-03-26T10:00:00Z",
    comments: [],
  },
];

function getTickets(): TicketRecord[] {
  try {
    const data = JSON.parse(localStorage.getItem("bizpos_tickets") ?? "null");
    if (!data) {
      localStorage.setItem("bizpos_tickets", JSON.stringify(SEED_TICKETS));
      return SEED_TICKETS;
    }
    return data;
  } catch {
    return SEED_TICKETS;
  }
}

export default function TicketsPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<TicketRecord[]>(getTickets);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(
    null,
  );
  const [commentText, setCommentText] = useState("");
  const [form, setForm] = useState({
    type: "IT Helpdesk" as TicketType,
    title: "",
    description: "",
    priority: "Medium" as TicketPriority,
    assignee: "",
  });

  const save = (list: TicketRecord[]) => {
    localStorage.setItem("bizpos_tickets", JSON.stringify(list));
    setTickets(list);
  };

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        const matchSearch =
          t.id.toLowerCase().includes(search.toLowerCase()) ||
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.reporter.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === "all" || t.type === filterType;
        const matchStatus = filterStatus === "all" || t.status === filterStatus;
        const matchPriority =
          filterPriority === "all" || t.priority === filterPriority;
        return matchSearch && matchType && matchStatus && matchPriority;
      }),
    [tickets, search, filterType, filterStatus, filterPriority],
  );

  const createTicket = () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    const next = `TKT-${String(tickets.length + 1).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const newTicket: TicketRecord = {
      id: next,
      type: form.type,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: "Open",
      assignee: form.assignee,
      reporter: currentUser?.name ?? "Unknown",
      createdAt: now,
      updatedAt: now,
      comments: [],
    };
    save([newTicket, ...tickets]);
    setDialogOpen(false);
    toast.success("Ticket created");
  };

  const updateStatus = (id: string, status: TicketStatus) => {
    const updated = tickets.map((t) =>
      t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
    );
    save(updated);
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
    }
    toast.success(`Status updated to ${status}`);
  };

  const addComment = () => {
    if (!commentText.trim() || !selectedTicket) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: currentUser?.name ?? "Unknown",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            comments: [...t.comments, comment],
            updatedAt: new Date().toISOString(),
          }
        : t,
    );
    save(updated);
    setSelectedTicket((prev) =>
      prev ? { ...prev, comments: [...prev.comments, comment] } : null,
    );
    setCommentText("");
  };

  const handleExportPDF = () => {
    exportPDF(
      "Tickets",
      [
        "ID",
        "Type",
        "Title",
        "Priority",
        "Status",
        "Assignee",
        "Reporter",
        "Date",
      ],
      filtered.map((t) => [
        t.id,
        t.type,
        t.title,
        t.priority,
        t.status,
        t.assignee,
        t.reporter,
        t.createdAt.slice(0, 10),
      ]),
      "tickets.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "System",
        filters: [],
      },
    );
  };

  const handleExportExcel = () => {
    exportExcel(
      "tickets.xlsx",
      "Tickets",
      [
        "ID",
        "Type",
        "Title",
        "Priority",
        "Status",
        "Assignee",
        "Reporter",
        "Date",
      ],
      filtered.map((t) => [
        t.id,
        t.type,
        t.title,
        t.priority,
        t.status,
        t.assignee,
        t.reporter,
        t.createdAt.slice(0, 10),
      ]),
      {
        companyName: "BizPOS System",
        reportTitle: "Ticket List",
        generatedBy: currentUser?.name ?? "System",
        filters: [],
      },
    );
  };

  const counts = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "Open").length,
      inProgress: tickets.filter((t) => t.status === "In Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      critical: tickets.filter(
        (t) => t.priority === "Critical" && t.status !== "Closed",
      ).length,
    }),
    [tickets],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">
            IT Helpdesk & Customer Support tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            data-ocid="tickets.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            data-ocid="tickets.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={() => {
              setForm({
                type: "IT Helpdesk",
                title: "",
                description: "",
                priority: "Medium",
                assignee: "",
              });
              setDialogOpen(true);
            }}
            data-ocid="tickets.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Open</p>
          <p className="text-3xl font-bold text-blue-800">{counts.open}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">In Progress</p>
          <p className="text-3xl font-bold text-yellow-800">
            {counts.inProgress}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Resolved</p>
          <p className="text-3xl font-bold text-green-800">{counts.resolved}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Critical (Active)</p>
          <p className="text-3xl font-bold text-red-800">{counts.critical}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="pl-9"
            data-ocid="tickets.search_input"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44" data-ocid="tickets.select">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IT Helpdesk">IT Helpdesk</SelectItem>
            <SelectItem value="Customer Support">Customer Support</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-ocid="tickets.select">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_FLOW.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32" data-ocid="tickets.select">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="tickets.empty_state"
                  >
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t, i) => (
                  <TableRow
                    key={t.id}
                    data-ocid={`tickets.item.${i + 1}`}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <TableCell className="font-mono font-medium">
                      {t.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <p className="truncate font-medium">{t.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[t.priority]}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[t.status]}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.assignee || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{t.reporter}</TableCell>
                    <TableCell>{t.createdAt.slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-xl"
          data-ocid="tickets.dialog"
        >
          <DialogHeader>
            <DialogTitle>New Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as TicketType })
                  }
                >
                  <SelectTrigger data-ocid="tickets.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Helpdesk">IT Helpdesk</SelectItem>
                    <SelectItem value="Customer Support">
                      Customer Support
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as TicketPriority })
                  }
                >
                  <SelectTrigger data-ocid="tickets.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-ocid="tickets.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                data-ocid="tickets.textarea"
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                placeholder="Assign to..."
                data-ocid="tickets.input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="tickets.cancel_button"
              >
                Cancel
              </Button>
              <Button onClick={createTicket} data-ocid="tickets.submit_button">
                Create Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Sheet */}
      <Sheet
        open={!!selectedTicket}
        onOpenChange={(o) => !o && setSelectedTicket(null)}
      >
        <SheetContent
          className="w-full sm:max-w-xl overflow-y-auto"
          data-ocid="tickets.sheet"
        >
          {selectedTicket && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  {selectedTicket.id}
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details" data-ocid="tickets.tab">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="comments" data-ocid="tickets.tab">
                    Comments ({selectedTicket.comments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedTicket.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {selectedTicket.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <Badge variant="outline">{selectedTicket.type}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Priority</p>
                      <Badge
                        className={PRIORITY_COLORS[selectedTicket.priority]}
                      >
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reporter</p>
                      <p className="font-medium">{selectedTicket.reporter}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assignee</p>
                      <p className="font-medium">
                        {selectedTicket.assignee || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {selectedTicket.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-medium">
                        {selectedTicket.updatedAt.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Update Status</Label>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) =>
                        updateStatus(selectedTicket.id, v as TicketStatus)
                      }
                    >
                      <SelectTrigger data-ocid="tickets.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.map((s) => (
                          <SelectItem key={s} value={s}>
                            <Badge className={STATUS_COLORS[s]}>{s}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Status Workflow */}
                  <div className="flex items-center gap-1 mt-2">
                    {STATUS_FLOW.map((s, i) => (
                      <>
                        <div
                          key={s}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            s === selectedTicket.status
                              ? STATUS_COLORS[s]
                              : STATUS_FLOW.indexOf(selectedTicket.status) > i
                                ? "bg-gray-200 text-gray-700"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {s}
                        </div>
                        {i < STATUS_FLOW.length - 1 && (
                          <div className="h-px w-3 bg-gray-300" />
                        )}
                      </>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="space-y-4">
                  <div className="space-y-3">
                    {selectedTicket.comments.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-sm">
                        No comments yet
                      </p>
                    ) : (
                      selectedTicket.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{c.author}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.createdAt.slice(0, 10)}
                            </p>
                          </div>
                          <p className="text-sm">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="flex-1"
                      data-ocid="tickets.textarea"
                    />
                    <Button
                      size="icon"
                      onClick={addComment}
                      disabled={!commentText.trim()}
                      data-ocid="tickets.submit_button"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="attachments">
                  <AttachmentManager
                    moduleKey="tickets"
                    recordId={selectedTicket.id}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

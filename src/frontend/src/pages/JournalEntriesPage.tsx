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
import { Download, Eye, FileSpreadsheet, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { JournalEntry, JournalLine } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

interface FormLine {
  _id: string;
  accountId: string;
  accountName: string;
  debit: string;
  credit: string;
}

function newLine(): FormLine {
  return {
    _id: `${Date.now()}-${Math.random()}`,
    accountId: "",
    accountName: "",
    debit: "0",
    credit: "0",
  };
}

export default function JournalEntriesPage() {
  const { currentUser } = useAuth();
  const { journalEntries, accounts, addJournalEntry, deleteJournalEntry } =
    useStore();

  const handleExportPDF = () => {
    const rows = journalEntries.map((je) => [
      je.reference,
      je.date.slice(0, 10),
      je.description,
      je.lines.length,
    ]);
    exportPDF(
      "Journal Entries",
      ["Reference", "Date", "Description", "Lines"],
      rows,
      "journal-entries.pdf",
      {
        companyName: "BizPOS System",
        generatedBy: currentUser?.name ?? "Unknown",
      },
    );
  };

  const handleExportExcel = () => {
    const rows = journalEntries.map((je) => [
      je.reference,
      je.date.slice(0, 10),
      je.description,
      je.lines.length,
    ]);
    exportExcel(
      "journal-entries.xlsx",
      "Journal Entries",
      ["Reference", "Date", "Description", "Lines"],
      rows,
      {
        companyName: "BizPOS System",
        reportTitle: "Journal Entries",
        generatedBy: currentUser?.name ?? "Unknown",
      },
    );
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    reference: "",
    description: "",
    lines: [newLine(), newLine()],
  });

  const totalDebit = form.lines.reduce(
    (s, l) => s + (Number.parseFloat(l.debit) || 0),
    0,
  );
  const totalCredit = form.lines.reduce(
    (s, l) => s + (Number.parseFloat(l.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (id: string, field: string, value: string) => {
    setForm((prev) => {
      const newLines = prev.lines.map((l) => {
        if (l._id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "accountId") {
          const acc = accounts.find((a) => a.id === value);
          if (acc) updated.accountName = acc.name;
        }
        return updated;
      });
      return { ...prev, lines: newLines };
    });
  };

  const handleSave = () => {
    if (!form.date || !form.description) {
      toast.error("Date and description required");
      return;
    }
    const totalDebits = form.lines.reduce(
      (s, l) => s + (Number.parseFloat(l.debit) || 0),
      0,
    );
    const totalCredits = form.lines.reduce(
      (s, l) => s + (Number.parseFloat(l.credit) || 0),
      0,
    );
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast.error(
        `Journal entry is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      );
      return;
    }
    const lines: JournalLine[] = form.lines
      .filter((l) => l.accountId)
      .map((l) => ({
        accountId: l.accountId,
        accountName: l.accountName,
        debit: Number.parseFloat(l.debit) || 0,
        credit: Number.parseFloat(l.credit) || 0,
      }));
    if (lines.length < 2) {
      toast.error("At least 2 lines required");
      return;
    }
    addJournalEntry({
      date: form.date,
      reference: form.reference,
      description: form.description,
      lines,
    });
    // Update COA account balances
    try {
      const coaAccounts = JSON.parse(
        localStorage.getItem("bizpos_accounts_v3") || "[]",
      );
      const updatedAccounts = coaAccounts.map(
        (acc: { id: string; type: string; currentBalance: number }) => {
          for (const line of lines) {
            if (line.accountId !== acc.id) continue;
            const isDebitNormal =
              acc.type === "Asset" ||
              acc.type === "Expense" ||
              acc.type === "COGS";
            let balance = acc.currentBalance;
            if (line.debit > 0) {
              balance = isDebitNormal
                ? balance + line.debit
                : balance - line.debit;
            }
            if (line.credit > 0) {
              balance = isDebitNormal
                ? balance - line.credit
                : balance + line.credit;
            }
            return { ...acc, currentBalance: balance };
          }
          return acc;
        },
      );
      localStorage.setItem(
        "bizpos_accounts_v3",
        JSON.stringify(updatedAccounts),
      );
    } catch {
      /* ignore */
    }
    toast.success("Journal entry saved");
    setDialogOpen(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      reference: "",
      description: "",
      lines: [newLine(), newLine()],
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Double-entry bookkeeping records</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            data-ocid="journal.secondary_button"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-ocid="journal.secondary_button"
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            data-ocid="journal.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-2" /> New Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="journal.empty_state"
                  >
                    No journal entries
                  </TableCell>
                </TableRow>
              ) : (
                journalEntries.map((entry, i) => (
                  <TableRow key={entry.id} data-ocid={`journal.item.${i + 1}`}>
                    <TableCell className="font-mono">
                      {entry.reference || entry.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.lines.length} lines</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewEntry(entry)}
                          data-ocid={`journal.secondary_button.${i + 1}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(entry.id)}
                          className="text-red-600 hover:bg-red-50"
                          data-ocid={`journal.delete_button.${i + 1}`}
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
          className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="journal.dialog"
        >
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  data-ocid="journal.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
                  placeholder="JE-001"
                  data-ocid="journal.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  data-ocid="journal.input"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="w-32">Debit</TableHead>
                  <TableHead className="w-32">Credit</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.lines.map((line) => (
                  <TableRow key={line._id}>
                    <TableCell>
                      <Select
                        value={line.accountId}
                        onValueChange={(v) =>
                          updateLine(line._id, "accountId", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          updateLine(line._id, "debit", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          updateLine(line._id, "credit", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {form.lines.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              lines: prev.lines.filter(
                                (l) => l._id !== line._id,
                              ),
                            }))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="font-semibold">
                    {totalDebit.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {totalCredit.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
            {!isBalanced && (
              <p className="text-sm text-red-600">
                ⚠ Debit and credit totals must be equal
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  lines: [...prev.lines, newLine()],
                }))
              }
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Line
            </Button>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="journal.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isBalanced}
                data-ocid="journal.save_button"
              >
                Save Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl"
          data-ocid="journal.dialog"
        >
          <DialogHeader>
            <DialogTitle>Journal Entry — {viewEntry?.reference}</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>{" "}
                  <strong>{viewEntry.date}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Description:</span>{" "}
                  <strong>{viewEntry.description}</strong>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewEntry.lines.map((l, lineIdx) => (
                    <TableRow key={`${l.accountId}-${lineIdx}`}>
                      <TableCell>{l.accountName}</TableCell>
                      <TableCell className="text-right">
                        {l.debit > 0 ? l.debit.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.credit > 0 ? l.credit.toFixed(2) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>Delete this entry?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteJournalEntry(deleteId!);
                setDeleteId(null);
                toast.success("Entry deleted");
              }}
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

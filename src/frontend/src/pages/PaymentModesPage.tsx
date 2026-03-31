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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import type { PaymentMode } from "../store/useStore";

export default function PaymentModesPage() {
  const { paymentModes, addPaymentMode, updatePaymentMode, deletePaymentMode } =
    useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState<PaymentMode | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const openAdd = () => {
    setEditingMode(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };
  const openEdit = (pm: PaymentMode) => {
    setEditingMode(pm);
    setForm({ name: pm.name, description: pm.description || "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    if (editingMode) {
      updatePaymentMode(editingMode.id, form);
      toast.success("Payment mode updated");
    } else {
      addPaymentMode(form);
      toast.success("Payment mode created");
    }
    setDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Modes</h1>
          <p className="text-gray-600 mt-1">Manage accepted payment methods</p>
        </div>
        <Button onClick={openAdd} data-ocid="payment_modes.open_modal_button">
          <Plus className="h-4 w-4 mr-2" />
          Add Mode
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentModes.map((pm, i) => (
                <TableRow key={pm.id} data-ocid={`payment_modes.item.${i + 1}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold">{pm.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {pm.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(pm)}
                        data-ocid={`payment_modes.edit_button.${i + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(pm.id)}
                        className="text-red-600 hover:bg-red-50"
                        data-ocid={`payment_modes.delete_button.${i + 1}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="payment_modes.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingMode ? "Edit Payment Mode" : "Add Payment Mode"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Cash"
                data-ocid="payment_modes.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                data-ocid="payment_modes.textarea"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="payment_modes.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                data-ocid="payment_modes.save_button"
              >
                {editingMode ? "Update" : "Add"} Mode
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Mode</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this payment mode?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deletePaymentMode(deleteId!);
                setDeleteId(null);
                toast.success("Payment mode deleted");
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

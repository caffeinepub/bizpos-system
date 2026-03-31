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
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CreditCard, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

export default function ReceivePaymentPage() {
  const { sales, paymentModes, payments, addPayment, updateSale } = useStore();
  const [saleId, setSaleId] = useState("");
  const [paymentModeId, setPaymentModeId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const outstandingSales = sales.filter(
    (s) => s.balanceDue > 0 && s.status !== "Cancelled",
  );
  const selectedSale = sales.find((s) => s.id === saleId);

  const handleSaleChange = (id: string) => {
    setSaleId(id);
    const sale = sales.find((s) => s.id === id);
    if (sale) setAmount(sale.balanceDue.toString());
  };

  const handleSave = () => {
    if (!saleId || !paymentModeId || !amount) {
      toast.error("Please fill all required fields");
      return;
    }
    const paymentAmount = Number.parseFloat(amount);
    if (!selectedSale) return;
    if (paymentAmount <= 0 || paymentAmount > selectedSale.balanceDue) {
      toast.error(`Amount must be between 1 and ${selectedSale.balanceDue}`);
      return;
    }
    const mode = paymentModes.find((p) => p.id === paymentModeId);
    const newPaidAmount = selectedSale.paidAmount + paymentAmount;
    const newBalance = selectedSale.balanceDue - paymentAmount;
    const paymentId = `PAY-${String(payments.length + 1).padStart(3, "0")}`;
    addPayment({
      id: paymentId,
      saleId,
      customerName: selectedSale.customerName,
      warehouseName: selectedSale.warehouseName,
      paymentModeId,
      paymentModeName: mode?.name || "",
      amount: paymentAmount,
      date,
      reference,
      notes,
    });
    updateSale(saleId, {
      paidAmount: newPaidAmount,
      balanceDue: newBalance,
      status: newBalance === 0 ? "Completed" : "Pending",
    });
    toast.success(`Payment ${paymentId} recorded successfully`);
    setSaleId("");
    setPaymentModeId("");
    setAmount("");
    setReference("");
    setNotes("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Receive Payment</h1>
        <p className="text-gray-600 mt-1">
          Record payments against outstanding sales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Sale *</Label>
              <Select value={saleId} onValueChange={handleSaleChange}>
                <SelectTrigger data-ocid="payment.select">
                  <SelectValue placeholder="Select outstanding sale..." />
                </SelectTrigger>
                <SelectContent>
                  {outstandingSales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id} — {s.customerName} — Balance:{" "}
                      {s.balanceDue.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {outstandingSales.length === 0 && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  No outstanding balances
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <Select value={paymentModeId} onValueChange={setPaymentModeId}>
                <SelectTrigger data-ocid="payment.select">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={selectedSale?.balanceDue}
                  placeholder="0.00"
                  data-ocid="payment.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-ocid="payment.input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference No.</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., receipt number"
                data-ocid="payment.input"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                data-ocid="payment.textarea"
              />
            </div>

            <Button
              onClick={handleSave}
              className="w-full"
              data-ocid="payment.submit_button"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Save Payment
            </Button>
          </CardContent>
        </Card>

        {selectedSale ? (
          <Card>
            <CardHeader>
              <CardTitle>Sale Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Sale ID", value: selectedSale.id },
                  { label: "Customer", value: selectedSale.customerName },
                  { label: "Warehouse", value: selectedSale.warehouseName },
                  { label: "Sale Date", value: selectedSale.saleDate },
                  { label: "Sale Type", value: selectedSale.saleType },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between py-2 border-b"
                  >
                    <span className="text-gray-600 text-sm">{label}</span>
                    <span className="font-medium text-sm">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600 text-sm">Total Amount</span>
                  <span className="font-semibold">
                    {selectedSale.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600 text-sm">Paid Amount</span>
                  <span className="font-semibold text-green-600">
                    {selectedSale.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 font-semibold">
                    Balance Due
                  </span>
                  <span className="font-bold text-lg text-red-600">
                    {selectedSale.balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-400">
              <DollarSign className="h-12 w-12 mb-3" />
              <p>Select a sale to see summary</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CreditCard,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

interface SupplierPayment {
  id: string;
  purchaseId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference: string;
  notes: string;
}

const SUPPLIER_PAYMENTS_KEY = "bizpos_supplier_payments";

function loadSupplierPayments(): SupplierPayment[] {
  try {
    return JSON.parse(localStorage.getItem(SUPPLIER_PAYMENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function ReceivePaymentPage() {
  const {
    sales,
    paymentModes,
    payments,
    purchases,
    addPayment,
    updateSale,
    postJournalEntry,
    accountMapping,
  } = useStore();

  // ---- Customer Payment state ----
  const [saleId, setSaleId] = useState("");
  const [paymentModeId, setPaymentModeId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // ---- Supplier Payment state ----
  const [spPurchaseId, setSpPurchaseId] = useState("");
  const [spPaymentMethod, setSpPaymentMethod] = useState("Cash");
  const [spAmount, setSpAmount] = useState("");
  const [spDate, setSpDate] = useState(new Date().toISOString().slice(0, 10));
  const [spReference, setSpReference] = useState("");
  const [spNotes, setSpNotes] = useState("");
  const [supplierPayments, setSupplierPayments] =
    useState<SupplierPayment[]>(loadSupplierPayments);

  // ---- Customer Payment logic ----
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

  // ---- Supplier Payment logic ----
  // Outstanding purchases = Received status with unpaid balance
  const outstandingPurchases = purchases.filter((p) => {
    if (p.status !== "Received") return false;
    const paid = supplierPayments
      .filter((sp) => sp.purchaseId === p.id)
      .reduce((s, sp) => s + sp.amount, 0);
    return paid < p.total;
  });

  const selectedPurchase = purchases.find((p) => p.id === spPurchaseId);
  const selectedPurchasePaid = supplierPayments
    .filter((sp) => sp.purchaseId === spPurchaseId)
    .reduce((s, sp) => s + sp.amount, 0);
  const selectedPurchaseBalance = selectedPurchase
    ? selectedPurchase.total - selectedPurchasePaid
    : 0;

  const handlePurchaseChange = (id: string) => {
    setSpPurchaseId(id);
    const purchase = purchases.find((p) => p.id === id);
    if (purchase) {
      const paid = supplierPayments
        .filter((sp) => sp.purchaseId === id)
        .reduce((s, sp) => s + sp.amount, 0);
      setSpAmount((purchase.total - paid).toString());
    }
  };

  const handleSaveSupplierPayment = () => {
    if (!spPurchaseId || !spAmount) {
      toast.error("Please select a purchase and enter an amount");
      return;
    }
    const paymentAmount = Number.parseFloat(spAmount);
    if (!selectedPurchase) return;
    if (paymentAmount <= 0 || paymentAmount > selectedPurchaseBalance) {
      toast.error(
        `Amount must be between 1 and ${selectedPurchaseBalance.toLocaleString()}`,
      );
      return;
    }

    const newPayment: SupplierPayment = {
      id: `SP-${Date.now()}`,
      purchaseId: spPurchaseId,
      supplierId: selectedPurchase.supplierId,
      supplierName: selectedPurchase.supplierName,
      amount: paymentAmount,
      date: spDate,
      paymentMethod: spPaymentMethod,
      reference: spReference,
      notes: spNotes,
    };

    const existing = loadSupplierPayments();
    const updated = [...existing, newPayment];
    localStorage.setItem(SUPPLIER_PAYMENTS_KEY, JSON.stringify(updated));
    setSupplierPayments(updated);

    // Post journal: Dr Accounts Payable / Cr Cash
    if (postJournalEntry) {
      const apId = accountMapping?.accountsPayableId || "acc-300-02-01-0001";
      const cashId = accountMapping?.cashAccountId || "acc-100-02-01-0002";
      postJournalEntry({
        date: spDate,
        reference: newPayment.id,
        description: `Supplier Payment: ${selectedPurchase.supplierName} — ${selectedPurchase.id}`,
        lines: [
          {
            accountId: apId,
            accountName: "ACCOUNTS PAYABLE",
            debit: paymentAmount,
            credit: 0,
          },
          {
            accountId: cashId,
            accountName: "CASH IN HAND",
            debit: 0,
            credit: paymentAmount,
          },
        ],
      });
    }

    toast.success(`Supplier payment ${newPayment.id} recorded`);
    setSpPurchaseId("");
    setSpAmount("");
    setSpReference("");
    setSpNotes("");
    setSpDate(new Date().toISOString().slice(0, 10));
    setSpPaymentMethod("Cash");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">
          Record customer receipts and supplier payments
        </p>
      </div>

      <Tabs defaultValue="customer" data-ocid="payments.tab">
        <TabsList>
          <TabsTrigger value="customer" data-ocid="payments.customer.tab">
            <CreditCard className="h-4 w-4 mr-2" />
            Customer Payment
          </TabsTrigger>
          <TabsTrigger value="supplier" data-ocid="payments.supplier.tab">
            <TrendingDown className="h-4 w-4 mr-2" />
            Supplier Payment
          </TabsTrigger>
        </TabsList>

        {/* ============ CUSTOMER PAYMENT TAB ============ */}
        <TabsContent value="customer" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Payment Details</CardTitle>
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
                  <Select
                    value={paymentModeId}
                    onValueChange={setPaymentModeId}
                  >
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
                  Save Customer Payment
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
                      <span className="text-gray-600 text-sm">
                        Total Amount
                      </span>
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
        </TabsContent>

        {/* ============ SUPPLIER PAYMENT TAB ============ */}
        <TabsContent value="supplier" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Purchase *</Label>
                  <Select
                    value={spPurchaseId}
                    onValueChange={handlePurchaseChange}
                  >
                    <SelectTrigger data-ocid="supplier_payment.select">
                      <SelectValue placeholder="Select outstanding purchase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {outstandingPurchases.map((p) => {
                        const paid = supplierPayments
                          .filter((sp) => sp.purchaseId === p.id)
                          .reduce((s, sp) => s + sp.amount, 0);
                        const bal = p.total - paid;
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {p.id} — {p.supplierName} — Balance:{" "}
                            {bal.toLocaleString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {outstandingPurchases.length === 0 && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      No outstanding supplier balances
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={spPaymentMethod}
                    onValueChange={setSpPaymentMethod}
                  >
                    <SelectTrigger data-ocid="supplier_payment.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={spAmount}
                      onChange={(e) => setSpAmount(e.target.value)}
                      max={selectedPurchaseBalance}
                      placeholder="0.00"
                      data-ocid="supplier_payment.input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={spDate}
                      onChange={(e) => setSpDate(e.target.value)}
                      data-ocid="supplier_payment.input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reference No.</Label>
                  <Input
                    value={spReference}
                    onChange={(e) => setSpReference(e.target.value)}
                    placeholder="e.g., cheque number"
                    data-ocid="supplier_payment.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={spNotes}
                    onChange={(e) => setSpNotes(e.target.value)}
                    rows={2}
                    data-ocid="supplier_payment.textarea"
                  />
                </div>

                <Button
                  onClick={handleSaveSupplierPayment}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  data-ocid="supplier_payment.submit_button"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Save Supplier Payment
                </Button>
              </CardContent>
            </Card>

            {selectedPurchase ? (
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Purchase ID", value: selectedPurchase.id },
                      {
                        label: "Supplier",
                        value: selectedPurchase.supplierName,
                      },
                      {
                        label: "Warehouse",
                        value: selectedPurchase.warehouseName,
                      },
                      {
                        label: "Purchase Date",
                        value: selectedPurchase.purchaseDate,
                      },
                      { label: "Status", value: selectedPurchase.status },
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
                      <span className="text-gray-600 text-sm">
                        Total Amount
                      </span>
                      <span className="font-semibold">
                        {selectedPurchase.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600 text-sm">Amount Paid</span>
                      <span className="font-semibold text-green-600">
                        {selectedPurchasePaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 font-semibold">
                        Outstanding Balance
                      </span>
                      <span className="font-bold text-lg text-red-600">
                        {selectedPurchaseBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Recent payments for this purchase */}
                  {supplierPayments.filter(
                    (sp) => sp.purchaseId === spPurchaseId,
                  ).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Payment History
                      </p>
                      <div className="space-y-2">
                        {supplierPayments
                          .filter((sp) => sp.purchaseId === spPurchaseId)
                          .map((sp) => (
                            <div
                              key={sp.id}
                              className="flex justify-between text-sm bg-gray-50 rounded p-2"
                            >
                              <span className="text-gray-600">
                                {sp.date}{" "}
                                <Badge
                                  variant="outline"
                                  className="ml-1 text-xs"
                                >
                                  {sp.paymentMethod}
                                </Badge>
                              </span>
                              <span className="font-semibold text-green-700">
                                {sp.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <DollarSign className="h-12 w-12 mb-3" />
                  <p>Select a purchase to see summary</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

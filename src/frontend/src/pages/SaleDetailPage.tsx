import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import AttachmentManager from "../components/AttachmentManager";
import { useStore } from "../store/useStore";

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function SaleDetailPage() {
  const { saleId } = useParams({ from: "/layout/sales/$saleId" });
  const { sales, payments, settings } = useStore();
  const navigate = useNavigate();

  const sale = sales.find((s) => s.id === saleId);
  const salePayments = payments.filter((p) => p.saleId === saleId);

  if (!sale) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/sales" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          Sale not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate({ to: "/sales" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Invoice Details</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    Invoice — {sale.id}
                  </CardTitle>
                  <p className="text-gray-500 mt-1">{sale.saleDate}</p>
                </div>
                <Badge className={STATUS_COLORS[sale.status]}>
                  {sale.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold">{sale.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p className="font-semibold">{sale.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shop</p>
                  <p className="font-semibold">{sale.shopName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sale Type</p>
                  <Badge variant="outline">{sale.saleType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold">{sale.paymentMethod || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-semibold">{settings.companyName}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, rowIdx) => (
                    <TableRow key={`${item.itemId}-${rowIdx}`}>
                      <TableCell>{rowIdx + 1}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.subtotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{sale.subtotal.toLocaleString()}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-red-600">
                        -{sale.discount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {(sale.promoSavings ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promo Savings:</span>
                      <span className="text-orange-600">
                        -{(sale.promoSavings ?? 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {(sale.discount > 0 || (sale.promoSavings ?? 0) > 0) && (
                    <div className="flex justify-between text-gray-500">
                      <span>Taxable Amount:</span>
                      <span>
                        {Math.max(
                          0,
                          sale.subtotal -
                            sale.discount -
                            (sale.promoSavings ?? 0),
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {(sale.taxAmount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-blue-600">
                        +{(sale.taxAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">
                      {sale.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="text-green-600">
                      {sale.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Balance Due:</span>
                    <span
                      className={
                        sale.balanceDue > 0 ? "text-red-600" : "text-green-600"
                      }
                    >
                      {sale.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {salePayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No payments recorded
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salePayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.id}</TableCell>
                        <TableCell>{p.paymentModeName}</TableCell>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{p.reference || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {p.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {settings.invoiceFooter && (
            <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              {settings.invoiceFooter}
            </div>
          )}
        </TabsContent>
        <TabsContent value="attachments">
          <AttachmentManager moduleKey="sales" recordId={sale.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

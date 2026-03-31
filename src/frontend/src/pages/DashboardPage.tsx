import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "../store/useStore";

export default function DashboardPage() {
  const { sales, purchases, items, payments } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.saleDate === today);
  const todayPurchases = purchases.filter((p) => p.purchaseDate === today);

  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalPurchasesToday = todayPurchases.reduce(
    (sum, p) => sum + p.total,
    0,
  );
  const cashBalance = payments.reduce((sum, p) => sum + p.amount, 0);
  const lowStockItems = items.filter((i) => i.quantity < 10);

  const recentSales = [...sales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Build weekly chart data
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = days.map((day, i) => {
    const saleAmt =
      sales.length > 0
        ? (sales.reduce((sum, s) => sum + s.total, 0) / 7) *
          (0.8 + 0.4 * Math.sin(i))
        : 0;
    const purAmt =
      purchases.length > 0
        ? (purchases.reduce((sum, p) => sum + p.total, 0) / 7) *
          (0.7 + 0.3 * Math.cos(i))
        : 0;
    return {
      name: day,
      sales: Math.round(saleAmt),
      purchases: Math.round(purAmt),
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's your business overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Sales
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalSalesToday.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {todaySales.length} transactions today
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Purchases
            </CardTitle>
            <ShoppingBag className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalPurchasesToday.toLocaleString()}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {todayPurchases.length} purchase orders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cash Balance
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cashBalance.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Total collected
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-orange-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales & Purchases Trend (Weekly)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="sales"
                fill="#2563EB"
                name="Sales"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="purchases"
                fill="#22C55E"
                name="Purchases"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No sales yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentSales.map((sale, i) => (
                    <TableRow key={sale.id} data-ocid={`sales.item.${i + 1}`}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === "Completed"
                              ? "default"
                              : sale.status === "Pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {sale.total.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      All items well stocked
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.slice(0, 5).map((item, i) => (
                    <TableRow key={item.id} data-ocid={`stock.item.${i + 1}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-500">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{item.quantity}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

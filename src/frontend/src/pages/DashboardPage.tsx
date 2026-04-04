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
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";

export default function DashboardPage() {
  const {
    sales,
    purchases,
    items,
    payments,
    warehouses,
    companies,
    purchaseOrders,
  } = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const companyWarehouseIds = useMemo(() => {
    if (!currentUser?.activeCompanyId) return null;
    return warehouses
      .filter((w) => (w as any).companyId === currentUser.activeCompanyId)
      .map((w) => w.id);
  }, [warehouses, currentUser]);

  const filteredSales = useMemo(
    () =>
      companyWarehouseIds
        ? sales.filter((s) => companyWarehouseIds.includes(s.warehouseId))
        : sales,
    [sales, companyWarehouseIds],
  );

  const filteredPurchases = useMemo(
    () =>
      companyWarehouseIds
        ? purchases.filter((p) => companyWarehouseIds.includes(p.warehouseId))
        : purchases,
    [purchases, companyWarehouseIds],
  );

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = filteredSales.filter((s) => s.saleDate === today);
  const todayPurchases = filteredPurchases.filter(
    (p) => p.purchaseDate === today,
  );

  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalPurchasesToday = todayPurchases.reduce(
    (sum, p) => sum + p.total,
    0,
  );
  const cashBalance = payments.reduce((sum, p) => sum + p.amount, 0);

  // Use reorderLevel if available, otherwise fall back to qty < 10
  const lowStockItems = items.filter((i) => {
    const level = (i as any).reorderLevel;
    return level != null ? i.quantity <= level : i.quantity < 10;
  });

  const pendingPOs = purchaseOrders.filter(
    (po) => po.status === "Draft" || po.status === "Sent",
  ).length;

  const recentSales = [...filteredSales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = days.map((day, i) => {
    const saleAmt =
      filteredSales.length > 0
        ? (filteredSales.reduce((sum, s) => sum + s.total, 0) / 7) *
          (0.8 + 0.4 * Math.sin(i))
        : 0;
    const purAmt =
      filteredPurchases.length > 0
        ? (filteredPurchases.reduce((sum, p) => sum + p.total, 0) / 7) *
          (0.7 + 0.3 * Math.cos(i))
        : 0;
    return {
      name: day,
      sales: Math.round(saleAmt),
      purchases: Math.round(purAmt),
    };
  });

  const activeCompany = currentUser?.activeCompanyId
    ? companies.find((c) => c.id === currentUser.activeCompanyId)
    : null;

  const kpiCards = [
    {
      title: "Today's Sales",
      value: totalSalesToday.toLocaleString(),
      sub: `${todaySales.length} transactions`,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/sales",
    },
    {
      title: "Today's Purchases",
      value: totalPurchasesToday.toLocaleString(),
      sub: `${todayPurchases.length} orders`,
      icon: ShoppingBag,
      color: "text-orange-500",
      bg: "bg-orange-50",
      path: "/purchases",
    },
    {
      title: "Cash Balance",
      value: cashBalance.toLocaleString(),
      sub: "Total collected",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      path: "/payment-history",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length.toString(),
      sub: "Requires attention",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50",
      path: "/items",
    },
    {
      title: "Pending POs",
      value: pendingPOs.toString(),
      sub: "Awaiting approval",
      icon: ClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-50",
      path: "/purchase-orders",
    },
    {
      title: "Total Items",
      value: items.length.toString(),
      sub: "In inventory",
      icon: Package,
      color: "text-purple-500",
      bg: "bg-purple-50",
      path: "/items",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {activeCompany && (
          <p className="text-blue-600 text-sm font-medium">
            {activeCompany.name}
          </p>
        )}
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s your business overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            className="hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-200"
            onClick={() => navigate({ to: card.path })}
            data-ocid={`dashboard.${card.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.card`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} p-1.5 rounded-lg`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {card.value}
              </div>
              <p
                className={`text-xs ${card.color} mt-1 flex items-center gap-1`}
              >
                <TrendingUp className="h-3 w-3" />
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
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
                    <TableRow
                      key={sale.id}
                      data-ocid={`sales.item.${i + 1}`}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate({ to: "/sales" })}
                    >
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
            <div className="flex items-center justify-between">
              <CardTitle>Low Stock Alerts</CardTitle>
              {lowStockItems.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {lowStockItems.length} items
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      All items well stocked
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.slice(0, 6).map((item, i) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`stock.item.${i + 1}`}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate({ to: "/items" })}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-500">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{item.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {(item as any).reorderLevel ?? 10}
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store/useStore";
import { exportExcel, exportPDF } from "../utils/exportUtils";

import PageHelp from "@/components/PageHelp";

function getSessionUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("bizpos_session") || "{}").name || "Admin"
    );
  } catch {
    return "Admin";
  }
}

const PERF_BADGE: Record<string, string> = {
  Excellent: "bg-green-100 text-green-700",
  Good: "bg-blue-100 text-blue-700",
  Fair: "bg-yellow-100 text-yellow-700",
  Poor: "bg-red-100 text-red-700",
};

export default function SupplierPerformancePage() {
  const store = useStore();
  const suppliers = store.suppliers;
  const purchaseOrders = store.purchaseOrders;
  const grns = store.goodsReceiptNotes;
  const shipments = store.shipments;

  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Compute supplier performance
  const supplierPerf = suppliers
    .map((sup) => {
      const supPOs = purchaseOrders.filter((po) => po.supplierId === sup.id);
      const supGRNs = grns.filter((g) => g.supplierId === sup.id);

      const totalPOs = supPOs.length;
      const totalGRNs = supGRNs.length;
      const totalValue = supPOs.reduce((s, po) => s + po.totalAmount, 0);

      let totalAccepted = 0;
      let totalReceived = 0;
      for (const g of supGRNs) {
        for (const it of g.items) {
          totalAccepted += it.acceptedQty;
          totalReceived += it.receivedQty;
        }
      }
      const acceptanceRate =
        totalReceived > 0 ? (totalAccepted / totalReceived) * 100 : 100;

      // On-time delivery: shipments linked to supplier POs where actualDate <= expectedDate
      const supShipments = shipments.filter((s) =>
        supPOs.some((po) => s.linkedRefNo === po.poNumber),
      );
      const onTimeCount = supShipments.filter(
        (s) => s.actualDate && s.expectedDate && s.actualDate <= s.expectedDate,
      ).length;
      const onTimeRate =
        supShipments.length > 0 ? (onTimeCount / supShipments.length) * 100 : 0;

      // Avg lead time
      const leadTimes = supShipments
        .filter((s) => s.actualDate && s.expectedDate)
        .map((s) => {
          const d1 = new Date(s.expectedDate).getTime();
          const d2 = new Date(s.actualDate).getTime();
          return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
        });
      const avgLeadTime =
        leadTimes.length > 0
          ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
          : 0;

      const score =
        (acceptanceRate + (supShipments.length > 0 ? onTimeRate : 100)) / 2;
      const badge =
        score >= 90
          ? "Excellent"
          : score >= 75
            ? "Good"
            : score >= 60
              ? "Fair"
              : "Poor";

      return {
        supplier: sup,
        totalPOs,
        totalGRNs,
        totalValue,
        acceptanceRate,
        onTimeRate,
        avgLeadTime,
        badge,
      };
    })
    .filter(
      (r) =>
        !search || r.supplier.name.toLowerCase().includes(search.toLowerCase()),
    );

  // Overview KPIs
  const totalSuppliers = suppliers.length;
  const totalPOs = purchaseOrders.length;
  const totalGRNs = grns.length;
  const avgOnTime =
    supplierPerf.length > 0
      ? supplierPerf.reduce((s, r) => s + r.onTimeRate, 0) / supplierPerf.length
      : 0;
  const avgAcceptance =
    supplierPerf.length > 0
      ? supplierPerf.reduce((s, r) => s + r.acceptanceRate, 0) /
        supplierPerf.length
      : 0;

  function handleExportPDF() {
    exportPDF(
      "Supplier Performance",
      [
        "Supplier",
        "POs",
        "GRNs",
        "Total Value",
        "Acceptance %",
        "On-Time %",
        "Avg Lead Time",
        "Rating",
      ],
      supplierPerf.map((r) => [
        r.supplier.name,
        r.totalPOs,
        r.totalGRNs,
        r.totalValue.toLocaleString(),
        r.acceptanceRate.toFixed(1),
        r.onTimeRate.toFixed(1),
        r.avgLeadTime.toFixed(1),
        r.badge,
      ]),
      "supplier_performance.pdf",
      { reportTitle: "Supplier Performance", generatedBy: getSessionUser() },
    );
  }

  function handleExportExcel() {
    exportExcel(
      "supplier_performance.xlsx",
      "Performance",
      [
        "Supplier",
        "POs",
        "GRNs",
        "Total Value",
        "Acceptance %",
        "On-Time %",
        "Avg Lead Time (days)",
        "Rating",
      ],
      supplierPerf.map((r) => [
        r.supplier.name,
        r.totalPOs,
        r.totalGRNs,
        r.totalValue,
        r.acceptanceRate.toFixed(1),
        r.onTimeRate.toFixed(1),
        r.avgLeadTime.toFixed(1),
        r.badge,
      ]),
      { reportTitle: "Supplier Performance", generatedBy: getSessionUser() },
    );
  }

  // PO order history
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchSupplier =
      filterSupplier === "all" || po.supplierId === filterSupplier;
    const matchStatus = filterStatus === "all" || po.status === filterStatus;
    const matchFrom = !filterFrom || po.date >= filterFrom;
    const matchTo = !filterTo || po.date <= filterTo;
    return matchSupplier && matchStatus && matchFrom && matchTo;
  });

  // Quality analysis by supplier
  const supplierQuality = suppliers
    .map((sup) => {
      const supGRNs = grns.filter((g) => g.supplierId === sup.id);
      let ordered = 0;
      let received = 0;
      let accepted = 0;
      let rejected = 0;
      for (const g of supGRNs) {
        for (const it of g.items) {
          ordered += it.orderedQty;
          received += it.receivedQty;
          accepted += it.acceptedQty;
          rejected += it.rejectedQty;
        }
      }
      const rate =
        received > 0 ? ((accepted / received) * 100).toFixed(1) : "N/A";
      return { name: sup.name, ordered, received, accepted, rejected, rate };
    })
    .filter((r) => r.ordered > 0);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Supplier Performance
        </h1>
        <p className="text-sm text-slate-500">
          Analytics and quality metrics for all suppliers
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Total Suppliers",
                value: totalSuppliers,
                color: "text-blue-600",
              },
              { label: "Total POs", value: totalPOs, color: "text-slate-700" },
              {
                label: "Total GRNs",
                value: totalGRNs,
                color: "text-slate-700",
              },
              {
                label: "Avg On-Time %",
                value: `${avgOnTime.toFixed(1)}%`,
                color: "text-green-600",
              },
              {
                label: "Avg Acceptance %",
                value: `${avgAcceptance.toFixed(1)}%`,
                color: "text-green-600",
              },
            ].map((k) => (
              <div key={k.label} className="bg-white border rounded-lg p-4">
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className={`text-2xl font-bold mt-1 ${k.color}`}>
                  {k.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters + Export */}
          <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
            <Input
              data-ocid="supplier_perf.search_input"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          </div>

          {/* Performance Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Supplier",
                    "Total POs",
                    "Total GRNs",
                    "Total Value",
                    "Acceptance %",
                    "On-Time %",
                    "Avg Lead Time",
                    "Rating",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplierPerf.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-400"
                      data-ocid="supplier_perf.empty_state"
                    >
                      No suppliers found
                    </td>
                  </tr>
                )}
                {supplierPerf.map((r, idx) => (
                  <tr
                    key={r.supplier.id}
                    className="border-b hover:bg-slate-50"
                    data-ocid={`supplier_perf.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium">{r.supplier.name}</td>
                    <td className="px-4 py-3">{r.totalPOs}</td>
                    <td className="px-4 py-3">{r.totalGRNs}</td>
                    <td className="px-4 py-3">
                      PKR {r.totalValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(r.acceptanceRate, 100)}%`,
                            }}
                          />
                        </div>
                        <span>{r.acceptanceRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{r.onTimeRate.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      {r.avgLeadTime.toFixed(1)} days
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${PERF_BADGE[r.badge]}`}
                      >
                        {r.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 bg-white border rounded-lg p-4">
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger data-ocid="supplier_perf.select" className="w-44">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-ocid="supplier_perf.select" className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["Draft", "Sent", "Received", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {["PO No", "Supplier", "Date", "Amount", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-medium text-slate-600"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
                {filteredPOs.map((po, idx) => (
                  <tr
                    key={po.id}
                    className="border-b hover:bg-slate-50"
                    data-ocid={`supplier_perf.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {po.poNumber}
                    </td>
                    <td className="px-4 py-3">{po.supplierName}</td>
                    <td className="px-4 py-3">{po.date}</td>
                    <td className="px-4 py-3">
                      PKR {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4 mt-4">
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {[
                    "Supplier",
                    "Ordered",
                    "Received",
                    "Accepted",
                    "Rejected",
                    "Acceptance Rate",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplierQuality.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No quality data available
                    </td>
                  </tr>
                )}
                {supplierQuality.map((q) => (
                  <tr key={q.name} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{q.name}</td>
                    <td className="px-4 py-3">{q.ordered}</td>
                    <td className="px-4 py-3">{q.received}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {q.accepted}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-medium">
                      {q.rejected}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${q.rate === "N/A" ? 0 : q.rate}%`,
                            }}
                          />
                        </div>
                        <span className="font-medium">{q.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Globe, LogOut, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Warehouse } from "../store/useStore";

export default function WarehouseSelectPage() {
  const { currentUser, logout, setActiveWarehouse } = useAuth();
  const navigate = useNavigate();

  const warehouses: Warehouse[] = (() => {
    try {
      const raw = localStorage.getItem("bizpos_warehouses");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const assignedIds = currentUser?.assignedWarehouseIds ?? [];
  const visibleWarehouses =
    assignedIds.length === 0
      ? warehouses
      : warehouses.filter((w) => assignedIds.includes(w.id));

  const enter = (warehouseId: string | null) => {
    setActiveWarehouse(warehouseId);
    navigate({ to: "/dashboard" });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">BizPOS</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium">
              {currentUser?.name}
            </p>
            <p className="text-blue-300 text-xs">{currentUser?.roleName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            data-ocid="warehouse_select.logout_button"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4">
            <Building2 className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Select Warehouse
          </h1>
          <p className="text-slate-400 text-lg">
            Choose a warehouse to begin your session
          </p>
        </div>

        {/* All Warehouses Option */}
        <div className="w-full max-w-4xl mb-6">
          <button
            type="button"
            onClick={() => enter(null)}
            className="w-full group"
            data-ocid="warehouse_select.all_button"
          >
            <Card className="border-2 border-dashed border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 hover:border-blue-400 transition-all duration-200 cursor-pointer">
              <CardContent className="flex items-center gap-4 py-5 px-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold text-lg">
                    All Warehouses
                  </p>
                  <p className="text-blue-300 text-sm">
                    Cross-warehouse view — see data from all locations
                  </p>
                </div>
                <Badge className="bg-blue-600 text-white border-0 text-xs px-3 py-1">
                  No Filter
                </Badge>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 w-full max-w-4xl mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-500 text-sm">
            or select a specific warehouse
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Warehouse Grid */}
        {visibleWarehouses.length === 0 ? (
          <div
            className="text-center py-12"
            data-ocid="warehouse_select.empty_state"
          >
            <p className="text-slate-400">No warehouses available</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl"
            data-ocid="warehouse_select.list"
          >
            {visibleWarehouses.map((wh, i) => (
              <button
                key={wh.id}
                type="button"
                onClick={() => enter(wh.id)}
                className="group text-left"
                data-ocid={`warehouse_select.item.${i + 1}`}
              >
                <Card className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-400" />
                      </div>
                      <Badge
                        className={
                          wh.status === "Active"
                            ? "bg-green-500/20 text-green-400 border-green-500/30 border text-xs"
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30 border text-xs"
                        }
                      >
                        {wh.status}
                      </Badge>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors">
                      {wh.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{wh.location}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-blue-400 text-sm font-medium group-hover:text-blue-300">
                        Enter Warehouse →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-white/10">
        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-blue-400 hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

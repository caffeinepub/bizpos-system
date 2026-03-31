import { Button } from "@/components/ui/button";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  Banknote,
  BarChart3,
  BookCheck,
  BookMarked,
  BookOpen,
  Building2,
  Calculator,
  CalendarCheck,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  FileText,
  Gift,
  History,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  Package,
  Percent,
  Printer,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  UserSquare,
  Users,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface SubItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ElementType;
  module: string;
  direct?: boolean;
  subItems?: SubItem[];
}

const navGroups: NavGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
    direct: true,
    subItems: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    key: "pos",
    label: "POS",
    icon: ShoppingCart,
    module: "pos",
    direct: true,
    subItems: [{ path: "/pos", label: "Point of Sale", icon: ShoppingCart }],
  },
  {
    key: "sales",
    label: "Sales",
    icon: Receipt,
    module: "sales",
    subItems: [
      { path: "/sales", label: "Sales List", icon: Receipt },
      { path: "/receive-payment", label: "Receive Payment", icon: DollarSign },
      { path: "/payment-history", label: "Payment History", icon: History },
      { path: "/payment-modes", label: "Payment Modes", icon: CreditCard },
    ],
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: ShoppingBag,
    module: "purchases",
    subItems: [
      {
        path: "/purchase-orders",
        label: "Purchase Orders",
        icon: ClipboardList,
      },
      { path: "/purchases", label: "Invoices / Bills", icon: FileText },
      { path: "/suppliers", label: "Suppliers", icon: Building2 },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    module: "purchases",
    direct: true,
    subItems: [{ path: "/customers", label: "Customers", icon: Users }],
  },
  {
    key: "pricing",
    label: "Pricing",
    icon: Percent,
    module: "inventory",
    subItems: [
      { path: "/taxes", label: "Tax Rates", icon: Percent },
      { path: "/discounts", label: "Discounts", icon: Tag },
      { path: "/promotions", label: "Promotions", icon: Gift },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Package,
    module: "inventory",
    subItems: [
      { path: "/items", label: "Items", icon: Package },
      { path: "/stock-adjustment", label: "Stock Adjustment", icon: RefreshCw },
      { path: "/warehouse-stock", label: "Warehouse Stock", icon: Warehouse },
    ],
  },
  {
    key: "warehouse",
    label: "Warehouse",
    icon: Building2,
    module: "warehouse",
    subItems: [
      { path: "/warehouses", label: "Warehouses", icon: Building2 },
      { path: "/shops", label: "Shops", icon: Store },
    ],
  },
  {
    key: "accounting",
    label: "Accounting",
    icon: Calculator,
    module: "accounts",
    subItems: [
      {
        path: "/chart-of-accounts",
        label: "Chart of Accounts",
        icon: BookOpen,
      },
      { path: "/journal-entries", label: "Journal Entries", icon: BookMarked },
      { path: "/expenses", label: "Expenses", icon: TrendingDown },
      {
        path: "/bank-reconciliation",
        label: "Bank Reconciliation",
        icon: RefreshCw,
      },
      { path: "/trial-balance", label: "Trial Balance", icon: BarChart3 },
      { path: "/balance-sheet", label: "Balance Sheet", icon: FileText },
      { path: "/profit-loss", label: "Profit & Loss", icon: TrendingUp },
    ],
  },
  {
    key: "hr",
    label: "HR",
    icon: UserSquare,
    module: "employees",
    subItems: [
      { path: "/employees", label: "Employees", icon: UserSquare },
      {
        path: "/salary-processing",
        label: "Salary Processing",
        icon: Banknote,
      },
      {
        path: "/leave-management",
        label: "Leave Management",
        icon: CalendarOff,
      },
      { path: "/departments", label: "Departments", icon: Building2 },
      { path: "/designations", label: "Designations", icon: Award },
      { path: "/allowance-types", label: "Allowance Types", icon: Coins },
      { path: "/salary-slips", label: "Salary Slips", icon: FileText },
      { path: "/shifts", label: "Shift Management", icon: Clock },
      { path: "/shift-closing", label: "Shift Closing", icon: ClipboardCheck },
      { path: "/attendance", label: "Attendance", icon: CalendarCheck },
    ],
  },
  {
    key: "supplychain",
    label: "Supply Chain",
    icon: Truck,
    module: "purchases",
    subItems: [
      {
        path: "/purchase-requisitions",
        label: "Purchase Requisitions",
        icon: ClipboardList,
      },
      { path: "/purchase-orders", label: "Purchase Orders", icon: FileText },
      { path: "/goods-receipt", label: "Goods Receipt", icon: Package },
      {
        path: "/inventory-transfers",
        label: "Inventory Transfers",
        icon: RefreshCw,
      },
      { path: "/shipments", label: "Shipment Tracking", icon: Truck },
      {
        path: "/supplier-performance",
        label: "Supplier Performance",
        icon: TrendingUp,
      },
    ],
  },
  {
    key: "banking",
    label: "Banking",
    icon: Landmark,
    module: "accounts",
    subItems: [
      { path: "/banks", label: "Banks", icon: Building2 },
      { path: "/bank-branches", label: "Branches", icon: MapPin },
      { path: "/bank-accounts", label: "Bank Accounts", icon: CreditCard },
      { path: "/cheque-books", label: "Cheque Books", icon: BookCheck },
      { path: "/cheque-templates", label: "Cheque Templates", icon: BookOpen },
      { path: "/cheque-print", label: "Cheque Print", icon: Printer },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    module: "reports",
    subItems: [
      {
        path: "/reports?category=sales",
        label: "Sales Reports",
        icon: Receipt,
      },
      {
        path: "/reports?category=purchases",
        label: "Purchase Reports",
        icon: ShoppingBag,
      },
      {
        path: "/reports?category=inventory",
        label: "Inventory Reports",
        icon: Package,
      },
      {
        path: "/reports?category=financial",
        label: "Financial Reports",
        icon: TrendingUp,
      },
      {
        path: "/reports?category=payroll",
        label: "Payroll Reports",
        icon: Banknote,
      },
      {
        path: "/reports?category=leave",
        label: "HR Reports",
        icon: UserSquare,
      },
      {
        path: "/reports?category=activity",
        label: "Expense Reports",
        icon: TrendingDown,
      },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    icon: Shield,
    module: "users",
    subItems: [
      { path: "/users", label: "Users", icon: Users },
      { path: "/roles", label: "Roles", icon: Shield },
      { path: "/logs", label: "System Logs", icon: FileText },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AppLayout() {
  const { currentUser, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flyout, setFlyout] = useState<{ key: string; y: number } | null>(null);
  const flyoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const sidebarW = collapsed ? 64 : 240;

  const clearFlyout = () => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    flyoutTimeoutRef.current = setTimeout(() => setFlyout(null), 80);
  };

  const keepFlyout = () => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
  };

  useEffect(() => {
    return () => {
      if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    };
  }, []);

  const handleGroupHover = (
    key: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    keepFlyout();
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ key, y: rect.top });
  };

  const visibleGroups = navGroups.filter((g) => hasPermission(g.module));

  const isActive = (path: string) => {
    const p = path.split("?")[0];
    return currentPath === p || currentPath.startsWith(`${p}/`);
  };

  const isGroupActive = (group: NavGroup) =>
    group.subItems?.some((s) => isActive(s.path)) ?? false;

  const navigateTo = (path: string) => {
    const [pathname, search] = path.split("?");
    if (search) {
      navigate({
        to: pathname,
        search: Object.fromEntries(new URLSearchParams(search)),
      });
    } else {
      navigate({ to: pathname });
    }
    setMobileOpen(false);
    setFlyout(null);
  };

  const activeFlyoutGroup = flyout
    ? visibleGroups.find((g) => g.key === flyout.key)
    : null;

  const SidebarItem = ({ group }: { group: NavGroup }) => {
    const Icon = group.icon;
    const active = isGroupActive(group);
    const isDirect = group.direct && group.subItems?.length === 1;

    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group relative
          ${
            active
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        onClick={() => {
          if (isDirect && group.subItems?.[0]) {
            navigateTo(group.subItems[0].path);
          } else if (!isDirect && group.subItems?.length) {
            navigateTo(group.subItems[0].path);
          }
        }}
        onMouseEnter={(e) => {
          if (!isDirect && group.subItems && group.subItems.length > 1) {
            handleGroupHover(group.key, e);
          }
        }}
        onMouseLeave={clearFlyout}
        data-ocid={`nav.${group.key}.link`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-medium truncate">
              {group.label}
            </span>
            {!isDirect && group.subItems && group.subItems.length > 1 && (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: sidebarW }}
        className="hidden md:flex flex-col bg-slate-900 transition-all duration-200 flex-shrink-0 relative z-30"
        onMouseLeave={clearFlyout}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm">BizPOS</span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-700 h-7 w-7 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {visibleGroups.map((group) => (
            <SidebarItem key={group.key} group={group} />
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700 p-2">
          {!collapsed && (
            <div className="px-2 py-1 mb-1">
              <p className="text-white text-xs font-medium truncate">
                {currentUser?.name}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {currentUser?.roleName}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            data-ocid="nav.logout.button"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Flyout Panel */}
      {flyout && activeFlyoutGroup && (
        <div
          className="fixed z-50"
          style={{
            left: sidebarW,
            top: Math.max(
              8,
              Math.min(
                flyout.y - 8,
                window.innerHeight -
                  (activeFlyoutGroup.subItems?.length ?? 0) * 44 -
                  24,
              ),
            ),
          }}
          onMouseEnter={keepFlyout}
          onMouseLeave={clearFlyout}
        >
          <div className="bg-white border border-slate-200 rounded-r-xl shadow-xl min-w-52 overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-600 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider">
                {activeFlyoutGroup.label}
              </p>
            </div>
            <div className="py-1">
              {activeFlyoutGroup.subItems?.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left
                      ${
                        active
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 opacity-70" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-200 md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-bold">BizPOS</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              {group.direct && group.subItems?.[0] ? (
                <button
                  type="button"
                  onClick={() => navigateTo(group.subItems![0].path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                    ${
                      isGroupActive(group)
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                >
                  <group.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{group.label}</span>
                </button>
              ) : (
                <div className="mb-1">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <group.icon className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.subItems?.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigateTo(item.path)}
                      className={`w-full flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm text-left
                        ${
                          isActive(item.path)
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-3">
          <p className="text-white text-sm font-medium px-2">
            {currentUser?.name}
          </p>
          <p className="text-slate-400 text-xs px-2 mb-2">
            {currentUser?.roleName}
          </p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-slate-900">BizPOS</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

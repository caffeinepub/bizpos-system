import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  Banknote,
  BarChart3,
  Bell,
  BookCheck,
  BookMarked,
  BookOpen,
  Bookmark,
  Building2,
  Calculator,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  ChevronDown,
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
  Keyboard,
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
  RotateCcw,
  Settings,
  Shield,
  ShieldOff,
  ShoppingBag,
  ShoppingCart,
  Star,
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
      { path: "/sales-returns", label: "Sales Returns", icon: RotateCcw },
      { path: "/credit-notes", label: "Credit Notes", icon: FileText },
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
      { path: "/purchase-returns", label: "Purchase Returns", icon: RotateCcw },
      { path: "/debit-notes", label: "Debit Notes", icon: FileText },
      { path: "/suppliers", label: "Suppliers", icon: Building2 },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    module: "customers",
    subItems: [
      { path: "/customers", label: "Customers", icon: Users },
      { path: "/customer-groups", label: "Customer Groups", icon: Shield },
    ],
  },
  {
    key: "pricing",
    label: "Pricing",
    icon: Percent,
    module: "pricing",
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
      { path: "/companies", label: "Companies", icon: Building2 },
      { path: "/warehouses", label: "Warehouses", icon: Warehouse },
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
      { path: "/opening-balances", label: "Opening Balances", icon: Wallet },
      {
        path: "/financial-years",
        label: "Financial Years",
        icon: CalendarDays,
      },
      { path: "/expenses", label: "Expenses", icon: TrendingDown },
      { path: "/expense-categories", label: "Expense Categories", icon: Tag },
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
    module: "supply_chain",
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
    module: "banking",
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
      {
        path: "/reports?category=warehouse",
        label: "Warehouse Reports",
        icon: Building2,
      },
      {
        path: "/reports?category=banking",
        label: "Banking Reports",
        icon: Landmark,
      },
      { path: "/reports?category=tax", label: "Tax Reports", icon: Coins },
      { path: "/reports?category=aging", label: "Aging Reports", icon: Clock },
      {
        path: "/reports?category=operations",
        label: "Operations Reports",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    icon: Shield,
    module: "users",
    subItems: [
      { path: "/companies", label: "Companies", icon: Building2 },
      { path: "/users", label: "Users", icon: Users },
      { path: "/roles", label: "Roles", icon: Shield },
      { path: "/logs", label: "System Logs", icon: FileText },
      { path: "/tickets", label: "Tickets", icon: LifeBuoy },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: "G → D", description: "Dashboard", path: "/dashboard" },
  { keys: "G → P", description: "Point of Sale", path: "/pos" },
  { keys: "G → S", description: "Sales", path: "/sales" },
  { keys: "G → I", description: "Items / Inventory", path: "/items" },
  { keys: "G → U", description: "Users", path: "/users" },
  { keys: "G → R", description: "Reports", path: "/reports" },
  {
    keys: "G → A",
    description: "Chart of Accounts",
    path: "/chart-of-accounts",
  },
  { keys: "G → E", description: "Employees", path: "/employees" },
  { keys: "G → B", description: "Banks", path: "/banks" },
  { keys: "G → T", description: "Tickets", path: "/tickets" },
  { keys: "G → O", description: "Purchase Orders", path: "/purchase-orders" },
  { keys: "G → C", description: "Customers", path: "/customers" },
  { keys: "?", description: "Toggle this shortcuts panel", path: "" },
];

function getLabelForPath(path: string): string {
  for (const group of navGroups) {
    const item = group.subItems?.find(
      (s) => s.path.split("?")[0] === path.split("?")[0],
    );
    if (item) return item.label;
  }
  return path;
}

interface BookmarkEntry {
  path: string;
  label: string;
}

function BookmarkButton({
  currentPath,
  navigateTo,
  currentUser,
}: {
  currentPath: string;
  navigateTo: (path: string) => void;
  currentUser: any;
}) {
  const [, forceUpdate] = useState(0);

  const storageKey = `bizpos_bookmarks_${currentUser?.id ?? "guest"}`;

  const getBookmarks = (): BookmarkEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const saveBookmarks = (bm: BookmarkEntry[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bm));
    } catch {
      // ignore
    }
    forceUpdate((n) => n + 1);
  };

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.some(
    (b) => b.path.split("?")[0] === currentPath.split("?")[0],
  );

  const addBookmark = () => {
    const label = getLabelForPath(currentPath);
    saveBookmarks([...bookmarks, { path: currentPath, label }]);
  };

  const removeBookmark = (path: string) => {
    saveBookmarks(
      bookmarks.filter((b) => b.path.split("?")[0] !== path.split("?")[0]),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Bookmarks"
          data-ocid="nav.bookmarks.button"
        >
          <Bookmark className="h-5 w-5" />
          {bookmarks.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {bookmarks.length > 9 ? "9+" : bookmarks.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        data-ocid="nav.bookmarks.dropdown_menu"
      >
        <div className="px-3 py-2 border-b">
          <p className="font-semibold text-sm">Bookmarks</p>
          <p className="text-xs text-gray-500">
            {bookmarks.length === 0
              ? "No bookmarks saved"
              : `${bookmarks.length} saved page${bookmarks.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {bookmarks.length === 0 ? (
          <div className="px-3 py-3 text-center text-sm text-gray-400">
            No bookmarks yet
          </div>
        ) : (
          bookmarks.map((bm, idx) => (
            <div
              key={bm.path}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50"
              data-ocid={`nav.bookmarks.item.${idx + 1}`}
            >
              <button
                type="button"
                className="flex items-center gap-2 flex-1 text-sm text-left py-1 px-1 rounded hover:text-blue-600 transition-colors"
                onClick={() => navigateTo(bm.path)}
              >
                <Bookmark className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <span className="truncate">{bm.label}</span>
              </button>
              <button
                type="button"
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                onClick={() => removeBookmark(bm.path)}
                title="Remove bookmark"
                data-ocid={`nav.bookmarks.delete_button.${idx + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
        <DropdownMenuSeparator />
        {isBookmarked ? (
          <DropdownMenuItem
            onClick={() => removeBookmark(currentPath)}
            className="text-red-600 focus:text-red-600 cursor-pointer"
            data-ocid="nav.bookmarks.remove_button"
          >
            <X className="h-4 w-4 mr-2" />
            Remove bookmark
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={addBookmark}
            className="text-blue-600 focus:text-blue-600 cursor-pointer"
            data-ocid="nav.bookmarks.add_button"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmark this page
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FavoritesButton({
  navigateTo,
  currentUser,
}: {
  navigateTo: (path: string) => void;
  currentUser: any;
}) {
  const [, forceUpdate] = useState(0);
  const [configuring, setConfiguring] = useState(false);

  const storageKey = `bizpos_favorites_${currentUser?.id ?? "guest"}`;

  const getFavorites = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const saveFavorites = (favs: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favs));
    } catch {
      // ignore
    }
    forceUpdate((n) => n + 1);
  };

  const favorites = getFavorites();

  const toggleFavorite = (path: string) => {
    const current = getFavorites();
    if (current.includes(path)) {
      saveFavorites(current.filter((p) => p !== path));
    } else {
      saveFavorites([...current, path]);
    }
  };

  // Flatten all nav sub-items for the configure list
  const allNavItems = navGroups.flatMap((g) =>
    (g.subItems ?? []).map((item) => ({ ...item, groupLabel: g.label })),
  );

  const favoriteItems = favorites
    .map((path) => allNavItems.find((i) => i.path === path))
    .filter(Boolean) as (SubItem & { groupLabel: string })[];

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setConfiguring(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Favorites"
          data-ocid="nav.favorites.button"
        >
          <Star className="h-5 w-5" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {favorites.length > 9 ? "9+" : favorites.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        data-ocid="nav.favorites.dropdown_menu"
        onInteractOutside={(e) => {
          if (configuring) e.preventDefault();
        }}
      >
        {!configuring ? (
          <>
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Quick Access</p>
                <p className="text-xs text-gray-500">
                  {favorites.length === 0
                    ? "No favorites pinned"
                    : `${favorites.length} pinned page${favorites.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                onClick={() => setConfiguring(true)}
                data-ocid="nav.favorites.configure_button"
              >
                Configure
              </button>
            </div>
            {favoriteItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No favorites yet.
                <br />
                <button
                  type="button"
                  className="mt-1 text-blue-600 hover:underline text-xs"
                  onClick={() => setConfiguring(true)}
                >
                  Add favorites
                </button>
              </div>
            ) : (
              favoriteItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    className="flex items-center gap-2 cursor-pointer"
                    data-ocid={`nav.favorites.item.${idx + 1}`}
                  >
                    <Icon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.groupLabel}
                    </span>
                  </DropdownMenuItem>
                );
              })
            )}
          </>
        ) : (
          <>
            <div className="px-3 py-2 border-b flex items-center gap-2">
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                onClick={() => setConfiguring(false)}
                data-ocid="nav.favorites.configure_back_button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="font-semibold text-sm">Edit Favorites</p>
                <p className="text-xs text-gray-500">
                  Toggle to pin/unpin pages
                </p>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {allNavItems.map((item, idx) => {
                const Icon = item.icon;
                const isFav = favorites.includes(item.path);
                return (
                  <div
                    key={`${item.path}-${idx}`}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50"
                    data-ocid={`nav.favorites.configure.item.${idx + 1}`}
                  >
                    <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      className={`p-1 rounded transition-colors ${
                        isFav
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-gray-300 hover:text-yellow-400"
                      }`}
                      onClick={() => toggleFavorite(item.path)}
                      title={
                        isFav ? "Remove from favorites" : "Add to favorites"
                      }
                      data-ocid={`nav.favorites.configure.toggle.${idx + 1}`}
                    >
                      <Star
                        className="h-4 w-4"
                        fill={isFav ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const navigate = useNavigate();

  const notifications: {
    id: string;
    message: string;
    path: string;
    type: string;
  }[] = (() => {
    try {
      const items = JSON.parse(localStorage.getItem("bizpos_items") || "[]");
      const reqs = JSON.parse(
        localStorage.getItem("bizpos_purchase_requisitions") || "[]",
      );

      const lowStock = items
        .filter(
          (i: { quantity: number; reorderLevel?: number; name: string }) =>
            i.reorderLevel && i.quantity <= i.reorderLevel,
        )
        .slice(0, 5)
        .map((i: { name: string }) => ({
          id: `ls-${i.name}`,
          message: `Low stock: ${i.name}`,
          path: "/items",
          type: "warning",
        }));

      const pendingReqs = reqs
        .filter(
          (r: { status: string; requisitionNo: string }) =>
            r.status === "Submitted",
        )
        .slice(0, 5)
        .map((r: { id: string; requisitionNo: string }) => ({
          id: `req-${r.id}`,
          message: `Pending approval: ${r.requisitionNo}`,
          path: "/purchase-requisitions",
          type: "info",
        }));

      return [...lowStock, ...pendingReqs];
    } catch {
      return [];
    }
  })();

  const count = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          data-ocid="nav.bell.button"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        data-ocid="nav.dropdown_menu"
      >
        <div className="px-3 py-2 border-b">
          <p className="font-semibold text-sm">Notifications</p>
          <p className="text-xs text-gray-500">{count} active alerts</p>
        </div>
        {count === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            No new notifications
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => navigate({ to: n.path })}
              className="flex items-start gap-2 py-2"
            >
              <div
                className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.type === "warning" ? "bg-orange-500" : "bg-blue-500"}`}
              />
              <span className="text-sm leading-tight">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function KeyboardShortcuts({
  navigateTo,
}: {
  navigateTo: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const waitingRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if focused on interactive inputs
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Toggle cheatsheet on ?
      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
        waitingRef.current = false;
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        return;
      }

      // Close modal on Escape
      if (e.key === "Escape") {
        setOpen(false);
        waitingRef.current = false;
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        return;
      }

      if (waitingRef.current) {
        // Second key in G + key sequence
        waitingRef.current = false;
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

        const shortcutMap: Record<string, string> = {
          d: "/dashboard",
          p: "/pos",
          s: "/sales",
          i: "/items",
          u: "/users",
          r: "/reports",
          a: "/chart-of-accounts",
          e: "/employees",
          b: "/banks",
          t: "/tickets",
          o: "/purchase-orders",
          c: "/customers",
        };

        const dest = shortcutMap[key];
        if (dest) {
          e.preventDefault();
          navigateTo(dest);
        }
      } else if (key === "g") {
        // First key: G — start waiting for second key
        e.preventDefault();
        waitingRef.current = true;
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          waitingRef.current = false;
        }, 1500);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [navigateTo]);

  return (
    <>
      <button
        type="button"
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Keyboard Shortcuts (?)"
        onClick={() => setOpen((prev) => !prev)}
        data-ocid="nav.keyboard_shortcuts.button"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          tabIndex={-1}
          data-ocid="nav.keyboard_shortcuts.modal"
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Keyboard className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-900 text-base">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                data-ocid="nav.keyboard_shortcuts.close_button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                      Shortcut
                    </th>
                    <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {KEYBOARD_SHORTCUTS.map((sc) => (
                    <tr key={sc.keys} className="hover:bg-slate-50">
                      <td className="py-2 pr-4">
                        <kbd className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded px-2 py-1 shadow-sm">
                          {sc.keys}
                        </kbd>
                      </td>
                      <td className="py-2 text-slate-700">{sc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl">
              <p className="text-xs text-slate-500 text-center">
                Press{" "}
                <kbd className="font-mono bg-white border border-slate-300 rounded px-1 text-slate-700">
                  G
                </kbd>{" "}
                then a letter to navigate. Press{" "}
                <kbd className="font-mono bg-white border border-slate-300 rounded px-1 text-slate-700">
                  ?
                </kbd>{" "}
                to toggle this panel.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AccessGuard() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Find the module for the current path
  const pathModule = navGroups.find((g) =>
    g.subItems?.some((s) => s.path.split("?")[0] === currentPath),
  )?.module;

  const isAccessDenied =
    pathModule && !hasPermission(pathModule) && currentPath !== "/dashboard";

  if (isAccessDenied) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <ShieldOff className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 max-w-sm">
            You do not have permission to access this page. Contact your
            administrator to request access.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-ocid="access_denied.button"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

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

  const visibleGroups = navGroups
    .filter((g) => hasPermission(g.module))
    .map((g) => {
      if (g.key === "admin" && !currentUser?.isSuperUser) {
        return {
          ...g,
          subItems: g.subItems?.filter((s) => s.path !== "/companies"),
        };
      }
      return g;
    });

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

  // Resolve active company name from localStorage
  const activeCompanyName = (() => {
    if (!currentUser?.activeCompanyId) return null;
    try {
      const companies = JSON.parse(
        localStorage.getItem("bizpos_companies") || "[]",
      );
      const c = companies.find(
        (x: { id: string }) => x.id === currentUser.activeCompanyId,
      );
      return c ? (c.name as string) : null;
    } catch {
      return null;
    }
  })();

  const SidebarItem = ({ group }: { group: NavGroup }) => {
    const Icon = group.icon;
    const active = isGroupActive(group);
    const isDirect = group.direct && group.subItems?.length === 1;

    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group relative
          ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
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

        {/* Sidebar bottom — minimal logout only (user info moved to topbar) */}
        <div className="border-t border-slate-700 p-2">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            title="Logout"
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
                      ${active ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${
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
                      className={`w-full flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm text-left ${
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
          <span className="font-bold text-slate-900 flex-1">BizPOS</span>
          <FavoritesButton navigateTo={navigateTo} currentUser={currentUser} />
          <BookmarkButton
            currentPath={currentPath}
            navigateTo={navigateTo}
            currentUser={currentUser}
          />
          <NotificationBell />
          <KeyboardShortcuts navigateTo={navigateTo} />
        </div>

        {/* Desktop topbar */}
        <div className="hidden md:flex items-center justify-between gap-1 px-4 py-2 bg-white border-b border-slate-100">
          {/* Left side — subtle app identity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium select-none">
              BizPOS
            </span>
          </div>

          {/* Right side — tools + user info */}
          <div className="flex items-center gap-1">
            <FavoritesButton
              navigateTo={navigateTo}
              currentUser={currentUser}
            />
            <BookmarkButton
              currentPath={currentPath}
              navigateTo={navigateTo}
              currentUser={currentUser}
            />
            <NotificationBell />
            <KeyboardShortcuts navigateTo={navigateTo} />

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Company name */}
            {currentUser?.activeCompanyId &&
              (currentUser?.isSuperUser ? (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/company-select" })}
                  title="Switch Company"
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
                  data-ocid="nav.company.button"
                >
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="max-w-[120px] truncate">
                    {activeCompanyName ?? "Switch Company"}
                  </span>
                </button>
              ) : (
                <span
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium"
                  data-ocid="nav.company.panel"
                >
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="max-w-[120px] truncate">
                    {activeCompanyName ?? ""}
                  </span>
                </span>
              ))}

            {/* User name + role */}
            <div
              className="flex flex-col items-end leading-none gap-0.5 px-2"
              data-ocid="nav.user.panel"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  {currentUser?.name}
                </span>
                {currentUser?.isSuperUser && (
                  <Badge className="text-[10px] px-1 py-0 bg-purple-600 text-white border-0">
                    Super
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {currentUser?.roleName}
              </span>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              data-ocid="nav.topbar.logout.button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <AccessGuard />
        </main>
      </div>
    </div>
  );
}

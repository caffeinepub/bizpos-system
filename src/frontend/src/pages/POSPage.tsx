import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, getPrefs } from "@/lib/prefs";
import {
  AlertCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  Printer,
  Search,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import type { Item } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

interface CartItem {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface HeldSale {
  id: string;
  label: string;
  cart: CartItem[];
  discount: string;
  customerId: string;
  paymentMethod: string;
  saleType: "Cash" | "Credit";
  heldAt: string;
}

interface LastSale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discountAmt: number;
  promoSavings: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  shopName: string;
  cashierName: string;
  date: string;
}

const HELD_SALES_KEY = "bizpos_pos_held_sales";

function getHeldSales(shopId: string, userId: string): HeldSale[] {
  try {
    const all = JSON.parse(localStorage.getItem(HELD_SALES_KEY) || "{}");
    return all[`${shopId}_${userId}`] || [];
  } catch {
    return [];
  }
}

function saveHeldSales(shopId: string, userId: string, held: HeldSale[]) {
  try {
    const all = JSON.parse(localStorage.getItem(HELD_SALES_KEY) || "{}");
    all[`${shopId}_${userId}`] = held;
    localStorage.setItem(HELD_SALES_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

// Reusable item card used in the POS item grid
function ItemCard({
  item,
  onAdd,
  currency,
}: {
  item: Item;
  onAdd: (item: Item) => void;
  currency: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className="p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={item.quantity === 0}
      data-ocid="pos.primary_button"
    >
      <div className="font-medium text-sm leading-tight">{item.name}</div>
      <div className="text-xs text-gray-400 mt-0.5">{item.sku}</div>
      <div className="text-primary font-bold mt-1 text-sm">
        {formatCurrency(item.salePrice, currency)}
      </div>
      <div
        className={`text-xs mt-0.5 ${item.quantity === 0 ? "text-red-500" : "text-gray-400"}`}
      >
        Stock: {item.quantity === 0 ? "Out of stock" : item.quantity}
      </div>
    </button>
  );
}

export default function POSPage() {
  const {
    items,
    warehouses,
    customers,
    sales,
    shops,
    taxes,
    promotions,
    itemCategories,
    addSale,
    addLog,
  } = useStore();
  const { currentUser, getAccessibleShopIds } = useAuth();
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [saleType, setSaleType] = useState<"Cash" | "Credit">("Cash");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [noShopWarning, setNoShopWarning] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);
  const receiptContentRef = useRef<HTMLDivElement>(null);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [heldDialogOpen, setHeldDialogOpen] = useState(false);
  const initialized = useRef(false);

  // Preferences (currency, etc.)
  const [prefs, setPrefs] = useState(getPrefs);
  useEffect(() => {
    const handler = () => setPrefs(getPrefs());
    window.addEventListener("bizpos:prefs-changed", handler);
    return () => window.removeEventListener("bizpos:prefs-changed", handler);
  }, []);

  // Load held sales when shop changes
  useEffect(() => {
    if (selectedShopId && currentUser?.id) {
      setHeldSales(getHeldSales(selectedShopId, currentUser.id));
    }
  }, [selectedShopId, currentUser?.id]);

  // Auto-apply customer group discount
  useEffect(() => {
    if (!selectedCustomer) return;
    try {
      const allCustomers = JSON.parse(
        localStorage.getItem("bizpos_customers") || "[]",
      );
      const customer = allCustomers.find(
        (c: { id: string }) => c.id === selectedCustomer,
      );
      if (!customer?.customerGroupId) return;
      const groups = JSON.parse(
        localStorage.getItem("bizpos_customer_groups") || "[]",
      );
      const group = groups.find(
        (g: { id: string }) => g.id === customer.customerGroupId,
      );
      if (group && group.discount > 0) {
        setDiscount((prev) => {
          if (prev === "0" || prev === "") return String(group.discount);
          return prev;
        });
      }
    } catch {
      /* ignore */
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const userId = currentUser?.id ?? "";
    const isAdmin =
      currentUser?.isSuperUser ||
      currentUser?.permissions?.includes("all") ||
      currentUser?.roleName?.toLowerCase() === "admin";
    const userShops = isAdmin
      ? shops.filter((s) => s.status === "Active")
      : shops.filter(
          (s) => s.status === "Active" && s.assignedUserIds.includes(userId),
        );
    const lastShopKey = `bizpos_pos_last_shop_${userId}`;
    const savedShopId = localStorage.getItem(lastShopKey);
    const savedShop = savedShopId
      ? userShops.find((s) => s.id === savedShopId)
      : null;
    if (savedShop) {
      setSelectedShopId(savedShop.id);
      setSelectedWarehouse(savedShop.warehouseId);
    } else if (userShops.length === 1) {
      setSelectedShopId(userShops[0].id);
      setSelectedWarehouse(userShops[0].warehouseId);
      localStorage.setItem(lastShopKey, userShops[0].id);
    } else if (userShops.length > 1) {
      setShopDialogOpen(true);
    } else if (userShops.length === 0 && shops.length > 0) {
      setNoShopWarning(true);
    }
  }, [currentUser, shops]);

  const accessibleShopIds = getAccessibleShopIds();
  const isAdminUser =
    currentUser?.isSuperUser ||
    currentUser?.permissions?.includes("all") ||
    currentUser?.roleName?.toLowerCase() === "admin";
  const userShops = currentUser
    ? isAdminUser
      ? shops.filter((s) => s.status === "Active")
      : shops.filter((s) => {
          const inAssigned =
            s.status === "Active" && s.assignedUserIds.includes(currentUser.id);
          const inAccessible =
            accessibleShopIds.length === 0 || accessibleShopIds.includes(s.id);
          return (
            inAssigned ||
            (accessibleShopIds.length > 0 &&
              inAccessible &&
              s.status === "Active")
          );
        })
    : [];

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  const handleSelectShop = (shopId: string) => {
    const shop = shops.find((s) => s.id === shopId);
    if (shop) {
      setSelectedShopId(shopId);
      setSelectedWarehouse(shop.warehouseId);
      setShopDialogOpen(false);
      const userId = currentUser?.id ?? "";
      localStorage.setItem(`bizpos_pos_last_shop_${userId}`, shopId);
    }
  };

  // Categories sorted by seqNo
  const sortedCategories = [...itemCategories]
    .filter((c) => c.status === "active")
    .sort((a, b) => {
      const sa = a.seqNo ?? 999;
      const sb = b.seqNo ?? 999;
      return sa !== sb ? sa - sb : a.name.localeCompare(b.name);
    });

  const warehouseItems = selectedWarehouse
    ? items.filter((i) => i.warehouseId === selectedWarehouse)
    : items;

  const categoryFilteredItems = warehouseItems.filter((i) => {
    if (selectedCategory === "all") return true;
    return i.categoryId === selectedCategory;
  });

  const filteredItems = categoryFilteredItems.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addToCart = (item: (typeof items)[0]) => {
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.itemId === item.id
            ? {
                ...c,
                quantity: c.quantity + 1,
                subtotal: (c.quantity + 1) * c.price,
              }
            : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          itemId: item.id,
          itemName: item.name,
          price: item.salePrice,
          quantity: 1,
          subtotal: item.salePrice,
        },
      ]);
    }
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.itemId !== itemId));
      return;
    }
    setCart(
      cart.map((c) =>
        c.itemId === itemId
          ? { ...c, quantity: qty, subtotal: qty * c.price }
          : c,
      ),
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.subtotal, 0);
  const discountAmt = Number.parseFloat(discount) || 0;
  const today = new Date().toISOString().slice(0, 10);

  const promoSavings = cart.reduce((total, cartItem) => {
    const storeItem = items.find((i) => i.id === cartItem.itemId);
    const category = storeItem?.category ?? "";
    const bestPromo = promotions
      .filter((p) => {
        if (p.status === "Inactive") return false;
        if (today < p.startDate || today > p.endDate) return false;
        if (p.applicableTo === "all") return true;
        if (p.applicableTo === "category")
          return p.categories.includes(category);
        if (p.applicableTo === "product")
          return p.productIds.includes(cartItem.itemId);
        return false;
      })
      .reduce((best, p) => Math.max(best, p.discountPercentage), 0);
    return total + (cartItem.subtotal * bestPromo) / 100;
  }, 0);

  const taxAmount = cart.reduce((total, cartItem) => {
    const storeItem = items.find((i) => i.id === cartItem.itemId);
    const category = storeItem?.category ?? "";
    const taxableBase = cartItem.subtotal;
    const itemTax = taxes
      .filter((t) => {
        if (t.status !== "Active") return false;
        if (t.applicableTo === "all") return true;
        if (t.applicableTo === "category")
          return t.categories.includes(category);
        if (t.applicableTo === "product")
          return t.productIds.includes(cartItem.itemId);
        return false;
      })
      .reduce((sum, t) => sum + (taxableBase * t.rate) / 100, 0);
    return total + itemTax;
  }, 0);

  const taxableAmount = Math.max(0, subtotal - discountAmt - promoSavings);
  const total = Math.max(0, taxableAmount + taxAmount);

  // --- Hold / Resume ---
  const handleHoldSale = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty — nothing to hold");
      return;
    }
    const userId = currentUser?.id ?? "guest";
    const existing = getHeldSales(selectedShopId, userId);
    const holdId = `HOLD-${Date.now()}`;
    const heldAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const label = `Hold #${existing.length + 1} — ${cart.length} item(s) — ${heldAt}`;
    const newHeld: HeldSale = {
      id: holdId,
      label,
      cart: [...cart],
      discount,
      customerId: selectedCustomer,
      paymentMethod,
      saleType,
      heldAt: new Date().toISOString(),
    };
    const updated = [...existing, newHeld];
    saveHeldSales(selectedShopId, userId, updated);
    setHeldSales(updated);
    // Clear the current cart
    setCart([]);
    setDiscount("0");
    setSelectedCustomer("");
    toast.success(`Sale held — ${label}`);
  };

  const handleResumeHeld = (held: HeldSale) => {
    if (cart.length > 0) {
      toast.error(
        "Please hold or clear the current cart first before resuming a held sale",
      );
      return;
    }
    setCart(held.cart);
    setDiscount(held.discount);
    setSelectedCustomer(held.customerId);
    setPaymentMethod(held.paymentMethod);
    setSaleType(held.saleType);
    // Remove from held list
    const userId = currentUser?.id ?? "guest";
    const updated = heldSales.filter((h) => h.id !== held.id);
    saveHeldSales(selectedShopId, userId, updated);
    setHeldSales(updated);
    setHeldDialogOpen(false);
    toast.success("Sale resumed");
  };

  const handleDeleteHeld = (heldId: string) => {
    const userId = currentUser?.id ?? "guest";
    const updated = heldSales.filter((h) => h.id !== heldId);
    saveHeldSales(selectedShopId, userId, updated);
    setHeldSales(updated);
    toast.success("Held sale removed");
  };

  const handleNewSale = () => {
    setReceiptOpen(false);
    setLastSale(null);
    setCart([]);
    setDiscount("0");
    setSelectedCustomer("");
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!selectedWarehouse) {
      toast.error("Please select a warehouse");
      return;
    }
    const customer = customers.find((c) => c.id === selectedCustomer);
    const warehouse = warehouses.find((w) => w.id === selectedWarehouse);
    if (!warehouse) {
      toast.error("Please select a warehouse");
      return;
    }
    const saleNum = sales.length + 1;
    const saleId = `SALE-${String(saleNum).padStart(3, "0")}`;
    const paidAmount = saleType === "Cash" ? total : 0;
    addSale({
      id: saleId,
      customerId: selectedCustomer || "cust-003",
      customerName: customer?.name || "Walk-in Customer",
      warehouseId: selectedWarehouse,
      warehouseName: warehouse.name,
      shopId: selectedShopId || undefined,
      shopName: selectedShop?.name || "",
      saleType,
      items: cart.map((c) => ({
        itemId: c.itemId,
        itemName: c.itemName,
        quantity: c.quantity,
        price: c.price,
        subtotal: c.subtotal,
      })),
      subtotal,
      discount: discountAmt,
      total,
      taxAmount,
      promoSavings,
      paymentMethod,
      paidAmount,
      balanceDue: total - paidAmount,
      status: saleType === "Cash" ? "Completed" : "Pending",
      saleDate: today,
      createdAt: new Date().toISOString(),
    });
    addLog(
      "POS",
      "create",
      `Sale ${saleId} completed — Total: ${total.toFixed(2)}`,
    );
    toast.success(`Sale ${saleId} completed!`);
    setLastSale({
      id: saleId,
      items: [...cart],
      subtotal,
      discountAmt,
      promoSavings,
      taxAmount,
      total,
      paymentMethod,
      customerName: customer?.name || "Walk-in Customer",
      shopName: selectedShop?.name || "",
      cashierName: currentUser?.name || "Cashier",
      date: today,
    });
    setReceiptOpen(true);
  };

  if (noShopWarning) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-20">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-6 w-6" />
                No Shop Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                No shop has been assigned to your account. Please contact your
                administrator to assign a shop before using the POS.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Shop selector dialog */}
      <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="pos.dialog"
        >
          <DialogHeader>
            <DialogTitle>Select Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {userShops.map((shop) => (
              <button
                type="button"
                key={shop.id}
                onClick={() => handleSelectShop(shop.id)}
                className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                data-ocid="pos.secondary_button"
              >
                <div className="font-medium">{shop.name}</div>
                <div className="text-sm text-gray-500">
                  {shop.warehouseName} • {shop.code}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Held Sales Dialog */}
      <Dialog open={heldDialogOpen} onOpenChange={setHeldDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="pos.held_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-orange-500" />
              Held Sales ({heldSales.length})
            </DialogTitle>
          </DialogHeader>
          {heldSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No held sales
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heldSales.map((held) => {
                  const heldTotal = held.cart.reduce(
                    (s, c) => s + c.subtotal,
                    0,
                  );
                  return (
                    <TableRow key={held.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{held.label}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(held.heldAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {held.cart.map((c) => c.itemName).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{held.cart.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(heldTotal, prefs.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleResumeHeld(held)}
                            className="h-7 text-xs"
                            data-ocid="pos.resume_button"
                          >
                            <PlayCircle className="h-3.5 w-3.5 mr-1" />
                            Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHeld(held.id)}
                            className="h-7 w-7 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-lg print:block"
          data-ocid="pos.modal"
        >
          <DialogHeader>
            <DialogTitle>Sale Completed — Receipt</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4" ref={receiptContentRef}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Sale ID:</span>{" "}
                  <span className="font-semibold">{lastSale.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>{" "}
                  <span className="font-semibold">{lastSale.date}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cashier:</span>{" "}
                  <span className="font-semibold">{lastSale.cashierName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Shop:</span>{" "}
                  <span className="font-semibold">{lastSale.shopName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Customer:</span>{" "}
                  <span className="font-semibold">{lastSale.customerName}</span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastSale.items.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell className="text-sm">{item.itemName}</TableCell>
                      <TableCell className="text-right text-sm">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.price, prefs.currency)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.subtotal, prefs.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>
                    {formatCurrency(lastSale.subtotal, prefs.currency)}
                  </span>
                </div>
                {lastSale.discountAmt > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>
                      -{formatCurrency(lastSale.discountAmt, prefs.currency)}
                    </span>
                  </div>
                )}
                {lastSale.promoSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Savings</span>
                    <span>
                      -{formatCurrency(lastSale.promoSavings, prefs.currency)}
                    </span>
                  </div>
                )}
                {lastSale.taxAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Tax</span>
                    <span>
                      +{formatCurrency(lastSale.taxAmount, prefs.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(lastSale.total, prefs.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment Method</span>
                  <span className="font-medium">{lastSale.paymentMethod}</span>
                </div>
              </div>
              <div
                className="flex gap-2 pt-2 receipt-actions"
                data-print="hide"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    const receiptEl = receiptContentRef.current;
                    if (!receiptEl) return;
                    const printWin = window.open(
                      "",
                      "_blank",
                      "width=400,height=600",
                    );
                    if (!printWin) {
                      window.print();
                      return;
                    }
                    printWin.document.write(
                      "<html><head><title>Receipt</title><style>body{font-family:sans-serif;font-size:12pt;margin:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4pt 6pt;text-align:left}th{background:#f5f5f5}.text-right{text-align:right}.font-bold{font-weight:bold}.border-t{border-top:2px solid #333;margin-top:8px;padding-top:8px}.text-primary{color:#2563eb}.text-gray-500{color:#666}.text-red-600{color:#dc2626}.text-green-600{color:#16a34a}.text-orange-600{color:#ea580c}.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px}.col-span-2{grid-column:span 2}.space-y{margin-bottom:6px}.flex-between{display:flex;justify-content:space-between}</style></head><body>",
                    );
                    printWin.document.write(receiptEl.innerHTML);
                    printWin.document.write("</body></html>");
                    printWin.document.close();
                    printWin.focus();
                    setTimeout(() => {
                      printWin.print();
                      printWin.close();
                    }, 300);
                  }}
                  className="flex-1"
                  data-ocid="pos.secondary_button"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  onClick={handleNewSale}
                  className="flex-1"
                  data-ocid="pos.primary_button"
                >
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <PageHelp pageId="pos" />
          </div>
          {selectedShop && (
            <p className="text-gray-500 mt-0.5 flex items-center gap-1.5 text-sm">
              <Store className="h-4 w-4" />
              {selectedShop.name} — {selectedShop.warehouseName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Held sales indicator */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHeldDialogOpen(true)}
            className="relative"
            data-ocid="pos.held_sales_button"
          >
            <PauseCircle className="h-4 w-4 mr-1.5 text-orange-500" />
            Held Sales
            {heldSales.length > 0 && (
              <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-orange-500">
                {heldSales.length}
              </Badge>
            )}
          </Button>
          {userShops.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShopDialogOpen(true)}
              data-ocid="pos.secondary_button"
            >
              <Store className="h-4 w-4 mr-1.5" />
              Change Shop
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex gap-3 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-36">
                  <Label className="text-xs">Warehouse</Label>
                  <Select
                    value={selectedWarehouse}
                    onValueChange={setSelectedWarehouse}
                  >
                    <SelectTrigger data-ocid="pos.select">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex-1 min-w-36">
                  <Label className="text-xs">Customer</Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Walk-in" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sale Type</Label>
                  <Select
                    value={saleType}
                    onValueChange={(v) => setSaleType(v as "Cash" | "Credit")}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-ocid="pos.search_input"
                />
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                  }`}
                >
                  All
                </button>
                {sortedCategories.map((cat) => {
                  const catItemCount = warehouseItems.filter(
                    (i) => i.categoryId === cat.id,
                  ).length;
                  if (catItemCount === 0) return null;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {cat.name}
                      <span className="ml-1 opacity-60">({catItemCount})</span>
                    </button>
                  );
                })}
              </div>

              {/* Item grid — grouped by category when "All" is selected */}
              <div className="max-h-80 overflow-y-auto space-y-4">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No items found
                  </p>
                ) : selectedCategory !== "all" ? (
                  // Single category selected — flat grid, no header needed (tab already shows category)
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onAdd={addToCart}
                        currency={prefs.currency}
                      />
                    ))}
                  </div>
                ) : (
                  // "All" selected — group by category, ordered by seqNo
                  (() => {
                    // Build ordered category groups
                    const categoriesWithItems = sortedCategories.filter((cat) =>
                      filteredItems.some((i) => i.categoryId === cat.id),
                    );
                    const uncategorisedItems = filteredItems.filter(
                      (i) =>
                        !i.categoryId ||
                        !itemCategories.find((c) => c.id === i.categoryId),
                    );
                    return (
                      <>
                        {categoriesWithItems.map((cat) => {
                          const catItems = filteredItems.filter(
                            (i) => i.categoryId === cat.id,
                          );
                          return (
                            <div key={cat.id}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                  {cat.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {catItems.length} item
                                  {catItems.length !== 1 ? "s" : ""}
                                </span>
                                <div className="flex-1 h-px bg-blue-100" />
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {catItems.map((item) => (
                                  <ItemCard
                                    key={item.id}
                                    item={item}
                                    onAdd={addToCart}
                                    currency={prefs.currency}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {uncategorisedItems.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                Uncategorised
                              </span>
                              <span className="text-xs text-gray-400">
                                {uncategorisedItems.length} item
                                {uncategorisedItems.length !== 1 ? "s" : ""}
                              </span>
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {uncategorisedItems.map((item) => (
                                <ItemCard
                                  key={item.id}
                                  item={item}
                                  onAdd={addToCart}
                                  currency={prefs.currency}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Cart */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    Cart is empty
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.itemName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.price, prefs.currency)} each
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQty(
                            item.itemId,
                            Number.parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-16 h-7 text-center text-sm"
                        min="1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQty(item.itemId, 0)}
                        className="h-7 w-7 text-red-500 shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(subtotal, prefs.currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Discount:
                  </span>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-7 text-sm"
                    min="0"
                    data-ocid="pos.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Payment Method
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="h-8" data-ocid="pos.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {promoSavings > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Promo Savings:</span>
                    <span>-{formatCurrency(promoSavings, prefs.currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Taxable Amount:</span>
                      <span>
                        {formatCurrency(taxableAmount, prefs.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Tax:</span>
                      <span>+{formatCurrency(taxAmount, prefs.currency)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">
                    {formatCurrency(total, prefs.currency)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  onClick={handleHoldSale}
                  disabled={cart.length === 0}
                  className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  data-ocid="pos.hold_button"
                >
                  <PauseCircle className="h-4 w-4 mr-1.5" />
                  Hold
                </Button>
                <Button
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0}
                  className="flex-[2] h-10"
                  data-ocid="pos.primary_button"
                >
                  Complete Sale
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

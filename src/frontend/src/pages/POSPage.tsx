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
import { AlertCircle, Search, ShoppingCart, Store, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";

interface CartItem {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  subtotal: number;
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
    addSale,
  } = useStore();
  const { currentUser } = useAuth();
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [saleType, setSaleType] = useState<"Cash" | "Credit">("Cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [noShopWarning, setNoShopWarning] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const userId = currentUser?.id ?? "";
    const userShops = shops.filter(
      (s) => s.status === "Active" && s.assignedUserIds.includes(userId),
    );
    if (userShops.length === 1) {
      setSelectedShopId(userShops[0].id);
      setSelectedWarehouse(userShops[0].warehouseId);
    } else if (userShops.length > 1) {
      setShopDialogOpen(true);
    } else if (userShops.length === 0 && shops.length > 0) {
      setNoShopWarning(true);
    }
  }, [currentUser, shops]);

  const userShops = currentUser
    ? shops.filter(
        (s) =>
          s.status === "Active" && s.assignedUserIds.includes(currentUser.id),
      )
    : [];

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  const handleSelectShop = (shopId: string) => {
    const shop = shops.find((s) => s.id === shopId);
    if (shop) {
      setSelectedShopId(shopId);
      setSelectedWarehouse(shop.warehouseId);
      setShopDialogOpen(false);
    }
  };

  const warehouseItems = selectedWarehouse
    ? items.filter((i) => i.warehouseId === selectedWarehouse)
    : items;
  const filteredItems = warehouseItems.filter(
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

  // Calculate promo savings per cart item
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

  // Calculate tax per cart item
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
      paidAmount,
      balanceDue: total - paidAmount,
      status: saleType === "Cash" ? "Completed" : "Pending",
      saleDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
    toast.success(`Sale ${saleId} completed!`);
    setCart([]);
    setDiscount("0");
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
    <div className="p-6 space-y-4">
      <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
        <DialogContent data-ocid="pos.dialog">
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          {selectedShop && (
            <p className="text-gray-600 mt-1 flex items-center gap-1.5">
              <Store className="h-4 w-4" />
              {selectedShop.name} — {selectedShop.warehouseName}
            </p>
          )}
        </div>
        {userShops.length > 1 && (
          <Button
            variant="outline"
            onClick={() => setShopDialogOpen(true)}
            data-ocid="pos.secondary_button"
          >
            <Store className="h-4 w-4 mr-2" />
            Change Shop
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-3 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-36">
                  <Label>Warehouse</Label>
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
                  <Label>Customer</Label>
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
                  <Label>Sale Type</Label>
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
            <CardContent>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-ocid="pos.search_input"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                {filteredItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    disabled={item.quantity === 0}
                    data-ocid="pos.primary_button"
                  >
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.sku}</div>
                    <div className="text-primary font-bold mt-1">
                      {item.salePrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Stock: {item.quantity}
                    </div>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <p className="col-span-3 text-center text-muted-foreground py-8">
                    No items found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Cart is empty
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {item.itemName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.price.toLocaleString()} each
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
                        className="h-7 w-7 text-red-500"
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
                  <span>{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Discount (manual):
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
                {promoSavings > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Promo Savings:</span>
                    <span>-{promoSavings.toFixed(2)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Taxable Amount:</span>
                      <span>{taxableAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Tax:</span>
                      <span>+{taxAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">{total.toLocaleString()}</span>
                </div>
              </div>
              <Button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full mt-4 h-10"
                data-ocid="pos.primary_button"
              >
                Complete Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

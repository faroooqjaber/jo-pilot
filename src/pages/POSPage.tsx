import { useState, useEffect, useRef } from "react";
import { getProducts, CartItem, saveTransaction, Transaction, Product, getVatRate } from "@/lib/store";
import { getStoreSettings, JOD_CURRENCY } from "@/lib/store-settings";
import { getLocalizedCategoryLabel } from "@/lib/product-categories";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Trash2, Printer, CheckCircle, Download } from "lucide-react";
import Receipt from "@/components/pos/Receipt";
import { toast } from "sonner";
import { toPng } from "html-to-image";

export default function POSPage() {
  const { t, dir } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const settings = getStoreSettings();
  const currencySymbol = JOD_CURRENCY.symbol;
  const vatRate = getVatRate();
  const vatPct = settings.vatRate;

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const localizedCategory = getLocalizedCategoryLabel(p.category, t).toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query) ||
      localizedCategory.includes(query)
    );
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(t("productNotAvailable"));
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(t("cannotExceedStock"));
          return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      if (newQty > i.product.stock) {
        toast.error(t("cannotExceedStock"));
        return i;
      }
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
  const tax = subtotal * vatRate;
  const total = subtotal + tax;

  const finalizeSale = () => {
    if (cart.length === 0) return;
    const transaction = saveTransaction(cart);
    setLastTransaction(transaction);
    setCart([]);
    setProducts(getProducts());
    toast.success(t("saleCompleted"));
  };

  const printReceipt = () => {
    if (receiptRef.current) window.print();
  };

  const saveReceiptAsImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      const receiptNumber = lastTransaction?.receiptNumber ?? 1;
      link.download = `receipt-${receiptNumber}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t("receiptSaved"));
    } catch {
      toast.error(t("receiptSaveFailed"));
    }
  };

  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  return (
    <div className="flex h-full" dir={dir}>
      {/* Products Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
            <Input
              placeholder={t("searchByNameOrBarcode")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${dir === "rtl" ? "pr-10" : "pl-10"} touch-target text-base`}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min">
          {filtered.map(product => {
            const lowStock = product.stock <= product.lowStockThreshold;
            const outOfStock = product.stock <= 0;
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={outOfStock}
                className={`p-4 rounded-xl border transition-all touch-target pos-shadow hover:pos-shadow-lg animate-fade-in ${dir === "rtl" ? "text-right" : "text-left"} ${
                  outOfStock
                    ? "bg-muted opacity-60 cursor-not-allowed border-border"
                    : "bg-card border-border hover:border-primary cursor-pointer active:scale-[0.97]"
                }`}
              >
                <h3 className="font-bold text-sm text-card-foreground truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{getLocalizedCategoryLabel(product.category, t)}</p>
                <p className="text-lg font-bold text-primary mt-2">{fmt(product.salePrice)}</p>
                <div className={`text-xs mt-1 font-semibold ${outOfStock ? "text-danger" : lowStock ? "text-warning" : "text-success"}`}>
                  {outOfStock ? t("outOfStock") : lowStock ? `⚠ ${t("remaining")} ${product.stock}` : `${t("stock")}: ${product.stock}`}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              {t("noMatchingProducts")}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`w-80 lg:w-96 bg-card flex flex-col ${dir === "rtl" ? "border-l" : "border-r"} border-border`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg text-card-foreground">{t("currentCart")}</h2>
          <p className="text-sm text-muted-foreground">{cart.length} {t("items")}</p>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.map(item => (
            <div key={item.product.id} className="bg-muted rounded-lg p-3 animate-slide-in">
              <div className="flex justify-between items-start">
                <button onClick={() => removeFromCart(item.product.id)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className={`${dir === "rtl" ? "text-right mr-2" : "text-left ml-2"} flex-1`}>
                  <p className="font-semibold text-sm text-foreground">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{fmt(item.product.salePrice)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-sm text-primary">{fmt(item.product.salePrice * item.quantity)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 text-secondary-foreground">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 text-secondary-foreground">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && !lastTransaction && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCartEmpty />
              <p className="mt-3">{t("cartEmpty")}</p>
              <p className="text-xs mt-1">{t("clickToAdd")}</p>
            </div>
          )}
          {lastTransaction && cart.length === 0 && (
            <div className="mt-2">
              <Receipt ref={receiptRef} transaction={lastTransaction} />
              <div className="flex gap-2 mt-3">
                <Button onClick={printReceipt} variant="outline" className="flex-1 touch-target gap-2">
                  <Printer className="w-4 h-4" />
                  {t("print")}
                </Button>
                <Button onClick={saveReceiptAsImage} variant="outline" className="flex-1 touch-target gap-2">
                  <Download className="w-4 h-4" />
                  {t("saveAsImage")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{fmt(subtotal)}</span>
              <span>{t("subtotal")}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{fmt(tax)}</span>
              <span>{t("vat")} ({vatPct}%)</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
              <span>{fmt(total)}</span>
              <span>{t("grandTotal")}</span>
            </div>
            <Button onClick={finalizeSale} className="w-full touch-target text-base gap-2 mt-2" size="lg">
              <CheckCircle className="w-5 h-5" />
              {t("finalizeSale")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingCartEmpty() {
  return (
    <svg className="w-16 h-16 mx-auto text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

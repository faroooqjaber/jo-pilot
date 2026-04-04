import { useState, useEffect, useRef } from "react";
import { getProducts, CartItem, saveTransaction, Transaction, Product, getVatRate } from "@/lib/store";
import { getStoreSettings, JOD_CURRENCY } from "@/lib/store-settings";
import { getLocalizedCategoryLabel } from "@/lib/product-categories";
import { useI18n } from "@/lib/i18n";
import { playBeep } from "@/lib/beep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Trash2, Printer, CheckCircle, Download, ShoppingCart, Maximize, Minimize, Camera } from "lucide-react";
import Receipt from "@/components/pos/Receipt";
import BarcodeScanner from "@/components/pos/BarcodeScanner";
import { toast } from "sonner";
import { toPng } from "html-to-image";

export default function POSPage() {
  const { t, dir } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const settings = getStoreSettings();
  const currencySymbol = JOD_CURRENCY.symbol;
  const vatRate = getVatRate();
  const vatPct = settings.vatRate;

  useEffect(() => { setProducts(getProducts()); }, []);

  // Communicate fullscreen state to parent layout
  useEffect(() => {
    if (fullscreen) {
      document.body.setAttribute("data-pos-fullscreen", "true");
    } else {
      document.body.removeAttribute("data-pos-fullscreen");
    }
    return () => { document.body.removeAttribute("data-pos-fullscreen"); };
  }, [fullscreen]);

  const query = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const localizedCategory = getLocalizedCategoryLabel(p.category, t).toLowerCase();
    return p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query) || localizedCategory.includes(query);
  });

  const addToCart = (product: Product, fromScan = false) => {
    if (product.stock <= 0) { toast.error(t("productNotAvailable")); return; }
    playBeep();
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error(t("cannotExceedStock")); return prev; }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Handle barcode input — check on every change if exact barcode match
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const trimmed = value.trim();
    if (trimmed.length >= 4) {
      const match = products.find(p => p.barcode === trimmed);
      if (match) {
        addToCart(match, true);
        setSearch("");
        searchRef.current?.focus();
      }
    }
  };

  const handleScanResult = (code: string) => {
    const match = products.find(p => p.barcode === code);
    if (match) {
      addToCart(match, true);
    } else {
      setSearch(code);
      toast.error(dir === "rtl" ? "لم يتم العثور على المنتج" : "Product not found");
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      if (newQty > i.product.stock) { toast.error(t("cannotExceedStock")); return i; }
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));

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

  const printReceipt = () => { if (receiptRef.current) window.print(); };

  const saveReceiptAsImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `receipt-${lastTransaction?.receiptNumber ?? 1}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t("receiptSaved"));
    } catch { toast.error(t("receiptSaveFailed")); }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setFullscreen(f => !f);
  };

  // Sync state when user exits fullscreen via Escape key
  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  const isAr = dir === "rtl";

  return (
    <>
      <div className={`flex flex-col md:flex-row h-full ${fullscreen ? "fixed inset-0 z-50 bg-background" : ""}`} dir={dir}>
        {/* Fullscreen Exit Bar */}
        {fullscreen && (
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border shrink-0">
            <span className="text-sm font-semibold text-foreground">{isAr ? "وضع ملء الشاشة" : "Fullscreen Mode"}</span>
            <Button variant="destructive" size="sm" className="gap-2 h-8" onClick={toggleFullscreen}>
              <Minimize className="w-3.5 h-3.5" />
              {isAr ? "خروج" : "Exit"}
            </Button>
          </div>
        )}
        {/* Products Grid */}
        <div className="flex-1 flex flex-col p-3 lg:p-5 overflow-hidden min-w-0">
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
              <Input
                ref={searchRef}
                placeholder={t("searchByNameOrBarcode")}
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className={`${dir === "rtl" ? "pr-10" : "pl-10"} h-11 bg-card border-border text-sm`}
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => setScannerOpen(true)}
              title={isAr ? "مسح بالكاميرا" : "Scan with camera"}
            >
              <Camera className="w-4 h-4" />
            </Button>
            {!fullscreen && (
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={toggleFullscreen}
                title={isAr ? "ملء الشاشة" : "Fullscreen"}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 auto-rows-min">
            {filtered.map(product => {
              const lowStock = product.stock <= product.lowStockThreshold;
              const outOfStock = product.stock <= 0;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={outOfStock}
                  className={`group p-3 sm:p-4 rounded-xl border transition-all duration-200 ${dir === "rtl" ? "text-right" : "text-left"} ${
                    outOfStock
                      ? "bg-muted/50 opacity-50 cursor-not-allowed border-border"
                      : "bg-card border-border hover:border-primary/40 hover:pos-shadow-hover cursor-pointer active:scale-[0.97]"
                  }`}
                >
                  <h3 className="font-semibold text-sm text-card-foreground truncate">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{getLocalizedCategoryLabel(product.category, t)}</p>
                  <p className="text-base sm:text-lg font-bold text-primary mt-1.5 sm:mt-2.5">{fmt(product.salePrice)}</p>
                  <div className={`text-[11px] mt-1 font-semibold ${outOfStock ? "text-destructive" : lowStock ? "text-warning" : "text-success"}`}>
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
        <div className={`w-full md:w-80 lg:w-[360px] bg-card flex flex-col ${dir === "rtl" ? "md:border-l" : "md:border-r"} border-t md:border-t-0 border-border max-h-[50vh] md:max-h-none`}>
          <div className="p-3 lg:p-5 border-b border-border">
            <h2 className="font-bold text-base text-card-foreground">{t("currentCart")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{cart.length} {t("items")}</p>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {cart.map(item => (
              <div key={item.product.id} className="bg-muted/50 rounded-xl p-3 animate-scale-in border border-border/50">
                <div className="flex justify-between items-start">
                  <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className={`${dir === "rtl" ? "text-right mr-2" : "text-left ml-2"} flex-1`}>
                    <p className="font-semibold text-sm text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.product.salePrice)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="font-bold text-sm text-primary">{fmt(item.product.salePrice * item.quantity)}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-secondary-foreground transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-foreground">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-secondary-foreground transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && !lastTransaction && (
              <div className="text-center py-10 sm:py-14 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-medium text-sm">{t("cartEmpty")}</p>
                <p className="text-xs mt-1">{t("clickToAdd")}</p>
              </div>
            )}
            {lastTransaction && cart.length === 0 && (
              <div className="mt-2">
                <Receipt ref={receiptRef} transaction={lastTransaction} />
                <div className="flex gap-2 mt-3">
                  <Button onClick={printReceipt} variant="outline" className="flex-1 h-10 gap-2 text-sm">
                    <Printer className="w-4 h-4" />
                    {t("print")}
                  </Button>
                  <Button onClick={saveReceiptAsImage} variant="outline" className="flex-1 h-10 gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    {t("saveAsImage")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-border space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{fmt(subtotal)}</span>
                <span>{t("subtotal")}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{fmt(tax)}</span>
                <span>{t("vat")} ({vatPct}%)</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2.5">
                <span>{fmt(total)}</span>
                <span>{t("grandTotal")}</span>
              </div>
              <Button onClick={finalizeSale} className="w-full h-12 text-sm font-semibold gap-2 mt-1" size="lg">
                <CheckCircle className="w-5 h-5" />
                {t("finalizeSale")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScanResult} />
    </>
  );
}

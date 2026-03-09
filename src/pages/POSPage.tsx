import { useState, useEffect, useRef } from "react";
import { getProducts, CartItem, saveTransaction, Transaction, Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Trash2, Printer, CheckCircle } from "lucide-react";
import Receipt from "@/components/pos/Receipt";
import { toast } from "sonner";

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const filtered = products.filter(p =>
    p.name.includes(search) || p.barcode.includes(search) || p.category.includes(search)
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("المنتج غير متوفر في المخزون");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("لا يمكن تجاوز الكمية المتوفرة");
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
        toast.error("لا يمكن تجاوز الكمية المتوفرة");
        return i;
      }
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const finalizeSale = () => {
    if (cart.length === 0) return;
    const transaction = saveTransaction(cart);
    setLastTransaction(transaction);
    setCart([]);
    setProducts(getProducts());
    toast.success("تم إتمام عملية البيع بنجاح!");
  };

  const printReceipt = () => {
    if (receiptRef.current) {
      window.print();
    }
  };

  return (
    <div className="flex h-full">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو الباركود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 touch-target text-base"
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
                className={`p-4 rounded-xl border text-right transition-all touch-target pos-shadow hover:pos-shadow-lg animate-fade-in ${
                  outOfStock
                    ? "bg-muted opacity-60 cursor-not-allowed border-border"
                    : "bg-card border-border hover:border-primary cursor-pointer active:scale-[0.97]"
                }`}
              >
                <h3 className="font-bold text-sm text-card-foreground truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                <p className="text-lg font-bold text-primary mt-2">{product.salePrice.toFixed(2)} <span className="text-xs">ر.س</span></p>
                <div className={`text-xs mt-1 font-semibold ${outOfStock ? "text-danger" : lowStock ? "text-warning" : "text-success"}`}>
                  {outOfStock ? "نفذ من المخزون" : lowStock ? `⚠ متبقي ${product.stock}` : `المخزون: ${product.stock}`}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              لا توجد منتجات مطابقة للبحث
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 lg:w-96 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg text-card-foreground">السلة الحالية</h2>
          <p className="text-sm text-muted-foreground">{cart.length} صنف</p>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.map(item => (
            <div key={item.product.id} className="bg-muted rounded-lg p-3 animate-slide-in">
              <div className="flex justify-between items-start">
                <button onClick={() => removeFromCart(item.product.id)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-right flex-1 mr-2">
                  <p className="font-semibold text-sm text-foreground">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.salePrice.toFixed(2)} ر.س</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-sm text-primary">{(item.product.salePrice * item.quantity).toFixed(2)} ر.س</span>
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
              <p className="mt-3">السلة فارغة</p>
              <p className="text-xs mt-1">اضغط على منتج لإضافته</p>
            </div>
          )}
          {lastTransaction && cart.length === 0 && (
            <div className="mt-2">
              <Receipt ref={receiptRef} transaction={lastTransaction} />
              <Button onClick={printReceipt} variant="outline" className="w-full mt-3 touch-target gap-2">
                <Printer className="w-4 h-4" />
                طباعة الفاتورة
              </Button>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{subtotal.toFixed(2)} ر.س</span>
              <span>المجموع الفرعي</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{tax.toFixed(2)} ر.س</span>
              <span>ضريبة القيمة المضافة (15%)</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
              <span>{total.toFixed(2)} ر.س</span>
              <span>الإجمالي</span>
            </div>
            <Button onClick={finalizeSale} className="w-full touch-target text-base gap-2 mt-2" size="lg">
              <CheckCircle className="w-5 h-5" />
              إتمام البيع
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

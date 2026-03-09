import { useState, useEffect } from "react";
import { getTodayStats, getLowStockProducts, getTransactions, Product, Transaction } from "@/lib/store";
import { getStoreSettings, CURRENCIES } from "@/lib/store-settings";
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalSales: 0, totalTransactions: 0 });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const settings = getStoreSettings();
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol ?? "ر.س";
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;

  useEffect(() => {
    setStats(getTodayStats());
    setLowStock(getLowStockProducts());
    setRecentTransactions(getTransactions().slice(-10).reverse());
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="إجمالي مبيعات اليوم"
          value={fmt(stats.totalSales)}
          color="primary"
        />
        <StatCard
          icon={<ShoppingBag className="w-6 h-6" />}
          label="عمليات البيع اليوم"
          value={stats.totalTransactions.toString()}
          color="accent"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="منتجات منخفضة المخزون"
          value={lowStock.length.toString()}
          color="destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            تنبيهات المخزون
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-muted-foreground text-sm">جميع المنتجات متوفرة بكميات كافية ✓</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className={`font-semibold text-sm ${p.stock <= 0 ? "text-danger" : "text-warning"}`}>
                    {p.stock <= 0 ? "نفذ" : `متبقي ${p.stock}`}
                  </span>
                  <span className="text-sm text-foreground">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            آخر العمليات
          </h2>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد عمليات بيع بعد</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="font-bold text-sm text-primary">{fmt(t.total)}</span>
                  <div className="text-right">
                    <span className="text-sm text-foreground">{t.items.length} أصناف</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date), "HH:mm - yyyy/MM/dd", { locale: ar })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-danger",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-5 pos-shadow animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || ""}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

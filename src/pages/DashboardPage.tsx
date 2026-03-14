import { useState, useEffect } from "react";
import { getTodayStats, getLowStockProducts, getTransactions, Product, Transaction } from "@/lib/store";
import { JOD_CURRENCY } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState({ totalSales: 0, totalTransactions: 0 });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const currencySymbol = JOD_CURRENCY.symbol;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;
  const locale = lang === "ar" ? ar : enUS;

  useEffect(() => {
    setStats(getTodayStats());
    setLowStock(getLowStockProducts());
    setRecentTransactions(getTransactions().slice(-10).reverse());
  }, []);

  const statCards = [
    { icon: <DollarSign className="w-5 h-5" />, label: t("todayTotalSales"), value: fmt(stats.totalSales), gradient: "from-primary to-primary-glow", iconBg: "bg-primary/10 text-primary" },
    { icon: <ShoppingBag className="w-5 h-5" />, label: t("todaySalesOps"), value: stats.totalTransactions.toString(), gradient: "from-accent to-accent", iconBg: "bg-accent/10 text-accent" },
    { icon: <AlertTriangle className="w-5 h-5" />, label: t("lowStockProducts"), value: lowStock.length.toString(), gradient: "from-destructive to-destructive", iconBg: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("dashboard")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="group bg-card border border-border rounded-2xl p-5 pos-shadow hover:pos-shadow-hover transition-all duration-300 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg} transition-transform group-hover:scale-105`}>
                {card.icon}
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stock Alerts */}
        <div className="bg-card border border-border rounded-2xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            {t("stockAlerts")}
          </h2>
          {lowStock.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">{t("allStocked")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {lowStock.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.stock <= 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                    {p.stock <= 0 ? t("depleted") : `${t("remaining")} ${p.stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-2xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            {t("recentTransactions")}
          </h2>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">{t("noTransactionsYet")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="text-sm font-medium text-foreground">{tx.items.length} {t("items")}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(tx.date), "HH:mm - yyyy/MM/dd", { locale })}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-primary">{fmt(tx.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

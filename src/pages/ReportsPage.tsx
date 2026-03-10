import { useState, useEffect, useMemo } from "react";
import { getTransactions, getProducts, Transaction } from "@/lib/store";
import { getStoreSettings, CURRENCIES } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { DollarSign, ShoppingBag, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const COLORS = [
  "hsl(160, 84%, 39%)", "hsl(38, 92%, 50%)", "hsl(220, 70%, 55%)",
  "hsl(0, 72%, 51%)", "hsl(280, 60%, 50%)", "hsl(190, 80%, 45%)",
];

type Period = "daily" | "weekly" | "monthly";

export default function ReportsPage() {
  const { t, lang } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>("daily");

  const settings = getStoreSettings();
  const cs = CURRENCIES.find(c => c.code === settings.currency)?.symbol ?? "ر.س";
  const fmt = (n: number) => `${n.toFixed(2)} ${cs}`;
  const locale = lang === "ar" ? ar : enUS;

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const totalSales = transactions.reduce((s, t) => s + t.total, 0);
    const totalOrders = transactions.length;
    const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    const products = getProducts();
    let totalProfit = 0;
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const prod = products.find(p => p.id === item.product.id);
        const cost = prod?.costPrice ?? item.product.costPrice;
        totalProfit += (item.product.salePrice - cost) * item.quantity;
      });
    });

    return { totalSales, totalOrders, avgOrder, totalProfit };
  }, [transactions]);

  // Sales trend data
  const trendData = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    const groups: Record<string, number> = {};

    if (period === "daily") {
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        groups[format(day, "yyyy-MM-dd")] = 0;
      }
      transactions.forEach(tx => {
        const key = format(new Date(tx.date), "yyyy-MM-dd");
        if (key in groups) groups[key] += tx.total;
      });
      return Object.entries(groups).map(([date, revenue]) => ({
        label: format(new Date(date), "EEE", { locale }),
        revenue,
      }));
    }

    if (period === "weekly") {
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 6 });
        groups[format(weekStart, "yyyy-MM-dd")] = 0;
      }
      transactions.forEach(tx => {
        const weekStart = startOfWeek(new Date(tx.date), { weekStartsOn: 6 });
        const key = format(weekStart, "yyyy-MM-dd");
        if (key in groups) groups[key] += tx.total;
      });
      return Object.entries(groups).map(([date, revenue]) => ({
        label: format(new Date(date), "MM/dd", { locale }),
        revenue,
      }));
    }

    // monthly
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30));
      groups[format(monthStart, "yyyy-MM")] = 0;
    }
    transactions.forEach(tx => {
      const key = format(new Date(tx.date), "yyyy-MM");
      if (key in groups) groups[key] += tx.total;
    });
    return Object.entries(groups).map(([date, revenue]) => ({
      label: format(new Date(date + "-01"), "MMM", { locale }),
      revenue,
    }));
  }, [transactions, period, locale]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const id = item.product.id;
        if (!map[id]) map[id] = { name: item.product.name, qty: 0 };
        map[id].qty += item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [transactions]);

  // Category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const cat = item.product.category || "Other";
        map[cat] = (map[cat] || 0) + item.product.salePrice * item.quantity;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const statCards = [
    { icon: <DollarSign className="w-6 h-6" />, label: t("totalSales"), value: fmt(stats.totalSales), color: "bg-primary/10 text-primary" },
    { icon: <ShoppingBag className="w-6 h-6" />, label: t("totalOrders"), value: stats.totalOrders.toString(), color: "bg-accent/10 text-accent" },
    { icon: <TrendingUp className="w-6 h-6" />, label: t("avgOrderValue"), value: fmt(stats.avgOrder), color: "bg-primary/10 text-primary" },
    { icon: <PieChartIcon className="w-6 h-6" />, label: t("totalProfit"), value: fmt(stats.totalProfit), color: "bg-accent/10 text-accent" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("reports")}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 pos-shadow animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-card border border-border rounded-xl p-5 pos-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">{t("salesOverview")}</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(p)}
              </button>
            ))}
          </div>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontFamily: "Cairo" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(160, 84%, 39%)" strokeWidth={3} dot={{ r: 5 }} name={t("revenue")} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">{t("noDataAvailable")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card border border-border rounded-xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4">{t("topSellingProducts")}</h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(160, 84%, 39%)" radius={[0, 6, 6, 0]} name={t("unitsSold")} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">{t("noDataAvailable")}</p>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-card border border-border rounded-xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4">{t("categoryDistribution")}</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">{t("noDataAvailable")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

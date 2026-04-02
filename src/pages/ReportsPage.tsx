import { useState, useEffect, useMemo } from "react";
import { getTransactions, getProducts, Transaction } from "@/lib/store";
import { JOD_CURRENCY } from "@/lib/store-settings";
import { getCategoryTranslationKey, normalizeProductCategory } from "@/lib/product-categories";
import { useI18n } from "@/lib/i18n";
import { DollarSign, ShoppingBag, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const COLORS = [
  "hsl(162, 72%, 34%)", "hsl(36, 96%, 52%)", "hsl(220, 70%, 55%)",
  "hsl(4, 76%, 56%)", "hsl(280, 60%, 50%)", "hsl(190, 80%, 45%)",
];

type Period = "daily" | "weekly" | "monthly";

export default function ReportsPage() {
  const { t, lang, dir } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>("daily");

  const cs = JOD_CURRENCY.symbol;
  const fmt = (n: number) => `${n.toFixed(2)} ${cs}`;
  const locale = lang === "ar" ? ar : enUS;

  useEffect(() => { setTransactions(getTransactions()); }, []);

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

  const trendData = useMemo(() => {
    if (transactions.length === 0) return [];
    const now = new Date();
    const groups: Record<string, number> = {};
    if (period === "daily") {
      for (let i = 6; i >= 0; i--) { const day = subDays(now, i); groups[format(day, "yyyy-MM-dd")] = 0; }
      transactions.forEach(tx => { const key = format(new Date(tx.date), "yyyy-MM-dd"); if (key in groups) groups[key] += tx.total; });
      return Object.entries(groups).map(([date, revenue]) => ({ label: format(new Date(date), "EEE", { locale }), revenue }));
    }
    if (period === "weekly") {
      for (let i = 3; i >= 0; i--) { const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 6 }); groups[format(weekStart, "yyyy-MM-dd")] = 0; }
      transactions.forEach(tx => { const weekStart = startOfWeek(new Date(tx.date), { weekStartsOn: 6 }); const key = format(weekStart, "yyyy-MM-dd"); if (key in groups) groups[key] += tx.total; });
      return Object.entries(groups).map(([date, revenue]) => ({ label: format(new Date(date), "MM/dd", { locale }), revenue }));
    }
    for (let i = 5; i >= 0; i--) { const monthStart = startOfMonth(subDays(now, i * 30)); groups[format(monthStart, "yyyy-MM")] = 0; }
    transactions.forEach(tx => { const key = format(new Date(tx.date), "yyyy-MM"); if (key in groups) groups[key] += tx.total; });
    return Object.entries(groups).map(([date, revenue]) => ({ label: format(new Date(`${date}-01`), "MMM", { locale }), revenue }));
  }, [transactions, period, locale]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    transactions.forEach(tx => { tx.items.forEach(item => { const id = item.product.id; if (!map[id]) map[id] = { name: item.product.name, qty: 0 }; map[id].qty += item.quantity; }); });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => { tx.items.forEach(item => { const categoryKey = normalizeProductCategory(item.product.category); map[categoryKey] = (map[categoryKey] || 0) + item.product.salePrice * item.quantity; }); });
    return Object.entries(map).map(([key, value]) => ({ name: t(getCategoryTranslationKey(key)), value }));
  }, [transactions, t]);

  const statCards = [
    { icon: <DollarSign className="w-5 h-5" />, label: t("totalSales"), value: fmt(stats.totalSales), iconBg: "bg-primary/10 text-primary" },
    { icon: <ShoppingBag className="w-5 h-5" />, label: t("totalOrders"), value: stats.totalOrders.toString(), iconBg: "bg-accent/10 text-accent" },
    { icon: <TrendingUp className="w-5 h-5" />, label: t("avgOrderValue"), value: fmt(stats.avgOrder), iconBg: "bg-primary/10 text-primary" },
    { icon: <PieChartIcon className="w-5 h-5" />, label: t("totalProfit"), value: fmt(stats.totalProfit), iconBg: "bg-accent/10 text-accent" },
  ];

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-7xl mx-auto" dir={dir}>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("reports")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 pos-shadow hover:pos-shadow-hover transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg}`}>{card.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                <p className="text-xl font-bold text-foreground tracking-tight">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Trend */}
      <div className="bg-card border border-border rounded-2xl p-5 pos-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground text-[15px]">{t("salesOverview")}</h2>
          <div className="flex gap-0.5 bg-muted rounded-xl p-1">
            {(["daily", "weekly", "monthly"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${period === p ? "bg-card text-foreground pos-shadow" : "text-muted-foreground hover:text-foreground"}`}>
                {t(p)}
              </button>
            ))}
          </div>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 14%, 90%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(162, 72%, 34%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(162, 72%, 34%)" }} name={t("revenue")} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-muted-foreground py-12 text-sm">{t("noDataAvailable")}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4 text-[15px]">{t("topSellingProducts")}</h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 14%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={lang === "ar" ? 120 : 100} tick={{ fontSize: 10, width: lang === "ar" ? 110 : 90 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(162, 72%, 34%)" radius={[0, 6, 6, 0]} name={t("unitsSold")} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12 text-sm">{t("noDataAvailable")}</p>}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 pos-shadow">
          <h2 className="font-bold text-foreground mb-4 text-[15px]">{t("categoryDistribution")}</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12 text-sm">{t("noDataAvailable")}</p>}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { getTodayStats, getLowStockProducts, getTransactions, Product, Transaction } from "@/lib/store";
import { JOD_CURRENCY } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, ArrowUpRight, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface JoinRequest {
  id: string; user_id: string; status: string; requested_role: AppRole;
  message: string | null; created_at: string; user_name: string; user_email: string;
}

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const { membership } = useCompany();
  const [stats, setStats] = useState({ totalSales: 0, totalTransactions: 0 });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "requests">("overview");
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);

  const isAr = lang === "ar";
  const currencySymbol = JOD_CURRENCY.symbol;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;
  const locale = lang === "ar" ? ar : enUS;

  const canManageRequests = membership?.role === "owner" || membership?.role === "supervisor" || membership?.role === "manager";

  useEffect(() => {
    setStats(getTodayStats());
    setLowStock(getLowStockProducts());
    setRecentTransactions(getTransactions().slice(-10).reverse());
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!membership?.companyId || !canManageRequests) return;
    setReqLoading(true);
    try {
      const { data, error } = await supabase
        .from("join_requests")
        .select(`id, user_id, status, requested_role, message, created_at, profiles:user_id (full_name, email)`)
        .eq("company_id", membership.companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data ?? []).map((r: any) => ({
        id: r.id, user_id: r.user_id, status: r.status, requested_role: r.requested_role,
        message: r.message, created_at: r.created_at,
        user_name: r.profiles?.full_name ?? (isAr ? "مستخدم" : "User"),
        user_email: r.profiles?.email ?? ""
      })));
    } catch { toast.error(isAr ? "فشل تحميل الطلبات" : "Failed to load requests"); }
    finally { setReqLoading(false); }
  }, [membership, canManageRequests, isAr]);

  useEffect(() => { if (activeTab === "requests") fetchRequests(); }, [activeTab, fetchRequests]);

  const [approveTarget, setApproveTarget] = useState<JoinRequest | null>(null);

  const handleReject = async (requestId: string) => {
    const { error } = await supabase.from("join_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) toast.error(isAr ? "حدث خطأ" : "Error processing");
    else { toast.success(isAr ? "تم الرفض" : "Rejected"); fetchRequests(); }
  };

  const handleApproveWithRole = async (role: "supervisor" | "cashier") => {
    if (!approveTarget) return;
    const { error } = await supabase.from("join_requests").update({ status: "approved", requested_role: role }).eq("id", approveTarget.id);
    if (error) toast.error(isAr ? "حدث خطأ" : "Error processing");
    else { toast.success(isAr ? "تم القبول" : "Approved"); fetchRequests(); }
    setApproveTarget(null);
  };

  const roleLabels: Record<AppRole, string> = {
    owner: isAr ? "صاحب العمل" : "Owner",
    manager: isAr ? "مسؤول" : "Admin",
    supervisor: isAr ? "مسؤول" : "Admin",
    cashier: isAr ? "موظف" : "Staff",
  };

  const statCards = [
    { icon: <DollarSign className="w-5 h-5" />, label: t("todayTotalSales"), value: fmt(stats.totalSales), iconBg: "bg-primary/10 text-primary" },
    { icon: <ShoppingBag className="w-5 h-5" />, label: t("todaySalesOps"), value: stats.totalTransactions.toString(), iconBg: "bg-accent/10 text-accent" },
    { icon: <AlertTriangle className="w-5 h-5" />, label: t("lowStockProducts"), value: lowStock.length.toString(), iconBg: "bg-destructive/10 text-destructive" },
  ];

  const tabs = [
    { id: "overview" as const, label: isAr ? "نظرة عامة" : "Overview" },
    ...(canManageRequests ? [{ id: "requests" as const, label: isAr ? "طلبات الانضمام" : "Join Requests" }] : []),
  ];

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("dashboard")}</h1>
      </div>

      {/* Tabs removed — team management hidden */}

      {activeTab === "overview" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className="group bg-card border border-border rounded-2xl p-5 pos-shadow hover:pos-shadow-hover transition-all duration-300 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg} transition-transform group-hover:scale-105`}>{card.icon}</div>
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
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning" /></div>
                {t("stockAlerts")}
              </h2>
              {lowStock.length === 0 ? (
                <div className="text-center py-8"><p className="text-muted-foreground text-sm">{t("allStocked")}</p></div>
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
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-primary" /></div>
                {t("recentTransactions")}
              </h2>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8"><p className="text-muted-foreground text-sm">{t("noTransactionsYet")}</p></div>
              ) : (
                <div className="space-y-1">
                  {recentTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-foreground">{tx.items.length} {t("items")}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(tx.date), "HH:mm - yyyy/MM/dd", { locale })}</p>
                      </div>
                      <span className="font-bold text-sm text-primary">{fmt(tx.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Join Requests Tab */
        <div className="bg-card border border-border rounded-2xl p-6 pos-shadow">
          <h2 className="font-bold text-foreground mb-5 flex items-center gap-2 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
            {isAr ? "طلبات بانتظار موافقتك" : "Pending Join Requests"}
          </h2>

          {reqLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 mx-auto text-primary/30 mb-3" />
              <p className="text-muted-foreground text-sm">{isAr ? "لا توجد طلبات حالياً" : "No pending requests"}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {requests.map(req => (
                <div key={req.id} className="border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-foreground">{req.user_name}</p>
                    <p className="text-xs text-muted-foreground">{req.user_email}</p>
                    <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold">
                      {roleLabels[req.requested_role]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setApproveTarget(req)} className="h-8 text-xs gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />{isAr ? "قبول" : "Approve"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)} className="text-destructive hover:bg-destructive/10 h-8 text-xs gap-1">
                      <XCircle className="w-3.5 h-3.5" />{isAr ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Assignment Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "اختر الدور" : "Assign Role"}</DialogTitle>
            <DialogDescription>
              {isAr
                ? `اختر دور "${approveTarget?.user_name}" في المتجر`
                : `Choose a role for "${approveTarget?.user_name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <Button onClick={() => handleApproveWithRole("supervisor")} className="h-12 text-sm font-semibold gap-2" variant="outline">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {isAr ? "مشرف / مسؤول" : "Supervisor / Admin"}
            </Button>
            <Button onClick={() => handleApproveWithRole("cashier")} className="h-12 text-sm font-semibold gap-2" variant="outline">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {isAr ? "موظف / كاشير" : "Staff / Cashier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

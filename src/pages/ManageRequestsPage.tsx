import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Users, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface JoinRequest {
  id: string; user_id: string; status: string; requested_role: AppRole;
  message: string | null; created_at: string; user_name: string; user_email: string;
}

interface Member {
  id: string; user_id: string; role: AppRole; user_name: string; user_email: string;
}

export default function ManageRequestsPage() {
  const { lang, dir } = useI18n();
  const { membership } = useCompany();
  const isAr = lang === "ar";

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = membership?.role === "owner" || membership?.role === "manager";
  const roleLabels: Record<AppRole, string> = {
    owner: isAr ? "مالك" : "Owner", manager: isAr ? "مدير" : "Manager",
    supervisor: isAr ? "مشرف" : "Supervisor", cashier: isAr ? "كاشير" : "Cashier",
  };

  const fetchData = useCallback(async () => {
    if (!membership) return;
    setLoading(true);
    const { data: reqData } = await supabase.from("join_requests").select("id, user_id, status, requested_role, message, created_at, profiles(full_name, email)").eq("company_id", membership.companyId).eq("status", "pending").order("created_at", { ascending: false });
    setRequests((reqData ?? []).map((r: any) => ({ id: r.id, user_id: r.user_id, status: r.status, requested_role: r.requested_role, message: r.message, created_at: r.created_at, user_name: r.profiles?.full_name ?? "", user_email: r.profiles?.email ?? "" })));
    const { data: memData } = await supabase.from("company_members").select("id, user_id, role, profiles(full_name, email)").eq("company_id", membership.companyId).order("created_at", { ascending: true });
    setMembers((memData ?? []).map((m: any) => ({ id: m.id, user_id: m.user_id, role: m.role, user_name: m.profiles?.full_name ?? "", user_email: m.profiles?.email ?? "" })));
    setLoading(false);
  }, [membership]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRequest = async (requestId: string, action: "approved" | "rejected") => {
    const { error } = await supabase.from("join_requests").update({ status: action }).eq("id", requestId);
    if (error) toast.error(isAr ? "حدث خطأ" : "An error occurred");
    else { toast.success(action === "approved" ? (isAr ? "تم قبول الطلب" : "Request approved") : (isAr ? "تم رفض الطلب" : "Request rejected")); fetchData(); }
  };

  const handleUpdateRole = async (memberId: string, newRole: AppRole) => {
    const { error } = await supabase.from("company_members").update({ role: newRole }).eq("id", memberId);
    if (error) toast.error(isAr ? "فشل تحديث الدور" : "Failed to update role");
    else { toast.success(isAr ? "تم تحديث الدور" : "Role updated"); fetchData(); }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from("company_members").delete().eq("id", memberId);
    if (error) toast.error(isAr ? "فشل إزالة العضو" : "Failed to remove member");
    else { toast.success(isAr ? "تم إزالة العضو" : "Member removed"); fetchData(); }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-8" dir={dir}>
      <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
        {isAr ? "إدارة الفريق" : "Team Management"}
      </h1>

      {/* Pending Requests */}
      {canManage && (
        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {isAr ? "طلبات الانضمام" : "Join Requests"}
            {requests.length > 0 && <span className="bg-accent/15 text-accent text-[11px] font-bold px-2 py-0.5 rounded-full">{requests.length}</span>}
          </h2>

          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm bg-card border border-border rounded-xl p-5 text-center">{isAr ? "لا توجد طلبات جديدة" : "No pending requests"}</p>
          ) : (
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:pos-shadow-hover transition-all duration-300">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">{req.user_name || req.user_email}</p>
                    <p className="text-xs text-muted-foreground">{req.user_email}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{isAr ? "الدور المطلوب:" : "Requested role:"} <span className="font-medium">{roleLabels[req.requested_role]}</span></p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" onClick={() => handleRequest(req.id, "approved")} className="gap-1 h-8 px-3 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />{isAr ? "قبول" : "Approve"}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, "rejected")} className="gap-1 h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"><XCircle className="w-3.5 h-3.5" />{isAr ? "رفض" : "Reject"}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Members */}
      <section>
        <h2 className="text-[15px] font-semibold text-foreground mb-3">{isAr ? "أعضاء الفريق" : "Team Members"}</h2>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:pos-shadow-hover transition-all duration-300">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate text-foreground">{member.user_name || member.user_email}</p>
                <p className="text-xs text-muted-foreground">{member.user_email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canManage && member.role !== "owner" ? (
                  <>
                    <select value={member.role} onChange={e => handleUpdateRole(member.id, e.target.value as AppRole)} className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="manager">{roleLabels.manager}</option>
                      <option value="supervisor">{roleLabels.supervisor}</option>
                      <option value="cashier">{roleLabels.cashier}</option>
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)} className="w-8 h-8 p-0 hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">{roleLabels[member.role]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Trash2, UserPlus, Copy, LogOut as LogOutIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: string; user_id: string; role: AppRole; user_name: string; user_email: string;
}

interface JoinRequest {
  id: string; user_id: string; status: string; requested_role: AppRole;
  created_at: string; user_name: string; user_email: string;
}

export default function ManageRequestsPage() {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const { membership, refresh } = useCompany();
  const isAr = lang === "ar";

  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "requests">("members");
  const [approveTarget, setApproveTarget] = useState<JoinRequest | null>(null);

  const canManage = membership?.role === "owner" || membership?.role === "manager" || membership?.role === "supervisor";
  const canResign = membership?.role !== "owner";

  const roleLabels: Record<AppRole, string> = {
    owner: isAr ? "صاحب العمل" : "Owner",
    manager: isAr ? "مسؤول" : "Admin",
    supervisor: isAr ? "مشرف" : "Supervisor",
    cashier: isAr ? "كاشير" : "Cashier",
  };

  const fetchMembers = useCallback(async () => {
    if (!membership?.companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_members")
        .select(`id, user_id, role, profiles:user_id (full_name, email)`)
        .eq("company_id", membership.companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMembers((data ?? []).map((m: any) => ({
        id: m.id, user_id: m.user_id, role: m.role,
        user_name: m.profiles?.full_name ?? (isAr ? "عضو" : "Member"),
        user_email: m.profiles?.email ?? ""
      })));
    } catch { toast.error(isAr ? "فشل تحميل البيانات" : "Failed to load data"); }
    finally { setLoading(false); }
  }, [membership, isAr]);

  const fetchRequests = useCallback(async () => {
    if (!membership?.companyId || !canManage) return;
    setReqLoading(true);
    try {
      const { data, error } = await supabase
        .from("join_requests")
        .select(`id, user_id, status, requested_role, created_at, profiles:user_id (full_name, email)`)
        .eq("company_id", membership.companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data ?? []).map((r: any) => ({
        id: r.id, user_id: r.user_id, status: r.status, requested_role: r.requested_role,
        created_at: r.created_at,
        user_name: r.profiles?.full_name ?? (isAr ? "مستخدم" : "User"),
        user_email: r.profiles?.email ?? ""
      })));
    } catch { toast.error(isAr ? "فشل تحميل الطلبات" : "Failed to load requests"); }
    finally { setReqLoading(false); }
  }, [membership, canManage, isAr]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { if (canManage) fetchRequests(); }, [fetchRequests, canManage]);

  const copyStoreId = () => {
    if (membership?.companyId) {
      navigator.clipboard.writeText(membership.companyId);
      toast.success(isAr ? "تم نسخ رمز المتجر!" : "Store code copied!");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من إزالة هذا العضو؟" : "Remove this member?")) return;
    const { error } = await supabase.from("company_members").delete().eq("id", memberId);
    if (error) toast.error(isAr ? "فشل الإزالة" : "Failed");
    else { toast.success(isAr ? "تمت الإزالة" : "Removed"); fetchMembers(); }
  };

  const handleResign = async () => {
    if (!user || !membership) return;
    if (!confirm(isAr ? "هل أنت متأكد من الاستقالة؟" : "Are you sure you want to resign?")) return;
    const myMembership = members.find(m => m.user_id === user.id);
    if (!myMembership) return;
    const { error } = await supabase.from("company_members").delete().eq("id", myMembership.id);
    if (error) toast.error(isAr ? "فشلت الاستقالة" : "Failed to resign");
    else { toast.success(isAr ? "تم الاستقالة بنجاح" : "Resigned successfully"); await refresh(); }
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase.from("join_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) toast.error(isAr ? "حدث خطأ" : "Error");
    else { toast.success(isAr ? "تم الرفض" : "Rejected"); fetchRequests(); }
  };

  const handleApproveWithRole = async (role: "supervisor" | "cashier") => {
    if (!approveTarget) return;
    const { error } = await supabase.from("join_requests").update({ status: "approved", requested_role: role }).eq("id", approveTarget.id);
    if (error) toast.error(isAr ? "حدث خطأ" : "Error");
    else { toast.success(isAr ? "تم القبول وتعيين الدور" : "Approved and role assigned"); fetchRequests(); fetchMembers(); }
    setApproveTarget(null);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const tabs = [
    { id: "members" as const, label: isAr ? "الأعضاء" : "Members" },
    ...(canManage ? [{ id: "requests" as const, label: isAr ? "طلبات الانضمام" : "Join Requests" }] : []),
  ];

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6" dir={dir}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
          {isAr ? "فريق العمل" : "Team"}
        </h1>
        <div className="flex gap-2">
          {canManage && (
            <Button onClick={copyStoreId} variant="outline" className="gap-2 text-xs border-dashed border-primary">
              <UserPlus size={16} /> {isAr ? "دعوة" : "Invite"}
            </Button>
          )}
          {canResign && (
            <Button onClick={handleResign} variant="outline" className="gap-2 text-xs border-dashed border-destructive text-destructive hover:bg-destructive/10">
              <LogOutIcon size={16} /> {isAr ? "استقالة" : "Resign"}
            </Button>
          )}
        </div>
      </div>

      {/* Store Code */}
      {canManage && membership?.companyId && (
        <div className="bg-muted/50 border border-border rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{isAr ? "رمز المتجر (شاركه مع الموظف)" : "Store Code (share with staff)"}</p>
            <p className="text-xs font-mono text-foreground mt-0.5 select-all">{membership.companyId}</p>
          </div>
          <Button onClick={copyStoreId} size="sm" variant="ghost" className="h-8 w-8 p-0"><Copy size={14} /></Button>
        </div>
      )}

      {/* Tabs */}
      {canManage && (
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
              {tab.id === "requests" && requests.length > 0 && (
                <span className="ms-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">{requests.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === "members" ? (
        <div className="grid gap-3">
          {members.map(member => (
            <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                  {member.user_name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{member.user_name}</p>
                  <p className="text-xs text-muted-foreground">{member.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{roleLabels[member.role]}</span>
                {canManage && member.role !== "owner" && member.user_id !== user?.id && (
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)} className="h-8 w-8 p-0 text-destructive">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Join Requests Tab */
        <div className="bg-card border border-border rounded-2xl p-6">
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
                    <p className="text-xs text-muted-foreground">Email: {req.user_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setApproveTarget(req)} className="h-8 text-xs gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />{isAr ? "موافق" : "Approve"}
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
              {isAr ? "مشرف" : "Supervisor"}
            </Button>
            <Button onClick={() => handleApproveWithRole("cashier")} className="h-12 text-sm font-semibold gap-2" variant="outline">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {isAr ? "كاشير" : "Cashier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

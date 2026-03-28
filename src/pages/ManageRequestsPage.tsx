import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Users, Loader2, Trash2, UserPlus, Copy } from "lucide-react";
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
    owner: isAr ? "مالك" : "Owner", 
    manager: isAr ? "مدير" : "Manager",
    supervisor: isAr ? "مشرف" : "Supervisor", 
    cashier: isAr ? "كاشير" : "Cashier",
  };

  const fetchData = useCallback(async () => {
    if (!membership?.companyId) return;
    setLoading(true);
    try {
      // جلب طلبات الانضمام المعلقة
      const { data: reqData, error: reqError } = await supabase
        .from("join_requests")
        .select(`
          id, user_id, status, requested_role, message, created_at,
          profiles:user_id (full_name, email)
        `)
        .eq("company_id", membership.companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;

      setRequests((reqData ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        requested_role: r.requested_role,
        message: r.message,
        created_at: r.created_at,
        user_name: r.profiles?.full_name ?? (isAr ? "مستخدم غير معروف" : "Unknown User"),
        user_email: r.profiles?.email ?? ""
      })));

      // جلب أعضاء الفريق الحاليين
      const { data: memData, error: memError } = await supabase
        .from("company_members")
        .select(`
          id, user_id, role,
          profiles:user_id (full_name, email)
        `)
        .eq("company_id", membership.companyId)
        .order("created_at", { ascending: true });

      if (memError) throw memError;

      setMembers((memData ?? []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        user_name: m.profiles?.full_name ?? (isAr ? "عضو" : "Member"),
        user_email: m.profiles?.email ?? ""
      })));
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast.error(isAr ? "فشل في تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [membership, isAr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyStoreId = () => {
    if (membership?.companyId) {
      navigator.clipboard.writeText(membership.companyId);
      toast.success(isAr ? "تم نسخ معرف المتجر! أرسله للموظف لينضم إليك" : "Store ID copied! Send it to the employee to join.");
    }
  };

  const handleRequest = async (requestId: string, action: "approved" | "rejected") => {
    const { error } = await supabase.from("join_requests").update({ status: action }).eq("id", requestId);
    if (error) {
      toast.error(isAr ? "حدث خطأ أثناء معالجة الطلب" : "Error processing request");
    } else {
      toast.success(action === "approved" ? (isAr ? "تم قبول الموظف بنجاح" : "Employee approved") : (isAr ? "تم رفض الطلب" : "Request rejected"));
      fetchData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من إزالة هذا العضو؟" : "Are you sure you want to remove this member?")) return;
    const { error } = await supabase.from("company_members").delete().eq("id", memberId);
    if (error) toast.error(isAr ? "فشل إزالة العضو" : "Failed to remove member");
    else {
      toast.success(isAr ? "تمت الإزالة بنجاح" : "Removed successfully");
      fetchData();
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-8" dir={dir}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
          {isAr ? "إدارة فريق Jo Pilot" : "Jo Pilot Team Management"}
        </h1>
        {canManage && (
          <Button onClick={copyStoreId} variant="outline" className="gap-2 text-xs border-dashed border-primary">
            <UserPlus size={16} /> {isAr ? "دعوة موظف" : "Invite Employee"}
          </Button>
        )}
      </div>

      {/* قسم طلبات الانضمام */}
      {canManage && (
        <section className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5">
          <h2 className="text-[15px] font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {isAr ? "طلبات بانتظار موافقتك" : "Requests Pending Approval"}
            {requests.length > 0 && <span className="bg-orange-200 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded-full">{requests.length}</span>}
          </h2>

          {requests.length === 0 ? (
            <p className="text-orange-700/60 text-sm text-center italic">{isAr ? "لا توجد طلبات توظيف حالياً" : "No hiring requests right now"}</p>
          ) : (
            <div className="grid gap-3">
              {requests.map(req => (
                <div key={req.id} className="bg-white border border-orange-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-bold text-sm text-orange-950">{req.user_name}</p>
                    <p className="text-xs text-orange-800/70">{req.user_email}</p>
                    <span className="inline-block mt-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase font-bold">
                      {roleLabels[req.requested_role]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRequest(req.id, "approved")} className="bg-green-600 hover:bg-green-700 h-8 text-xs">{isAr ? "قبول" : "Approve"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRequest(req.id, "rejected")} className="text-red-600 hover:bg-red-50 h-8 text-xs">{isAr ? "رفض" : "Reject"}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* قسم أعضاء الفريق */}
      <section>
        <h2 className="text-[15px] font-semibold text-foreground mb-4">{isAr ? "الموظفون الحاليون" : "Current Staff"}</h2>
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
                <span className="text-[11px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                  {roleLabels[member.role]}
                </span>
                {canManage && member.role !== "owner" && (
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)} className="h-8 w-8 p-0 text-destructive">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

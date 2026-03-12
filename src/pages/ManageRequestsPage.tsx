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
  id: string;
  user_id: string;
  status: string;
  requested_role: AppRole;
  message: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface Member {
  id: string;
  user_id: string;
  role: AppRole;
  user_name: string;
  user_email: string;
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
    if (!membership) return;
    setLoading(true);

    // Fetch pending requests
    const { data: reqData } = await supabase
      .from("join_requests")
      .select("id, user_id, status, requested_role, message, created_at, profiles(full_name, email)")
      .eq("company_id", membership.companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setRequests(
      (reqData ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        requested_role: r.requested_role,
        message: r.message,
        created_at: r.created_at,
        user_name: r.profiles?.full_name ?? "",
        user_email: r.profiles?.email ?? "",
      }))
    );

    // Fetch members
    const { data: memData } = await supabase
      .from("company_members")
      .select("id, user_id, role, profiles(full_name, email)")
      .eq("company_id", membership.companyId)
      .order("created_at", { ascending: true });

    setMembers(
      (memData ?? []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        user_name: m.profiles?.full_name ?? "",
        user_email: m.profiles?.email ?? "",
      }))
    );

    setLoading(false);
  }, [membership]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequest = async (requestId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("join_requests")
      .update({ status: action })
      .eq("id", requestId);

    if (error) {
      toast.error(isAr ? "حدث خطأ" : "An error occurred");
    } else {
      toast.success(action === "approved"
        ? (isAr ? "تم قبول الطلب" : "Request approved")
        : (isAr ? "تم رفض الطلب" : "Request rejected")
      );
      fetchData();
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("company_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast.error(isAr ? "فشل تحديث الدور" : "Failed to update role");
    } else {
      toast.success(isAr ? "تم تحديث الدور" : "Role updated");
      fetchData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("company_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error(isAr ? "فشل إزالة العضو" : "Failed to remove member");
    } else {
      toast.success(isAr ? "تم إزالة العضو" : "Member removed");
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8" dir={dir}>
      <h1 className="text-2xl font-bold text-foreground">
        <Users className="w-6 h-6 inline ltr:mr-2 rtl:ml-2" />
        {isAr ? "إدارة الفريق" : "Team Management"}
      </h1>

      {/* Pending Requests */}
      {canManage && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            <Clock className="w-5 h-5 inline ltr:mr-1 rtl:ml-1" />
            {isAr ? "طلبات الانضمام" : "Join Requests"}
            {requests.length > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full ltr:ml-2 rtl:mr-2">
                {requests.length}
              </span>
            )}
          </h2>

          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm bg-card border border-border rounded-lg p-4">
              {isAr ? "لا توجد طلبات جديدة" : "No pending requests"}
            </p>
          ) : (
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{req.user_name || req.user_email}</p>
                    <p className="text-xs text-muted-foreground">{req.user_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? "الدور المطلوب:" : "Requested role:"} {roleLabels[req.requested_role]}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleRequest(req.id, "approved")} className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {isAr ? "قبول" : "Approve"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRequest(req.id, "rejected")} className="gap-1">
                      <XCircle className="w-3 h-3" />
                      {isAr ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          {isAr ? "أعضاء الفريق" : "Team Members"}
        </h2>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{member.user_name || member.user_email}</p>
                <p className="text-xs text-muted-foreground">{member.user_email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canManage && member.role !== "owner" ? (
                  <>
                    <select
                      value={member.role}
                      onChange={e => handleUpdateRole(member.id, e.target.value as AppRole)}
                      className="text-xs bg-muted border border-border rounded-md px-2 py-1 text-foreground"
                    >
                      <option value="manager">{roleLabels.manager}</option>
                      <option value="supervisor">{roleLabels.supervisor}</option>
                      <option value="cashier">{roleLabels.cashier}</option>
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {roleLabels[member.role]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

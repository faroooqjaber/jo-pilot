import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Trash2, UserPlus, Copy, LogOut as LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: string; user_id: string; role: AppRole; user_name: string; user_email: string;
}

export default function ManageRequestsPage() {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const { membership, refresh } = useCompany();
  const isAr = lang === "ar";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = membership?.role === "owner" || membership?.role === "manager" || membership?.role === "supervisor";
  const canResign = membership?.role !== "owner";

  const roleLabels: Record<AppRole, string> = {
    owner: isAr ? "صاحب العمل" : "Owner",
    manager: isAr ? "مسؤول" : "Admin",
    supervisor: isAr ? "مسؤول" : "Admin",
    cashier: isAr ? "موظف" : "Staff",
  };

  const fetchData = useCallback(async () => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyStoreId = () => {
    if (membership?.companyId) {
      navigator.clipboard.writeText(membership.companyId);
      toast.success(isAr ? "تم نسخ كود المتجر! أرسله للموظف لينضم" : "Store code copied!");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من إزالة هذا العضو؟" : "Remove this member?")) return;
    const { error } = await supabase.from("company_members").delete().eq("id", memberId);
    if (error) toast.error(isAr ? "فشل الإزالة" : "Failed");
    else { toast.success(isAr ? "تمت الإزالة" : "Removed"); fetchData(); }
  };

  const handleResign = async () => {
    if (!user || !membership) return;
    if (!confirm(isAr ? "هل أنت متأكد من الاستقالة من هذا المتجر؟ لن تتمكن من الوصول بعد ذلك." : "Are you sure you want to resign? You will lose access to this store.")) return;

    // Find current user's membership row
    const myMembership = members.find(m => m.user_id === user.id);
    if (!myMembership) return;

    const { error } = await supabase.from("company_members").delete().eq("id", myMembership.id);
    if (error) {
      toast.error(isAr ? "فشلت الاستقالة" : "Failed to resign");
    } else {
      toast.success(isAr ? "تم الاستقالة بنجاح" : "You have resigned successfully");
      await refresh();
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

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
              <UserPlus size={16} /> {isAr ? "دعوة موظف" : "Invite"}
            </Button>
          )}
          {canResign && (
            <Button onClick={handleResign} variant="outline" className="gap-2 text-xs border-dashed border-destructive text-destructive hover:bg-destructive/10">
              <LogOutIcon size={16} /> {isAr ? "استقالة" : "Resign"}
            </Button>
          )}
        </div>
      </div>

      {/* Store Code display for admins */}
      {canManage && membership?.companyId && (
        <div className="bg-muted/50 border border-border rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{isAr ? "كود المتجر (أرسله للموظف)" : "Store Code (share with staff)"}</p>
            <p className="text-xs font-mono text-foreground mt-0.5 select-all">{membership.companyId}</p>
          </div>
          <Button onClick={copyStoreId} size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Copy size={14} />
          </Button>
        </div>
      )}

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
    </div>
  );
}

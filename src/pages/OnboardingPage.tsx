import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBasket, Loader2, Plus, CheckCircle2, Clock, XCircle, Hash, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const companyNameSchema = z.string().trim().min(2).max(100);

type Tab = "create" | "join";

const companyTypes = [
  { value: "retail", ar: "متجر تجزئة", en: "Retail Store" },
  { value: "restaurant", ar: "مطعم", en: "Restaurant" },
  { value: "services", ar: "خدمات", en: "Services" },
  { value: "wholesale", ar: "جملة", en: "Wholesale" },
  { value: "other", ar: "أخرى", en: "Other" },
];

export default function OnboardingPage() {
  const { lang, dir } = useI18n();
  const { user, signOut } = useAuth();
  const { refresh } = useCompany();
  const isAr = lang === "ar";

  const [tab, setTab] = useState<Tab>("create");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("retail");
  const [joinCode, setJoinCode] = useState("");
  const [myRequests, setMyRequests] = useState<{ id: string; company_name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [hasPending, setHasPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const checkPendingRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("join_requests")
      .select("id, status, companies(name)")
      .eq("user_id", user.id)
      .eq("status", "pending");

    const pending = data && data.length > 0;
    setHasPending(!!pending);
    setMyRequests((data ?? []).map((r: any) => ({ id: r.id, company_name: r.companies?.name ?? "", status: r.status })));
    setCheckingPending(false);
  }, [user]);

  useEffect(() => {
    checkPendingRequests();
  }, [checkPendingRequests]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    // Check if any request got approved (user now has membership)
    await refresh();
    await checkPendingRequests();
    setRefreshing(false);
  };

  const handleCreateCompany = async () => {
    const result = companyNameSchema.safeParse(companyName);
    if (!result.success) { toast.error(isAr ? "اسم الشركة يجب أن يكون حرفين على الأقل" : "Min 2 characters"); return; }
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("companies").insert({ name: result.data, owner_id: user.id, company_type: companyType });
    setLoading(false);
    if (error) toast.error(isAr ? "فشل إنشاء الشركة" : "Failed");
    else { toast.success(isAr ? "تم إنشاء الشركة!" : "Company created!"); await refresh(); }
  };

  const handleJoinByCode = async () => {
    const code = joinCode.trim();
    if (!code || code.length < 8) {
      toast.error(isAr ? "أدخل كود المتجر الصحيح" : "Enter a valid store code");
      return;
    }
    if (!user) return;
    setLoading(true);

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", code)
      .maybeSingle();

    if (companyError || !company) {
      toast.error(isAr ? "لم يتم العثور على متجر بهذا الكود" : "No store found with this code");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("join_requests").insert({ company_id: company.id, user_id: user.id, requested_role: "cashier" });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error(isAr ? "لقد أرسلت طلبًا بالفعل" : "Already sent");
      else toast.error(isAr ? "فشل الإرسال" : "Failed");
    } else {
      toast.success(isAr ? `تم إرسال طلب الانضمام إلى "${company.name}"!` : `Join request sent to "${company.name}"!`);
      setHasPending(true);
      checkPendingRequests();
    }
  };

  const fetchMyRequests = async () => {
    if (!user) return;
    const { data: requests } = await supabase.from("join_requests").select("id, status, companies(name)").eq("user_id", user.id);
    setMyRequests((requests ?? []).map((r: any) => ({ id: r.id, company_name: r.companies?.name ?? "", status: r.status })));
  };

  const handleTabSwitch = (t: Tab) => {
    setTab(t);
    if (t === "join") fetchMyRequests();
  };

  if (checkingPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show waiting screen if user has pending requests
  if (hasPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isAr ? "بانتظار الموافقة" : "Waiting for Approval"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isAr
              ? "تم إرسال طلبك بنجاح. سيقوم صاحب المتجر أو المسؤول بمراجعة طلبك."
              : "Your request has been sent. The store owner or admin will review it."}
          </p>

          {myRequests.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              {myRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-foreground">{req.company_name}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {isAr ? "قيد الانتظار" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleRefreshStatus} className="h-11 px-6 font-semibold gap-2" disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isAr ? "تحديث الحالة" : "Refresh Status"}
          </Button>

          <div className="mt-4">
            <button onClick={() => setHasPending(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {isAr ? "إنشاء متجر جديد بدلاً من ذلك" : "Create a new store instead"}
            </button>
          </div>

          <div className="mt-5">
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {isAr ? "تسجيل الخروج" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/25 border border-primary/20">
            <ShoppingBasket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">JO Pilot</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{isAr ? "أنشئ متجرك أو انضم لمتجر موجود" : "Create or join a store"}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden pos-shadow">
          <div className="flex">
            {(["create", "join"] as Tab[]).map(t => (
              <button key={t} onClick={() => handleTabSwitch(t)}
                className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}>
                {t === "create" ? <Plus className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                {t === "create" ? (isAr ? "إنشاء متجر" : "Create Store") : (isAr ? "الانضمام بكود" : "Join by Code")}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === "create" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "اسم المتجر" : "Store Name"}</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isAr ? "مثال: متجر السعادة" : "e.g. Happy Store"} maxLength={100} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "نوع النشاط" : "Business Type"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {companyTypes.map(ct => (
                      <button key={ct.value} onClick={() => setCompanyType(ct.value)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          companyType === ct.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                        }`}>
                        {isAr ? ct.ar : ct.en}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateCompany} className="w-full h-11 font-semibold" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                  {isAr ? "إنشاء المتجر" : "Create Store"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "كود المتجر (المعرّف)" : "Store Code (ID)"}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.trim())}
                      placeholder={isAr ? "الصق كود المتجر هنا..." : "Paste store code here..."}
                      maxLength={100}
                      className="h-10 font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "اطلب الكود من صاحب المتجر أو المسؤول" : "Ask the store owner or admin for the code"}
                  </p>
                </div>

                <Button onClick={handleJoinByCode} className="w-full h-10 font-semibold" disabled={loading || !joinCode.trim()}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                  {isAr ? "إرسال طلب انضمام" : "Send Join Request"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-5">
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            {isAr ? "تسجيل الخروج" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
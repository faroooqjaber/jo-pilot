import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Search, Loader2, Send, Plus, CheckCircle2, Clock, XCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const companyNameSchema = z.string().trim().min(2).max(100);

type Tab = "create" | "join";

export default function OnboardingPage() {
  const { lang, dir } = useI18n();
  const { user, signOut } = useAuth();
  const { refresh } = useCompany();
  const isAr = lang === "ar";

  const [tab, setTab] = useState<Tab>("create");
  const [companyName, setCompanyName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [myRequests, setMyRequests] = useState<{ id: string; company_name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCreateCompany = async () => {
    const result = companyNameSchema.safeParse(companyName);
    if (!result.success) { toast.error(isAr ? "اسم الشركة يجب أن يكون حرفين على الأقل" : "Company name must be at least 2 characters"); return; }
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("companies").insert({ name: result.data, owner_id: user.id });
    setLoading(false);
    if (error) toast.error(isAr ? "فشل إنشاء الشركة" : "Failed to create company");
    else { toast.success(isAr ? "تم إنشاء الشركة بنجاح!" : "Company created!"); await refresh(); }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.from("companies").select("id, name").ilike("name", `%${searchQuery.trim()}%`).limit(10);
    setSearchResults(data ?? []);
    if (user) {
      const { data: requests } = await supabase.from("join_requests").select("id, status, companies(name)").eq("user_id", user.id);
      setMyRequests((requests ?? []).map((r: any) => ({ id: r.id, company_name: r.companies?.name ?? "", status: r.status })));
    }
    setLoading(false);
  };

  const handleJoinRequest = async (companyId: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("join_requests").insert({ company_id: companyId, user_id: user.id, requested_role: "cashier" });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error(isAr ? "لقد أرسلت طلبًا بالفعل" : "You already sent a request");
      else toast.error(isAr ? "فشل إرسال الطلب" : "Failed to send request");
    } else { toast.success(isAr ? "تم إرسال طلب الانضمام!" : "Join request sent!"); handleSearch(); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <ShoppingCart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{isAr ? "مرحبًا بك!" : "Welcome!"}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{isAr ? "أنشئ شركتك أو انضم لشركة موجودة" : "Create your company or join an existing one"}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden pos-shadow">
          <div className="flex">
            {(["create", "join"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                {t === "create" ? <Plus className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {t === "create" ? (isAr ? "إنشاء شركة" : "Create Company") : (isAr ? "انضم لشركة" : "Join Company")}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === "create" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "اسم الشركة" : "Company Name"}</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isAr ? "مثال: متجر السعادة" : "e.g. Happy Store"} maxLength={100} className="h-11" />
                </div>
                <Button onClick={handleCreateCompany} className="w-full h-11 font-semibold" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                  {isAr ? "إنشاء الشركة" : "Create Company"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "ابحث عن شركة" : "Search for a company"}</Label>
                  <div className="flex gap-2">
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isAr ? "اكتب اسم الشركة..." : "Type company name..."} onKeyDown={e => e.key === "Enter" && handleSearch()} maxLength={100} className="h-10" />
                    <Button onClick={handleSearch} disabled={loading} variant="outline" className="h-10"><Search className="w-4 h-4" /></Button>
                  </div>
                </div>

                {searched && searchResults.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">{isAr ? "لا توجد نتائج" : "No results found"}</p>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map(company => {
                      const existingRequest = myRequests.find(r => r.company_name === company.name);
                      return (
                        <div key={company.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary" /></div>
                            <span className="font-medium text-sm">{company.name}</span>
                          </div>
                          {existingRequest ? (
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              {existingRequest.status === "pending" && <Clock className="w-3 h-3" />}
                              {existingRequest.status === "approved" && <CheckCircle2 className="w-3 h-3 text-primary" />}
                              {existingRequest.status === "rejected" && <XCircle className="w-3 h-3 text-destructive" />}
                              {existingRequest.status === "pending" ? (isAr ? "قيد الانتظار" : "Pending") : existingRequest.status === "approved" ? (isAr ? "مقبول" : "Approved") : (isAr ? "مرفوض" : "Rejected")}
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleJoinRequest(company.id)} disabled={loading} className="gap-1 h-8 text-xs">
                              <Send className="w-3 h-3" />{isAr ? "طلب انضمام" : "Request"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {myRequests.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold mb-2">{isAr ? "طلباتي" : "My Requests"}</h3>
                    {myRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{req.company_name}</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          req.status === "pending" ? "bg-accent/10 text-accent" : req.status === "approved" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        }`}>
                          {req.status === "pending" ? (isAr ? "قيد الانتظار" : "Pending") : req.status === "approved" ? (isAr ? "مقبول" : "Approved") : (isAr ? "مرفوض" : "Rejected")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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

import { useState, useRef } from "react";
import { getStoreSettings, saveStoreSettings, JOD_CURRENCY, JORDAN_DEFAULT_VAT_RATE } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Upload, Trash2, Save, Globe, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t, lang, setLang, dir } = useI18n();
  const { signOut } = useAuth();
  const { membership, refresh } = useCompany();
  const isAr = lang === "ar";

  const [settings, setSettings] = useState(getStoreSettings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwner = membership?.role === "owner";

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t("imageTooLarge")); return; }
    const reader = new FileReader();
    reader.onload = () => setSettings(prev => ({ ...prev, storeLogo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!settings.storeName.trim()) { toast.error(t("storeNameRequired")); return; }
    saveStoreSettings({ storeName: settings.storeName, storeLogo: settings.storeLogo, vatRate: JORDAN_DEFAULT_VAT_RATE });
    toast.success(t("settingsSaved"));
  };

  const handleDeleteCompany = async () => {
    if (!membership || deleteConfirmText !== membership.companyName) {
      toast.error(isAr ? "اكتب اسم الشركة للتأكيد" : "Type the company name to confirm");
      return;
    }
    setDeleteLoading(true);
    const { error } = await supabase.from("companies").delete().eq("id", membership.companyId);
    setDeleteLoading(false);
    if (error) toast.error(isAr ? "فشل حذف الشركة" : "Failed to delete company");
    else {
      toast.success(isAr ? "تم حذف الشركة" : "Company deleted");
      await refresh();
      // Redirect to onboarding instead of logging out
      window.location.href = "/onboarding";
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-xl mx-auto space-y-6" dir={dir}>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("storeSettings")}</h1>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 pos-shadow">
        {/* Language */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" />{t("language")}</Label>
          <div className="flex gap-2">
            <Button variant={lang === "ar" ? "default" : "outline"} size="sm" onClick={() => setLang("ar")} className="flex-1 h-9">{t("arabic")}</Button>
            <Button variant={lang === "en" ? "default" : "outline"} size="sm" onClick={() => setLang("en")} className="flex-1 h-9">{t("english")}</Button>
          </div>
        </div>

        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="storeName" className="text-sm font-semibold">{t("storeNameLabel")}</Label>
          <Input id="storeName" value={settings.storeName} onChange={e => setSettings(prev => ({ ...prev, storeName: e.target.value }))} placeholder={t("storeNamePlaceholder")} className="h-11" />
        </div>

        {/* Store Logo */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("storeLogo")}</Label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {settings.storeLogo ? <img src={settings.storeLogo} alt={t("storeLogo")} className="w-full h-full object-cover" /> : <ShoppingCart className="w-6 h-6 text-muted-foreground" />}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2 h-8"><Upload className="w-3.5 h-3.5" />{t("uploadImage")}</Button>
              {settings.storeLogo && (
                <Button variant="outline" size="sm" onClick={() => setSettings(prev => ({ ...prev, storeLogo: null }))} className="gap-2 h-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" />{t("removeLogo")}</Button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <p className="text-[11px] text-muted-foreground">{t("logoHint")}</p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("currency")}</Label>
          <div className="border border-border rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">{t("jordanianDinar")} - {JOD_CURRENCY.symbol}</div>
        </div>

        {/* VAT info */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("vatRate")}</Label>
          <div className="border border-border rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">
            <span className="text-muted-foreground text-xs">{isAr ? "يتم تحديد نسبة الضريبة لكل منتج على حدة عند إضافته" : "Tax rate is set per product when adding it"}</span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full h-11 gap-2 font-semibold"><Save className="w-4 h-4" />{t("saveSettings")}</Button>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-card border-2 border-destructive/20 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{isAr ? "منطقة الخطر" : "Danger Zone"}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? "حذف الشركة سيؤدي إلى إزالة جميع البيانات والأعضاء بشكل نهائي." : "Deleting the company will permanently remove all data and members."}</p>

          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="gap-2 h-9"><Trash2 className="w-4 h-4" />{isAr ? "حذف الشركة" : "Delete Company"}</Button>
          ) : (
            <div className="space-y-3 p-4 bg-destructive/5 rounded-xl border border-destructive/15">
              <p className="text-sm font-semibold text-destructive">{isAr ? `اكتب "${membership?.companyName}" للتأكيد` : `Type "${membership?.companyName}" to confirm`}</p>
              <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={membership?.companyName} className="border-destructive/20 h-10" />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDeleteCompany} disabled={deleteLoading || deleteConfirmText !== membership?.companyName} className="gap-2 h-9">
                  {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isAr ? "تأكيد الحذف" : "Confirm Delete"}
                </Button>
                <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} className="h-9">{isAr ? "إلغاء" : "Cancel"}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import { getStoreSettings, saveStoreSettings, JOD_CURRENCY, JORDAN_DEFAULT_VAT_RATE } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Upload, Trash2, Save, Globe } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t, lang, setLang, dir } = useI18n();
  const [settings, setSettings] = useState(getStoreSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings(prev => ({ ...prev, storeLogo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!settings.storeName.trim()) {
      toast.error(t("storeNameRequired"));
      return;
    }

    // VAT is fixed at Jordan default, cannot be changed
    saveStoreSettings({
      storeName: settings.storeName,
      storeLogo: settings.storeLogo,
      vatRate: JORDAN_DEFAULT_VAT_RATE,
    });

    toast.success(t("settingsSaved"));
  };

  return (
    <div className="p-6 max-w-xl mx-auto" dir={dir}>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("storeSettings")}</h1>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Language */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t("language")}
          </Label>
          <div className="flex gap-2">
            <Button
              variant={lang === "ar" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("ar")}
              className="flex-1"
            >
              {t("arabic")}
            </Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("en")}
              className="flex-1"
            >
              {t("english")}
            </Button>
          </div>
        </div>

        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="storeName" className="text-sm font-semibold">{t("storeNameLabel")}</Label>
          <Input
            id="storeName"
            value={settings.storeName}
            onChange={e => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
            placeholder={t("storeNamePlaceholder")}
            className="text-base"
          />
        </div>

        {/* Store Logo */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("storeLogo")}</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {settings.storeLogo ? (
                <img src={settings.storeLogo} alt={t("storeLogo")} className="w-full h-full object-cover" />
              ) : (
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" />
                {t("uploadImage")}
              </Button>
              {settings.storeLogo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, storeLogo: null }))}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("removeLogo")}
                </Button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
        </div>

        {/* Fixed Currency */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("currency")}</Label>
          <div className="text-base border border-border rounded-lg bg-muted px-3 py-2 text-foreground">
            {t("jordanianDinar")} - {JOD_CURRENCY.symbol}
          </div>
        </div>

        {/* VAT Rate - Fixed at 16% */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("vatRate")}</Label>
          <div className="text-base border border-border rounded-lg bg-muted px-3 py-2 text-foreground flex items-center justify-between">
            <span>{JORDAN_DEFAULT_VAT_RATE}%</span>
            <span className="text-xs text-muted-foreground">{t("fixedVatJordan")}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("jordanVatFixed")} ({JORDAN_DEFAULT_VAT_RATE}%)
          </p>
        </div>

        <Button onClick={handleSave} className="w-full touch-target gap-2" size="lg">
          <Save className="w-5 h-5" />
          {t("saveSettings")}
        </Button>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { getStoreSettings, saveStoreSettings, CURRENCIES } from "@/lib/store-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Upload, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState(getStoreSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 2 ميجابايت");
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
      toast.error("اسم المتجر مطلوب");
      return;
    }
    if (settings.vatRate < 0 || settings.vatRate > 100) {
      toast.error("نسبة الضريبة يجب أن تكون بين 0 و 100");
      return;
    }
    saveStoreSettings(settings);
    toast.success("تم حفظ الإعدادات بنجاح!");
  };

  return (
    <div className="p-6 max-w-xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-foreground mb-6">إعدادات المتجر</h1>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="storeName" className="text-sm font-semibold">اسم المتجر</Label>
          <Input
            id="storeName"
            value={settings.storeName}
            onChange={e => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
            placeholder="أدخل اسم المتجر"
            className="text-base"
          />
        </div>

        {/* Store Logo */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">شعار المتجر</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {settings.storeLogo ? (
                <img src={settings.storeLogo} alt="شعار المتجر" className="w-full h-full object-cover" />
              ) : (
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" />
                رفع صورة
              </Button>
              {settings.storeLogo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, storeLogo: null }))}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  إزالة الشعار
                </Button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <p className="text-xs text-muted-foreground">يُستخدم في الفاتورة والقائمة الجانبية. الحد الأقصى 2 ميجابايت.</p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">العملة</Label>
          <Select value={settings.currency} onValueChange={v => setSettings(prev => ({ ...prev, currency: v }))}>
            <SelectTrigger className="text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* VAT Rate */}
        <div className="space-y-2">
          <Label htmlFor="vatRate" className="text-sm font-semibold">نسبة ضريبة القيمة المضافة (%)</Label>
          <Input
            id="vatRate"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={settings.vatRate}
            onChange={e => setSettings(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))}
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">أدخل 0 لتعطيل الضريبة</p>
        </div>

        <Button onClick={handleSave} className="w-full touch-target gap-2" size="lg">
          <Save className="w-5 h-5" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}

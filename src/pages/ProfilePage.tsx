import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save, Loader2, AtSign, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(100);
const usernameSchema = z.string().regex(/^[a-z0-9_]{3,30}$/).optional().or(z.literal(""));

export default function ProfilePage() {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url, username").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url);
        setUsername((data as any).username || "");
      }
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(isAr ? "حجم الصورة يجب أن لا يتجاوز 2MB" : "Image must be under 2MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(isAr ? "فشل رفع الصورة" : "Failed to upload image"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
    setAvatarUrl(newUrl);
    setUploading(false);
    toast.success(isAr ? "تم تحديث الصورة" : "Avatar updated");
  };

  const handleSave = async () => {
    if (!user) return;
    const nameResult = nameSchema.safeParse(fullName);
    if (!nameResult.success) { toast.error(isAr ? "الاسم مطلوب" : "Name is required"); return; }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername && !usernameSchema.safeParse(cleanUsername).success) {
      toast.error(isAr ? "اسم المستخدم: 3-30 حرف إنجليزي صغير أو أرقام أو _" : "Username: 3-30 lowercase letters, numbers, or _");
      return;
    }
    setLoading(true);
    const updateData: any = { full_name: nameResult.data };
    if (cleanUsername) updateData.username = cleanUsername;
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error(isAr ? "اسم المستخدم محجوز" : "Username already taken");
      else toast.error(isAr ? "فشل الحفظ" : "Failed to save");
    } else toast.success(isAr ? "تم حفظ الملف الشخصي" : "Profile saved");
  };

  const initials = fullName ? fullName.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="p-5 lg:p-8 max-w-lg mx-auto" dir={dir}>
      <h1 className="text-2xl font-bold text-foreground mb-6 tracking-tight">
        {isAr ? "الملف الشخصي" : "Profile"}
      </h1>

      <div className="bg-card border border-border rounded-2xl overflow-hidden pos-shadow">
        {/* Avatar header */}
        <div className="gradient-primary px-6 pt-8 pb-12 flex justify-center">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar className="w-24 h-24 ring-4 ring-white/20 shadow-xl">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
              <AvatarFallback className="text-xl font-bold bg-white/20 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="px-6 -mt-4 pb-6 space-y-5">
          <p className="text-xs text-muted-foreground text-center">{isAr ? "اضغط لتغيير الصورة" : "Click to change photo"}</p>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{isAr ? "الاسم الكامل" : "Full Name"}</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isAr ? "أدخل اسمك" : "Enter your name"} maxLength={100} className="h-11" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2"><AtSign className="w-4 h-4 text-muted-foreground" />{isAr ? "اسم المستخدم" : "Username"}</Label>
            <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username" maxLength={30} dir="ltr" className="font-mono h-11" />
            <p className="text-[11px] text-muted-foreground">{isAr ? "أحرف إنجليزية صغيرة وأرقام و _ فقط (3-30 حرف)" : "Lowercase letters, numbers, and _ only (3-30 chars)"}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <div className="text-sm border border-border rounded-lg bg-muted px-3 py-2.5 text-muted-foreground">{user?.email}</div>
          </div>

          <Button onClick={handleSave} className="w-full h-11 gap-2 font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isAr ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

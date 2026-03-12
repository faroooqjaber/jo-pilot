import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const { lang, dir } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast.error(isAr ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? "تم تحديث كلمة المرور" : "Password updated");
      navigate("/");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir={dir}>
        <p className="text-muted-foreground">{isAr ? "رابط غير صالح" : "Invalid reset link"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={dir}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-bold text-foreground text-center">
          {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
        </h1>
        <div className="space-y-2">
          <Label>{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
          <div className="relative">
            <Lock className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="ltr:pl-10 rtl:pr-10"
              maxLength={128}
            />
          </div>
        </div>
        <Button onClick={handleReset} className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
          {isAr ? "تحديث كلمة المرور" : "Update Password"}
        </Button>
      </div>
    </div>
  );
}

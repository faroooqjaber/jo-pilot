import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBasket, Mail, Lock, User, Loader2, AtSign, Languages, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(128);
const nameSchema = z.string().trim().min(1).max(100);
const usernameSchema = z.string().regex(/^[a-z0-9_]{3,30}$/);

export default function AuthPage() {
  const { t, lang, dir, setLang } = useI18n();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "username-login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && document.documentElement.classList.contains('dark'));

  const isAr = lang === "ar";

  const toggleDark = () => { document.documentElement.classList.toggle('dark'); setDark(!dark); };
  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  const checkAgreed = () => {
    if (!agreed) {
      toast.error("يجب الموافقة على الإخلاء القانوني للمتابعة");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!checkAgreed()) return;
    const emailResult = emailSchema.safeParse(email);
    const passResult = passwordSchema.safeParse(password);
    if (!emailResult.success || !passResult.success) {
      toast.error(isAr ? "تحقق من البريد وكلمة المرور" : "Check email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailResult.data, password });
    setLoading(false);
    if (error) toast.error(isAr ? "فشل تسجيل الدخول: " + error.message : "Login failed: " + error.message);
  };

  const handleUsernameLogin = async () => {
    if (!checkAgreed()) return;
    const uResult = usernameSchema.safeParse(username.toLowerCase());
    const passResult = passwordSchema.safeParse(password);
    if (!uResult.success || !passResult.success) {
      toast.error(isAr ? "تحقق من اسم المستخدم وكلمة المرور" : "Check username and password");
      return;
    }
    setLoading(true);
    const { data, error: fnError } = await supabase.rpc("get_email_by_username", { _username: uResult.data });
    if (fnError || !data) {
      toast.error(isAr ? "اسم المستخدم غير موجود" : "Username not found");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: data as string, password });
    setLoading(false);
    if (error) toast.error(isAr ? "فشل تسجيل الدخول: " + error.message : "Login failed: " + error.message);
  };

  const handleSignup = async () => {
    if (!checkAgreed()) return;
    const emailResult = emailSchema.safeParse(email);
    const passResult = passwordSchema.safeParse(password);
    const nameResult = nameSchema.safeParse(fullName);
    if (!emailResult.success || !passResult.success || !nameResult.success) {
      toast.error(isAr ? "تحقق من جميع الحقول" : "Check all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: emailResult.data,
      password,
      options: { data: { full_name: nameResult.data }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(isAr ? "فشل إنشاء الحساب: " + error.message : "Signup failed: " + error.message);
    else toast.success(isAr ? "تم إنشاء الحساب! تحقق من بريدك الإلكتروني" : "Account created! Check your email");
  };

  const handleForgot = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(isAr ? "أدخل بريد إلكتروني صحيح" : "Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailResult.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "تم إرسال رابط إعادة التعيين" : "Reset link sent to your email");
      setMode("login");
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast.error(isAr ? "فشل تسجيل الدخول" : "Login failed");
    setLoading(false);
  };

  const isUsernameMode = mode === "username-login";

  return (
    <div className="min-h-screen flex" dir={dir}>
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-background border-e border-border relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative text-center px-12 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-primary/20">
            <ShoppingBasket className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">JO Pilot</h1>
          <p className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
            {isAr ? "نظام نقاط البيع الذكي لإدارة أعمالك بكفاءة" : "Smart POS system to manage your business efficiently"}
          </p>
          <div className="flex justify-center gap-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/30" />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        {/* Language & Theme toggles */}
        <div className="absolute top-4 flex gap-2 ltr:right-4 rtl:left-4">
          <button onClick={toggleLang} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={lang === "ar" ? "English" : "العربية"}>
            <Languages className="w-4 h-4" />
          </button>
          <button onClick={toggleDark} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={dark ? "Light" : "Dark"}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/25 border border-primary/20">
              <ShoppingBasket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">JO Pilot</h1>
          </div>

          {/* Title */}
          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "login" || isUsernameMode
                ? isAr ? "مرحباً بعودتك" : "Welcome back"
                : mode === "signup"
                ? isAr ? "إنشاء حساب جديد" : "Create an account"
                : isAr ? "إعادة تعيين كلمة المرور" : "Reset password"}
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {mode === "login" || isUsernameMode
                ? isAr ? "سجل دخولك للمتابعة" : "Sign in to continue"
                : mode === "signup"
                ? isAr ? "أدخل بياناتك للبدء" : "Enter your details to get started"
                : isAr ? "أدخل بريدك لإعادة تعيين كلمة المرور" : "Enter your email to reset password"}
            </p>
          </div>

          <div className="space-y-5">
            {/* Username Login Mode */}
            {isUsernameMode && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "اسم المستخدم" : "Username"}</Label>
                  <div className="relative">
                    <AtSign className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                    <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username" className="ltr:pl-10 rtl:pr-10 h-11" maxLength={30} dir="ltr" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{isAr ? "كلمة المرور" : "Password"}</Label>
                  <div className="relative">
                    <Lock className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isAr ? "كلمة المرور" : "Password"} className="ltr:pl-10 rtl:pr-10 h-11" maxLength={128} />
                  </div>
                </div>
                <Button onClick={handleUsernameLogin} className="w-full h-11 text-sm font-semibold" disabled={loading || !agreed}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </Button>
                <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline w-full text-center block font-medium">
                  {isAr ? "الدخول بالبريد الإلكتروني" : "Sign in with email"}
                </button>
              </>
            )}

            {/* Signup fields */}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
                <div className="relative">
                  <User className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isAr ? "أدخل اسمك" : "Enter your name"} className="ltr:pl-10 rtl:pr-10 h-11" maxLength={100} />
                </div>
              </div>
            )}

            {/* Email */}
            {!isUsernameMode && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <div className="relative">
                  <Mail className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" className="ltr:pl-10 rtl:pr-10 h-11" maxLength={255} />
                </div>
              </div>
            )}

            {/* Password */}
            {!isUsernameMode && mode !== "forgot" && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isAr ? "كلمة المرور" : "Password"}</Label>
                <div className="relative">
                  <Lock className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isAr ? "كلمة المرور (6 أحرف على الأقل)" : "Password (min 6 chars)"} className="ltr:pl-10 rtl:pr-10 h-11" maxLength={128} />
                </div>
              </div>
            )}

            {/* Legal Disclaimer Checkbox */}
            {(mode === "login" || mode === "signup" || isUsernameMode) && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Checkbox
                  id="legal-agree"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-1 shrink-0"
                />
                <label htmlFor="legal-agree" className="text-[11px] leading-relaxed text-muted-foreground cursor-pointer select-none" dir="rtl">
                  أوافق على أن المسؤولية القانونية والضريبية كاملة تقع على عاتقي كصاحب متجر، وأقر بأن نظام JO Pilot هو أداة تنظيمية للمتاجر الصغيرة وليس موثقاً حالياً في نظام &quot;فوترة&quot; الوطني، ولا يتحمل النظام أي مسؤولية عن التهرب الضريبي.
                </label>
              </div>
            )}

            {/* Action Button */}
            {!isUsernameMode && (
              <Button onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="w-full h-11 text-sm font-semibold" disabled={loading || (mode !== "forgot" && !agreed)}>
                {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                {mode === "login" ? (isAr ? "تسجيل الدخول" : "Sign In") : mode === "signup" ? (isAr ? "إنشاء حساب" : "Create Account") : (isAr ? "إرسال رابط التعيين" : "Send Reset Link")}
              </Button>
            )}

            {/* Links */}
            {mode === "login" && (
              <div className="flex justify-between text-sm">
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </button>
                <button onClick={() => setMode("username-login")} className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  {isAr ? "الدخول باسم المستخدم" : "Use username"}
                </button>
              </div>
            )}

            {/* OAuth */}
            {(mode === "login" || mode === "signup") && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground">{isAr ? "أو المتابعة عبر" : "or continue with"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-11 gap-2 font-medium" onClick={() => handleOAuth("google")} disabled={loading}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" className="h-11 gap-2 font-medium" onClick={() => handleOAuth("apple")} disabled={loading}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple
                  </Button>
                </div>
              </>
            )}

            {/* Toggle */}
            <div className="text-center text-sm text-muted-foreground pt-2">
              {mode === "login" || isUsernameMode ? (
                <span>
                  {isAr ? "ليس لديك حساب؟ " : "Don't have an account? "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline font-semibold">{isAr ? "أنشئ حساب" : "Sign up"}</button>
                </span>
              ) : (
                <span>
                  {isAr ? "لديك حساب؟ " : "Already have an account? "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline font-semibold">{isAr ? "سجل دخول" : "Sign in"}</button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

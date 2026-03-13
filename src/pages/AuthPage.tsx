import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Mail, Lock, User, Loader2, AtSign } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(128);
const nameSchema = z.string().trim().min(1).max(100);
const usernameSchema = z.string().regex(/^[a-z0-9_]{3,30}$/);

export default function AuthPage() {
  const { t, lang, dir } = useI18n();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "username-login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const isAr = lang === "ar";

  const handleLogin = async () => {
    const emailResult = emailSchema.safeParse(email);
    const passResult = passwordSchema.safeParse(password);
    if (!emailResult.success || !passResult.success) {
      toast.error(isAr ? "تحقق من البريد وكلمة المرور" : "Check email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailResult.data,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(isAr ? "فشل تسجيل الدخول: " + error.message : "Login failed: " + error.message);
    }
  };

  const handleUsernameLogin = async () => {
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
    if (error) {
      toast.error(isAr ? "فشل تسجيل الدخول: " + error.message : "Login failed: " + error.message);
    }
  };

  const handleSignup = async () => {
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
      options: {
        data: { full_name: nameResult.data },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(isAr ? "فشل إنشاء الحساب: " + error.message : "Signup failed: " + error.message);
    } else {
      toast.success(isAr ? "تم إنشاء الحساب! تحقق من بريدك الإلكتروني" : "Account created! Check your email");
    }
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
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? "تم إرسال رابط إعادة التعيين" : "Reset link sent to your email");
      setMode("login");
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(isAr ? "فشل تسجيل الدخول" : "Login failed");
    }
    setLoading(false);
  };

  const isUsernameMode = mode === "username-login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
            <ShoppingCart className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            JO Shops
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === "login" || isUsernameMode
              ? isAr ? "سجل دخولك للمتابعة" : "Sign in to continue"
              : mode === "signup"
              ? isAr ? "أنشئ حسابك الجديد" : "Create your account"
              : isAr ? "أدخل بريدك لإعادة تعيين كلمة المرور" : "Enter your email to reset password"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/5 space-y-4">
          {/* Username Login Mode */}
          {isUsernameMode && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isAr ? "اسم المستخدم" : "Username"}</Label>
                <div className="relative">
                  <AtSign className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="username"
                    className="ltr:pl-10 rtl:pr-10"
                    maxLength={30}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isAr ? "كلمة المرور" : "Password"}</Label>
                <div className="relative">
                  <Lock className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isAr ? "كلمة المرور" : "Password"}
                    className="ltr:pl-10 rtl:pr-10"
                    maxLength={128}
                  />
                </div>
              </div>
              <Button onClick={handleUsernameLogin} className="w-full touch-target" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Button>
              <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline w-full text-center block">
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
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={isAr ? "أدخل اسمك" : "Enter your name"}
                  className="ltr:pl-10 rtl:pr-10"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {/* Email field (login, signup, forgot) */}
          {!isUsernameMode && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="ltr:pl-10 rtl:pr-10"
                  maxLength={255}
                />
              </div>
            </div>
          )}

          {/* Password field (login, signup) */}
          {!isUsernameMode && mode !== "forgot" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isAr ? "كلمة المرور" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute top-3 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isAr ? "كلمة المرور (6 أحرف على الأقل)" : "Password (min 6 chars)"}
                  className="ltr:pl-10 rtl:pr-10"
                  maxLength={128}
                />
              </div>
            </div>
          )}

          {/* Action Button (login, signup, forgot) */}
          {!isUsernameMode && (
            <Button
              onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
              className="w-full touch-target"
              size="lg"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
              {mode === "login"
                ? isAr ? "تسجيل الدخول" : "Sign In"
                : mode === "signup"
                ? isAr ? "إنشاء حساب" : "Create Account"
                : isAr ? "إرسال رابط التعيين" : "Send Reset Link"}
            </Button>
          )}

          {/* Forgot password + username login links */}
          {mode === "login" && (
            <div className="flex justify-between text-sm">
              <button onClick={() => setMode("forgot")} className="text-primary hover:underline">
                {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
              </button>
              <button onClick={() => setMode("username-login")} className="text-primary hover:underline">
                {isAr ? "الدخول باسم المستخدم" : "Use username"}
              </button>
            </div>
          )}

          {/* OAuth buttons */}
          {(mode === "login" || mode === "signup") && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">{isAr ? "أو" : "or"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="touch-target gap-2"
                  size="lg"
                  onClick={() => handleOAuth("google")}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="touch-target gap-2"
                  size="lg"
                  onClick={() => handleOAuth("apple")}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </>
          )}

          {/* Toggle login/signup */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            {mode === "login" || isUsernameMode ? (
              <span>
                {isAr ? "ليس لديك حساب؟ " : "Don't have an account? "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline font-semibold">
                  {isAr ? "أنشئ حساب" : "Sign up"}
                </button>
              </span>
            ) : (
              <span>
                {isAr ? "لديك حساب؟ " : "Already have an account? "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline font-semibold">
                  {isAr ? "سجل دخول" : "Sign in"}
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

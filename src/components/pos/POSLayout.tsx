import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Moon, Sun, Settings, BarChart3, Users, LogOut, Languages, Store } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function POSLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { t, dir, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { membership } = useCompany();
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && document.documentElement.classList.contains('dark'));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) { setFullName(data.full_name || ""); setAvatarUrl(data.avatar_url); } });
  }, [user]);

  const role = membership?.role;
  const isAr = lang === "ar";

  const roleLabel = role === "owner" ? (isAr ? "صاحب العمل" : "Owner") :
    (role === "manager" || role === "supervisor") ? (isAr ? "مسؤول" : "Admin") :
    (isAr ? "موظف" : "Staff");

  const allNavItems = [
    { path: "/", label: t("navPOS"), icon: ShoppingCart, roles: ["owner", "manager", "supervisor", "cashier"] },
    { path: "/products", label: t("navProducts"), icon: Package, roles: ["owner", "manager", "supervisor"] },
    { path: "/dashboard", label: t("navDashboard"), icon: LayoutDashboard, roles: ["owner", "manager", "supervisor"] },
    { path: "/reports", label: t("navReports"), icon: BarChart3, roles: ["owner", "manager", "supervisor"] },
    { path: "/team", label: isAr ? "الفريق" : "Team", icon: Users, roles: ["owner", "manager", "supervisor"] },
    { path: "/settings", label: t("navSettings"), icon: Settings, roles: ["owner", "manager"] },
  ];

  const navItems = allNavItems.filter(item => role && item.roles.includes(role));
  const toggleDark = () => { document.documentElement.classList.toggle('dark'); setDark(!dark); };
  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");
  const initials = fullName ? fullName.slice(0, 2).toUpperCase() : "JS";

  return (
    <div className="flex h-screen overflow-hidden" dir={dir}>
      <aside className={`w-[72px] lg:w-[260px] flex flex-col shrink-0 ${dir === "rtl" ? "border-l" : "border-r"} border-sidebar-border shadow-xl`}
        style={{ background: "var(--gradient-sidebar)" }}>
        
        <div className="p-4 lg:px-5 lg:py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block min-w-0">
            <span className="text-sidebar-accent-foreground font-black text-lg tracking-tighter block">JO Shops</span>
            {role && <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{roleLabel}</span>}
          </div>
        </div>

        <div className="mx-3 lg:mx-4 h-px bg-sidebar-border/60" />

        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  active ? "bg-primary text-white shadow-md shadow-primary/20" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
                <item.icon className={`w-[20px] h-[20px] shrink-0 ${!active ? 'group-hover:scale-110 transition-transform' : ''}`} />
                <span className="hidden lg:block font-semibold text-[13.5px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 lg:p-4 space-y-2 bg-sidebar-accent/10">
          <button onClick={toggleLang} className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Languages className="w-[18px] h-[18px] text-primary" />
            <span className="hidden lg:block text-[12px] font-bold">{lang === "ar" ? "English" : "العربية"}</span>
          </button>
          <button onClick={toggleDark} className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            {dark ? <Sun className="w-[18px] h-[18px] text-yellow-500" /> : <Moon className="w-[18px] h-[18px] text-blue-400" />}
            <span className="hidden lg:block text-[12px] font-bold">{dark ? (isAr ? "الوضع النهاري" : "Light") : (isAr ? "الوضع الليلي" : "Dark")}</span>
          </button>
          <div className="h-px bg-sidebar-border/40 my-2" />
          <div className="flex flex-col gap-1">
            <Link to="/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-all">
              <Avatar className="w-8 h-8 border-2 border-primary/20">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                <AvatarFallback className="text-[10px] font-bold bg-primary text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block min-w-0">
                <p className="text-[12px] font-bold truncate leading-none">{fullName || (isAr ? "المستخدم" : "User")}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase">{roleLabel}</p>
              </div>
            </Link>
            <button onClick={signOut} className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-[18px] h-[18px]" />
              <span className="hidden lg:block text-[12px] font-bold">{isAr ? "خروج" : "Logout"}</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}

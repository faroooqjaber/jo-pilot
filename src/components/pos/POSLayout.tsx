import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Moon, Sun, Settings, BarChart3, Users, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function POSLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { t, dir } = useI18n();
  const { user, signOut } = useAuth();
  const { membership } = useCompany();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [user]);

  const role = membership?.role;
  const isAr = dir === "rtl";

  const allNavItems = [
    { path: "/", label: t("navPOS"), icon: ShoppingCart, roles: ["owner", "manager", "supervisor", "cashier"] },
    { path: "/products", label: t("navProducts"), icon: Package, roles: ["owner", "manager", "supervisor"] },
    { path: "/dashboard", label: t("navDashboard"), icon: LayoutDashboard, roles: ["owner", "manager", "supervisor"] },
    { path: "/reports", label: t("navReports"), icon: BarChart3, roles: ["owner", "manager", "supervisor"] },
    { path: "/team", label: isAr ? "الفريق" : "Team", icon: Users, roles: ["owner", "manager"] },
    { path: "/settings", label: t("navSettings"), icon: Settings, roles: ["owner", "manager"] },
  ];

  const navItems = allNavItems.filter(item => role && item.roles.includes(role));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const initials = fullName ? fullName.slice(0, 2).toUpperCase() : "??";

  const roleLabel = role === "owner" ? (isAr ? "مالك" : "Owner") :
    role === "manager" ? (isAr ? "مدير" : "Manager") :
    role === "supervisor" ? (isAr ? "مشرف" : "Supervisor") :
    (isAr ? "كاشير" : "Cashier");

  return (
    <div className="flex h-screen overflow-hidden" dir={dir}>
      {/* Sidebar */}
      <aside className={`w-[72px] lg:w-[260px] flex flex-col shrink-0 ${dir === "rtl" ? "border-l" : "border-r"} border-sidebar-border`}
        style={{ background: "var(--gradient-sidebar)" }}>
        
        {/* Brand */}
        <div className="p-4 lg:px-5 lg:py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden lg:block min-w-0">
            <span className="text-sidebar-accent-foreground font-bold text-[15px] tracking-tight block">JO Shops</span>
            {role && (
              <span className="text-[11px] text-sidebar-foreground/60 font-medium">{roleLabel}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 lg:mx-4 h-px bg-sidebar-border/60" />

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl touch-target transition-all duration-200 ${
                  active
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className={`w-[20px] h-[20px] shrink-0 transition-transform duration-200 ${!active ? 'group-hover:scale-110' : ''}`} />
                <span className="hidden lg:block font-medium text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 lg:p-3 space-y-0.5">
          <div className="mx-1 lg:mx-0 mb-1 h-px bg-sidebar-border/60" />

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              location.pathname === "/profile"
                ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Avatar className="w-7 h-7 ring-2 ring-sidebar-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
              <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-[13px] font-medium truncate">{fullName || (isAr ? "الملف الشخصي" : "Profile")}</span>
          </Link>

          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent touch-target transition-all duration-200"
          >
            {dark ? <Sun className="w-[20px] h-[20px]" /> : <Moon className="w-[20px] h-[20px]" />}
            <span className="hidden lg:block text-[13px] font-medium">{dark ? t("lightMode") : t("darkMode")}</span>
          </button>
          
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive touch-target transition-all duration-200"
          >
            <LogOut className="w-[20px] h-[20px]" />
            <span className="hidden lg:block text-[13px] font-medium">{isAr ? "تسجيل الخروج" : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}

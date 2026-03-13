import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Moon, Sun, Settings, BarChart3, Users, LogOut, User } from "lucide-react";
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

  return (
    <div className="flex h-screen overflow-hidden" dir={dir}>
      <aside className={`w-20 lg:w-64 bg-sidebar flex flex-col ${dir === "rtl" ? "border-l" : "border-r"} border-sidebar-border shrink-0`}>
        {/* Brand */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden lg:block min-w-0">
            <span className="text-sidebar-foreground font-extrabold text-sm truncate block">JO Shops</span>
            {role && (
              <span className="text-xs text-sidebar-accent-foreground">
                {role === "owner" ? (isAr ? "مالك" : "Owner") :
                 role === "manager" ? (isAr ? "مدير" : "Manager") :
                 role === "supervisor" ? (isAr ? "مشرف" : "Supervisor") :
                 (isAr ? "كاشير" : "Cashier")}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg touch-target transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {/* Profile link */}
          <Link
            to="/profile"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              location.pathname === "/profile"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Avatar className="w-7 h-7">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
              <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-sm font-medium truncate">{fullName || (isAr ? "الملف الشخصي" : "Profile")}</span>
          </Link>

          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent touch-target transition-colors"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="hidden lg:block text-sm">{dark ? t("lightMode") : t("darkMode")}</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent touch-target transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-sm">{isAr ? "تسجيل الخروج" : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

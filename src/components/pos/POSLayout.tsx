import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Moon, Sun, Settings } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";

const navItems = [
  { path: "/", label: "نقطة البيع", icon: ShoppingCart },
  { path: "/products", label: "المنتجات", icon: Package },
  { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { path: "/settings", label: "الإعدادات", icon: Settings },
];

export default function POSLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const settings = getStoreSettings();

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      <aside className="w-20 lg:w-64 bg-sidebar flex flex-col border-l border-sidebar-border shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden shrink-0">
            {settings.storeLogo ? (
              <img src={settings.storeLogo} alt={settings.storeName} className="w-full h-full object-cover" />
            ) : (
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <span className="hidden lg:block text-sidebar-foreground font-bold text-lg truncate">{settings.storeName}</span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent touch-target transition-colors"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="hidden lg:block text-sm">{dark ? "الوضع الفاتح" : "الوضع الداكن"}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

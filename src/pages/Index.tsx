import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ShoppingBasket, ArrowLeft, ArrowRight, Languages, Moon, Sun, BarChart3, Package, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Index() {
  const { lang, dir, setLang } = useI18n();
  const isAr = lang === "ar";
  const [dark, setDark] = useState(() => typeof window !== "undefined" && document.documentElement.classList.contains("dark"));

  const toggleDark = () => { document.documentElement.classList.toggle("dark"); setDark(!dark); };
  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Smartphone, title: isAr ? "نقطة بيع ذكية" : "Smart POS", desc: isAr ? "واجهة سهلة تعمل على جميع الأجهزة" : "Easy interface on all devices" },
    { icon: BarChart3, title: isAr ? "تقارير وتحليلات" : "Reports & Analytics", desc: isAr ? "تابع أداء متجرك لحظة بلحظة" : "Track your store performance in real-time" },
    { icon: Package, title: isAr ? "تابع مخزونك" : "Track Inventory", desc: isAr ? "راقب مستويات المخزون وحركة المنتجات بسهولة" : "Monitor stock levels and product movement easily" },
    { icon: Shield, title: isAr ? "آمن وموثوق" : "Secure & Reliable", desc: isAr ? "بياناتك محمية بأعلى معايير الأمان" : "Your data is protected with top security" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <ShoppingBasket className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-extrabold text-primary tracking-tight">JO Pilot</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Languages className="w-4 h-4" />
          </button>
          <button onClick={toggleDark} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/auth">
            <Button size="sm" className="font-semibold gap-1.5 px-4">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 start-10 w-80 h-80 rounded-full bg-primary/30 blur-[100px]" />
          <div className="absolute bottom-10 end-20 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-6 py-20 md:py-32">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary/10 flex items-center justify-center shadow-2xl border border-primary/20">
            <ShoppingBasket className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight mb-6">
            {isAr ? (
              <>JO Pilot - <span className="text-primary">إدارة متجرك</span> بلمسة</>
            ) : (
              <>JO Pilot - <span className="text-primary">Manage</span> Your Store with a Touch</>
            )}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {isAr
              ? "أدر مبيعاتك، تابع مخزونك، ونظّم أعمالك من مكان واحد. بسيط، سريع، وآمن."
              : "Manage sales, track inventory, and organize your business from one place. Simple, fast, and secure."}
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-14 px-10 text-base font-bold gap-2 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              {isAr ? "ابدأ الآن" : "Get Started"}
              <Arrow className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 JO Pilot. {isAr ? "جميع الحقوق محفوظة" : "All rights reserved"}.</p>
      </footer>
    </div>
  );
}

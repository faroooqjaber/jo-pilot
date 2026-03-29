import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider, useCompany } from "@/hooks/useCompany";
import POSLayout from "@/components/pos/POSLayout";
import POSPage from "@/pages/POSPage";
import ProductsPage from "@/pages/ProductsPage";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import ManageRequestsPage from "@/pages/ManageRequestsPage";
import ProfilePage from "@/pages/ProfilePage";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { membership, loading: companyLoading } = useCompany();

  if (authLoading || (user && companyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold">Jo Pilot</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // تم تعديل هذا الجزء لتجاوز صفحة إنشاء الشركة المفقودة
  if (!membership) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<div className="p-8 text-center">برجاء إنشاء شركة من خلال قاعدة البيانات أولاً أو رفع ملف صفحة الشركة.</div>} />
      </Routes>
    );
  }

  const role = membership.role;

  return (
    <POSLayout>
      <Routes>
        <Route path="/" element={<POSPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {(role === "owner" || role === "manager" || role === "supervisor") && (
          <>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </>
        )}

        {(role === "owner" || role === "manager") && (
          <>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<ManageRequestsPage />} />
          </>
        )}

        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </POSLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CompanyProvider>
              <AppRoutes />
            </CompanyProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

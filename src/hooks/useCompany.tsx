import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface CompanyMembership {
  companyId: string;
  companyName: string;
  role: AppRole;
}

interface CompanyContextType {
  membership: CompanyMembership | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  membership: null,
  loading: true,
  refresh: async () => {},
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembership = useCallback(async () => {
    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("company_members")
        .select("company_id, role, companies(name)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setMembership(null);
      } else {
        const companyData = data.companies as unknown as { name: string } | null;
        setMembership({
          companyId: data.company_id,
          companyName: companyData?.name ?? "",
          role: data.role,
        });
      }
    } catch {
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return (
    <CompanyContext.Provider value={{ membership, loading, refresh: fetchMembership }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}

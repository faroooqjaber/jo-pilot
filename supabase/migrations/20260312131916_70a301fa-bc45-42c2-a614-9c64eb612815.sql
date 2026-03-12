
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'supervisor', 'cashier');

-- Create join request status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view companies" ON public.companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner can update company" ON public.companies
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

-- Company members table (roles stored here, NOT on profiles)
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_member_role(_user_id UUID, _company_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1
$$;

CREATE POLICY "Members can view their company members" ON public.company_members
  FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Owner/manager can insert members" ON public.company_members
  FOR INSERT TO authenticated WITH CHECK (
    public.get_member_role(auth.uid(), company_id) IN ('owner', 'manager')
  );

CREATE POLICY "Owner/manager can update members" ON public.company_members
  FOR UPDATE TO authenticated USING (
    public.get_member_role(auth.uid(), company_id) IN ('owner', 'manager')
  );

CREATE POLICY "Owner/manager can delete members" ON public.company_members
  FOR DELETE TO authenticated USING (
    public.get_member_role(auth.uid(), company_id) IN ('owner', 'manager')
  );

-- Join requests table
CREATE TABLE public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  requested_role app_role NOT NULL DEFAULT 'cashier',
  message TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, status)
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.join_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Company owner/manager can view requests" ON public.join_requests
  FOR SELECT TO authenticated USING (
    public.get_member_role(auth.uid(), company_id) IN ('owner', 'manager')
  );

CREATE POLICY "Authenticated users can create requests" ON public.join_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner/manager can update requests" ON public.join_requests
  FOR UPDATE TO authenticated USING (
    public.get_member_role(auth.uid(), company_id) IN ('owner', 'manager')
  );

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-add owner as company member when company is created
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

-- Trigger: auto-add member when join request is approved
CREATE OR REPLACE FUNCTION public.handle_request_approved()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (NEW.company_id, NEW.user_id, NEW.requested_role)
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_approved
  AFTER UPDATE ON public.join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_request_approved();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_join_requests_updated_at BEFORE UPDATE ON public.join_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

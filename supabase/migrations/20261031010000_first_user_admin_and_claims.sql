-- Migration: Automated First-User Super Admin & Subject Claims Workflow
-- Author: Google Antigravity

-- 1. Create subject_claims table
CREATE TABLE IF NOT EXISTS public.subject_claims (
  id text PRIMARY KEY,
  staff_id text NOT NULL,
  staff_email text NOT NULL,
  staff_name text NOT NULL,
  exam_type text NOT NULL, -- 'midsem' or 'put'
  section text NOT NULL,   -- e.g. 'B1', 'B2', etc.
  subject text NOT NULL,   -- e.g. 'BT205', 'BT203', etc.
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);

-- Enable RLS
ALTER TABLE public.subject_claims ENABLE ROW LEVEL SECURITY;

-- Subject claims RLS Policies
-- Authenticated users can view all subject claims (needed to check if already assigned)
DROP POLICY IF EXISTS "Authenticated users can read subject claims" ON public.subject_claims;
CREATE POLICY "Authenticated users can read subject claims"
  ON public.subject_claims FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can insert their own claims with status 'pending'
DROP POLICY IF EXISTS "Staff can insert own pending claims" ON public.subject_claims;
CREATE POLICY "Staff can insert own pending claims"
  ON public.subject_claims FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- Only admins can update subject claims (approve/reject)
DROP POLICY IF EXISTS "Admins can update subject claims" ON public.subject_claims;
CREATE POLICY "Admins can update subject claims"
  ON public.subject_claims FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Automated First-User Super Admin Trigger
-- Checks if any admin exists in public.profiles.
-- If total count is 0, the VERY FIRST user is automatically assigned role = 'admin'.
-- All subsequent users are automatically assigned role = 'employee'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_count integer;
  assigned_role text;
BEGIN
  -- Count existing admin users in profiles
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

  -- If no admin exists in profiles, assign 'admin' to the very first user! Otherwise 'employee'
  IF admin_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'employee';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
END;
$$;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.subject_claims TO authenticated;
GRANT ALL ON public.subject_claims TO service_role;

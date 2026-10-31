-- Migration: Student Access Logs for Fresh Camera Snapshot Security Gate
-- Author: Google Antigravity

CREATE TABLE IF NOT EXISTS public.student_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no text NOT NULL,
  section text NOT NULL,
  exam_type text NOT NULL,
  student_name text,
  photo_data text, -- base64 data URL of the captured selfie/snapshot
  ip_address text,
  user_agent text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by any user accessing the student portal
DROP POLICY IF EXISTS "Allow insert to student_access_logs" ON public.student_access_logs;
CREATE POLICY "Allow insert to student_access_logs"
  ON public.student_access_logs FOR INSERT
  WITH CHECK (true);

-- Allow reading logs for admins/teachers for audit tracking
DROP POLICY IF EXISTS "Admins can read student_access_logs" ON public.student_access_logs;
CREATE POLICY "Admins can read student_access_logs"
  ON public.student_access_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT INSERT ON public.student_access_logs TO anon, authenticated;
GRANT SELECT ON public.student_access_logs TO authenticated;
GRANT ALL ON public.student_access_logs TO service_role;

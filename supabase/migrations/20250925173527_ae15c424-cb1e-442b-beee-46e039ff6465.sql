-- Fix recursive RLS causing registration failure and enable safe admin checks

-- 1) Helper: admin check by JWT email (no table reads)
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((auth.jwt() ->> 'email') = 'admin@gmail.com', false);
$$;

-- 2) Recreate admin_users policies without self-referencing queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Only verified admins can view admin_users'
  ) THEN
    DROP POLICY "Only verified admins can view admin_users" ON public.admin_users;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Only verified admins can insert admin_users'
  ) THEN
    DROP POLICY "Only verified admins can insert admin_users" ON public.admin_users;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Only verified admins can update admin_users'
  ) THEN
    DROP POLICY "Only verified admins can update admin_users" ON public.admin_users;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Only verified admins can delete admin_users'
  ) THEN
    DROP POLICY "Only verified admins can delete admin_users" ON public.admin_users;
  END IF;
END $$;

CREATE POLICY "Admins can read admin_users"
ON public.admin_users
FOR SELECT
USING (public.is_admin_email());

CREATE POLICY "Admins can insert admin_users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.is_admin_email());

CREATE POLICY "Admins can update admin_users"
ON public.admin_users
FOR UPDATE
USING (public.is_admin_email())
WITH CHECK (public.is_admin_email());

CREATE POLICY "Admins can delete admin_users"
ON public.admin_users
FOR DELETE
USING (public.is_admin_email());

-- 3) Update students admin policies to avoid referencing admin_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Admins can read all students'
  ) THEN
    DROP POLICY "Admins can read all students" ON public.students;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Admins can update all students'
  ) THEN
    DROP POLICY "Admins can update all students" ON public.students;
  END IF;
END $$;

CREATE POLICY "Admins can read all students"
ON public.students
FOR SELECT
USING (public.is_admin_email());

CREATE POLICY "Admins can update all students"
ON public.students
FOR UPDATE
USING (public.is_admin_email());

-- 4) Update student_university_selections admin policy similarly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_university_selections' AND policyname = 'Admins can view all selections'
  ) THEN
    DROP POLICY "Admins can view all selections" ON public.student_university_selections;
  END IF;
END $$;

CREATE POLICY "Admins can view all selections"
ON public.student_university_selections
FOR SELECT
USING (public.is_admin_email());

-- 5) Make grant_dev_admin executable (VOLATILE)
CREATE OR REPLACE FUNCTION public.grant_dev_admin(dev_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid UUID := auth.uid();
  is_match BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = uid AND email = dev_email) INTO is_match;
  IF is_match THEN
    INSERT INTO public.admin_users (user_id, email, role)
    VALUES (uid, dev_email, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
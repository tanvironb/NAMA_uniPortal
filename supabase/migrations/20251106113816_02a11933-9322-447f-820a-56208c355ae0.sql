-- Drop the overly permissive policy that allows all authenticated users to read admin_users
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON public.admin_users;

-- Create a new policy that only allows admins to read admin_users
CREATE POLICY "Admins can read admin_users"
ON public.admin_users
FOR SELECT
USING (is_admin());
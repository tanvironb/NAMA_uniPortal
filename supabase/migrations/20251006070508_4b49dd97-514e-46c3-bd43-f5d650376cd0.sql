-- Add explicit authentication requirement for sensitive tables
-- These RESTRICTIVE policies ensure that ONLY authenticated users can access data,
-- while the existing PERMISSIVE policies determine WHICH data they can access

-- Profiles table: Require authentication in addition to existing policies
CREATE POLICY "profiles_require_authentication" 
ON public.profiles 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Admin users table: Require authentication
CREATE POLICY "admin_users_require_authentication" 
ON public.admin_users 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Applications table: Require authentication  
CREATE POLICY "applications_require_authentication" 
ON public.applications 
AS RESTRICTIVE
FOR SELECT 
USING (auth.uid() IS NOT NULL);
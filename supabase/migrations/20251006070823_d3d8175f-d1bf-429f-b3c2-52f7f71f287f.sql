-- Fix security vulnerability: Replace broad authentication checks with proper access controls

-- Drop the overly permissive authentication-only policies
DROP POLICY IF EXISTS "profiles_require_authentication" ON public.profiles;
DROP POLICY IF EXISTS "admin_users_require_authentication" ON public.admin_users;
DROP POLICY IF EXISTS "applications_require_authentication" ON public.applications;

-- Profiles table: Replace the ALL policy with specific SELECT and UPDATE policies
-- First drop the existing combined ALL policy
DROP POLICY IF EXISTS "Users can view and update own profile" ON public.profiles;

-- Add specific SELECT policy: users can only view their own profile OR be admin
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() = id) OR is_admin());

-- Add specific UPDATE policy: users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Applications table: Replace the ALL policy with specific SELECT policy
-- First drop the existing ALL policy for users
DROP POLICY IF EXISTS "Users can manage their own applications" ON public.applications;

-- Add specific SELECT policy: users can only view their own applications OR be admin  
CREATE POLICY "Users can view own applications" 
ON public.applications 
FOR SELECT 
USING ((student_id = auth.uid()) OR is_admin());

-- Add specific INSERT policy for users
CREATE POLICY "Users can create own applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

-- Add specific UPDATE policy for users
CREATE POLICY "Users can update own applications" 
ON public.applications 
FOR UPDATE 
USING (student_id = auth.uid());

-- Add specific DELETE policy for users
CREATE POLICY "Users can delete own applications" 
ON public.applications 
FOR DELETE 
USING (student_id = auth.uid());
-- Fix security vulnerability: Replace all uses of get_current_user_role with is_admin

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Update country_field_overrides policies to use is_admin() instead of get_current_user_role()
DROP POLICY IF EXISTS "country_field_overrides_admin_insert" ON public.country_field_overrides;
DROP POLICY IF EXISTS "country_field_overrides_admin_update" ON public.country_field_overrides;
DROP POLICY IF EXISTS "country_field_overrides_admin_delete" ON public.country_field_overrides;

CREATE POLICY "country_field_overrides_admin_insert" ON public.country_field_overrides
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "country_field_overrides_admin_update" ON public.country_field_overrides
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "country_field_overrides_admin_delete" ON public.country_field_overrides
    FOR DELETE USING (is_admin());

-- Drop existing vulnerable policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

-- Create secure policies using is_admin() function
CREATE POLICY "Users can view and update own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (is_admin());

-- Only existing admins can manage admin_users table
CREATE POLICY "Only admins can manage admin_users" ON public.admin_users
    FOR ALL USING (is_admin());

-- Now we can safely drop the vulnerable function
DROP FUNCTION IF EXISTS public.get_current_user_role();
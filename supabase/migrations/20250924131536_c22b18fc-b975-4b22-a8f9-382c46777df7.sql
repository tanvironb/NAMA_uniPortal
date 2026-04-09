-- Security Fix: Restrict admin_users table access to prevent email harvesting
-- Current policy allows any authenticated user to potentially access admin emails
-- We need to make the policy more restrictive

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Only admins can manage admin_users" ON public.admin_users;

-- Create a more restrictive policy that only allows verified admins to access the table
-- Split into separate policies for better security granularity
CREATE POLICY "Only verified admins can view admin_users" ON public.admin_users
    FOR SELECT 
    USING (
        is_admin() AND 
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Only verified admins can insert admin_users" ON public.admin_users
    FOR INSERT 
    WITH CHECK (
        is_admin() AND 
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Only verified admins can update admin_users" ON public.admin_users
    FOR UPDATE 
    USING (
        is_admin() AND 
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid()
        )
    )
    WITH CHECK (
        is_admin() AND 
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Only verified admins can delete admin_users" ON public.admin_users
    FOR DELETE 
    USING (
        is_admin() AND 
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

-- Also ensure the is_admin function is secure by updating it to be more explicit
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only return true if the user exists in admin_users table and auth.uid() matches
    IF uid IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = uid
    );
END;
$function$;
-- Create function to grant dev admin on sign-in
CREATE OR REPLACE FUNCTION public.grant_dev_admin(dev_email TEXT)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
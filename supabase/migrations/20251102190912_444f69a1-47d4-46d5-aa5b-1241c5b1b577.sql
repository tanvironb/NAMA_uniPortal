-- Ensure admin1@gmail.com is registered as admin
-- Note: This assumes the user exists in auth.users
-- If not, create it first in Supabase Authentication > Users

DO $$
DECLARE
  admin1_user_id UUID;
BEGIN
  -- Get user ID for admin1@gmail.com from auth.users
  SELECT id INTO admin1_user_id FROM auth.users WHERE email = 'admin1@gmail.com';

  -- Only proceed if user exists
  IF admin1_user_id IS NOT NULL THEN
    -- Insert into admin_users table
    INSERT INTO public.admin_users (user_id, email, role)
    VALUES (admin1_user_id, 'admin1@gmail.com', 'admin')
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

    -- Insert/update profile
    INSERT INTO public.profiles (id, email, first_name, last_name, nationality, gender, role, status)
    VALUES (admin1_user_id, 'admin1@gmail.com', 'Admin', 'One', 'System', 'Male', 'admin', 'approved')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      status = EXCLUDED.status;
  END IF;
END $$;
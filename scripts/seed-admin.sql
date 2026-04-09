-- This SQL script seeds admin users directly in Supabase SQL Editor
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/zycysolzfzjkvwcjyyqv/sql/new

-- Note: This assumes the users already exist in auth.users
-- If they don't exist, you need to create them through Supabase Auth UI first:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add user" 
-- 3. Add admin@gmail.com with password: M|06xS(@59<te<
-- 4. Add admin1@gmail.com with password: N@ma2025!Secure#Access

-- After creating the auth users, run this SQL to add them to admin tables:

DO $$
DECLARE
  admin_user_id UUID;
  admin1_user_id UUID;
BEGIN
  -- Get user IDs from auth.users (requires service role)
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@gmail.com';
  SELECT id INTO admin1_user_id FROM auth.users WHERE email = 'admin1@gmail.com';

  -- Insert into admin_users table
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, email, role)
    VALUES (admin_user_id, 'admin@gmail.com', 'admin')
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

    -- Insert/update profile
    INSERT INTO public.profiles (id, email, first_name, last_name, nationality, gender, role, status)
    VALUES (admin_user_id, 'admin@gmail.com', 'Admin', 'User', 'System', 'Male', 'admin', 'approved')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      status = EXCLUDED.status;
  END IF;

  IF admin1_user_id IS NOT NULL THEN
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

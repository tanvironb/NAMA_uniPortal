-- Add status column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add constraint for status
DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_status CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
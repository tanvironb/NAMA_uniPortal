-- Create normalized database schema for NAMA University Portal

-- Create enums
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing profiles table to match students schema
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS preferred_country TEXT,
    ADD COLUMN IF NOT EXISTS preferred_field TEXT;

-- Add constraints for gender and status (drop if exists first)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT check_gender CHECK (gender IN ('Male', 'Female'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_name TEXT NOT NULL,
    country TEXT NOT NULL CHECK (country IN ('Kyrgyzstan', 'Malaysia', 'Tanzania', 'Turkey', 'United Kingdom')),
    ranking TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint (drop if exists first)
DO $$ BEGIN
    ALTER TABLE public.universities ADD CONSTRAINT unique_university_country UNIQUE (university_name, country);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    level_of_study TEXT NOT NULL CHECK (level_of_study IN ('Foundation', 'Diploma', 'Bachelors Degree', 'Masters Degree', 'PhD')),
    field_of_study TEXT NOT NULL,
    duration TEXT,
    scholarship TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_university_selections table
CREATE TABLE IF NOT EXISTS public.student_university_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for student university selections
DO $$ BEGIN
    ALTER TABLE public.student_university_selections ADD CONSTRAINT unique_student_university UNIQUE (student_id, university_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_nationality ON public.profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_name_country ON public.universities(university_name, country);
CREATE INDEX IF NOT EXISTS idx_courses_university ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level_of_study);
CREATE INDEX IF NOT EXISTS idx_courses_field ON public.courses(field_of_study);
CREATE INDEX IF NOT EXISTS idx_courses_title ON public.courses(course_title);
CREATE INDEX IF NOT EXISTS idx_sus_student ON public.student_university_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_sus_university ON public.student_university_selections(university_id);

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_university_selections ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
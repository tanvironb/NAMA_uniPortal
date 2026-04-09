-- Create or update the database schema for NAMA University Portal (without conflicting constraints)

-- Create enums if they don't exist
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

-- Update universities table structure to match requirements
ALTER TABLE public.universities 
    ADD COLUMN IF NOT EXISTS university_name TEXT,
    ADD COLUMN IF NOT EXISTS ranking TEXT;

-- Update the name column with university_name if it doesn't exist
UPDATE public.universities SET university_name = name WHERE university_name IS NULL AND name IS NOT NULL;

-- Make university_name NOT NULL after populating it (only if it has data)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM public.universities WHERE university_name IS NOT NULL LIMIT 1) THEN
        ALTER TABLE public.universities ALTER COLUMN university_name SET NOT NULL;
    END IF;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update profiles table to include student fields
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS preferred_country TEXT,
    ADD COLUMN IF NOT EXISTS preferred_field TEXT;

-- Add constraints for profiles (only if they don't exist)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_gender CHECK (gender IN ('Male', 'Female'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT check_profile_status CHECK (status IN ('pending', 'approved', 'rejected'));
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
    ALTER TABLE public.student_university_selections ADD CONSTRAINT unique_student_university_selection UNIQUE (student_id, university_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create performance indexes
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

-- Clear existing data and insert sample universities for the 5 required countries
TRUNCATE public.universities CASCADE;

-- Insert sample universities for the 5 required countries
INSERT INTO public.universities (university_name, country, ranking, name) VALUES
    ('International University of Kyrgyzstan', 'Kyrgyzstan', '1', 'International University of Kyrgyzstan'),
    ('Kyrgyz-Turkish Manas University', 'Kyrgyzstan', '2', 'Kyrgyz-Turkish Manas University'),
    ('American University of Central Asia', 'Kyrgyzstan', '3', 'American University of Central Asia'),
    ('University of Malaya', 'Malaysia', '70', 'University of Malaya'),
    ('Universiti Putra Malaysia', 'Malaysia', '143', 'Universiti Putra Malaysia'),
    ('Universiti Teknologi Malaysia', 'Malaysia', '188', 'Universiti Teknologi Malaysia'),
    ('University of Dar es Salaam', 'Tanzania', '1', 'University of Dar es Salaam'),
    ('Sokoine University of Agriculture', 'Tanzania', '2', 'Sokoine University of Agriculture'),
    ('Mzumbe University', 'Tanzania', '3', 'Mzumbe University'),
    ('Bogazici University', 'Turkey', '148', 'Bogazici University'),
    ('Middle East Technical University', 'Turkey', '255', 'Middle East Technical University'),
    ('Istanbul Technical University', 'Turkey', '273', 'Istanbul Technical University'),
    ('University of Oxford', 'United Kingdom', '4', 'University of Oxford'),
    ('University of Cambridge', 'United Kingdom', '6', 'University of Cambridge'),
    ('Imperial College London', 'United Kingdom', '8', 'Imperial College London');
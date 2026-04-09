-- Create normalized database schema for NAMA University Portal

-- Create enums
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table (extends existing profiles)
-- First, update existing profiles table to match students schema
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS preferred_country TEXT,
    ADD COLUMN IF NOT EXISTS preferred_field TEXT;

-- Add constraints for gender and status
ALTER TABLE public.profiles 
    ADD CONSTRAINT IF NOT EXISTS check_gender CHECK (gender IN ('Male', 'Female'));

ALTER TABLE public.profiles 
    ADD CONSTRAINT IF NOT EXISTS check_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_name TEXT NOT NULL,
    country TEXT NOT NULL CHECK (country IN ('Kyrgyzstan', 'Malaysia', 'Tanzania', 'Turkey', 'United Kingdom')),
    ranking TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_university_country UNIQUE (university_name, country)
);

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_university UNIQUE (student_id, university_id)
);

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

-- Create RLS policies

-- Universities: read-only for authenticated users
CREATE POLICY IF NOT EXISTS "Universities are readable by authenticated users"
    ON public.universities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage universities"
    ON public.universities FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Courses: read-only for authenticated users
CREATE POLICY IF NOT EXISTS "Courses are readable by authenticated users"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Profiles: users can read/update their own, admins can read all
CREATE POLICY IF NOT EXISTS "Users can read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Student university selections: users can read/write their own, admins can read all
CREATE POLICY IF NOT EXISTS "Users can manage their own university selections"
    ON public.student_university_selections FOR ALL
    TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY IF NOT EXISTS "Admins can read all university selections"
    ON public.student_university_selections FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admin users: only admins can read
CREATE POLICY IF NOT EXISTS "Only admins can read admin_users"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "Only admins can manage admin_users"
    ON public.admin_users FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Seed sample data
-- Insert sample universities
INSERT INTO public.universities (university_name, country, ranking) VALUES
    ('International University of Kyrgyzstan', 'Kyrgyzstan', '1'),
    ('Kyrgyz-Turkish Manas University', 'Kyrgyzstan', '2'),
    ('American University of Central Asia', 'Kyrgyzstan', '3'),
    ('University of Malaya', 'Malaysia', '70'),
    ('Universiti Putra Malaysia', 'Malaysia', '143'),
    ('Universiti Teknologi Malaysia', 'Malaysia', '188'),
    ('University of Dar es Salaam', 'Tanzania', '1'),
    ('Sokoine University of Agriculture', 'Tanzania', '2'),
    ('Mzumbe University', 'Tanzania', '3'),
    ('Bogazici University', 'Turkey', '148'),
    ('Middle East Technical University', 'Turkey', '255'),
    ('Istanbul Technical University', 'Turkey', '273'),
    ('University of Oxford', 'United Kingdom', '4'),
    ('University of Cambridge', 'United Kingdom', '6'),
    ('Imperial College London', 'United Kingdom', '8')
ON CONFLICT (university_name, country) DO NOTHING;

-- Insert sample courses
INSERT INTO public.courses (university_id, course_title, level_of_study, field_of_study, duration, scholarship) 
SELECT 
    u.id,
    CASE 
        WHEN field = 'Arts and Humanities' THEN level || ' in ' || field
        WHEN field = 'Social Science and Management' THEN level || ' in ' || field
        WHEN field = 'Engineering and Technology' THEN level || ' in ' || field
        WHEN field = 'Life Science and Medicine' THEN level || ' in ' || field
        WHEN field = 'Business Administration' THEN level || ' in ' || field
        WHEN field = 'Education' THEN level || ' in ' || field
        ELSE level || ' in ' || field
    END as course_title,
    level as level_of_study,
    field as field_of_study,
    CASE 
        WHEN level = 'Foundation' THEN '1 year'
        WHEN level = 'Diploma' THEN '2 years'
        WHEN level = 'Bachelors Degree' THEN '3-4 years'
        WHEN level = 'Masters Degree' THEN '1-2 years'
        WHEN level = 'PhD' THEN '3-5 years'
    END as duration,
    CASE 
        WHEN u.country IN ('Kyrgyzstan', 'Tanzania') THEN 'Available'
        WHEN u.country = 'Malaysia' THEN 'Partial'
        ELSE 'None'
    END as scholarship
FROM public.universities u
CROSS JOIN (
    VALUES 
        ('Foundation'), ('Diploma'), ('Bachelors Degree'), ('Masters Degree'), ('PhD')
) AS levels(level)
CROSS JOIN (
    VALUES 
        ('Arts and Humanities'),
        ('Social Science and Management'),
        ('Engineering and Technology'),
        ('Life Science and Medicine'),
        ('Business Administration'),
        ('Education')
) AS fields(field)
WHERE u.country IN ('Kyrgyzstan', 'Tanzania')

UNION ALL

-- Add some additional fields for other countries
SELECT 
    u.id,
    level || ' in ' || field as course_title,
    level as level_of_study,
    field as field_of_study,
    CASE 
        WHEN level = 'Foundation' THEN '1 year'
        WHEN level = 'Diploma' THEN '2 years'
        WHEN level = 'Bachelors Degree' THEN '3-4 years'
        WHEN level = 'Masters Degree' THEN '1-2 years'
        WHEN level = 'PhD' THEN '3-5 years'
    END as duration,
    CASE 
        WHEN u.country = 'Malaysia' THEN 'Partial'
        ELSE 'None'
    END as scholarship
FROM public.universities u
CROSS JOIN (
    VALUES 
        ('Bachelors Degree'), ('Masters Degree'), ('PhD')
) AS levels(level)
CROSS JOIN (
    VALUES 
        ('Computer Science'),
        ('International Relations'),
        ('Economics'),
        ('Psychology'),
        ('Environmental Science')
) AS fields(field)
WHERE u.country IN ('Malaysia', 'Turkey', 'United Kingdom')
ON CONFLICT DO NOTHING;

-- Create dev admin user
INSERT INTO public.admin_users (user_id, email, role)
SELECT id, 'admin@gmail.com', 'admin'
FROM auth.users 
WHERE email = 'admin@gmail.com'
ON CONFLICT (email) DO NOTHING;
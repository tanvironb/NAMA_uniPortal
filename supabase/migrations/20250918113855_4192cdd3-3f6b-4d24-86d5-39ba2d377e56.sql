-- Finalize NAMA University Portal database schema

-- Create remaining tables and policies

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for student university selections
DO $$ BEGIN
    ALTER TABLE public.student_university_selections ADD CONSTRAINT unique_student_university_selection UNIQUE (student_id, university_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_university_selections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Universities: readable by authenticated users, manageable by admins
DROP POLICY IF EXISTS "Universities are readable by authenticated users" ON public.universities;
CREATE POLICY "Universities are readable by authenticated users"
    ON public.universities FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage universities" ON public.universities;
CREATE POLICY "Admins can manage universities"
    ON public.universities FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Courses: readable by authenticated users, manageable by admins
CREATE POLICY "Courses are readable by authenticated users"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Student university selections: users can manage their own, admins can read all
CREATE POLICY "Users can manage their own university selections"
    ON public.student_university_selections FOR ALL
    TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can read all university selections"
    ON public.student_university_selections FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admin users: only admins can read/manage
CREATE POLICY "Only admins can read admin_users"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Only admins can manage admin_users"
    ON public.admin_users FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Insert sample courses for universities 
INSERT INTO public.courses (university_id, course_title, level_of_study, field_of_study, duration, scholarship) 
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
WHERE u.country IN ('Kyrgyzstan', 'Malaysia', 'Tanzania', 'Turkey', 'United Kingdom')
ON CONFLICT DO NOTHING;
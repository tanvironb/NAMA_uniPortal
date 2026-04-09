-- Create the admin check function and complete database setup

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

-- Create courses table if not exists
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

-- Create student_university_selections table if not exists
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

-- Enable RLS on tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_university_selections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
DROP POLICY IF EXISTS "Courses are readable by authenticated users" ON public.courses;
CREATE POLICY "Courses are readable by authenticated users"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Create RLS policies for student university selections
DROP POLICY IF EXISTS "Users can manage their own university selections" ON public.student_university_selections;
CREATE POLICY "Users can manage their own university selections"
    ON public.student_university_selections FOR ALL
    TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can read all university selections" ON public.student_university_selections;
CREATE POLICY "Admins can read all university selections"
    ON public.student_university_selections FOR SELECT
    TO authenticated
    USING (public.is_admin());
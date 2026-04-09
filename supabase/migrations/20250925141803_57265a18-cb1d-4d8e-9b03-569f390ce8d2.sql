-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nationality TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    level_of_study TEXT NOT NULL,
    preferred_country TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_nationality ON public.students(nationality);
CREATE INDEX IF NOT EXISTS idx_students_gender ON public.students(gender);

-- Add indexes for universities table
CREATE INDEX IF NOT EXISTS idx_uni_level ON public.universities(level_of_study);
CREATE INDEX IF NOT EXISTS idx_uni_country ON public.universities(country);
CREATE INDEX IF NOT EXISTS idx_uni_field ON public.universities(field_of_study);
CREATE INDEX IF NOT EXISTS idx_uni_name ON public.universities(university);

-- Enable RLS for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS policies for students table
DROP POLICY IF EXISTS "Users can read and update own student record" ON public.students;
CREATE POLICY "Users can read and update own student record" ON public.students
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all students" ON public.students;
CREATE POLICY "Admins can read all students" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can update all students" ON public.students;
CREATE POLICY "Admins can update all students" ON public.students
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS policy for universities table (allow anonymous and authenticated to read)
DROP POLICY IF EXISTS "Universities are readable by everyone" ON public.universities;
CREATE POLICY "Universities are readable by everyone" ON public.universities
    FOR SELECT USING (true);
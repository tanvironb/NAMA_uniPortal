-- Ensure student_university_selections table exists
CREATE TABLE IF NOT EXISTS public.student_university_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(user_id) ON DELETE CASCADE,
    university_name TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, university_name, country)
);

-- Enable RLS for student_university_selections
ALTER TABLE public.student_university_selections ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_university_selections table
DROP POLICY IF EXISTS "Users can manage own university selections" ON public.student_university_selections;
CREATE POLICY "Users can manage own university selections" ON public.student_university_selections
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can read all university selections" ON public.student_university_selections;
CREATE POLICY "Admins can read all university selections" ON public.student_university_selections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid()
        ) OR auth.uid()::text = 'admin@gmail.com'
    );
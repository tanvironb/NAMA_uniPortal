-- Fix student_university_selections table structure
DROP TABLE IF EXISTS public.student_university_selections CASCADE;

CREATE TABLE public.student_university_selections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  university_name text NOT NULL,
  country text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_university_selections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can manage their own selections" 
ON public.student_university_selections 
FOR ALL 
USING (student_id = auth.uid());

CREATE POLICY "Admins can view all selections" 
ON public.student_university_selections 
FOR SELECT 
USING (is_admin());
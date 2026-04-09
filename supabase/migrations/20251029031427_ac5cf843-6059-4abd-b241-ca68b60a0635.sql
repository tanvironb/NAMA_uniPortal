-- Create scholarship applications table
CREATE TABLE public.scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  level_of_study TEXT NOT NULL,
  country TEXT NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  passport_id TEXT NOT NULL,
  nationality TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  place_of_birth TEXT,
  
  -- Contact Information
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  contact_country TEXT,
  city TEXT,
  residence_address TEXT,
  
  -- Highest Education
  education_level TEXT NOT NULL,
  education_field TEXT,
  institution_name TEXT,
  institution_country TEXT,
  year_entered INTEGER,
  year_graduated INTEGER,
  final_grade TEXT,
  transcript_path TEXT,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  serial_code TEXT NOT NULL UNIQUE,
  auth_signature TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for private documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scholarship-documents', 'scholarship-documents', false);

-- Enable RLS
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scholarship_applications
CREATE POLICY "Students can view own applications"
ON public.scholarship_applications
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create own applications"
ON public.scholarship_applications
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all applications"
ON public.scholarship_applications
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update applications"
ON public.scholarship_applications
FOR UPDATE
USING (is_admin());

-- RLS Policies for certificates
CREATE POLICY "Students can view own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage certificates"
ON public.certificates
FOR ALL
USING (is_admin());

-- Storage policies for transcripts
CREATE POLICY "Students can upload own transcripts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'scholarship-documents' 
  AND (storage.foldername(name))[1] = 'transcripts'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Students can view own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'scholarship-documents'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'scholarship-documents'
  AND is_admin()
);

CREATE POLICY "System can insert certificates"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'scholarship-documents'
  AND (storage.foldername(name))[1] = 'certificates'
);

-- Create indexes
CREATE INDEX idx_applications_student ON public.scholarship_applications(student_id);
CREATE INDEX idx_applications_status ON public.scholarship_applications(status);
CREATE INDEX idx_applications_created ON public.scholarship_applications(created_at DESC);
CREATE INDEX idx_certificates_application ON public.certificates(application_id);

-- Function to generate unique serial code
CREATE OR REPLACE FUNCTION public.generate_serial_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_serial TEXT;
  serial_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate UNI-XXXXXXXXXX format
    new_serial := 'UNI-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 10));
    
    -- Check if serial already exists
    SELECT EXISTS(SELECT 1 FROM public.certificates WHERE serial_code = new_serial) INTO serial_exists;
    
    EXIT WHEN NOT serial_exists;
  END LOOP;
  
  RETURN new_serial;
END;
$$;

-- Function to compute auth signature
CREATE OR REPLACE FUNCTION public.compute_auth_signature(serial TEXT, app_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN upper(substring(md5(serial || app_id::text || 'uni-match-secret') from 1 for 8));
END;
$$;
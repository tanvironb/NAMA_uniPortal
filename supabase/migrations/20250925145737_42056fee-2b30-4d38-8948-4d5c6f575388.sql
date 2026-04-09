-- Drop existing universities table and recreate with new structure
DROP TABLE IF EXISTS public.universities CASCADE;

CREATE TABLE public.universities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  university_name text NOT NULL,
  country text NOT NULL,
  course_title text,
  level_of_study text NOT NULL,
  field_of_study text NOT NULL,
  duration text,
  tuition_fees text,
  scholarship text,
  ranking text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and allow read access for anonymous and authenticated users
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are readable by everyone" 
ON public.universities 
FOR SELECT 
USING (true);

-- Create indexes for performance (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_uni_level ON public.universities (lower(level_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_country ON public.universities (lower(country));
CREATE INDEX IF NOT EXISTS idx_uni_field ON public.universities (lower(field_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_name ON public.universities (lower(university_name));

-- Create deduplication views
CREATE OR REPLACE VIEW public.v_countries_by_level AS
SELECT DISTINCT
  trim(country) as label,
  lower(trim(level_of_study)) as level_key,
  trim(country) as country_raw
FROM public.universities
WHERE country IS NOT NULL AND level_of_study IS NOT NULL;

CREATE OR REPLACE VIEW public.v_fields_by_level_country AS
SELECT DISTINCT
  trim(field_of_study) as label,
  lower(trim(level_of_study)) as level_key,
  lower(trim(country)) as country_key
FROM public.universities
WHERE field_of_study IS NOT NULL AND country IS NOT NULL AND level_of_study IS NOT NULL;

CREATE OR REPLACE VIEW public.v_universities_lookup AS
SELECT DISTINCT
  trim(university_name) as university_name,
  trim(country) as country,
  trim(field_of_study) as field_of_study,
  trim(level_of_study) as level_of_study,
  ranking
FROM public.universities
WHERE university_name IS NOT NULL AND country IS NOT NULL;
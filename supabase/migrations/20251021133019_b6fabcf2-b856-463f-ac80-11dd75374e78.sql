-- Create education_level enum
CREATE TYPE public.education_level AS ENUM ('Foundation', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Any');

-- Create award_frequency enum
CREATE TYPE public.award_frequency AS ENUM ('One-time', 'Monthly', 'Yearly', 'Other');

-- Create scholarships table
CREATE TABLE public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  funded_by TEXT NOT NULL,
  education_levels education_level[] NOT NULL,
  amount TEXT NOT NULL,
  award_frequency award_frequency NOT NULL DEFAULT 'One-time',
  deadline DATE,
  deadline_rolling BOOLEAN DEFAULT FALSE,
  apply_url TEXT NOT NULL,
  country_eligibility TEXT[],
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  apply_click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX idx_scholarships_deadline ON public.scholarships(deadline) WHERE status = 'active';
CREATE INDEX idx_scholarships_featured ON public.scholarships(featured) WHERE status = 'active';
CREATE INDEX idx_scholarships_status ON public.scholarships(status);

-- Enable RLS
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Public can read active scholarships
CREATE POLICY "Public can read active scholarships"
  ON public.scholarships
  FOR SELECT
  USING (status = 'active');

-- Admins can manage all scholarships
CREATE POLICY "Admins can manage scholarships"
  ON public.scholarships
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_scholarships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scholarships_updated_at();
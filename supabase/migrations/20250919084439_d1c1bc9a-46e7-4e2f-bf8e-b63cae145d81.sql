-- Enable RLS on universities table if not already enabled
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Universities are readable by everyone" ON public.universities;
DROP POLICY IF EXISTS "Universities are readable by authenticated users" ON public.universities;

-- Create new policy to allow anonymous and authenticated users to read universities
CREATE POLICY "Universities are publicly readable" 
ON public.universities 
FOR SELECT 
USING (true);

-- Keep write operations restricted (no policies = no access for non-superusers)
-- This ensures only admin functions can modify university data
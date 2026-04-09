-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uni_level ON universities (lower(level_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_country ON universities (lower(country));
CREATE INDEX IF NOT EXISTS idx_uni_field ON universities (lower(field_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_name ON universities (lower(university_name));

-- Update RLS policy to allow anonymous users to read universities
DROP POLICY IF EXISTS "Universities are readable by everyone" ON universities;
CREATE POLICY "Universities are readable by everyone" 
ON universities 
FOR SELECT 
USING (true);
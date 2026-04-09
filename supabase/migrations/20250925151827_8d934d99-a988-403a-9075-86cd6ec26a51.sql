-- Add performance indexes for universities table
CREATE INDEX IF NOT EXISTS idx_uni_level ON universities (lower(level_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_country ON universities (lower(country));
CREATE INDEX IF NOT EXISTS idx_uni_field ON universities (lower(field_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_name ON universities (lower(university_name));

-- Update RLS policy to allow anonymous users to read universities
DROP POLICY IF EXISTS "Universities are readable by everyone" ON universities;
CREATE POLICY "Universities are readable by everyone" 
ON universities 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure students table allows updates for user's own record
DROP POLICY IF EXISTS "Users can read and update own student record" ON students;
CREATE POLICY "Users can read and update own student record" 
ON students 
FOR ALL
TO authenticated
USING (auth.uid() = user_id);
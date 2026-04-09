-- Enable public read-only access to universities and add performance indexes
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- SELECT policy for all (anon + authenticated)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'universities' AND policyname = 'Public can read universities'
  ) THEN
    CREATE POLICY "Public can read universities"
    ON public.universities
    FOR SELECT
    USING (true);
  END IF;

  -- Admin-only write policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'universities' AND policyname = 'Admins can insert universities'
  ) THEN
    CREATE POLICY "Admins can insert universities"
    ON public.universities
    FOR INSERT
    WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'universities' AND policyname = 'Admins can update universities'
  ) THEN
    CREATE POLICY "Admins can update universities"
    ON public.universities
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'universities' AND policyname = 'Admins can delete universities'
  ) THEN
    CREATE POLICY "Admins can delete universities"
    ON public.universities
    FOR DELETE
    USING (is_admin());
  END IF;
END$$;

-- Indexes for faster filtering (idempotent)
CREATE INDEX IF NOT EXISTS idx_uni_level   ON public.universities (lower(level_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_country ON public.universities (lower(country));
CREATE INDEX IF NOT EXISTS idx_uni_field   ON public.universities (lower(field_of_study));
CREATE INDEX IF NOT EXISTS idx_uni_name    ON public.universities (lower(university));
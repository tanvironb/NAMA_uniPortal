-- Fix search_path for update function by recreating trigger and function
DROP TRIGGER IF EXISTS update_scholarships_updated_at ON public.scholarships;
DROP FUNCTION IF EXISTS public.update_scholarships_updated_at();

CREATE OR REPLACE FUNCTION public.update_scholarships_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scholarships_updated_at();
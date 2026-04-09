-- Fix search_path for generate_serial_code function
CREATE OR REPLACE FUNCTION public.generate_serial_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix search_path for compute_auth_signature function
CREATE OR REPLACE FUNCTION public.compute_auth_signature(serial TEXT, app_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN upper(substring(md5(serial || app_id::text || 'uni-match-secret') from 1 for 8));
END;
$$;
-- Drop the security definer views since we're using direct table queries
DROP VIEW IF EXISTS v_countries_by_level CASCADE;
DROP VIEW IF EXISTS v_fields_by_level_country CASCADE;
DROP VIEW IF EXISTS v_universities_lookup CASCADE;
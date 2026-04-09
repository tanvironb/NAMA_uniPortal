-- Update universities to include the 5 required countries and add sample courses
TRUNCATE public.universities CASCADE;

-- Insert sample universities for the 5 required countries
INSERT INTO public.universities (id, name, country, level_of_study, field_of_study, tuition_min, tuition_max, active, created_at, university_name, ranking) VALUES
    (gen_random_uuid(), 'International University of Kyrgyzstan', 'Kyrgyzstan', 'Bachelors Degree', 'Engineering and Technology', 2000, 4000, true, now(), 'International University of Kyrgyzstan', '1'),
    (gen_random_uuid(), 'Kyrgyz-Turkish Manas University', 'Kyrgyzstan', 'Bachelors Degree', 'Business Administration', 1500, 3500, true, now(), 'Kyrgyz-Turkish Manas University', '2'),
    (gen_random_uuid(), 'American University of Central Asia', 'Kyrgyzstan', 'Masters Degree', 'Arts and Humanities', 2500, 5000, true, now(), 'American University of Central Asia', '3'),
    (gen_random_uuid(), 'University of Malaya', 'Malaysia', 'Bachelors Degree', 'Life Science and Medicine', 8000, 15000, true, now(), 'University of Malaya', '70'),
    (gen_random_uuid(), 'Universiti Putra Malaysia', 'Malaysia', 'Masters Degree', 'Engineering and Technology', 6000, 12000, true, now(), 'Universiti Putra Malaysia', '143'),
    (gen_random_uuid(), 'Universiti Teknologi Malaysia', 'Malaysia', 'PhD', 'Computer Science', 5000, 10000, true, now(), 'Universiti Teknologi Malaysia', '188'),
    (gen_random_uuid(), 'University of Dar es Salaam', 'Tanzania', 'Bachelors Degree', 'Social Science and Management', 1000, 2500, true, now(), 'University of Dar es Salaam', '1'),
    (gen_random_uuid(), 'Sokoine University of Agriculture', 'Tanzania', 'Masters Degree', 'Life Science and Medicine', 1200, 3000, true, now(), 'Sokoine University of Agriculture', '2'),
    (gen_random_uuid(), 'Mzumbe University', 'Tanzania', 'Bachelors Degree', 'Business Administration', 800, 2000, true, now(), 'Mzumbe University', '3'),
    (gen_random_uuid(), 'Bogazici University', 'Turkey', 'Bachelors Degree', 'Engineering and Technology', 5000, 8000, true, now(), 'Bogazici University', '148'),
    (gen_random_uuid(), 'Middle East Technical University', 'Turkey', 'Masters Degree', 'Engineering and Technology', 4000, 7000, true, now(), 'Middle East Technical University', '255'),
    (gen_random_uuid(), 'Istanbul Technical University', 'Turkey', 'PhD', 'Engineering and Technology', 3000, 6000, true, now(), 'Istanbul Technical University', '273'),
    (gen_random_uuid(), 'University of Oxford', 'United Kingdom', 'Bachelors Degree', 'Arts and Humanities', 25000, 35000, true, now(), 'University of Oxford', '4'),
    (gen_random_uuid(), 'University of Cambridge', 'United Kingdom', 'Masters Degree', 'Engineering and Technology', 30000, 40000, true, now(), 'University of Cambridge', '6'),
    (gen_random_uuid(), 'Imperial College London', 'United Kingdom', 'PhD', 'Life Science and Medicine', 28000, 38000, true, now(), 'Imperial College London', '8');

-- Insert comprehensive courses for each university
INSERT INTO public.courses (university_id, course_title, level_of_study, field_of_study, duration, scholarship) 
SELECT 
    u.id,
    level || ' in ' || field as course_title,
    level as level_of_study,
    field as field_of_study,
    CASE 
        WHEN level = 'Foundation' THEN '1 year'
        WHEN level = 'Diploma' THEN '2 years'
        WHEN level = 'Bachelors Degree' THEN '3-4 years'
        WHEN level = 'Masters Degree' THEN '1-2 years'
        WHEN level = 'PhD' THEN '3-5 years'
    END as duration,
    CASE 
        WHEN u.country IN ('Kyrgyzstan', 'Tanzania') THEN 'Available'
        WHEN u.country = 'Malaysia' THEN 'Partial'
        ELSE 'None'
    END as scholarship
FROM public.universities u
CROSS JOIN (
    VALUES 
        ('Foundation'), ('Diploma'), ('Bachelors Degree'), ('Masters Degree'), ('PhD')
) AS levels(level)
CROSS JOIN (
    VALUES 
        ('Arts and Humanities'),
        ('Social Science and Management'),
        ('Engineering and Technology'),
        ('Life Science and Medicine'),
        ('Business Administration'),
        ('Education')
) AS fields(field)
WHERE u.country IN ('Kyrgyzstan', 'Tanzania')

UNION ALL

-- Add additional fields for other countries
SELECT 
    u.id,
    level || ' in ' || field as course_title,
    level as level_of_study,
    field as field_of_study,
    CASE 
        WHEN level = 'Foundation' THEN '1 year'
        WHEN level = 'Diploma' THEN '2 years'
        WHEN level = 'Bachelors Degree' THEN '3-4 years'
        WHEN level = 'Masters Degree' THEN '1-2 years'
        WHEN level = 'PhD' THEN '3-5 years'
    END as duration,
    CASE 
        WHEN u.country = 'Malaysia' THEN 'Partial'
        ELSE 'None'
    END as scholarship
FROM public.universities u
CROSS JOIN (
    VALUES 
        ('Bachelors Degree'), ('Masters Degree'), ('PhD')
) AS levels(level)
CROSS JOIN (
    VALUES 
        ('Computer Science'),
        ('International Relations'),
        ('Economics'),
        ('Psychology'),
        ('Environmental Science'),
        ('Arts and Humanities'),
        ('Social Science and Management'),
        ('Engineering and Technology'),
        ('Life Science and Medicine'),
        ('Business Administration'),
        ('Education')
) AS fields(field)
WHERE u.country IN ('Malaysia', 'Turkey', 'United Kingdom')
ON CONFLICT DO NOTHING;
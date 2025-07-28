-- Test queries for the epistemic_driver_history table
-- Run these after creating the table to verify it works correctly

-- 1. Check if the table exists and view its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'epistemic_driver_history' 
ORDER BY ordinal_position;

-- 2. Check if indexes were created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'epistemic_driver_history';

-- 3. Check if RLS policies were created
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'epistemic_driver_history';

-- 4. Test insert (replace 'your-user-id' with an actual user ID from auth.users)
-- INSERT INTO epistemic_driver_history (
--     user_id,
--     title,
--     subject,
--     objectives,
--     study_map_data,
--     tags,
--     notes,
--     is_favorite
-- ) VALUES (
--     'your-user-id',
--     'Test Study Map',
--     'Azure AZ-104',
--     'Test objectives for Azure certification',
--     '{"epistemological_drivers": {"pillar": "Test", "points": []}, "learning_paths": [], "connecting_link": "Test"}',
--     ARRAY['azure', 'certification', 'test'],
--     'This is a test entry',
--     true
-- );

-- 5. Test select (will only work if you have data and are authenticated)
-- SELECT * FROM epistemic_driver_history ORDER BY created_at DESC LIMIT 5;

-- Check if state column exists in organizations table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' AND column_name = 'state';

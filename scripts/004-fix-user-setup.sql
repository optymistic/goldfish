-- This script helps set up a proper user for testing
-- Run this AFTER you have created a user through Supabase Auth

-- First, create a user through Supabase Auth dashboard or signup form
-- Then run this to create sample data for that user

-- Update the guides to use your actual user ID
-- Replace 'YOUR_ACTUAL_USER_ID_HERE' with the UUID from auth.users table

-- Example of how to update guides with real user ID:
-- UPDATE public.guides 
-- SET user_id = 'YOUR_ACTUAL_USER_ID_HERE'
-- WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

-- To find your user ID, you can run:
-- SELECT id, email FROM auth.users;

-- For now, let's create a profile entry for the placeholder user
INSERT INTO public.profiles (id, email, full_name) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@example.com',
  'Demo User'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

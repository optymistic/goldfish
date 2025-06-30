-- This script sets up proper auth integration when you're ready
-- Run this AFTER you have Supabase Auth working

-- First, create the profiles table that properly references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update guides table to properly reference auth.users (when ready)
-- Uncomment these lines when you want to enforce user authentication:

-- ALTER TABLE public.guides 
-- ADD CONSTRAINT guides_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to be more strict (when ready)
-- DROP POLICY "Authenticated users can manage guides" ON public.guides;
-- CREATE POLICY "Users can view own guides" ON public.guides
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own guides" ON public.guides
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own guides" ON public.guides
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own guides" ON public.guides
--   FOR DELETE USING (auth.uid() = user_id);

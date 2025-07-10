-- Add new content block types for interactive elements
ALTER TABLE public.content_blocks 
DROP CONSTRAINT IF EXISTS content_blocks_type_check;

ALTER TABLE public.content_blocks 
ADD CONSTRAINT content_blocks_type_check 
CHECK (type IN ('heading', 'paragraph', 'image', 'video', 'gif', 'embed', 'two-column', 'input-field', 'file-upload'));

-- Create user responses table for storing user submissions
CREATE TABLE IF NOT EXISTS public.user_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- Session ID or user ID for tracking responses
  question TEXT NOT NULL, -- The question text from the input field
  answer TEXT, -- User's text response
  file_url TEXT, -- URL of uploaded file (stored in R2)
  file_name TEXT, -- Original filename
  file_size INTEGER, -- File size in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_responses_guide_id ON public.user_responses(guide_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_block_id ON public.user_responses(block_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_user_identifier ON public.user_responses(user_identifier);
CREATE INDEX IF NOT EXISTS idx_user_responses_created_at ON public.user_responses(created_at);

-- Enable Row Level Security
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow anyone to insert and view responses (for public guides)
CREATE POLICY "Anyone can insert responses" ON public.user_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view responses" ON public.user_responses
  FOR SELECT USING (true);

-- Add a function to get response statistics for a guide
CREATE OR REPLACE FUNCTION get_guide_response_stats(guide_uuid UUID)
RETURNS TABLE (
  total_responses INTEGER,
  unique_users INTEGER,
  latest_response TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_responses,
    COUNT(DISTINCT user_identifier)::INTEGER as unique_users,
    MAX(created_at) as latest_response
  FROM public.user_responses 
  WHERE guide_id = guide_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
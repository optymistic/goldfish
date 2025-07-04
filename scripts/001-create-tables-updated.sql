-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Guides table (removed foreign key constraint to auth.users for now)
CREATE TABLE IF NOT EXISTS public.guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID, -- Removed foreign key constraint for flexibility
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'Tutorial',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  custom_url TEXT UNIQUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slides table
CREATE TABLE IF NOT EXISTS public.slides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content blocks table
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'image', 'video', 'gif', 'embed', 'two-column')),
  content TEXT,
  left_content TEXT,
  right_content TEXT,
  left_type TEXT,
  right_type TEXT,

  styles JSONB DEFAULT '{}',
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON public.guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_status ON public.guides(status);
CREATE INDEX IF NOT EXISTS idx_guides_custom_url ON public.guides(custom_url);
CREATE INDEX IF NOT EXISTS idx_slides_guide_id ON public.slides(guide_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_slide_id ON public.content_blocks(slide_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Guides policies (simplified for now)
DROP POLICY IF EXISTS "Users can view own guides" ON public.guides;
DROP POLICY IF EXISTS "Anyone can view published guides" ON public.guides;
DROP POLICY IF EXISTS "Users can insert own guides" ON public.guides;
DROP POLICY IF EXISTS "Users can update own guides" ON public.guides;
DROP POLICY IF EXISTS "Users can delete own guides" ON public.guides;

-- Simplified policies that work without strict user authentication
CREATE POLICY "Anyone can view published guides" ON public.guides
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can manage guides" ON public.guides
  FOR ALL USING (true); -- Simplified for now

-- Slides policies
DROP POLICY IF EXISTS "Users can manage slides of own guides" ON public.slides;
DROP POLICY IF EXISTS "Anyone can view slides of published guides" ON public.slides;

CREATE POLICY "Anyone can view slides of published guides" ON public.slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guides 
      WHERE guides.id = slides.guide_id 
      AND guides.status = 'published'
    )
  );

CREATE POLICY "Authenticated users can manage slides" ON public.slides
  FOR ALL USING (true); -- Simplified for now

-- Content blocks policies
DROP POLICY IF EXISTS "Users can manage blocks of own guides" ON public.content_blocks;
DROP POLICY IF EXISTS "Anyone can view blocks of published guides" ON public.content_blocks;

CREATE POLICY "Anyone can view blocks of published guides" ON public.content_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slides 
      JOIN public.guides ON guides.id = slides.guide_id
      WHERE slides.id = content_blocks.slide_id 
      AND guides.status = 'published'
    )
  );

CREATE POLICY "Authenticated users can manage blocks" ON public.content_blocks
  FOR ALL USING (true); -- Simplified for now

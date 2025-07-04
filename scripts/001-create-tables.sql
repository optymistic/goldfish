-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we can extend it)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guides table
CREATE TABLE public.guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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
CREATE TABLE public.slides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content blocks table
CREATE TABLE public.content_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'image', 'video', 'gif')),
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
CREATE INDEX idx_guides_user_id ON public.guides(user_id);
CREATE INDEX idx_guides_status ON public.guides(status);
CREATE INDEX idx_guides_custom_url ON public.guides(custom_url);
CREATE INDEX idx_slides_guide_id ON public.slides(guide_id);
CREATE INDEX idx_content_blocks_slide_id ON public.content_blocks(slide_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Guides policies
CREATE POLICY "Users can view own guides" ON public.guides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published guides" ON public.guides
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert own guides" ON public.guides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guides" ON public.guides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own guides" ON public.guides
  FOR DELETE USING (auth.uid() = user_id);

-- Slides policies
CREATE POLICY "Users can manage slides of own guides" ON public.slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.guides 
      WHERE guides.id = slides.guide_id 
      AND guides.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view slides of published guides" ON public.slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guides 
      WHERE guides.id = slides.guide_id 
      AND guides.status = 'published'
    )
  );

-- Content blocks policies
CREATE POLICY "Users can manage blocks of own guides" ON public.content_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.slides 
      JOIN public.guides ON guides.id = slides.guide_id
      WHERE slides.id = content_blocks.slide_id 
      AND guides.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view blocks of published guides" ON public.content_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slides 
      JOIN public.guides ON guides.id = slides.guide_id
      WHERE slides.id = content_blocks.slide_id 
      AND guides.status = 'published'
    )
  );

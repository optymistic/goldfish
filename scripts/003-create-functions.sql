-- Function to increment guide views
CREATE OR REPLACE FUNCTION increment_guide_views(guide_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.guides 
  SET views = views + 1, updated_at = NOW()
  WHERE id = guide_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's guide count
CREATE OR REPLACE FUNCTION get_user_guide_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.guides 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular guides
CREATE OR REPLACE FUNCTION get_popular_guides(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  tags TEXT[],
  views INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.title, g.description, g.type, g.tags, g.views, g.created_at
  FROM public.guides g
  WHERE g.status = 'published'
  ORDER BY g.views DESC, g.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

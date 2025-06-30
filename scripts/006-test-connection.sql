-- Test database connection and verify tables exist
SELECT 
  'guides' as table_name, 
  COUNT(*) as record_count 
FROM guides
UNION ALL
SELECT 
  'slides' as table_name, 
  COUNT(*) as record_count 
FROM slides
UNION ALL
SELECT 
  'content_blocks' as table_name, 
  COUNT(*) as record_count 
FROM content_blocks
UNION ALL
SELECT 
  'profiles' as table_name, 
  COUNT(*) as record_count 
FROM profiles;

-- Test inserting a sample guide
INSERT INTO guides (
  id,
  user_id, 
  title,
  description,
  type,
  tags,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '00000000-0000-0000-0000-000000000000',
  'Test Guide',
  'Testing database connection',
  'Tutorial',
  ARRAY['test'],
  'draft'
) ON CONFLICT (id) DO NOTHING;

-- Verify the insert worked
SELECT * FROM guides WHERE title = 'Test Guide' LIMIT 1;

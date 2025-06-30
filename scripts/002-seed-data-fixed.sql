-- This script creates sample data that works with Supabase Auth
-- It creates guides without requiring specific user IDs

-- First, let's create some sample guides with a placeholder user_id
-- In production, these would be created by actual authenticated users

-- Sample guides (using a UUID that will be replaced when real users are created)
INSERT INTO public.guides (
  id, 
  user_id, 
  title, 
  description, 
  type, 
  tags, 
  status, 
  views,
  created_at
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  '00000000-0000-0000-0000-000000000000', -- Placeholder user ID
  'Getting Started with React',
  'A comprehensive guide to learning React from scratch',
  'Tutorial',
  ARRAY['React', 'JavaScript', 'Frontend'],
  'published',
  1250,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  '00000000-0000-0000-0000-000000000000', -- Placeholder user ID
  'API Integration Best Practices',
  'Learn how to integrate APIs effectively in your applications',
  'Walkthrough',
  ARRAY['API', 'Backend', 'Integration'],
  'draft',
  0,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  '00000000-0000-0000-0000-000000000000', -- Placeholder user ID
  'Design System Implementation',
  'Step-by-step guide to building a design system',
  'Course',
  ARRAY['Design', 'UI/UX', 'System'],
  'published',
  890,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample slides
INSERT INTO public.slides (id, guide_id, title, position, created_at) VALUES
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  'Welcome to React',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  'What is React?',
  2,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440000',
  'Your First Component',
  3,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440002',
  'Introduction to APIs',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440003',
  'Design System Basics',
  1,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample content blocks
INSERT INTO public.content_blocks (slide_id, type, content, styles, position, created_at) VALUES
-- Slide 1 blocks
(
  '550e8400-e29b-41d4-a716-446655440010',
  'heading',
  'Welcome to React Tutorial',
  '{"fontSize": 36, "color": "#1f2937", "textAlign": "center"}',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440010',
  'paragraph',
  'React is a powerful JavaScript library for building user interfaces. In this tutorial, you''ll learn the fundamentals of React and how to build your first application.',
  '{"fontSize": 18, "color": "#4b5563", "textAlign": "center", "padding": 20}',
  2,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440010',
  'image',
  '/placeholder.svg?height=300&width=600',
  '{"borderRadius": 12, "padding": 20}',
  3,
  NOW()
),
-- Slide 2 blocks
(
  '550e8400-e29b-41d4-a716-446655440011',
  'heading',
  'What is React?',
  '{"fontSize": 32, "color": "#1f2937", "textAlign": "left"}',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  'paragraph',
  'React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called ''components''.',
  '{"fontSize": 16, "color": "#374151", "textAlign": "left", "padding": 10}',
  2,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  'paragraph',
  'Key features of React include:\n• Component-based architecture\n• Virtual DOM for performance\n• Unidirectional data flow\n• Rich ecosystem and community',
  '{"fontSize": 16, "color": "#374151", "textAlign": "left", "backgroundColor": "#f3f4f6", "padding": 20, "borderRadius": 8}',
  3,
  NOW()
),
-- Slide 3 blocks
(
  '550e8400-e29b-41d4-a716-446655440012',
  'heading',
  'Creating Your First Component',
  '{"fontSize": 28, "color": "#1f2937", "textAlign": "left"}',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  'paragraph',
  'Components are the building blocks of React applications. Here''s how you create a simple component:',
  '{"fontSize": 16, "color": "#374151", "textAlign": "left"}',
  2,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  'paragraph',
  'function Welcome(props) {\n  return <h1>Hello, {props.name}!</h1>;\n}',
  '{"fontSize": 14, "color": "#1f2937", "backgroundColor": "#f9fafb", "padding": 20, "borderRadius": 8}',
  3,
  NOW()
),
-- Additional slides content
(
  '550e8400-e29b-41d4-a716-446655440020',
  'heading',
  'API Integration Best Practices',
  '{"fontSize": 32, "color": "#1f2937", "textAlign": "center"}',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440020',
  'paragraph',
  'Learn how to effectively integrate APIs into your applications with these proven techniques.',
  '{"fontSize": 16, "color": "#374151", "textAlign": "center"}',
  2,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440030',
  'heading',
  'Building a Design System',
  '{"fontSize": 32, "color": "#1f2937", "textAlign": "center"}',
  1,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440030',
  'paragraph',
  'A comprehensive guide to creating and implementing design systems in your organization.',
  '{"fontSize": 16, "color": "#374151", "textAlign": "center"}',
  2,
  NOW()
) ON CONFLICT (id) DO NOTHING;

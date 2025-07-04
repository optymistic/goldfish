interface ContentBlock {
  id: string
  type: "heading" | "paragraph" | "image" | "video" | "gif" | "embed" | "two-column"
  content: string
  left_content?: string
  right_content?: string
  left_type?: "heading" | "paragraph" | "image" | "video" | "gif" | "embed"
  right_type?: "heading" | "paragraph" | "image" | "video" | "gif" | "embed"
  styles: {
    fontSize?: number
    color?: string
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    textAlign?: "left" | "center" | "right"
    columnGap?: number
    leftColumnWidth?: number
    rightColumnWidth?: number
  }
}

interface Slide {
  id: string
  title: string
  blocks: ContentBlock[]
}

interface Guide {
  id: string
  title: string
  description: string
  type: string
  slides: Slide[]
  tags: string[]
  createdAt: string
  status: "draft" | "published"
  views: number
  user_id?: string
}

// Mock data that matches the database structure
const mockGuides: { [key: string]: Guide } = {
  "550e8400-e29b-41d4-a716-446655440000": {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Getting Started with React",
    description: "A comprehensive guide to learning React from scratch",
    type: "Tutorial",
    slides: [
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        title: "Welcome to React",
        blocks: [
          {
            id: "1",
            type: "heading",
            content: "Welcome to React Tutorial",
            styles: { fontSize: 36, color: "#1f2937", textAlign: "center" },
          },
          {
            id: "2",
            type: "paragraph",
            content:
              "React is a powerful JavaScript library for building user interfaces. In this tutorial, you'll learn the fundamentals of React and how to build your first application.",
            styles: { fontSize: 18, color: "#4b5563", textAlign: "center", padding: 20 },
          },
          {
            id: "3",
            type: "image",
            content: "/placeholder.svg?height=300&width=600",
            styles: { borderRadius: 12, padding: 20 },
          },
        ],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440011",
        title: "What is React?",
        blocks: [
          {
            id: "4",
            type: "heading",
            content: "What is React?",
            styles: { fontSize: 32, color: "#1f2937", textAlign: "left" },
          },
          {
            id: "5",
            type: "paragraph",
            content:
              "React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called 'components'.",
            styles: { fontSize: 16, color: "#374151", textAlign: "left", padding: 10 },
          },
          {
            id: "6",
            type: "paragraph",
            content:
              "Key features of React include:\n• Component-based architecture\n• Virtual DOM for performance\n• Unidirectional data flow\n• Rich ecosystem and community",
            styles: {
              fontSize: 16,
              color: "#374151",
              textAlign: "left",
              backgroundColor: "#f3f4f6",
              padding: 20,
              borderRadius: 8,
            },
          },
        ],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440012",
        title: "Your First Component",
        blocks: [
          {
            id: "7",
            type: "heading",
            content: "Creating Your First Component",
            styles: { fontSize: 28, color: "#1f2937", textAlign: "left" },
          },
          {
            id: "8",
            type: "paragraph",
            content:
              "Components are the building blocks of React applications. Here's how you create a simple component:",
            styles: { fontSize: 16, color: "#374151", textAlign: "left" },
          },
          {
            id: "9",
            type: "paragraph",
            content: "function Welcome(props) {\n  return <h1>Hello, {props.name}!</h1>;\n}",
            styles: { fontSize: 14, color: "#1f2937", backgroundColor: "#f9fafb", padding: 20, borderRadius: 8 },
          },
        ],
      },
    ],
    tags: ["React", "JavaScript", "Frontend"],
    createdAt: "2024-01-15",
    status: "published",
    views: 1250,
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  "550e8400-e29b-41d4-a716-446655440002": {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "API Integration Best Practices",
    description: "Learn how to integrate APIs effectively in your applications",
    type: "Walkthrough",
    slides: [
      {
        id: "550e8400-e29b-41d4-a716-446655440020",
        title: "Introduction to APIs",
        blocks: [
          {
            id: "1",
            type: "heading",
            content: "API Integration Best Practices",
            styles: { fontSize: 32, color: "#1f2937", textAlign: "center" },
          },
          {
            id: "2",
            type: "paragraph",
            content: "Learn how to effectively integrate APIs into your applications with these proven techniques.",
            styles: { fontSize: 16, color: "#374151", textAlign: "center" },
          },
        ],
      },
    ],
    tags: ["API", "Backend", "Integration"],
    createdAt: "2024-01-10",
    status: "draft",
    views: 0,
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  "550e8400-e29b-41d4-a716-446655440003": {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "Design System Implementation",
    description: "Step-by-step guide to building a design system",
    type: "Course",
    slides: [
      {
        id: "550e8400-e29b-41d4-a716-446655440030",
        title: "Design System Basics",
        blocks: [
          {
            id: "1",
            type: "heading",
            content: "Building a Design System",
            styles: { fontSize: 32, color: "#1f2937", textAlign: "center" },
          },
          {
            id: "2",
            type: "paragraph",
            content: "A comprehensive guide to creating and implementing design systems in your organization.",
            styles: { fontSize: 16, color: "#374151", textAlign: "center" },
          },
        ],
      },
    ],
    tags: ["Design", "UI/UX", "System"],
    createdAt: "2024-01-08",
    status: "published",
    views: 890,
    user_id: "00000000-0000-0000-0000-000000000000",
  },
}

export class GuideStore {
  private static instance: GuideStore
  private guides: { [key: string]: Guide } = mockGuides

  private constructor() {}

  static getInstance(): GuideStore {
    if (!GuideStore.instance) {
      GuideStore.instance = new GuideStore()
    }
    return GuideStore.instance
  }

  getGuide(id: string): Guide | null {
    return this.guides[id] || null
  }

  getAllGuides(): Guide[] {
    return Object.values(this.guides)
  }

  saveGuide(guide: Guide): void {
    this.guides[guide.id] = guide
  }

  createGuide(guideData: Omit<Guide, "id" | "createdAt" | "status" | "views" | "user_id">): Guide {
    const id = Date.now().toString()
    const guide: Guide = {
      ...guideData,
      id,
      createdAt: new Date().toISOString().split("T")[0],
      status: "draft",
      views: 0,
      user_id: "00000000-0000-0000-0000-000000000000", // Placeholder user ID
    }
    this.guides[id] = guide
    return guide
  }

  deleteGuide(id: string): boolean {
    if (this.guides[id]) {
      delete this.guides[id]
      return true
    }
    return false
  }
}

export const guideStore = GuideStore.getInstance()

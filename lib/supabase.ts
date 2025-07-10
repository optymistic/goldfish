import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      guides: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: string
          tags: string[]
          status: "draft" | "published"
          custom_url: string | null
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type?: string
          tags?: string[]
          status?: "draft" | "published"
          custom_url?: string | null
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: string
          tags?: string[]
          status?: "draft" | "published"
          custom_url?: string | null
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      slides: {
        Row: {
          id: string
          guide_id: string
          title: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guide_id: string
          title: string
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guide_id?: string
          title?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      content_blocks: {
        Row: {
          id: string
          slide_id: string
          type: "heading" | "paragraph" | "image" | "video" | "gif" | "embed" | "two-column" | "input-field" | "file-upload"
          content: string | null
          left_content: string | null
          right_content: string | null
          left_type: string | null
          right_type: string | null
          styles: any
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slide_id: string
          type: "heading" | "paragraph" | "image" | "video" | "gif" | "embed" | "two-column" | "input-field" | "file-upload"
          content?: string | null
          left_content?: string | null
          right_content?: string | null
          left_type?: string | null
          right_type?: string | null
          styles?: any
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slide_id?: string
          type?: "heading" | "paragraph" | "image" | "video" | "gif" | "embed" | "two-column" | "input-field" | "file-upload"
          content?: string | null
          left_content?: string | null
          right_content?: string | null
          left_type?: string | null
          right_type?: string | null
          styles?: any
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_responses: {
        Row: {
          id: string
          guide_id: string
          slide_id: string
          block_id: string
          user_identifier: string
          question: string
          answer: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          guide_id: string
          slide_id: string
          block_id: string
          user_identifier: string
          question: string
          answer?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          guide_id?: string
          slide_id?: string
          block_id?: string
          user_identifier?: string
          question?: string
          answer?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          created_at?: string
        }
      }
    }
  }
}

import { supabase } from "./supabase"
import type { Database } from "./supabase"

type Guide = Database["public"]["Tables"]["guides"]["Row"]
type Slide = Database["public"]["Tables"]["slides"]["Row"]
type ContentBlock = Database["public"]["Tables"]["content_blocks"]["Row"]

export interface GuideWithSlides extends Guide {
  slides: (Slide & {
    blocks: ContentBlock[]
  })[]
}

export class DatabaseGuideStore {
  private static instance: DatabaseGuideStore

  private constructor() {}

  static getInstance(): DatabaseGuideStore {
    if (!DatabaseGuideStore.instance) {
      DatabaseGuideStore.instance = new DatabaseGuideStore()
    }
    return DatabaseGuideStore.instance
  }

  async getGuide(id: string): Promise<GuideWithSlides | null> {
    try {
      const { data: guide, error: guideError } = await supabase.from("guides").select("*").eq("id", id).single()

      if (guideError || !guide) {
        console.error("Error fetching guide:", guideError)
        return null
      }

      const { data: slides, error: slidesError } = await supabase
        .from("slides")
        .select(`
          *,
          content_blocks (*)
        `)
        .eq("guide_id", id)
        .order("position")

      if (slidesError) {
        console.error("Error fetching slides:", slidesError)
        return null
      }

      const slidesWithBlocks =
        slides?.map((slide) => ({
          ...slide,
          blocks: slide.content_blocks?.sort((a: ContentBlock, b: ContentBlock) => a.position - b.position) || [],
        })) || []

      return {
        ...guide,
        slides: slidesWithBlocks,
      }
    } catch (error) {
      console.error("Error in getGuide:", error)
      return null
    }
  }

  async getAllGuides(userId?: string): Promise<Guide[]> {
    try {
      let query = supabase.from("guides").select("*")

      if (userId) {
        query = query.eq("user_id", userId)
      }
      // If no userId provided, get all guides (for dashboard)

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching guides:", error)
        return []
      }

      // Get slides count for each guide
      const guidesWithSlidesCount = await Promise.all(
        (data || []).map(async (guide) => {
          const { count } = await supabase
            .from("slides")
            .select("*", { count: "exact", head: true })
            .eq("guide_id", guide.id)
          
          return {
            ...guide,
            slides: count || 0
          }
        })
      )

      return guidesWithSlidesCount
    } catch (error) {
      console.error("Error in getAllGuides:", error)
      return []
    }
  }

  async saveGuide(guide: GuideWithSlides): Promise<boolean> {
    try {
      console.log("[DEBUG] Saving guide:", guide.id)
      console.log("[DEBUG] Slides to save:", guide.slides.map(s => ({ id: s.id, title: s.title, position: s.position, blocks: s.blocks.map(b => ({ id: b.id, type: b.type, content: b.content, position: b.position })) })))
      
      // Update guide
      const { error: guideError } = await supabase.from("guides").upsert({
        id: guide.id,
        user_id: guide.user_id,
        title: guide.title,
        description: guide.description,
        type: guide.type,
        tags: guide.tags,
        status: guide.status,
        custom_url: guide.custom_url,
        views: guide.views,
        updated_at: new Date().toISOString(),
      })

      if (guideError) {
        console.error("Error saving guide:", guideError)
        return false
      }

      // Only fetch existing data if we have slides to potentially delete
      // This reduces unnecessary requests when just updating content
      let existingSlides: any[] = []
      let existingBlocks: any[] = []
      
      if (guide.slides.length > 0) {
        // Combined query to get both slides and blocks in one request
        const { data: existingData, error: existingError } = await supabase
          .from("slides")
          .select(`
            id,
            content_blocks (id, slide_id)
          `)
          .eq("guide_id", guide.id)

        if (existingError) {
          console.error("Error fetching existing data:", existingError)
        } else {
          existingSlides = existingData || []
          existingBlocks = existingSlides.flatMap(slide => slide.content_blocks || [])
        }
      }

      // Track which slides and blocks should be kept
      const currentSlideIds = new Set(guide.slides.map(s => s.id))
      const currentBlockIds = new Set(guide.slides.flatMap(s => s.blocks.map(b => b.id)))

      // Delete orphaned slides (only if there are any)
      const orphanedSlideIds = existingSlides
        .map(s => s.id)
        .filter(id => !currentSlideIds.has(id))
      
      if (orphanedSlideIds.length > 0) {
        console.log("Deleting orphaned slides:", orphanedSlideIds)
        const { error: deleteSlidesError } = await supabase
          .from("slides")
          .delete()
          .in("id", orphanedSlideIds)
        
        if (deleteSlidesError) {
          console.error("Error deleting orphaned slides:", deleteSlidesError)
        }
      }

      // Delete orphaned blocks (only if there are any)
      const orphanedBlockIds = existingBlocks
        .map(b => b.id)
        .filter(id => !currentBlockIds.has(id))
      
      if (orphanedBlockIds.length > 0) {
        console.log("Deleting orphaned blocks:", orphanedBlockIds)
        const { error: deleteBlocksError } = await supabase
          .from("content_blocks")
          .delete()
          .in("id", orphanedBlockIds)
        
        if (deleteBlocksError) {
          console.error("Error deleting orphaned blocks:", deleteBlocksError)
        }
      }

      // Save slides and blocks
      for (const slide of guide.slides) {
        console.log("Saving slide:", slide.id)
        
        const { error: slideError } = await supabase.from("slides").upsert({
          id: slide.id,
          guide_id: guide.id,
          title: slide.title,
          position: slide.position,
          updated_at: new Date().toISOString(),
        })

        if (slideError) {
          console.error("Error saving slide:", slideError)
          return false
        }

        // Save content blocks
        for (const block of slide.blocks) {
          console.log("Saving block:", block.id)
          
          const { error: blockError } = await supabase.from("content_blocks").upsert({
            id: block.id,
            slide_id: slide.id,
            type: block.type,
            content: block.content,
            left_content: block.left_content,
            right_content: block.right_content,
            left_type: block.left_type,
            right_type: block.right_type,
            styles: block.styles,
            position: block.position,
            updated_at: new Date().toISOString(),
          })

          if (blockError) {
            console.error("Error saving block:", blockError)
            return false
          }
        }
      }

      console.log("Save completed successfully for guide:", guide.id)
      return true
    } catch (error) {
      console.error("Error in saveGuide:", error)
      return false
    }
  }

  async createGuide(guideData: {
    title: string
    description: string
    type: string
    tags: string[]
    userId: string
  }): Promise<GuideWithSlides | null> {
    try {
      const { data: guide, error: guideError } = await supabase
        .from("guides")
        .insert({
          user_id: guideData.userId,
          title: guideData.title,
          description: guideData.description,
          type: guideData.type,
          tags: guideData.tags,
          status: "draft",
        })
        .select()
        .single()

      if (guideError || !guide) {
        console.error("Error creating guide:", guideError)
        return null
      }

      // Create initial slide
      const { data: slide, error: slideError } = await supabase
        .from("slides")
        .insert({
          guide_id: guide.id,
          title: "Introduction",
          position: 1,
        })
        .select()
        .single()

      if (slideError || !slide) {
        console.error("Error creating slide:", slideError)
        return null
      }

      return {
        ...guide,
        slides: [
          {
            ...slide,
            blocks: [],
          },
        ],
      }
    } catch (error) {
      console.error("Error in createGuide:", error)
      return null
    }
  }

  async deleteGuide(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("guides").delete().eq("id", id)

      if (error) {
        console.error("Error deleting guide:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in deleteGuide:", error)
      return false
    }
  }

  async incrementViews(id: string): Promise<void> {
    try {
      await supabase.rpc("increment_guide_views", { guide_id: id })
    } catch (error) {
      console.error("Error incrementing views:", error)
    }
  }
}

export const databaseGuideStore = DatabaseGuideStore.getInstance()

"use client"

import type React from "react"
import type { Database } from "@/lib/supabase"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Save,
  Eye,
  Share2,
  ArrowLeft,
  Plus,
  Type,
  ImageIcon,
  Video,
  FileText,
  Settings,
  Play,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Layout,
  Trash2,
  Link,
  RotateCcw,
  Edit,
  Maximize2,
  BookCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { databaseGuideStore, GuideWithSlides } from "@/lib/database-guide-store"
import { generateUUID } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import DOMPurify from 'dompurify'
// @ts-ignore
import type { default as DOMPurifyType } from 'dompurify';

// Use Supabase types
type Slide = Database["public"]["Tables"]["slides"]["Row"] & { blocks: ContentBlock[] }
type ContentBlock = Database["public"]["Tables"]["content_blocks"]["Row"]

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "http://localhost:3000"
}

// Helper to get current ISO string
const now = () => new Date().toISOString()

// Local storage key for unsaved changes
const getLocalStorageKey = (guideId: string) => `guide-editor-${guideId}`

function GuideEditorPage() {
  return (
    <AuthGuard>
      <GuideEditor />
    </AuthGuard>
  )
}

export default GuideEditorPage

export function GuideEditor() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  // Load guide data from store
  const [guideData, setGuideData] = useState<GuideWithSlides | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load guide data on component mount
  useEffect(() => {
    const loadGuide = async () => {
      try {
        const response = await apiClient.getGuide(params.id as string)
        setGuideData(response.guide)
        // Initialize tags from guide data
        if (response.guide?.tags) {
          setGuideTags(response.guide.tags.map((tag: string, i: number) => ({ text: tag, color: getTagColor(tag, i) })))
        }
        
        // Check for unsaved changes in localStorage
        const localKey = getLocalStorageKey(params.id as string)
        const savedData = localStorage.getItem(localKey)
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          setSlides(parsedData.slides || [])
          setGuideTitle(parsedData.title || response.guide?.title || "My New Guide")
          setHasUnsavedChanges(true)
        } else if (response.guide) {
          // If no localStorage data, initialize with guide data
          setGuideTitle(response.guide.title)
          setSlides(response.guide.slides.length > 0 ? response.guide.slides : [
            {
              id: generateUUID(),
              guide_id: response.guide.id,
              title: "Introduction",
              position: 1,
              created_at: now(),
              updated_at: now(),
              blocks: [
                {
                  id: generateUUID(),
                  slide_id: "temp-slide-id",
                  type: "heading",
                  content: "Welcome to Your Guide",
                  left_content: null,
                  right_content: null,
                  left_type: null,
                  right_type: null,
                  styles: { fontSize: 32, color: "#1f2937", textAlign: "center" },
                  position: 1,
                  created_at: now(),
                  updated_at: now(),
                },
                {
                  id: generateUUID(),
                  slide_id: "temp-slide-id",
                  type: "paragraph",
                  content: "This is your first slide. Start editing to create amazing content!",
                  left_content: null,
                  right_content: null,
                  left_type: null,
                  right_type: null,
                  styles: { fontSize: 16, color: "#6b7280", textAlign: "center" },
                  position: 2,
                  created_at: now(),
                  updated_at: now(),
                },
              ],
            },
          ])
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading guide:", error)
        toast({
          title: "Error",
          description: "Failed to load guide data.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadGuide()
    }
  }, [params.id, toast])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [guideTitle, setGuideTitle] = useState("My New Guide")
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null)

  const [isCopied, setIsCopied] = useState(false)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [customUrl, setCustomUrl] = useState("")
  const [aspectRatioLock, setAspectRatioLock] = useState(true)
  const [titleInputWidth, setTitleInputWidth] = useState(200)
  const titleMeasureRef = useRef<HTMLSpanElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Add state and handlers at the top of the component:
  const [guideTags, setGuideTags] = useState<{ text: string; color: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  function getTagColor(tag: string, index: number) {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    ];
    return colors[index % colors.length];
  }
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!newTag) return;
      if (guideTags.some(t => t.text === newTag)) return;
      if (guideTags.length >= 10) return;
      setGuideTags([...guideTags, { text: newTag, color: getTagColor(newTag, guideTags.length) }]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove: { text: string; color: string }) => {
    setGuideTags(guideTags.filter(t => t.text !== tagToRemove.text));
  };

  // Clear selected block when changing slides
  useEffect(() => {
    setSelectedBlock(null)
  }, [currentSlide])

  // Measure title width for dynamic input sizing
  useEffect(() => {
    if (titleMeasureRef.current) {
      const width = titleMeasureRef.current.offsetWidth
      setTitleInputWidth(Math.max(200, Math.min(600, width + 20))) // Add some padding
    }
  }, [guideTitle])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key to delete selected block
      if (e.key === 'Delete' && selectedBlock && !isPreviewMode) {
        e.preventDefault()
        deleteBlock(selectedBlock)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedBlock, isPreviewMode])

  // Reset styles to default
  const resetBlockStyles = (blockId: string) => {
    const block = slides[currentSlide]?.blocks.find(b => b.id === blockId)
    if (!block) return

    const defaultStyles = getDefaultStyles(block.type)
    const updatedSlides = [...slides]
    const blockIndex = updatedSlides[currentSlide].blocks.findIndex(b => b.id === blockId)
    
    if (blockIndex !== -1) {
      updatedSlides[currentSlide].blocks[blockIndex] = {
        ...updatedSlides[currentSlide].blocks[blockIndex],
        styles: defaultStyles
      }
      setSlides(updatedSlides)
    }
  }

  // Save to localStorage when slides or title change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (guideData && slides.length > 0) {
        const localKey = getLocalStorageKey(params.id as string)
        const dataToSave = {
          title: guideTitle,
          slides: slides,
          lastModified: new Date().toISOString()
        }
        localStorage.setItem(localKey, JSON.stringify(dataToSave))
        setHasUnsavedChanges(true)
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(timeoutId)
  }, [slides, guideTitle, guideData, params.id])

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
        return "You have unsaved changes. Are you sure you want to leave?"
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Cleanup localStorage on unmount if no unsaved changes
  useEffect(() => {
    return () => {
      if (!hasUnsavedChanges) {
        const localKey = getLocalStorageKey(params.id as string)
        localStorage.removeItem(localKey)
      }
    }
  }, [hasUnsavedChanges, params.id])

  // Save to database function
  const saveToDatabase = useCallback(async (status: "draft" | "published" = "draft") => {
    if (!guideData) {
      console.error("No guide data available for saving")
      return false
    }
    
    setIsSaving(true)
    try {
      const updatedGuide = {
        ...guideData,
        title: guideTitle,
        tags: guideTags.map(t => t.text),
        slides: slides.map((slide, index) => ({
          ...slide,
          position: index + 1,
          blocks: slide.blocks.map((block, blockIndex) => ({
            ...block,
            position: blockIndex + 1,
          })),
        })),
        status,
        custom_url: status === "published" ? (customUrl || null) : (guideData.custom_url || null),
      }

      const success = await databaseGuideStore.saveGuide(updatedGuide)
      
      if (success) {
        // Clear localStorage after successful save
        const localKey = getLocalStorageKey(params.id as string)
        localStorage.removeItem(localKey)
        setHasUnsavedChanges(false)
        return true
      } else {
        console.error("Save failed - databaseGuideStore.saveGuide returned false")
        return false
      }
    } catch (error) {
      console.error("Save error:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [guideData, guideTitle, slides, customUrl, params.id, guideTags])

  const handleSaveDraft = async () => {
    const success = await saveToDatabase("draft")
    if (success) {
      toast({
        title: "Draft Saved",
        description: "Your guide has been saved to drafts successfully.",
      })
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } else {
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePublish = async () => {
    const success = await saveToDatabase("published")
    if (success) {
      setIsPublishDialogOpen(false)
      toast({
        title: "Guide Published",
        description: "Your guide is now live and accessible via the shareable link.",
      })
    } else {
      toast({
        title: "Publish Failed",
        description: "Failed to publish guide. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCopyUrl = async () => {
    const baseUrl = getBaseUrl()
    const fullUrl = customUrl ? `${baseUrl}/guide/${customUrl}` : `${baseUrl}/guide/${params.id}`

    try {
      await navigator.clipboard.writeText(fullUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: "URL Copied",
        description: "The shareable URL has been copied to your clipboard.",
      })
    } catch (err) {
      console.error("Failed to copy: ", err)
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      })
    }
  }

  const addSlide = () => {
    if (!guideData || !guideData.id) return
    const newSlide: Slide = {
      id: generateUUID(),
      guide_id: guideData.id,
      title: `Slide ${slides.length + 1}`,
      position: slides.length + 1,
      created_at: now(),
      updated_at: now(),
      blocks: [],
    }
    setSlides([...slides, newSlide])
    setCurrentSlide(slides.length)
  }

  const deleteSlide = (slideIndex: number) => {
    if (slides.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one slide in your guide.",
        variant: "destructive",
      })
      return
    }

    if (confirm(`Are you sure you want to delete "Slide ${slideIndex + 1}"? This action cannot be undone.`)) {
      const updatedSlides = slides.filter((_, index) => index !== slideIndex)
      setSlides(updatedSlides)
      
      // Adjust current slide if needed
      if (currentSlide >= slideIndex) {
        const newCurrentSlide = Math.max(0, currentSlide - 1)
        setCurrentSlide(newCurrentSlide)
      }
      
      toast({
        title: "Slide Deleted",
        description: "The slide has been removed from your guide.",
      })
    }
  }

  const addBlock = (type: ContentBlock["type"]) => {
    const slideId = slides[currentSlide]?.id ?? generateUUID()
    const newBlock: ContentBlock = {
      id: generateUUID(),
      slide_id: slideId,
      type,
      content: getDefaultContent(type),
      left_content: null,
      right_content: null,
      left_type: null,
      right_type: null,
      styles: getDefaultStyles(type),
      position: slides[currentSlide]?.blocks.length + 1 || 1,
      created_at: now(),
      updated_at: now(),
    }

    if (type === "two-column") {
      newBlock.left_content = ""
      newBlock.right_content = ""
      newBlock.left_type = "paragraph"
      newBlock.right_type = "paragraph"
    }

    const updatedSlides = [...slides]
    const blocks = updatedSlides[currentSlide].blocks
    if (selectedBlock) {
      const selectedIndex = blocks.findIndex(b => b.id === selectedBlock)
      if (selectedIndex !== -1) {
        blocks.splice(selectedIndex + 1, 0, newBlock)
      } else {
        blocks.push(newBlock)
      }
    } else {
      blocks.push(newBlock)
    }
    setSlides(updatedSlides)
    setSelectedBlock(newBlock.id)
  }

  const getDefaultContent = (type: ContentBlock["type"]) => {
    switch (type) {
      case "heading":
        return ""
      case "paragraph":
        return ""
      case "image":
        return "/placeholder.png"
      case "video":
        return "https://example.com/video.mp4"
      case "gif":
        return "/placeholder.png"
      case "embed":
        return "https://www.youtube.com/embed/dQw4w9WgXcQ"
      case "two-column":
        return ""
      default:
        return ""
    }
  }

  const convertToEmbedUrl = (url: string): string => {
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url
    }
    
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url
    }
    
    // Google Maps
    if (url.includes('google.com/maps')) {
      return url.replace('/maps/', '/maps/embed/')
    }
    
    // Spotify
    if (url.includes('open.spotify.com/track/') || url.includes('open.spotify.com/album/') || url.includes('open.spotify.com/playlist/')) {
      return url.replace('open.spotify.com', 'open.spotify.com/embed')
    }
    
    // For other URLs, return as-is (user should provide embed URL)
    return url
  }

  const getDefaultStyles = (type: ContentBlock["type"]) => {
    switch (type) {
      case "heading":
        return {
          fontSize: 24,
          color: "hsl(var(--foreground))",
          textAlign: "left" as const,
          backgroundColor: "transparent",
        }
      case "paragraph":
        return {
          fontSize: 16,
          color: "hsl(var(--foreground))",
          textAlign: "left" as const,
          backgroundColor: "transparent",
        }
      case "image":
        return { 
          borderRadius: 8, 
          padding: 0, 
          backgroundColor: "transparent",
          width: 100,
          height: 300
        }
      case "video":
        return { 
          borderRadius: 12, 
          padding: 0, 
          backgroundColor: "transparent",
          width: 100,
          height: 400
        }
      case "gif":
        return { 
          borderRadius: 8, 
          padding: 0, 
          backgroundColor: "transparent",
          width: 100,
          height: 300
        }
      case "embed":
        return { 
          borderRadius: 8, 
          padding: 0, 
          backgroundColor: "transparent",
          width: 100,
          height: 400
        }
      default:
        return { backgroundColor: "transparent" }
    }
  }

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    const updatedSlides = slides.map((slide) => ({
      ...slide,
      blocks: slide.blocks.map((block) => {
        if (block.id === blockId) {
          const newBlock = { ...block, ...updates };
          if (updates.content !== undefined) {
            console.log('[GuideEditor] updateBlock: new content value', updates.content);
          }
          return newBlock;
        }
        return block;
      }),
    }))
    setSlides(updatedSlides)
  }

  const updateBlockStyle = (blockId: string, styleKey: string, value: any) => {
    let safeValue = value;
    if (Array.isArray(value)) {
      safeValue = value[0];
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`updateBlockStyle: Received array for styleKey '${styleKey}', using first element.`, value);
      }
    }
    if (typeof safeValue !== 'number' && typeof safeValue !== 'string') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`updateBlockStyle: Ignoring invalid style value for '${styleKey}':`, safeValue);
      }
      return;
    }
    const updatedSlides = slides.map((slide) => ({
      ...slide,
      blocks: slide.blocks.map((block) =>
        block.id === blockId ? { ...block, styles: { ...block.styles, [styleKey]: safeValue } } : block,
      ),
    }))
    setSlides(updatedSlides)
  }

  const deleteBlock = (blockId: string) => {
    const updatedSlides = slides.map((slide) => ({
      ...slide,
      blocks: slide.blocks.filter((block) => block.id !== blockId),
    }))
    setSlides(updatedSlides)
    setSelectedBlock(null)
  }

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId)
    e.dataTransfer.effectAllowed = "move"
    
    // Create a better drag preview that shows the full block
    const dragPreview = (e.currentTarget as HTMLElement).cloneNode(true) as HTMLElement
    
    // Apply drag preview styles
    dragPreview.style.opacity = '0.8'
    dragPreview.style.transform = 'rotate(2deg) scale(0.95)'
    dragPreview.style.pointerEvents = 'none'
    dragPreview.style.position = 'fixed'
    dragPreview.style.zIndex = '1000'
    dragPreview.style.top = '-1000px' // Hide it off-screen
    dragPreview.style.width = `${(e.currentTarget as HTMLElement).offsetWidth}px`
    dragPreview.style.maxWidth = '300px' // Limit width for better UX
    dragPreview.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
    dragPreview.style.borderRadius = '8px'
    dragPreview.style.background = 'white'
    dragPreview.style.border = '2px solid hsl(var(--primary))'
    
    // Remove any existing drag previews
    const existingPreview = document.querySelector('.drag-preview')
    if (existingPreview) {
      document.body.removeChild(existingPreview)
    }
    
    dragPreview.classList.add('drag-preview')
    document.body.appendChild(dragPreview)
    
    // Set the drag image with proper offset
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    e.dataTransfer.setDragImage(dragPreview, offsetX, offsetY)
    
    // Remove the preview after a short delay
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview)
      }
    }, 100)
  }

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    
    if (!draggedBlock || draggedBlock === blockId) {
      setDragOverBlock(null)
      setDragPosition(null)
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position = e.clientY < midY ? 'above' : 'below'
    
    setDragOverBlock(blockId)
    setDragPosition(position)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX, clientY } = e
    
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverBlock(null)
      setDragPosition(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault()
    if (!draggedBlock || draggedBlock === targetBlockId) {
      setDraggedBlock(null)
      setDragOverBlock(null)
      setDragPosition(null)
      return
    }

    const updatedSlides = [...slides]
    const currentBlocks = updatedSlides[currentSlide].blocks
    const draggedIndex = currentBlocks.findIndex((b) => b.id === draggedBlock)
    const targetIndex = currentBlocks.findIndex((b) => b.id === targetBlockId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = currentBlocks.splice(draggedIndex, 1)
      // Insert based on drag position
      let insertIndex = targetIndex
      if (dragPosition === 'below' && draggedIndex < targetIndex) {
        insertIndex = targetIndex
      } else if (dragPosition === 'above' && draggedIndex > targetIndex) {
        insertIndex = targetIndex
      } else if (dragPosition === 'below' && draggedIndex > targetIndex) {
        insertIndex = targetIndex + 1
      } else if (dragPosition === 'above' && draggedIndex < targetIndex) {
        insertIndex = targetIndex
      }
      currentBlocks.splice(insertIndex, 0, draggedItem)
      setSlides(updatedSlides)
      setSelectedBlock(draggedBlock) // <-- Ensure the dragged block stays selected
    }

    setDraggedBlock(null)
    setDragOverBlock(null)
    setDragPosition(null)
  }

  const handleDragEnd = () => {
    setDraggedBlock(null)
    setDragOverBlock(null)
    setDragPosition(null)
  }

  // Helper to sanitize and enhance HTML (add target/rel to <a> tags)
  function sanitizeAndEnhanceHtml(html: string) {
    // Sanitize first
    let clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
    // Enhance <a> tags to always open in new tab and be safe
    clean = clean.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (match: string, p1: string) => {
      // If already has target or rel, don't duplicate
      let result = `<a ${p1}`
      if (!/target=/.test(p1)) result += ' target="_blank"'
      if (!/rel=/.test(p1)) result += ' rel="noopener noreferrer"'
      result += '>'
      return result
    })
    return clean
  }

  const renderBlockContent = (block: ContentBlock, isPreview = false) => {
    const padding = block.styles.individualPadding 
      ? `${block.styles.paddingTop || 0}px ${block.styles.paddingRight || 0}px ${block.styles.paddingBottom || 0}px ${block.styles.paddingLeft || 0}px`
      : `${block.styles.padding || 0}px`
    
    const commonStyles = {
      backgroundColor: block.styles.backgroundColor || "transparent",
      borderRadius: `${block.styles.borderRadius || 0}px`,
      textAlign: block.styles.textAlign || "left",
      padding: padding,
      cursor: isPreview ? "default" : "pointer",
    }

    if (block.type === "two-column") {
      return (
        <div className="two-column-layout" style={commonStyles}>
          <div className="border rounded p-4 flex items-center justify-center min-h-[100px]">
            {renderSingleContent(block.left_type || "paragraph", block.left_content || "", block.styles, "left")}
          </div>
          <div className="border rounded p-4 flex items-center justify-center min-h-[100px]">
            {renderSingleContent(block.right_type || "paragraph", block.right_content || "", block.styles, "right")}
          </div>
        </div>
      )
    }

    return renderSingleContent(block.type, block.content ?? "", block.styles, commonStyles)
  }

  const renderSingleContent = (type: string, content: string, styles: any, commonStyles?: any, position?: string) => {
    // Determine if the background is a gradient
    const isGradient = typeof styles.backgroundColor === 'string' && styles.backgroundColor.startsWith('linear-gradient');
    const finalStyles = {
      ...commonStyles,
      ...(isGradient
        ? { background: styles.backgroundColor }
        : { backgroundColor: styles.backgroundColor === "transparent" ? "transparent" : styles.backgroundColor }),
    }

    // Check if content is empty for editor placeholders
    const isEmpty = !content || content.trim() === '';

    // Detect block-level HTML
    const hasBlockHtml = /<(ul|ol|li|p|div|h[1-6])\b/i.test(content);

    switch (type) {
      case "heading":
        if (hasBlockHtml) {
          return (
            <div
              style={{
                ...finalStyles,
                fontSize: `${styles.fontSize || 24}px`,
                color: styles.color || "hsl(var(--foreground))",
                fontWeight: "bold",
                margin: 0,
                width: "100%",
                minHeight: "2em",
                display: "block",
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Heading" : content) }}
            />
          )
        } else {
          return (
            <h2
              style={{
                ...finalStyles,
                fontSize: `${styles.fontSize || 24}px`,
                color: styles.color || "hsl(var(--foreground))",
                fontWeight: "bold",
                margin: 0,
                width: "100%",
                minHeight: "2em",
                display: "block",
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Heading" : content) }}
            />
          )
        }
      case "paragraph":
        return (
          <div
            style={{
              ...finalStyles,
              fontSize: `${styles.fontSize || 16}px`,
              color: styles.color || "hsl(var(--foreground))",
              lineHeight: 1.6,
              margin: 0,
              width: "100%",
              minHeight: "1.6em",
              display: "block",
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? (position === "left" ? "Left Column" : position === "right" ? "Right Column" : "Paragraph") : content) }}
          />
        )
      case "image":
        return (
          <div
            style={{
              ...finalStyles,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: styles.width ? `${styles.width}%` : "100%",
              height: styles.height ? `${styles.height}px` : "auto",
              overflow: 'hidden',
            }}
          >
            <img
              src={content || "/placeholder.png"}
              alt="Content"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                borderRadius: finalStyles.borderRadius,
                objectFit: "contain",
                display: "block",
              }}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'image', src: content || "/placeholder.png", backgroundStyle: styles.backgroundColor?.startsWith('linear-gradient') ? { background: styles.backgroundColor } : { backgroundColor: styles.backgroundColor || 'transparent' } })}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                borderRadius: '50%',
                padding: 4,
                cursor: 'pointer',
                zIndex: 2,
                background: 'rgba(0,0,0,0.5)', // semi-transparent dark background
                color: '#fff', // ensure icon is white
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
              aria-label="Expand image"
            >
              <Maximize2 color="#fff" size={16} />
            </button>
          </div>
        )
      case "video":
        return (
          <div style={{ ...finalStyles, position: 'relative', display: 'inline-block' }}>
            <video
              src={content}
              controls
              style={{
                maxWidth: styles.width ? `${styles.width}%` : "100%",
                width: styles.width ? `${styles.width}%` : "auto",
                height: styles.height ? `${styles.height}px` : "auto",
                display: "block",
                margin: "0 auto",
                borderRadius: finalStyles.borderRadius,
                objectFit: "contain"
              }}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'video', src: content, backgroundStyle: styles.backgroundColor?.startsWith('linear-gradient') ? { background: styles.backgroundColor } : { backgroundColor: styles.backgroundColor || 'transparent' } })}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                borderRadius: '50%',
                padding: 4,
                cursor: 'pointer',
                zIndex: 2,
                background: 'rgba(0,0,0,0.5)', // semi-transparent dark background
                color: '#fff', // ensure icon is white
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
              aria-label="Expand video"
            >
              <Maximize2 color="#fff" size={16} />
            </button>
          </div>
        )
      case "gif":
        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={content || "/placeholder.png"}
              alt="Content"
              style={{
                ...finalStyles,
                maxWidth: styles.width ? `${styles.width}%` : "100%",
                width: styles.width ? `${styles.width}%` : "auto",
                height: styles.height ? `${styles.height}px` : "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'image', src: content || "/placeholder.png", backgroundStyle: styles.backgroundColor?.startsWith('linear-gradient') ? { background: styles.backgroundColor } : { backgroundColor: styles.backgroundColor || 'transparent' } })}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                borderRadius: '50%',
                padding: 4,
                cursor: 'pointer',
                zIndex: 2,
                background: 'rgba(0,0,0,0.5)', // semi-transparent dark background
                color: '#fff', // ensure icon is white
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
              aria-label="Expand image"
            >
              <Maximize2 color="#fff" size={16} />
            </button>
          </div>
        )
      case "embed":
        return (
          <div style={{ ...finalStyles, width: "100%" }}>
            <iframe
              src={content}
              style={{
                width: "100%",
                height: styles.height ? `${styles.height}px` : "400px",
                border: "none",
                borderRadius: `${styles.borderRadius || 8}px`,
              }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded content"
              onError={(e) => {
                console.error("Embed iframe error:", e)
              }}
            />
            {!content && (
              <div 
                style={{
                  width: "100%",
                  height: styles.height ? `${styles.height}px` : "400px",
                  border: "2px dashed #ccc",
                  borderRadius: `${styles.borderRadius || 8}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f9f9f9",
                  color: "#666"
                }}
              >
                Enter an embed URL above
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const renderBlock = (block: ContentBlock, isPreview = false) => {
    const borderRadius = block.styles?.borderRadius || 0
    const isDragging = draggedBlock === block.id
    const isDragOver = dragOverBlock === block.id
    
    return (
      <div
        key={block.id}
        className={`relative group transition-all duration-200 ${
          !isPreview && selectedBlock === block.id && !draggedBlock ? "ring-2 ring-primary" : ""
        } ${
          isDragging ? "opacity-50 scale-95" : ""
        } ${
          isDragOver && !isPreview && draggedBlock && draggedBlock !== block.id ? "ring-2 ring-primary/60 ring-dashed" : ""
        }`}
        style={!isPreview && selectedBlock === block.id ? { borderRadius: `${borderRadius}px` } : {}}
        onClick={() => !isPreview && !draggedBlock && setSelectedBlock(block.id)}
        draggable={!isPreview}
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={(e) => handleDragOver(e, block.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
      >
        {/* Drop indicator lines - only show when dragging over this specific block */}
        {isDragOver && !isPreview && draggedBlock && draggedBlock !== block.id && (
          <>
            {dragPosition === 'above' && (
              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 shadow-sm" />
            )}
            {dragPosition === 'below' && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 shadow-sm" />
            )}
          </>
        )}
        
        {!isPreview && (
          <div className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground drag-handle" />
          </div>
        )}
        {renderBlockContent(block, isPreview)}
        {!isPreview && selectedBlock === block.id && !draggedBlock && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              deleteBlock(block.id)
            }}
          >
            ×
          </Button>
        )}
      </div>
    )
  }

  const selectedBlockData = slides[currentSlide]?.blocks.find((b) => b.id === selectedBlock)

  // Add debugging to log value passed to RichTextEditor and value stored in state
  useEffect(() => {
    if (selectedBlockData) {
      console.log('[GuideEditor] RichTextEditor value prop:', selectedBlockData.content);
    }
  }, [selectedBlockData?.content]);

  const [expandedMedia, setExpandedMedia] = useState<{ type: 'image' | 'video', src: string, backgroundStyle?: React.CSSProperties } | null>(null)
  const [expandAnim, setExpandAnim] = useState(false)
  useEffect(() => {
    if (expandedMedia) {
      setExpandAnim(true)
    } else {
      setExpandAnim(false)
    }
  }, [expandedMedia])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-rings mx-auto"></div>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-pulse">
            Loading guide...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-premium">
      <Toaster />
      {/* Header */}
      <header className="glass-premium border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
                      router.push("/")
                    }
                  } else {
                    router.push("/")
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-4 flex-1">
                {/* Title input with edit icon */}
                <div className="flex flex-col gap-1 flex-1">
                  {/* Title input with edit icon */}
                  <div className="flex items-center gap-2 group">
                    <div className="relative inline-flex items-center">
                      {/* Hidden span for measuring width */}
                      <span
                        ref={titleMeasureRef}
                        className="text-lg font-semibold invisible absolute whitespace-pre"
                        style={{
                          background: 'linear-gradient(to right, #ec4899, #a855f7, #8b5cf6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {guideTitle || "Enter guide title..."}
                      </span>
                      <Input
                        ref={titleInputRef}
                        value={guideTitle}
                        onChange={(e) => setGuideTitle(e.target.value)}
                        className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent group-hover:bg-muted/50 focus:bg-muted/50 rounded-md transition-colors duration-200 focus:border focus:border-primary/20 cursor-text"
                        style={{
                          background: 'linear-gradient(to right, #ec4899, #a855f7, #8b5cf6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          width: `${titleInputWidth}px`
                        }}
                        placeholder="Enter guide title..."
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="opacity-100 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 ml-4 p-1 rounded-md bg-muted/80 backdrop-blur-sm"
                        onClick={() => titleInputRef.current?.focus()}
                        aria-label="Edit title"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  {/* Tags row below title */}
                  <div className="flex items-center gap-2 min-w-0 flex-wrap mt-1">
                    {guideTags.map((tag, index) => (
                      <Badge
                        key={tag.text}
                        variant="outline"
                        className={`text-xs px-2 py-1 font-medium ${tag.color}`}
                      >
                        {tag.text}
                      </Badge>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tag..."
                      className="text-xs border rounded-md px-2 py-1 min-w-[60px] max-w-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {hasUnsavedChanges && (
                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Unsaved
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (isPreviewMode) {
                    setIsPreviewMode(false)
                  } else {
                    router.push(`/guide/${params.id}?from=dashboard`)
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? "Edit" : "Preview"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="loading-rings-sm mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 min-w-[120px] flex-shrink-0 whitespace-nowrap"
                    disabled={isSaving}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full flex flex-col items-center justify-center max-h-[90vh]">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2">
                      <BookCheck className="h-5 w-5 text-pink-500" />
                      <span className="gradient-text font-bold">Publish Your Guide</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-8">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your guide will be published and accessible via a shareable link.
                    </p>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Custom URL (optional)</Label>
                      <Input
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="my-awesome-guide"
                        className="text-sm h-10"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to use default ID-based URL</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <Label className="text-xs text-muted-foreground mb-2 block">Shareable URL</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={
                            customUrl ? `${getBaseUrl()}/guide/${customUrl}` : `${getBaseUrl()}/guide/${params.id}`
                          }
                          readOnly
                          className="text-sm h-10"
                        />
                        <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                          {isCopied ? "Copied ✅" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 min-w-[120px] flex-shrink-0 whitespace-nowrap"
                        onClick={handlePublish}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div className="loading-rings-sm mr-2"></div>
                            Publishing...
                          </>
                        ) : (
                          "Publish Guide"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Slides Panel */}
          <div className="col-span-2 card-premium rounded-lg border p-4 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Slides</h3>
              <Button size="sm" variant="outline" onClick={addSlide}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`glass-premium rounded-lg border border-border/50 cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                    currentSlide === index
                      ? "ring-2 ring-primary/50 bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 shadow-lg"
                      : "hover:bg-muted/30 hover:border-border hover:shadow-md hover:scale-[1.02]"
                  }`}
                >
                  <div 
                    onClick={() => setCurrentSlide(index)}
                    className="flex-1 p-3"
                  >
                    <div className="text-xs font-medium mb-1 text-foreground">Slide {index + 1}</div>
                    <div 
                      className="text-xs font-bold text-muted-foreground truncate"
                      style={{
                        background: 'linear-gradient(to right, #ec4899, #a855f7, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {slide.title}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
                      {slide.blocks.length} blocks
                    </div>
                  </div>
                  
                  {/* Delete button - only show on hover and if more than 1 slide */}
                  {slides.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive border border-destructive/20 hover:border-destructive/40"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSlide(index)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {/* Premium gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 pointer-events-none ${
                    currentSlide === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity duration-200`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="col-span-6 card-premium rounded-lg border min-h-[600px]">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Slide {currentSlide + 1}</h2>
                  <div className="flex items-center gap-2 group">
                    <div className="relative inline-flex items-center">
                      <Input
                        value={slides[currentSlide]?.title || ""}
                        onChange={(e) => {
                          const updatedSlides = [...slides]
                          updatedSlides[currentSlide].title = e.target.value
                          setSlides(updatedSlides)
                        }}
                        className="text-sm font-bold mt-1 border-none shadow-none focus-visible:ring-0 px-0 bg-transparent group-hover:bg-muted/50 focus:bg-muted/50 rounded-md transition-colors duration-200 focus:border focus:border-primary/20 cursor-text"
                        style={{
                          background: 'linear-gradient(to right, #ec4899, #a855f7, #8b5cf6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                        placeholder="Slide title..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentSlide === 0}
                    onClick={() => setCurrentSlide(currentSlide - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentSlide === slides.length - 1}
                    onClick={() => setCurrentSlide(currentSlide + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {!isPreviewMode && (
              <div className="p-4 border-b bg-muted/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => addBlock("heading")}>
                    <Type className="h-3 w-3 mr-1" />
                    Heading
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("paragraph")}>
                    <FileText className="h-3 w-3 mr-1" />
                    Text
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("image")}>
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Image
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("video")}>
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("gif")}>
                    <Play className="h-3 w-3 mr-1" />
                    GIF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("embed")}>
                    <Link className="h-3 w-3 mr-1" />
                    Embed
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addBlock("two-column")}>
                    <Layout className="h-3 w-3 mr-1" />2 Columns
                  </Button>
                </div>
              </div>
            )}

            <div className="p-6 pb-12">
              <div className="space-y-4">
                {slides[currentSlide]?.blocks.map((block) => renderBlock(block, isPreviewMode))}
                {slides[currentSlide]?.blocks.length === 0 && !isPreviewMode && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>This slide is empty. Add some content to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="col-span-4 card-premium rounded-lg border sticky top-6 self-start">
            <div className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <h3 className="font-semibold flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Properties
              </h3>
            </div>

            <div className="p-4 space-y-8">
              {selectedBlockData ? (
                <div className="space-y-6">
                  {/* Content Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Content Type</Label>
                    <Select
                      value={selectedBlockData.type}
                      onValueChange={(value) => updateBlock(selectedBlockData.id, { type: value as any })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heading">Heading</SelectItem>
                        <SelectItem value="paragraph">Paragraph</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                        <SelectItem value="embed">Embed</SelectItem>
                        <SelectItem value="two-column">Two Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Styles Button */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetBlockStyles(selectedBlockData.id)}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default Styles
                    </Button>
                  </div>

                  {/* Content */}
                  {selectedBlockData.type !== "two-column" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Content</Label>
                      {selectedBlockData.type === "heading" || selectedBlockData.type === "paragraph" ? (
                        <RichTextEditor
                          value={selectedBlockData.content ?? ""}
                          onChange={(value) => updateBlock(selectedBlockData.id, { content: value })}
                          placeholder="Enter content..."
                          blockType={selectedBlockData.type}
                        />
                      ) : (
                        <>
                          <Input
                            value={selectedBlockData.content ?? ""}
                            onChange={(e) => {
                              const url = e.target.value
                              if (selectedBlockData.type === "embed") {
                                const embedUrl = convertToEmbedUrl(url)
                                updateBlock(selectedBlockData.id, { content: embedUrl })
                              } else {
                                updateBlock(selectedBlockData.id, { content: url })
                              }
                            }}
                            placeholder={
                              selectedBlockData.type === "embed" 
                                ? "Paste YouTube, Vimeo, Google Maps, or embed URL..." 
                                : selectedBlockData.type === "image" 
                                  ? "Image URL" 
                                  : selectedBlockData.type === "gif" 
                                    ? "GIF URL" 
                                    : "Video URL"
                            }
                            className="text-sm"
                          />
                          {selectedBlockData.type === "embed" && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                <strong>Supported formats:</strong>
                              </p>
                              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                <li>• YouTube: Paste any YouTube URL</li>
                                <li>• Vimeo: Paste any Vimeo URL</li>
                                <li>• Google Maps: Paste any Google Maps URL</li>
                                <li>• Spotify: Paste any Spotify track/album/playlist URL</li>
                                <li>• Other: Paste any embed URL (iframe src)</li>
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Two Column Content */}
                  {selectedBlockData.type === "two-column" && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="text-xs text-muted-foreground">Left Column</Label>
                          <Select
                            value={selectedBlockData.left_type || "paragraph"}
                            onValueChange={(value) => updateBlock(selectedBlockData.id, { left_type: value as any })}
                          >
                            <SelectTrigger className="w-24 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="heading">Heading</SelectItem>
                              <SelectItem value="paragraph">Text</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="gif">GIF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedBlockData.left_type === "heading" ||
                        selectedBlockData.left_type === "paragraph" ||
                        !selectedBlockData.left_type ? (
                          <RichTextEditor
                            value={selectedBlockData.left_content ?? ""}
                            onChange={(value) => updateBlock(selectedBlockData.id, { left_content: value })}
                            placeholder="Left column content..."
                            blockType={selectedBlockData.left_type || "paragraph"}
                          />
                        ) : (
                          <Input
                            value={selectedBlockData.left_content ?? ""}
                            onChange={(e) => updateBlock(selectedBlockData.id, { left_content: e.target.value })}
                            placeholder={`${selectedBlockData.left_type === "image" ? "Image" : selectedBlockData.left_type === "gif" ? "GIF" : "Video"} URL`}
                            className="text-sm"
                          />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="text-xs text-muted-foreground">Right Column</Label>
                          <Select
                            value={selectedBlockData.right_type || "paragraph"}
                            onValueChange={(value) =>
                              updateBlock(selectedBlockData.id, { right_type: value as any })
                            }
                          >
                            <SelectTrigger className="w-24 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="heading">Heading</SelectItem>
                              <SelectItem value="paragraph">Text</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="gif">GIF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedBlockData.right_type === "heading" ||
                        selectedBlockData.right_type === "paragraph" ||
                        !selectedBlockData.right_type ? (
                          <RichTextEditor
                            value={selectedBlockData.right_content ?? ""}
                            onChange={(value) => updateBlock(selectedBlockData.id, { right_content: value })}
                            placeholder="Right column content..."
                            blockType={selectedBlockData.right_type || "paragraph"}
                          />
                        ) : (
                          <Input
                            value={selectedBlockData.right_content ?? ""}
                            onChange={(e) => updateBlock(selectedBlockData.id, { right_content: e.target.value })}
                            placeholder={`${selectedBlockData.right_type === "image" ? "Image" : selectedBlockData.right_type === "gif" ? "GIF" : "Video"} URL`}
                            className="text-sm"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Styles */}
                  <div className="space-y-4">
                    <Tabs defaultValue="layout" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="layout">Layout</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      </TabsList>

                      <TabsContent value="layout" className="space-y-6 mt-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Text Alignment</Label>
                          <div className="flex gap-2 mt-1 w-full">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateBlockStyle(selectedBlockData.id, "textAlign", "left")}
                              className={`flex-1 h-10 ${
                                selectedBlockData.styles.textAlign === "left" || !selectedBlockData.styles.textAlign 
                                  ? "bg-blue-600 text-white shadow-md border-blue-600 hover:bg-blue-700" 
                                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              }`}
                              style={{ minWidth: 0 }}
                            >
                              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="8" height="2" rx="1" fill="currentColor"/><rect x="3" y="13" width="10" height="2" rx="1" fill="currentColor"/></svg>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateBlockStyle(selectedBlockData.id, "textAlign", "center")}
                              className={`flex-1 h-10 ${
                                selectedBlockData.styles.textAlign === "center" 
                                  ? "bg-blue-600 text-white shadow-md border-blue-600 hover:bg-blue-700" 
                                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              }`}
                              style={{ minWidth: 0 }}
                            >
                              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/><rect x="4" y="13" width="12" height="2" rx="1" fill="currentColor"/></svg>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateBlockStyle(selectedBlockData.id, "textAlign", "right")}
                              className={`flex-1 h-10 ${
                                selectedBlockData.styles.textAlign === "right" 
                                  ? "bg-blue-600 text-white shadow-md border-blue-600 hover:bg-blue-700" 
                                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              }`}
                              style={{ minWidth: 0 }}
                            >
                              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/><rect x="9" y="9" width="8" height="2" rx="1" fill="currentColor"/><rect x="7" y="13" width="10" height="2" rx="1" fill="currentColor"/></svg>
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Padding</Label>
                          <div className="space-y-6">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="individual-padding"
                                checked={selectedBlockData.styles.individualPadding || false}
                                onChange={(e) => updateBlockStyle(selectedBlockData.id, "individualPadding", e.target.checked)}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="individual-padding" className="text-xs text-muted-foreground">
                                Individual padding controls
                              </Label>
                            </div>
                            
                            {selectedBlockData.styles.individualPadding ? (
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Top</Label>
                                  <Slider
                                    value={[selectedBlockData.styles.paddingTop || 0]}
                                    onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "paddingTop", value)}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="text-xs text-muted-foreground">
                                    {selectedBlockData.styles.paddingTop || 0}px
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Right</Label>
                                  <Slider
                                    value={[selectedBlockData.styles.paddingRight || 0]}
                                    onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "paddingRight", value)}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="text-xs text-muted-foreground">
                                    {selectedBlockData.styles.paddingRight || 0}px
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Bottom</Label>
                                  <Slider
                                    value={[selectedBlockData.styles.paddingBottom || 0]}
                                    onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "paddingBottom", value)}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="text-xs text-muted-foreground">
                                    {selectedBlockData.styles.paddingBottom || 0}px
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Left</Label>
                                  <Slider
                                    value={[selectedBlockData.styles.paddingLeft || 0]}
                                    onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "paddingLeft", value)}
                                    max={50}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="text-xs text-muted-foreground">
                                    {selectedBlockData.styles.paddingLeft || 0}px
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Slider
                                  value={[selectedBlockData.styles.padding || 0]}
                                  onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "padding", value)}
                                  max={50}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="text-xs text-muted-foreground">
                                  {selectedBlockData.styles.padding || 0}px
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Border Radius</Label>
                          <Slider
                            value={[selectedBlockData.styles.borderRadius || 0]}
                            onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "borderRadius", value)}
                            max={20}
                            step={1}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">
                            {selectedBlockData.styles.borderRadius || 0}px
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="appearance" className="space-y-6 mt-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Background</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => updateBlockStyle(selectedBlockData.id, "backgroundColor", "transparent")}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                selectedBlockData.styles.backgroundColor === "transparent" || !selectedBlockData.styles.backgroundColor
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-border hover:border-border/60"
                              } bg-transparent`}
                            >
                              <span className="text-xs">None</span>
                            </button>
                            
                            <button
                              onClick={() => updateBlockStyle(selectedBlockData.id, "backgroundColor", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                selectedBlockData.styles.backgroundColor === "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-border hover:border-border/60"
                              } bg-gradient-to-br from-purple-400 to-blue-500`}
                            >
                              <span className="text-xs text-white">Purple</span>
                            </button>
                            
                            <button
                              onClick={() => updateBlockStyle(selectedBlockData.id, "backgroundColor", "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)")}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                selectedBlockData.styles.backgroundColor === "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-border hover:border-border/60"
                              } bg-gradient-to-br from-pink-400 to-red-500`}
                            >
                              <span className="text-xs text-white">Pink</span>
                            </button>
                            
                            <button
                              onClick={() => updateBlockStyle(selectedBlockData.id, "backgroundColor", "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)")}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                selectedBlockData.styles.backgroundColor === "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-border hover:border-border/60"
                              } bg-gradient-to-br from-blue-400 to-cyan-400`}
                            >
                              <span className="text-xs text-white">Ocean</span>
                            </button>
                            
                            <button
                              onClick={() => updateBlockStyle(selectedBlockData.id, "backgroundColor", "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)")}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                selectedBlockData.styles.backgroundColor === "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-border hover:border-border/60"
                              } bg-gradient-to-br from-green-400 to-teal-400`}
                            >
                              <span className="text-xs text-white">Mint</span>
                            </button>
                            
                            <button
                              onClick={() => updateBlockStyle(selectedBlockData.id, "backgroundColor", "linear-gradient(135deg, #fa709a 0%, #fee140 100%)")}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                selectedBlockData.styles.backgroundColor === "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                                  ? "border-blue-500 ring-2 ring-blue-500/20"
                                  : "border-border hover:border-border/60"
                              } bg-gradient-to-br from-pink-400 to-yellow-400`}
                            >
                              <span className="text-xs text-white">Sunset</span>
                            </button>
                          </div>
                          
                          {/* Background Color Options */}
                          <div className="space-y-3">
                            {/* Dynamic Theme Toggle */}
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="bg-option"
                                id="bg-dynamic"
                                checked={selectedBlockData.styles.backgroundColor === "hsl(var(--background))"}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateBlockStyle(selectedBlockData.id, "backgroundColor", "hsl(var(--background))")
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="bg-dynamic" className="text-xs text-muted-foreground">
                                Dynamic (Theme)
                              </Label>
                            </div>

                            {/* Custom Background Color */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="bg-option"
                                  id="custom-bg"
                                  checked={selectedBlockData.styles.backgroundColor && 
                                    selectedBlockData.styles.backgroundColor !== "transparent" &&
                                    selectedBlockData.styles.backgroundColor !== "hsl(var(--background))" &&
                                    !selectedBlockData.styles.backgroundColor.includes("linear-gradient")}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateBlockStyle(selectedBlockData.id, "backgroundColor", "#ffffff")
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="custom-bg" className="text-xs text-muted-foreground">
                                  Custom color
                                </Label>
                              </div>
                              {(selectedBlockData.styles.backgroundColor && 
                                selectedBlockData.styles.backgroundColor !== "transparent" &&
                                selectedBlockData.styles.backgroundColor !== "hsl(var(--background))" &&
                                !selectedBlockData.styles.backgroundColor.includes("linear-gradient")) && (
                                <Input
                                  type="color"
                                  value={selectedBlockData.styles.backgroundColor}
                                  onChange={(e) => updateBlockStyle(selectedBlockData.id, "backgroundColor", e.target.value)}
                                  className="w-full h-10"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Font Size</Label>
                          <Slider
                            value={[selectedBlockData.styles.fontSize || 16]}
                            onValueChange={([value]) => updateBlockStyle(selectedBlockData.id, "fontSize", value)}
                            max={72}
                            min={12}
                            step={1}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">
                            {selectedBlockData.styles.fontSize || 16}px
                          </div>
                        </div>

                        {/* Text Color - Only show for text-based content */}
                        {((selectedBlockData.type === "heading" || selectedBlockData.type === "paragraph") ||
                          (selectedBlockData.type === "two-column" && 
                           (selectedBlockData.left_type === "heading" || selectedBlockData.left_type === "paragraph" || !selectedBlockData.left_type) &&
                           (selectedBlockData.right_type === "heading" || selectedBlockData.right_type === "paragraph" || !selectedBlockData.right_type))) && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Text Color</Label>
                            <div className="grid grid-cols-4 gap-2">
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "transparent")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "transparent" || !selectedBlockData.styles.color
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-transparent`}
                              >
                                <span className="text-xs">None</span>
                              </button>
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "hsl(var(--foreground))")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "hsl(var(--foreground))"
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-foreground`}
                              />
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "#3b82f6")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "#3b82f6"
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-blue-500`}
                              />
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "#10b981")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "#10b981"
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-green-500`}
                              />
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "#f59e0b")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "#f59e0b"
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-yellow-500`}
                              />
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "#ef4444")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "#ef4444"
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-red-500`}
                              />
                              <button
                                onClick={() => updateBlockStyle(selectedBlockData.id, "color", "#8b5cf6")}
                                className={`h-8 rounded border-2 transition-all ${
                                  selectedBlockData.styles.color === "#8b5cf6"
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-border hover:border-border/60"
                                } bg-purple-500`}
                              />
                            </div>
                            
                            {/* Text Color Options */}
                            <div className="space-y-3">
                              {/* Dynamic Theme Toggle */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="text-option"
                                  id="text-dynamic"
                                  checked={selectedBlockData.styles.color === "hsl(var(--foreground))"}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateBlockStyle(selectedBlockData.id, "color", "hsl(var(--foreground))")
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="text-dynamic" className="text-xs text-muted-foreground">
                                  Dynamic (Theme)
                                </Label>
                              </div>

                              {/* Custom Text Color */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="text-option"
                                    id="custom-text-color"
                                    checked={selectedBlockData.styles.color && 
                                      selectedBlockData.styles.color !== "transparent" &&
                                      selectedBlockData.styles.color !== "hsl(var(--foreground))" &&
                                      !["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].includes(selectedBlockData.styles.color)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        updateBlockStyle(selectedBlockData.id, "color", "#000000")
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <Label htmlFor="custom-text-color" className="text-xs text-muted-foreground">
                                    Custom color
                                  </Label>
                                </div>
                                {(selectedBlockData.styles.color && 
                                  selectedBlockData.styles.color !== "transparent" &&
                                  selectedBlockData.styles.color !== "hsl(var(--foreground))" &&
                                  !["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].includes(selectedBlockData.styles.color)) && (
                                  <Input
                                    type="color"
                                    value={selectedBlockData.styles.color}
                                    onChange={(e) => updateBlockStyle(selectedBlockData.id, "color", e.target.value)}
                                    className="w-full h-10"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Size Controls - Only show for media elements */}
                        {(selectedBlockData.type === "image" || 
                          selectedBlockData.type === "gif" || 
                          selectedBlockData.type === "video" || 
                          selectedBlockData.type === "embed") && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="aspect-ratio-lock"
                                checked={aspectRatioLock}
                                onChange={(e) => setAspectRatioLock(e.target.checked)}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="aspect-ratio-lock" className="text-sm font-medium">
                                Maintain aspect ratio
                              </Label>
                            </div>
                            
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Width</Label>
                              <Slider
                                value={[selectedBlockData.styles.width || 100]}
                                onValueChange={([value]) => {
                                  updateBlockStyle(selectedBlockData.id, "width", value)
                                  // Only apply aspect ratio logic if the lock is enabled and we have valid dimensions
                                  if (aspectRatioLock && selectedBlockData.styles.height && selectedBlockData.styles.height > 0) {
                                    const currentHeight = selectedBlockData.styles.height
                                    const currentWidth = selectedBlockData.styles.width || 100
                                    // Calculate aspect ratio: width/height
                                    const aspectRatio = currentWidth / currentHeight
                                    const newHeight = Math.round(value / aspectRatio)
                                    // Ensure height stays within reasonable bounds
                                    const clampedHeight = Math.max(50, Math.min(800, newHeight))
                                    updateBlockStyle(selectedBlockData.id, "height", clampedHeight)
                                  }
                                }}
                                max={100}
                                min={10}
                                step={1}
                                className="w-full"
                              />
                              <div className="text-xs text-muted-foreground">
                                {selectedBlockData.styles.width || 100}%
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Height</Label>
                              <Slider
                                value={[selectedBlockData.styles.height || 300]}
                                onValueChange={([value]) => {
                                  updateBlockStyle(selectedBlockData.id, "height", value)
                                  // Only apply aspect ratio logic if the lock is enabled and we have valid dimensions
                                  if (aspectRatioLock && selectedBlockData.styles.width && selectedBlockData.styles.width > 0) {
                                    const currentWidth = selectedBlockData.styles.width
                                    const currentHeight = selectedBlockData.styles.height || 300
                                    // Calculate aspect ratio: width/height
                                    const aspectRatio = currentWidth / currentHeight
                                    const newWidth = Math.round(value * aspectRatio)
                                    // Ensure width stays within reasonable bounds (10% to 100%)
                                    const clampedWidth = Math.max(10, Math.min(100, newWidth))
                                    updateBlockStyle(selectedBlockData.id, "width", clampedWidth)
                                  }
                                }}
                                max={800}
                                min={50}
                                step={10}
                                className="w-full"
                              />
                              <div className="text-xs text-muted-foreground">
                                {selectedBlockData.styles.height || 300}px
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">Select a block to edit its properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Expanded Media Dialog */}
      <Dialog open={!!expandedMedia} onOpenChange={open => {
        if (!open) {
          setExpandAnim(false)
          setTimeout(() => setExpandedMedia(null), 200)
        } else {
          setExpandAnim(true)
        }
      }}>
        <DialogContent
          className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-10 shadow-lg duration-200 sm:rounded-2xl !max-w-4xl !w-full flex flex-col items-center justify-center !max-h-[80vh] bg-white/90 dark:bg-gray-900/90 ${expandAnim ? 'expand-fade-scale-enter expand-fade-scale-enter-active' : 'expand-fade-scale-exit expand-fade-scale-exit-active'}`}
          style={expandedMedia?.backgroundStyle}
        >
          {expandedMedia?.type === 'image' && (
            <img src={expandedMedia.src} alt="Expanded" style={{ maxWidth: '80vw', maxHeight: '70vh', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }} />
          )}
          {expandedMedia?.type === 'video' && (
            <video src={expandedMedia.src} controls autoPlay style={{ maxWidth: '80vw', maxHeight: '70vh', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Home, Share2, BookOpen, Copy, Maximize, Maximize2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { SocialShareDialog } from "@/components/social-share-dialog"
import { databaseGuideStore } from "@/lib/database-guide-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { useIsMobile } from "@/components/ui/use-mobile"
import DOMPurify from 'dompurify'

interface ContentBlock {
  id: string
  type: "heading" | "paragraph" | "image" | "video" | "gif" | "embed" | "two-column"
  content: string | null
  left_content?: string | null
  right_content?: string | null
  left_type?: string | null
  right_type?: string | null
  styles: {
    fontSize?: number
    color?: string
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    textAlign?: "left" | "center" | "right"
    width?: number
    height?: number
  }
}

interface Slide {
  id: string
  title: string
  blocks: ContentBlock[]
}

interface GuideData {
  id: string
  title: string
  description: string | null
  type: string
  tags: string[]
  slides: Slide[]
}

const mockGuideData = {
  id: "1",
  title: "Getting Started with React",
  description: "A comprehensive guide to learning React from scratch",
  type: "Tutorial",
  tags: ["React", "JavaScript", "Frontend"],
  slides: [
    {
      id: "1",
      title: "Welcome to React",
      blocks: [
        {
          id: "1",
          type: "heading" as const,
          content: "Welcome to React Tutorial",
          styles: { fontSize: 36, color: "#1f2937", textAlign: "center" as const },
        },
        {
          id: "2",
          type: "paragraph" as const,
          content:
            "React is a powerful JavaScript library for building user interfaces. In this tutorial, you'll learn the fundamentals of React and how to build your first application.",
          styles: { fontSize: 18, color: "#4b5563", textAlign: "center" as const, padding: 20 },
        },
        {
          id: "3",
          type: "image" as const,
          content: "/placeholder.png",
          styles: { borderRadius: 12, padding: 20 },
        },
      ],
    },
    {
      id: "2",
      title: "What is React?",
      blocks: [
        {
          id: "4",
          type: "heading" as const,
          content: "What is React?",
          styles: { fontSize: 32, color: "#1f2937", textAlign: "left" as const },
        },
        {
          id: "5",
          type: "paragraph" as const,
          content:
            "React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called 'components'.",
          styles: { fontSize: 16, color: "#374151", textAlign: "left" as const, padding: 10 },
        },
        {
          id: "6",
          type: "paragraph" as const,
          content:
            "Key features of React include:\n• Component-based architecture\n• Virtual DOM for performance\n• Unidirectional data flow\n• Rich ecosystem and community",
          styles: {
            fontSize: 16,
            color: "#374151",
            textAlign: "left" as const,
            backgroundColor: "#f3f4f6",
            padding: 20,
            borderRadius: 8,
          },
        },
      ],
    },
    {
      id: "3",
      title: "Your First Component",
      blocks: [
        {
          id: "7",
          type: "heading" as const,
          content: "Creating Your First Component",
          styles: { fontSize: 28, color: "#1f2937", textAlign: "left" as const },
        },
        {
          id: "8",
          type: "paragraph" as const,
          content:
            "Components are the building blocks of React applications. Here's how you create a simple component:",
          styles: { fontSize: 16, color: "#374151", textAlign: "left" as const },
        },
        {
          id: "9",
          type: "paragraph" as const,
          content: "function Welcome(props) {\n  return <h1>Hello, {props.name}!</h1>;\n}",
          styles: { fontSize: 14, color: "#1f2937", backgroundColor: "#f9fafb", padding: 20, borderRadius: 8 },
        },
      ],
    },
  ],
}

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

// Helper to sanitize and enhance HTML (add target/rel to <a> tags)
function sanitizeAndEnhanceHtml(html: string) {
  let clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  clean = clean.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (match: string, p1: string) => {
    let result = `<a ${p1}`
    if (!/target=/.test(p1)) result += ' target="_blank"'
    if (!/rel=/.test(p1)) result += ' rel="noopener noreferrer"'
    result += '>'
    return result
  })
  return clean
}

export default function GuideViewer() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isFromDashboard = searchParams.get("from") === "dashboard"
  const [currentSlide, setCurrentSlide] = useState(0)
  const [guideData, setGuideData] = useState<GuideData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isSimpleShareDialogOpen, setIsSimpleShareDialogOpen] = useState(false)
  const [hasShownCongrats, setHasShownCongrats] = useState(false)
  const [isCongratsDialogOpen, setIsCongratsDialogOpen] = useState(false)
  const [completionProgress, setCompletionProgress] = useState(0)
  const [hasStartedGuide, setHasStartedGuide] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [expandedMedia, setExpandedMedia] = useState<{ type: 'image' | 'video', src: string, backgroundStyle?: React.CSSProperties } | null>(null)
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate progress percentage
  const progress = guideData && hasStartedGuide ? ((currentSlide + 1) / guideData.slides.length) * 100 : 0

  useEffect(() => {
    const loadGuide = async () => {
      try {
        const guide = await databaseGuideStore.getGuide(params.id as string)
        if (guide) {
          setGuideData({
            id: guide.id,
            title: guide.title,
            description: guide.description,
            type: guide.type,
            tags: guide.tags,
            slides: guide.slides
          })
        } else {
          setGuideData(mockGuideData)
        }
      } catch (error) {
        console.error("Error loading guide:", error)
        setGuideData(mockGuideData)
      } finally {
        setIsLoading(false)
      }
    }

    loadGuide()
  }, [params.id])

  // Reset congrats state when guide changes
  useEffect(() => {
    setHasShownCongrats(false)
    setCurrentSlide(0)
    setCompletionProgress(0)
    setHasStartedGuide(false)
  }, [params.id])

  useEffect(() => {
    // Only show congrats popup if we haven't shown it yet and we're on the final slide
    const totalSlides = guideData?.slides.length || 0
    const finalSlideIndex = totalSlides - 1
    const isOnFinalSlide = currentSlide === finalSlideIndex
    const progressIs100 = ((currentSlide + 1) / totalSlides) * 100 === 100
    
    console.log("Debug popup logic:", {
      currentSlide,
      totalSlides,
      finalSlideIndex,
      hasShownCongrats,
      isOnFinalSlide,
      progressIs100,
      progress: ((currentSlide + 1) / totalSlides) * 100,
      shouldShow: isOnFinalSlide && !hasShownCongrats && totalSlides > 0
    })
    
    if (isOnFinalSlide && !hasShownCongrats && totalSlides > 0) {
      console.log("Starting completion sequence")
      
      // Step 1: Animate completion progress over 1 second
      const progressInterval = setInterval(() => {
        setCompletionProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 3
        })
      }, 30) // 30ms intervals for smooth animation
      
      // Step 2: Show popup after 1.5 seconds with fade animation
      const popupTimeout = setTimeout(() => {
        console.log("Showing congrats popup now")
        setIsCongratsDialogOpen(true)
        setHasShownCongrats(true) // Set this AFTER the popup appears
      }, 1500) // 1.5 seconds total
      
      return () => {
        clearInterval(progressInterval)
        clearTimeout(popupTimeout)
      }
    }
  }, [currentSlide, guideData?.slides.length, hasShownCongrats])

  const nextSlide = () => {
    if (currentSlide < (guideData?.slides.length || 0) - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleShareProgress = () => {
    setIsShareDialogOpen(true)
  }

  const handleSimpleShare = () => {
    setIsSimpleShareDialogOpen(true)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(guideUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      setIsCopied(false)
    }
  }

  const handleCongratsClose = () => {
    setIsCongratsDialogOpen(false)
  }

  const handleStartOver = () => {
    setIsCongratsDialogOpen(false)
    setHasShownCongrats(false)
    setCompletionProgress(0)
    setHasStartedGuide(false)
    goToSlide(0)
  }

  const handleShareFromCongrats = () => {
    setIsCongratsDialogOpen(false)
    handleShareProgress()
  }

  const renderBlock = (block: ContentBlock) => {
    const isGradient = block.styles.backgroundColor?.startsWith('linear-gradient')
    const commonStyles = {
      padding: `${block.styles.padding || 0}px`,
      ...(isGradient
        ? { background: block.styles.backgroundColor }
        : { backgroundColor: block.styles.backgroundColor || "transparent" }),
      borderRadius: `${block.styles.borderRadius || 0}px`,
      textAlign: block.styles.textAlign || "left",
    }

    switch (block.type) {
      case "heading":
        {
          const isEmpty = !block.content || block.content.trim() === '';
          const hasBlockHtml = /<(ul|ol|li|p|div|h[1-6])\b/i.test(block.content || '');
          const headingPadding = (block.styles.padding && block.styles.padding > 0) ? `${block.styles.padding}px` : '8px 0';
          if (hasBlockHtml) {
            return (
              <div
                style={{
                  ...commonStyles,
                  fontSize: `${block.styles.fontSize || 24}px`,
                  color: block.styles.color || "hsl(var(--foreground))",
                  fontWeight: "bold",
                  margin: "24px 0 24px 0",
                  padding: headingPadding,
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Heading" : (block.content || '')) }}
              />
            )
          } else {
            return (
              <h2
                style={{
                  ...commonStyles,
                  fontSize: `${block.styles.fontSize || 24}px`,
                  color: block.styles.color || "hsl(var(--foreground))",
                  fontWeight: "bold",
                  margin: "24px 0 24px 0",
                  padding: headingPadding,
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Heading" : (block.content || '')) }}
              />
            )
          }
        }
      case "paragraph":
        {
          const isEmpty = !block.content || block.content.trim() === '';
          return (
            <div
              style={{
                ...commonStyles,
                fontSize: `${block.styles.fontSize || 16}px`,
                color: block.styles.color || "hsl(var(--foreground))",
                lineHeight: 1.6,
                margin: "0 0 16px 0",
                whiteSpace: "pre-line",
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Paragraph" : (block.content || '')) }}
            />
          )
        }
      case "image":
      case "gif":
        return (
          <div style={{ ...commonStyles, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <img
              src={block.content || "/placeholder.png"}
              alt="Guide content"
              style={{
                width: '100%',
                height: block.styles.height ? `${block.styles.height}px` : 'auto',
                display: 'block',
                borderRadius: commonStyles.borderRadius,
                objectFit: 'contain',
              }}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'image', src: block.content || "/placeholder.png", backgroundStyle: block.styles.backgroundColor?.startsWith('linear-gradient') ? { background: block.styles.backgroundColor } : { backgroundColor: block.styles.backgroundColor || 'transparent' } })}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                borderRadius: '50%',
                padding: 4,
                cursor: 'pointer',
                zIndex: 2,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
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
          <div style={{ ...commonStyles, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <video
              src={block.content || ""}
              controls
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: commonStyles.borderRadius,
                objectFit: 'contain',
              }}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'video', src: block.content || "", backgroundStyle: block.styles.backgroundColor?.startsWith('linear-gradient') ? { background: block.styles.backgroundColor } : { backgroundColor: block.styles.backgroundColor || 'transparent' } })}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                borderRadius: '50%',
                padding: 4,
                cursor: 'pointer',
                zIndex: 2,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
              aria-label="Expand video"
            >
              <Maximize2 color="#fff" size={16} />
            </button>
          </div>
        )
      case "embed":
        return (
          <div style={{ ...commonStyles, width: "100%" }}>
            <iframe
              src={block.content || ""}
              style={{
                width: "100%",
                height: "400px",
                border: "none",
                borderRadius: `${block.styles.borderRadius || 8}px`,
                display: "block",
                margin: "0 auto 16px auto",
              }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded content"
              onError={(e) => {
                console.error("Embed iframe error:", e)
              }}
            />
            {!block.content && (
              <div 
                style={{
                  width: "100%",
                  height: "400px",
                  border: "2px dashed #ccc",
                  borderRadius: `${block.styles.borderRadius || 8}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                  margin: "0 auto 16px auto",
                }}
              >
                Embed content not available
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const getBaseUrl = () => {
    // Use your actual domain
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      // If running on v0 preview, use your production domain
      if (hostname.includes("vusercontent.net") || hostname.includes("v0.dev")) {
        return "https://blockguide.vercel.app"
      }
      return window.location.origin
    }

    // Server-side: always use your production domain
    return "https://blockguide.vercel.app"
  }

  const guideUrl = `${getBaseUrl()}/guide/${params.id}`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-rings mx-auto"></div>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-pulse">
            {isFromDashboard ? "Loading preview..." : "Loading guide..."}
          </p>
        </div>
      </div>
    )
  }

  if (!guideData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Guide not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SVG Gradient Definition for Share Icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#ec4899' }} />
            <stop offset="50%" style={{ stopColor: '#a855f7' }} />
            <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
          </linearGradient>
        </defs>
      </svg>
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-5 w-5 text-pink-500 mr-2" />
                    <h1 className="text-base sm:text-lg font-bold gradient-text">{guideData.title}</h1>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">{guideData.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {guideData.tags.map((tag: string, index: number) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-xs ${getTagColor(tag, index)}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Desktop header actions */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleSimpleShare}>
                <Share2 className="h-4 w-4 mr-2 text-pink-500" />
                <span className="gradient-text font-semibold">Share</span>
              </Button>
              {isFromDashboard && (
                <Button variant="outline" size="sm" onClick={() => router.push("/")}> <Home className="h-4 w-4" /> </Button>
              )}
            </div>
            {/* Mobile hamburger menu */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle>
                <span className="ml-2">Theme</span>
              </ThemeToggle>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="pb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">
                Slide {currentSlide + 1} of {guideData.slides.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {hasShownCongrats && currentSlide === (guideData?.slides.length || 1) - 1 ? `${completionProgress}%` : `${Math.round(progress)}%`} Complete
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className={`h-full transition-all duration-500 ${
                  hasShownCongrats && currentSlide === (guideData?.slides.length || 1) - 1 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse' 
                    : 'bg-primary'
                } ${
                  progress === 100 && !hasShownCongrats 
                    ? 'shadow-lg shadow-green-500/50 animate-pulse' 
                    : ''
                }`}
                style={{ 
                  width: hasShownCongrats && currentSlide === (guideData?.slides.length || 1) - 1 ? `${completionProgress}%` : `${progress}%`,
                  backgroundColor: progress === 100 && !hasShownCongrats ? '#16a34a' : undefined,
                  boxShadow: progress === 100 && !hasShownCongrats 
                    ? '0 0 18px rgba(34, 197, 94, 0.5)' 
                    : undefined
                }}
              />
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Drawer for header actions */}
      <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col items-center gap-4 p-4 w-full max-w-xs mx-auto">
            <ThemeToggle>
              <span className="ml-2">Theme</span>
            </ThemeToggle>
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2" onClick={() => { setIsMobileMenuOpen(false); handleSimpleShare(); }}>
              <Share2 className="h-4 w-4 mr-2 text-pink-500" />
              <span className="gradient-text font-semibold">Share</span>
            </Button>
            {isFromDashboard && (
              <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2" onClick={() => { setIsMobileMenuOpen(false); router.push("/"); }}>
                <Home className="h-4 w-4" />
                <span className="ml-2">Home</span>
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="ghost" className="mt-2 w-full">Close</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
      {/* Main Content Container - update to match editor page */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: Guide Navigation as its own row */}
        {isMobile && (
          <div className="mb-4">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Guide Navigation</h3>
              <div className="flex flex-wrap gap-2">
                {guideData.slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`flex-1 min-w-[100px] text-left p-2.5 rounded-lg border transition-colors h-12 flex items-center justify-center ${
                      currentSlide === index
                        ? "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/40 dark:text-primary"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold truncate gradient-text">
                      {index + 1}. {slide.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-12'} gap-6`}>
          {/* Desktop: Slide Navigation Sidebar */}
          {!isMobile && (
            <div className="col-span-3">
              <div className="bg-card rounded-lg border p-4 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <h3 className="font-semibold text-sm mb-3">Guide Navigation</h3>
                <div className="space-y-2">
                  {guideData.slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => goToSlide(index)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors h-12 flex items-center ${
                        currentSlide === index
                          ? "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/40 dark:text-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="text-xs font-bold truncate gradient-text">
                        {index + 1}. {slide.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Main Content */}
          <div className={isMobile ? '' : 'col-span-9'}>
            <div className="bg-card rounded-lg border shadow-sm relative">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold gradient-text mb-2">{guideData.slides[currentSlide].title}</h2>
                </div>
                <div className="space-y-4" style={{ width: '100%', padding: 0, margin: 0 }}>
                  {guideData.slides[currentSlide].blocks.map((block) => (
                    <div key={block.id}>
                      {renderBlock(block)}
                    </div>
                  ))}
                </div>
              </div>
              {/* Pagination Controls - always at bottom on mobile */}
              <div className={`border-t bg-muted/50 px-8 py-4 ${isMobile ? 'sticky bottom-0 left-0 w-full z-20' : ''}`}>
                <div className="flex justify-between items-center gap-4">
                  <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                    <div className="hidden sm:block text-sm text-muted-foreground mr-3">
                      {currentSlide + 1} / {guideData.slides.length}
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[200px] sm:max-w-[300px] px-2">
                      {guideData.slides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`flex-shrink-0 w-2.5 h-2.5 rounded-full transition-colors ${
                            currentSlide === index ? "bg-primary" : "bg-muted-foreground hover:bg-muted-foreground/70"
                          }`}
                          title={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={nextSlide}
                    disabled={currentSlide === guideData.slides.length - 1}
                    className={`${
                      currentSlide === guideData.slides.length - 1 ? 'bg-primary hover:bg-primary/90' : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {currentSlide === guideData.slides.length - 1 ? 'Complete' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Full Screen Start Guide Overlay */}
        {currentSlide === 0 && !hasStartedGuide && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center cursor-pointer"
            onClick={() => setHasStartedGuide(true)}
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-violet-500/10" />
            {/* Clean, minimal content container */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-md mx-6 p-6 overflow-hidden">
              {/* Full-width gradient accent like completion card */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500" />
              {/* Clean, centered layout */}
              <div className="text-center space-y-6">
                {/* Signal SVG icon */}
                <div className="flex justify-center">
                  <img src="/signal.svg" alt="Signal" className="w-72 h-24" />
                </div>
                {/* Content section with better typography */}
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    Ready to Begin?
                  </h1>
                  <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    Start your learning journey with
                    <br />
                    <span className="font-semibold text-pink-600 dark:text-pink-400">{guideData?.title}</span>
                  </p>
                </div>
                {/* Clean action section */}
                <div className="space-y-3">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasStartedGuide(true);
                    }}
                    className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl rounded-xl"
                  >
                    Start Journey
                  </Button>
                  <p className="font-bold text-xs text-gray-500 dark:text-gray-400">
                    Click anywhere to begin
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {isMobile ? (
        <Drawer open={isSimpleShareDialogOpen} onOpenChange={setIsSimpleShareDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Share Guide URL</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-6 p-4">
              <div className="space-y-2">
                <label htmlFor="shareableUrl" className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Guide URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="shareableUrl"
                    value={guideUrl}
                    readOnly
                    className="text-sm border-gray-300 dark:border-gray-600 flex-1 rounded px-2 py-1 bg-white dark:bg-gray-900"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4 mr-1" />
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsSimpleShareDialogOpen(false)} className="border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                  Close
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isSimpleShareDialogOpen} onOpenChange={setIsSimpleShareDialogOpen}>
          <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto scrollbar-hide border-0 bg-gradient-to-br from-pink-50 via-purple-50 to-violet-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-violet-950/20 shadow-2xl">
            <DialogHeader className="relative z-10">
              <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent font-bold">
                <Share2 className="h-5 w-5 text-pink-500" />
                Share Guide URL
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label htmlFor="shareableUrl" className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Guide URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="shareableUrl"
                    value={guideUrl}
                    readOnly
                    className="text-sm border-gray-300 dark:border-gray-600 flex-1 rounded px-2 py-1 bg-white dark:bg-gray-900"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4 mr-1" />
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsSimpleShareDialogOpen(false)} className="border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <SocialShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        guideTitle={guideData.title}
        guideUrl={guideUrl}
      />
      {/* Congratulations Popup - Redesigned */}
      <Dialog open={isCongratsDialogOpen} onOpenChange={setIsCongratsDialogOpen}>
        <DialogContent className="sm:max-w-md border-0 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500" />
          
          <DialogHeader className="text-center pb-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              {/* Single, elegant celebration icon */}
              <div className="mb-4">
                <div className="flex justify-center">
                  <img src="/done.svg" alt="Done" className="w-16 h-16" />
                </div>
              </div>
              Congratulations!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-6 px-6 pb-8">
            <div className="space-y-3">
              <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                You've completed "{guideData?.title}"
              </p>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                Great job! You've learned something new today.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={handleStartOver} 
                className="flex-1 h-11 text-sm border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Start Over
              </Button>
              <Button 
                onClick={handleShareFromCongrats} 
                className="flex-1 h-11 text-sm bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white transition-all duration-200 hover:scale-[1.02] shadow-lg"
              >
                Share Progress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Expanded Media Dialog */}
      <Dialog open={!!expandedMedia} onOpenChange={open => !open && setExpandedMedia(null)}>
        <DialogContent
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-10 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl !max-w-4xl !w-full flex flex-col items-center justify-center !max-h-[80vh] bg-white/90 dark:bg-gray-900/90"
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

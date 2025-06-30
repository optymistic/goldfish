"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Home, Share2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { SocialShareDialog } from "@/components/social-share-dialog"
import { databaseGuideStore } from "@/lib/database-guide-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export default function GuideViewer() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isFromDashboard = searchParams.get("from") === "dashboard"
  const [currentSlide, setCurrentSlide] = useState(0)
  const [guideData, setGuideData] = useState<GuideData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [hasShownCongrats, setHasShownCongrats] = useState(false)
  const [isCongratsDialogOpen, setIsCongratsDialogOpen] = useState(false)
  const [completionProgress, setCompletionProgress] = useState(0)
  const [hasStartedGuide, setHasStartedGuide] = useState(false)

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
        return (
          <h2
            style={{
              ...commonStyles,
              fontSize: `${block.styles.fontSize || 24}px`,
              color: block.styles.color || "hsl(var(--foreground))",
              fontWeight: "bold",
              margin: "0",
            }}
          >
            {block.content}
          </h2>
        )
      case "paragraph":
        return (
          <p
            style={{
              ...commonStyles,
              fontSize: `${block.styles.fontSize || 16}px`,
              color: block.styles.color || "hsl(var(--foreground))",
              lineHeight: 1.6,
              margin: "0 0 16px 0",
              whiteSpace: "pre-line",
            }}
          >
            {block.content}
          </p>
        )
      case "image":
      case "gif":
        return (
          <img
            src={block.content || "/placeholder.png"}
            alt="Guide content"
            style={{
              ...commonStyles,
              maxWidth: block.styles.width ? `${block.styles.width}%` : "100%",
              height: block.styles.height ? `${block.styles.height}px` : "auto",
              display: "block",
              margin: "0 auto 16px auto",
            }}
          />
        )
      case "video":
        return (
          <video
            src={block.content || ""}
            controls
            style={{
              ...commonStyles,
              maxWidth: "100%",
              height: "auto",
              display: "block",
              margin: "0 auto 16px auto",
            }}
          />
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
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-base font-premium-heading text-foreground">{guideData.title}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">{guideData.type}</Badge>
                  {guideData.tags.map((tag: string, index: number) => (
                    <Badge key={tag} variant="outline" className={`text-xs ${getTagColor(tag, index)}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleShareProgress}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {isFromDashboard && (
                <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                  <Home className="h-4 w-4" />
                </Button>
              )}
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
                    ? '0 0 20px rgba(34, 197, 94, 0.5)' 
                    : undefined
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-8">
          {/* Slide Navigation */}
          <div className="col-span-3">
            <div className="bg-card rounded-lg border p-4 sticky top-24">
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
                    <div className="text-xs font-medium truncate">
                      {index + 1}. {slide.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="bg-card rounded-lg border shadow-sm relative">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{guideData.slides[currentSlide].title}</h2>
                </div>

                <div className="prose prose-lg max-w-none">
                  {guideData.slides[currentSlide].blocks.map((block) => (
                    <div key={block.id} className="mb-6">
                      {renderBlock(block)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="border-t bg-muted/50 px-8 py-4">
                <div className="flex justify-between items-center gap-4">
                  <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                    {/* Slide indicator for mobile/small screens */}
                    <div className="hidden sm:block text-sm text-muted-foreground mr-3">
                      {currentSlide + 1} / {guideData.slides.length}
                    </div>
                    
                    {/* Scrollable dots container */}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50 flex items-center justify-center cursor-pointer"
            onClick={() => setHasStartedGuide(true)}
          >
            {/* Static background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-violet-500/20" />
            
            {/* Wide single-column content container */}
            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-xl mx-6 p-8">
              {/* Decorative elements */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-60" />
              <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-gradient-to-br from-violet-400 to-pink-500 rounded-full opacity-60" />
              <div className="absolute top-1/2 -left-4 w-2 h-2 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full opacity-40" />
              <div className="absolute top-1/4 -right-3 w-1.5 h-1.5 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-40" />
              
              {/* Single column layout */}
              <div className="text-center space-y-6">
                {/* Hero icon with static glow effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full blur-xl opacity-30" />
                  <div className="relative text-4xl animate-bounce bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                    ✨
                  </div>
                </div>
                
                {/* Content section */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                      Ready to Begin?
                    </h1>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 mx-auto rounded-full" />
                  </div>
                  
                  <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                    Start your learning journey with
                    <br />
                    <span className="font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">"{guideData?.title}"</span>.
                  </p>
                </div>
                
                {/* Action section */}
                <div className="space-y-4">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasStartedGuide(true);
                    }}
                    className="group relative h-12 px-8 text-base font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 hover:from-pink-600 hover:via-purple-600 hover:to-violet-600 text-white transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl rounded-xl overflow-hidden"
                  >
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-violet-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
                    <span className="relative z-10">Start Journey</span>
                  </Button>
                  
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full" />
                    <span>Click anywhere to begin</span>
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SocialShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        guideTitle={guideData.title}
        guideUrl={guideUrl}
      />

      {/* Congratulations Popup */}
      <Dialog open={isCongratsDialogOpen} onOpenChange={setIsCongratsDialogOpen}>
        <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-pink-50 via-purple-50 to-violet-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-violet-950/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden">
          {/* Gradient border overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-violet-500/10 rounded-lg" />
          
          <DialogHeader className="text-center pb-6 relative z-10">
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
              {/* Animated Confetti */}
              <div className="relative mb-4 h-16 flex items-center justify-center">
                {/* Sparkles */}
                <div className="absolute inset-0">
                  <div className="absolute top-2 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
                  <div className="absolute top-4 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.3s', animationDuration: '1.8s' }} />
                  <div className="absolute top-1 left-1/2 w-1 h-1 bg-violet-400 rounded-full animate-ping" style={{ animationDelay: '0.6s', animationDuration: '1.2s' }} />
                  <div className="absolute top-6 right-1/3 w-1.5 h-1.5 bg-pink-300 rounded-full animate-ping" style={{ animationDelay: '0.9s', animationDuration: '1.6s' }} />
                  <div className="absolute top-3 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: '1.2s', animationDuration: '1.4s' }} />
                </div>
                
                {/* Main celebration icon */}
                <div className="text-4xl animate-bounce bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                  ✨
                </div>
                
                {/* Floating particles */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-1/2 w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '2s' }} />
                  <div className="absolute top-2 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '1.8s' }} />
                  <div className="absolute top-4 left-1/4 w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2.2s' }} />
                  <div className="absolute top-6 right-1/2 w-1 h-1 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '1.1s', animationDuration: '1.9s' }} />
                </div>
              </div>
              Congratulations!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-6 px-4 relative z-10">
            <div className="space-y-3">
              <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                You've successfully completed the "{guideData?.title}" guide!
              </p>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                Great job! You've learned something new today. Keep up the amazing work! 🌟
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={handleStartOver} 
                className="flex-1 h-12 text-base border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 transition-all duration-200 hover:scale-105 text-pink-700 dark:text-pink-300"
              >
                Start Over
              </Button>
              <Button 
                onClick={handleShareFromCongrats} 
                className="flex-1 h-12 text-base bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 hover:from-pink-600 hover:via-purple-600 hover:to-violet-600 text-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Share Progress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

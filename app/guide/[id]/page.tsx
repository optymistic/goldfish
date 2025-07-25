"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Home, Share2, BookOpen, Copy, Maximize, Maximize2, Menu, Upload, Trash2 } from "lucide-react"
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
import { apiClient } from "@/lib/api-client"
import "@/components/ui/fancy-checkbox.css";
import { FileUpload } from "@/components/file-upload"

// Add sanitizeStyleObject function to prevent array-to-style errors
function sanitizeStyleObject(styleObj: any): any {
  if (!styleObj || typeof styleObj !== "object") return styleObj;
  const sanitized: any = {};
  for (const key in styleObj) {
    let value = styleObj[key];
    // Recursively flatten arrays
    while (Array.isArray(value)) {
      if (value.length === 0) {
        value = undefined;
        break;
      }
      if (value.length === 1) {
        value = value[0];
      } else {
        // If array has more than one value, take the first and warn
        console.warn(`sanitizeStyleObject: Array value for '${key}', using first element.`, value);
        value = value[0];
      }
    }
    // Only allow string, number, boolean, or undefined/null
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === undefined ||
      value === null
    ) {
      sanitized[key] = value;
    } else {
      console.warn(`sanitizeStyleObject: Invalid style value for '${key}', omitting.`, value);
    }
  }
  return sanitized;
}

// Helper to ensure style is always a valid object
function validStyle(s: any) {
  if (Array.isArray(s)) {
    console.error("❌ block.styles is an array!", s);
    return {};
  }
  if (!s || typeof s !== 'object') return {};
  return s;
}

interface ContentBlock {
  id: string
  type: "heading" | "paragraph" | "image" | "video" | "gif" | "embed" | "two-column" | "input-field" | "file-upload"
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
    columnGap?: number
    leftColumnWidth?: number
    rightColumnWidth?: number
    placeholder?: string
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
  // Replace native checkboxes with FancyCheckbox markup
  clean = clean.replace(/<input([^>]*type=["']checkbox["'][^>]*)>/gi, (match: string, attrs: string) => {
    // Preserve checked/disabled attributes
    const checked = /checked/i.test(attrs) ? 'checked' : '';
    const disabled = /disabled/i.test(attrs) ? 'disabled' : '';
    return `<span class="checkbox-wrapper-33"><label class="checkbox"><input class="checkbox__trigger visuallyhidden" type="checkbox" ${checked} ${disabled} /><span class="checkbox__symbol"><svg aria-hidden="true" class="icon-checkbox" width="28px" height="28px" viewBox="0 0 28 28" version="1" xmlns="http://www.w3.org/2000/svg"><path d="M4 14l8 7L24 7"></path></svg></span></label></span>`;
  });
  return clean
}

const PUBLIC_ROOT = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-d6b84090aa7c4bd2b76e7511ce7da6aa.r2.dev';
function getPublicUrl(url: string) {
  if (!url) return '';
  if (url.startsWith(PUBLIC_ROOT)) return url;
  const filename = url.split('/').pop();
  return `${PUBLIC_ROOT.replace(/\/$/, '')}/${filename}`;
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

  // State for all responses
  const [responses, setResponses] = useState<{ [blockId: string]: string }>({})
  const [files, setFiles] = useState<{ [blockId: string]: { name: string; url: string; type?: string } }>({})
  const [fileUploadStatus, setFileUploadStatus] = useState<{ [blockId: string]: 'idle' | 'uploading' | 'success' | 'error' }>({})
  const [fileUploadError, setFileUploadError] = useState<{ [blockId: string]: string }>({})
  const [submittingAll, setSubmittingAll] = useState(false)
  const [submitAllSuccess, setSubmitAllSuccess] = useState(false)
  const [submitAllError, setSubmitAllError] = useState<string | null>(null)
  // Add state to track if current slide has been submitted
  const [submittedSlides, setSubmittedSlides] = useState<{ [slideId: string]: boolean }>({});

  // Calculate progress percentage
  const progress = guideData && hasStartedGuide ? ((currentSlide + 1) / guideData.slides.length) * 100 : 0

  // Load previous responses for this user (by sessionStorage userIdentifier)
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

  // Remove the effect that loads previous responses for this user
  // useEffect(() => { ... fetch(`/api/responses?...`) ... }, [guideData?.slides, params.id])
  // Instead, always start with empty state for responses and files
  useEffect(() => {
    setResponses({})
    setFiles({})
    // Optionally, remove userIdentifier for a true fresh start
    sessionStorage.removeItem('userIdentifier')
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

  const goToTop = () => {
    // Always scroll the window to the top, after DOM update
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  const nextSlide = () => {
    if (currentSlide < (guideData?.slides.length || 0) - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
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

  // Handler for input field response
  const handleInputResponse = async (block: any, answer: string) => {
    setResponses(prev => ({ ...prev, [block.id]: answer }))
  }

  // Handler for file upload (uploads to R2, stores URL in state)
  const handleFileUpload = async (block: any, file: File) => {
    setFileUploadStatus(prev => ({ ...prev, [block.id]: 'uploading' }))
    setFileUploadError(prev => ({ ...prev, [block.id]: '' }))
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadData = await uploadRes.json()
      if (uploadData.url) {
        setFiles(prev => ({ ...prev, [block.id]: { name: uploadData.originalName, url: uploadData.url, type: file.type } }))
        setFileUploadStatus(prev => ({ ...prev, [block.id]: 'success' }))
      } else {
        setFileUploadStatus(prev => ({ ...prev, [block.id]: 'error' }))
        setFileUploadError(prev => ({ ...prev, [block.id]: uploadData.error || 'Upload failed' }))
      }
    } catch (err: any) {
      setFileUploadStatus(prev => ({ ...prev, [block.id]: 'error' }))
      setFileUploadError(prev => ({ ...prev, [block.id]: err.message || 'Upload failed' }))
    }
  }

  // Handler for file removal
  const handleRemoveFile = async (blockId: string) => {
    const file = files[blockId];
    if (file) {
      try {
        // Extract filename from URL
        const filename = file.url.split('/').pop();
        if (filename) {
          // Delete from R2 storage
          const deleteRes = await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename })
          });
          
          if (!deleteRes.ok) {
            console.error("Failed to delete file from storage");
          }
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
    
    // Remove from local state
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[blockId];
      return newFiles;
    });
    setFileUploadStatus(prev => ({ ...prev, [blockId]: 'idle' }));
    setFileUploadError(prev => ({ ...prev, [blockId]: '' }));
  };

  // Handler for file replacement
  const handleReplaceFile = (blockId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,text/plain';
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        // Delete old file if it exists
        const oldFile = files[blockId];
        if (oldFile) {
          try {
            const filename = oldFile.url.split('/').pop();
            if (filename) {
              await fetch("/api/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename })
              });
            }
          } catch (error) {
            console.error("Error deleting old file:", error);
          }
        }
        
        // Upload new file
        handleFileUpload({ id: blockId }, file);
      }
      fileInput.remove(); // Clean up the input element
    };
    fileInput.click();
  };

  // Handler for all responses submit
  const handleSubmitAll = async () => {
    setSubmittingAll(true)
    setSubmitAllSuccess(false)
    setSubmitAllError(null)
    const userIdentifier =
      typeof window !== "undefined"
        ? sessionStorage.getItem("userIdentifier") || (() => {
            const id = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`
            sessionStorage.setItem("userIdentifier", id)
            return id
          })()
        : ""
    
    // Get current slide data
    const currentSlideData = guideData?.slides[currentSlide]
    if (!currentSlideData) {
      setSubmitAllError("Slide not found")
      setSubmittingAll(false)
      return
    }
    // Prevent resubmission if already submitted
    if (submittedSlides[currentSlideData.id]) {
      setSubmittingAll(false)
      return
    }
    
    // Gather blocks from current slide only
    const currentSlideBlocks = currentSlideData.blocks.map(block => ({ ...block, slide_id: currentSlideData.id }))
    
    // Prepare response array for current slide only
    const responseArray = currentSlideBlocks
      .filter(block => block.type === "input-field" || block.type === "file-upload")
      .map(block => {
        if (block.type === "input-field") {
          return {
            guide_id: params.id,
            slide_id: block.slide_id,
            block_id: block.id,
            user_identifier: userIdentifier,
            question: block.content,
            answer: responses[block.id] || "",
          }
        } else if (block.type === "file-upload") {
          return {
            guide_id: params.id,
            slide_id: block.slide_id,
            block_id: block.id,
            user_identifier: userIdentifier,
            question: block.content,
            file_url: files[block.id]?.url || "",
            file_name: files[block.id]?.name || "",
          }
        }
        return null
      })
      .filter(Boolean)
    
    // Validate that all interactive blocks have responses
    const interactiveBlocks = currentSlideBlocks.filter(block => block.type === "input-field" || block.type === "file-upload")
    const hasEmptyResponses = interactiveBlocks.some(block => {
      if (block.type === "input-field") {
        return !responses[block.id] || responses[block.id].trim() === ""
      } else if (block.type === "file-upload") {
        return !files[block.id] || !files[block.id].url
      }
      return false
    })
    
    if (hasEmptyResponses) {
      setSubmitAllError("Please fill in all required fields")
      setSubmittingAll(false)
      return
    }
    
    // Check if there are any responses to submit
    if (responseArray.length === 0) {
      setSubmitAllError("No responses to submit")
      setSubmittingAll(false)
      return
    }
    
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: responseArray }),
      })
      if (res.ok) {
        setSubmitAllSuccess(true)
        setSubmittedSlides(prev => ({ ...prev, [currentSlideData.id]: true }))
        setTimeout(() => setSubmitAllSuccess(false), 2000)
      } else {
        const data = await res.json()
        setSubmitAllError(data.error || "Failed to submit responses")
      }
    } catch (err: any) {
      setSubmitAllError(err.message || "Failed to submit responses")
    }
    setSubmittingAll(false)
  }

  const renderColumnContent = (type: string, content: string, styles: any) => {
    const commonStyles = {
      padding: `${styles.padding || 0}px`,
      backgroundColor: styles.backgroundColor || "transparent",
      borderRadius: `${styles.borderRadius || 0}px`,
      textAlign: styles.textAlign || "left",
    }

    switch (type) {
      case "heading":
        return (
          <h3
            style={sanitizeStyleObject({
              ...commonStyles,
              fontSize: `${styles.fontSize || 20}px`,
              color: styles.color || "hsl(var(--foreground))",
              fontWeight: "bold",
              margin: "0 0 12px 0",
            })}
            dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(content || "Column Heading") }}
          />
        )
      case "paragraph":
        return (
          <div
            style={sanitizeStyleObject({
              ...commonStyles,
              fontSize: `${styles.fontSize || 16}px`,
              color: styles.color || "hsl(var(--foreground))",
              lineHeight: 1.6,
              margin: "0 0 12px 0",
              whiteSpace: "pre-line",
            })}
            dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(content || "Column content") }}
          />
        )
      case "image":
      case "gif":
        return (
          <div style={sanitizeStyleObject({ ...commonStyles, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' })}>
            <img
              src={content || "/placeholder.png"}
              alt="Column content"
              style={sanitizeStyleObject({
                width: '100%',
                height: styles.height ? `${styles.height}px` : 'auto',
                display: 'block',
                borderRadius: commonStyles.borderRadius,
                objectFit: 'contain',
              })}
            />
          </div>
        )
      case "video":
        return (
          <div style={sanitizeStyleObject({ ...commonStyles, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' })}>
            <video
              src={content || ""}
              controls
              style={sanitizeStyleObject({
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: commonStyles.borderRadius,
                objectFit: 'contain',
              })}
            />
          </div>
        )
      case "embed":
        return (
          <div style={sanitizeStyleObject({ ...commonStyles, width: "100%" })}>
            <iframe
              src={content || ""}
              style={sanitizeStyleObject({
                width: "100%",
                height: "300px",
                border: "none",
                borderRadius: `${styles.borderRadius || 8}px`,
                display: "block",
              })}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded content"
            />
          </div>
        )
      default:
        return (
          <div
            style={sanitizeStyleObject({
              ...commonStyles,
              fontSize: `${styles.fontSize || 16}px`,
              color: styles.color || "hsl(var(--foreground))",
              lineHeight: 1.6,
              margin: "0 0 12px 0",
              whiteSpace: "pre-line",
            })}
            dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(content || "Column content") }}
          />
        )
    }
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
          
          // Mobile-specific heading adjustments
          const baseFontSize = block.styles.fontSize || 24;
          const mobileFontSize = isMobile ? Math.min(baseFontSize, 20) : baseFontSize;
          const mobileMargin = isMobile ? "16px 0" : "24px 0 24px 0";
          
          if (hasBlockHtml) {
            return (
              <div
                style={sanitizeStyleObject({
                  ...commonStyles,
                  fontSize: `${mobileFontSize}px`,
                  color: block.styles.color || "hsl(var(--foreground))",
                  fontWeight: "bold",
                  margin: mobileMargin,
                  padding: headingPadding,
                })}
                dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Heading" : (block.content || '')) }}
              />
            )
          } else {
            return (
              <h2
                style={sanitizeStyleObject({
                  ...commonStyles,
                  fontSize: `${mobileFontSize}px`,
                  color: block.styles.color || "hsl(var(--foreground))",
                  fontWeight: "bold",
                  margin: mobileMargin,
                  padding: headingPadding,
                })}
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
              style={sanitizeStyleObject({
                ...commonStyles,
                fontSize: `${block.styles.fontSize || 16}px`,
                color: block.styles.color || "hsl(var(--foreground))",
                lineHeight: 1.6,
                margin: "0 0 16px 0",
                whiteSpace: "pre-line",
              })}
              dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(isEmpty ? "Paragraph" : (block.content || '')) }}
            />
          )
        }
      case "image":
      case "gif":
        return (
          <div style={sanitizeStyleObject({ ...commonStyles, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' })}>
            <img
              src={block.content || "/placeholder.png"}
              alt="Guide content"
              style={sanitizeStyleObject({
                width: '100%',
                height: isMobile ? 'auto' : (block.styles.height ? `${block.styles.height}px` : 'auto'),
                maxHeight: isMobile ? '300px' : 'none',
                display: 'block',
                borderRadius: commonStyles.borderRadius,
                objectFit: isMobile ? 'cover' : 'contain',
              })}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'image', src: block.content || "/placeholder.png", backgroundStyle: block.styles.backgroundColor?.startsWith('linear-gradient') ? { background: block.styles.backgroundColor } : { backgroundColor: block.styles.backgroundColor || 'transparent' } })}
              style={sanitizeStyleObject({
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
              })}
              aria-label="Expand image"
            >
              <Maximize2 color="#fff" size={16} />
            </button>
          </div>
        )
      case "video":
        return (
          <div style={sanitizeStyleObject({ ...commonStyles, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' })}>
            <video
              src={block.content || ""}
              controls
              style={sanitizeStyleObject({
                width: '100%',
                height: isMobile ? 'auto' : 'auto',
                maxHeight: isMobile ? '250px' : 'none',
                display: 'block',
                borderRadius: commonStyles.borderRadius,
                objectFit: isMobile ? 'cover' : 'contain',
              })}
            />
            <button
              type="button"
              onClick={() => setExpandedMedia({ type: 'video', src: block.content || "", backgroundStyle: block.styles.backgroundColor?.startsWith('linear-gradient') ? { background: block.styles.backgroundColor } : { backgroundColor: block.styles.backgroundColor || 'transparent' } })}
              style={sanitizeStyleObject({
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
              })}
              aria-label="Expand video"
            >
              <Maximize2 color="#fff" size={16} />
            </button>
          </div>
        )
      case "embed":
        return (
          <div style={sanitizeStyleObject({ ...commonStyles, width: "100%" })}>
            <iframe
              src={block.content || ""}
              style={sanitizeStyleObject({
                width: "100%",
                height: isMobile ? "250px" : "400px",
                border: "none",
                borderRadius: `${block.styles.borderRadius || 8}px`,
                display: "block",
                margin: "0 auto 16px auto",
              })}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded content"
              onError={(e) => {
                console.error("Embed iframe error:", e)
              }}
            />
            {!block.content && (
              <div 
                style={sanitizeStyleObject({
                  width: "100%",
                  height: isMobile ? "250px" : "400px",
                  border: "2px dashed #ccc",
                  borderRadius: `${block.styles.borderRadius || 8}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                  margin: "0 auto 16px auto",
                })}
              >
                Embed content not available
              </div>
            )}
          </div>
        )
      case "two-column":
        {
          const getColumnLayout = () => {
            const leftWidth = block.styles.leftColumnWidth || 50
            const rightWidth = block.styles.rightColumnWidth || 50
            if (leftWidth > rightWidth) return "left-wide"
            if (rightWidth > leftWidth) return "right-wide"
            return "equal"
          }
          
          const columnGap = block.styles.columnGap || 16
          
          return (
            <div 
              className={`two-column-layout ${getColumnLayout()}`}
              style={sanitizeStyleObject({
                ...commonStyles,
                gap: `${columnGap}px`,
                gridTemplateColumns: block.styles.leftColumnWidth && block.styles.rightColumnWidth 
                  ? `${block.styles.leftColumnWidth}% ${block.styles.rightColumnWidth}%`
                  : undefined
              })}
            >
              <div className="space-y-4">
                {renderColumnContent(block.left_type || "paragraph", block.left_content || "", block.styles)}
              </div>
              <div className="space-y-4">
                {renderColumnContent(block.right_type || "paragraph", block.right_content || "", block.styles)}
              </div>
            </div>
          )
        }
      case "input-field":
        return (
          <div className="space-y-2">
            <div
              style={sanitizeStyleObject({ ...commonStyles, fontSize: `${block.styles.fontSize || 16}px`, color: block.styles.color || "hsl(var(--foreground))" })}
              dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(block.content || "") }}
            />
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder={block.styles?.placeholder !== undefined ? block.styles.placeholder : "Type your answer..."}
              value={responses[block.id] ?? ""}
              onChange={e => setResponses(prev => ({ ...prev, [block.id]: e.target.value }))}
              disabled={submittingAll}
            />
          </div>
        )
      case "file-upload":
        return (
          <div className="space-y-2">
            <div
              style={sanitizeStyleObject({ ...commonStyles, fontSize: `${block.styles.fontSize || 16}px`, color: block.styles.color || "hsl(var(--foreground))" })}
              dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(block.content || "") }}
            />
            {files[block.id] ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  {/* File preview */}
                  {(() => {
                    const file = files[block.id];
                    const url = getPublicUrl(file.url);
                    if (file.type?.startsWith("image/")) {
                      // Image preview
                      return <img src={url} alt={file.name} className="w-12 h-12 object-cover rounded border" style={{ maxWidth: 48, maxHeight: 48 }} />;
                    } else if (file.type === "application/pdf") {
                      // PDF icon
                      return <span title="PDF" className="inline-block w-10 h-12 bg-gray-200 text-gray-700 flex items-center justify-center rounded border font-bold">PDF</span>;
                    } else {
                      // Generic file icon
                      return <span title="File" className="inline-block w-10 h-12 bg-gray-100 text-gray-500 flex items-center justify-center rounded border font-bold">📄</span>;
                    }
                  })()}
                  <span className="truncate max-w-[120px]" title={files[block.id].name}>{files[block.id].name}</span>
                  <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(files[block.id].url)}><Copy className="h-4 w-4" /></Button>
                  <a href={getPublicUrl(files[block.id].url)} target="_blank" rel="noopener noreferrer" className="text-primary underline">View</a>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleRemoveFile(block.id)}
                    disabled={submittingAll}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleReplaceFile(block.id)}
                    disabled={submittingAll}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <FileUpload
                onFileSelect={file => handleFileUpload(block, file)}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,text/plain"
                disabled={fileUploadStatus[block.id] === 'uploading' || submittingAll}
              >
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                </div>
              </FileUpload>
            )}
            {fileUploadStatus[block.id] === 'uploading' && <div className="text-xs text-muted-foreground">Uploading...</div>}
            {fileUploadStatus[block.id] === 'success' && <div className="text-xs text-green-600">Uploaded!</div>}
            {fileUploadStatus[block.id] === 'error' && <div className="text-xs text-red-600">{fileUploadError[block.id]}</div>}
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

  useEffect(() => {
    // Scroll to top when slide changes
    if (hasStartedGuide) {
      goToTop();
    }
  }, [currentSlide, hasStartedGuide]);

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
                  {/* Mobile: Title on single line */}
                  {isMobile ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-5 w-5 text-pink-500 mr-2" />
                        <h1 className="text-base font-bold gradient-text truncate">{guideData.title}</h1>
                      </div>
                      {/* Type and tags on single line */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">{guideData.type}</Badge>
                        {guideData.tags.map((tag: string, index: number) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-xs flex-shrink-0 ${getTagColor(tag, index)}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
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
      <div className={isMobile ? 'w-full px-2 py-4' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        {/* Mobile: Guide Navigation as horizontal scrollable row */}
        {isMobile && (
          <div className="mb-4">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Guide Navigation</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {guideData.slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`flex-shrink-0 min-w-[120px] text-left p-2.5 rounded-lg border transition-colors h-12 flex items-center justify-center ${
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
              <div className="bg-card rounded-lg border p-4 sticky top-36 max-h-[calc(100vh-3rem)] overflow-y-auto">
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
                  <h2 className="text-sm font-bold gradient-text mb-2">{guideData.slides[currentSlide].title}</h2>
                </div>
                <div className="space-y-4" style={sanitizeStyleObject({ width: '100%', padding: 0, margin: 0 })}>
                  {guideData.slides[currentSlide].blocks.map((block) => (
                    <div key={block.id}>
                      {renderBlock(block)}
                    </div>
                  ))}
                </div>
                
                {/* Submit button for interactive blocks */}
                {guideData.slides[currentSlide].blocks.some(
                  (block: any) => block.type === "input-field" || block.type === "file-upload"
                ) && (
                  <div className="mt-8 flex flex-col items-center">
                    <Button
                      onClick={handleSubmitAll}
                      disabled={submittingAll || Object.values(fileUploadStatus).some(status => status === 'uploading') || submittedSlides[guideData.slides[currentSlide].id]}
                      className="w-full max-w-xs"
                    >
                      {submittedSlides[guideData.slides[currentSlide].id]
                        ? "Submitted!"
                        : submittingAll
                          ? "Submitting..."
                          : submitAllSuccess
                            ? "Submitted!"
                            : "Submit"}
                    </Button>
                    {submitAllError && <div className="text-xs text-red-600 mt-2">{submitAllError}</div>}
                  </div>
                )}
              </div>
              {/* Pagination Controls - always at bottom on mobile */}
              <div className={`border-t bg-muted/50 ${isMobile ? 'sticky bottom-0 left-0 w-full z-20 rounded-t-2xl shadow-lg bg-white/90 dark:bg-background/90 px-2 py-1' : 'px-8 py-4'}`}>
                <div className={`flex justify-between items-center gap-4 ${isMobile ? 'py-1' : ''}`}>
                  <Button 
                    variant={isMobile ? 'ghost' : 'outline'}
                    onClick={prevSlide} 
                    disabled={currentSlide === 0}
                    className={isMobile ? 'h-10 px-3 text-sm' : 'bg-background hover:bg-accent'}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                    <div className="hidden sm:block text-sm text-muted-foreground mr-3">
                      {currentSlide + 1} / {guideData.slides.length}
                    </div>
                    {!isMobile && (
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-[200px] sm:max-w-[300px] px-2">
                        {guideData.slides.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`flex-shrink-0 w-2.5 h-2.5 rounded-full transition-colors ${
                              currentSlide === index ? 'bg-primary' : 'bg-muted-foreground hover:bg-muted-foreground/70'
                            }`}
                            title={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={nextSlide}
                    disabled={currentSlide === guideData.slides.length - 1}
                    className={isMobile
                      ? `h-10 px-3 text-sm bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white shadow-md border-0 ${currentSlide === guideData.slides.length - 1 ? 'opacity-80' : ''}`
                      : `bg-background hover:bg-accent ${currentSlide === guideData.slides.length - 1 ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`
                    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer"
            onClick={() => setHasStartedGuide(true)}
          >
            {/* Subtle gradient background */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-violet-500/10" /> */}
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
          className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl !max-w-4xl !w-full flex flex-col items-center justify-center !max-h-[80vh] ${isMobile ? 'p-2' : 'p-10'}`}
          style={sanitizeStyleObject(expandedMedia?.backgroundStyle)}
        >
          {expandedMedia?.type === 'image' && (
            <img src={expandedMedia.src} alt="Expanded" style={sanitizeStyleObject({ maxWidth: isMobile ? '95vw' : '80vw', maxHeight: isMobile ? '85vh' : '70vh', borderRadius: isMobile ? 8 : 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)' })} />
          )}
          {expandedMedia?.type === 'video' && (
            <video src={expandedMedia.src} controls autoPlay style={sanitizeStyleObject({ maxWidth: isMobile ? '95vw' : '80vw', maxHeight: isMobile ? '85vh' : '70vh', borderRadius: isMobile ? 8 : 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)' })} />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

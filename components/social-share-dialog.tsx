"use client"

import { useState, useRef, useEffect } from "react"
import { Twitter, MessageCircle, Copy, Download, Share2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

interface SocialShareDialogProps {
  isOpen: boolean
  onClose: () => void
  guideTitle: string
  guideUrl: string
}

interface Theme {
  id: string
  name: string
  gradient: string[]
  textColor: string
  accentColor: string
}

const themes: Theme[] = [
  {
    id: "luxury-navy",
    name: "Luxury Navy",
    gradient: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"],
    textColor: "#F8FAFC",
    accentColor: "#F59E0B",
  },
  {
    id: "emerald-sage",
    name: "Emerald Sage",
    gradient: ["#064E3B", "#065F46", "#047857", "#059669", "#10B981"],
    textColor: "#F0FDF4",
    accentColor: "#D97706",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    gradient: ["#581C87", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"],
    textColor: "#FAF5FF",
    accentColor: "#F59E0B",
  },
  {
    id: "warm-gold",
    name: "Warm Gold",
    gradient: ["#92400E", "#B45309", "#D97706", "#F59E0B", "#FBBF24"],
    textColor: "#FFFBEB",
    accentColor: "#DC2626",
  },
  {
    id: "deep-burgundy",
    name: "Deep Burgundy",
    gradient: ["#7F1D1D", "#991B1B", "#B91C1C", "#DC2626", "#EF4444"],
    textColor: "#FEF2F2",
    accentColor: "#F59E0B",
  },
  {
    id: "charcoal-slate",
    name: "Charcoal Slate",
    gradient: ["#0F172A", "#1E293B", "#334155", "#475569", "#64748B"],
    textColor: "#F1F5F9",
    accentColor: "#3B82F6",
  },
]

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

export function SocialShareDialog({ isOpen, onClose, guideTitle, guideUrl }: SocialShareDialogProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [customMessage, setCustomMessage] = useState(`Just completed "${guideTitle}" - check it out!`)
  const [isCopied, setIsCopied] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0])
  const [imageDataUrl, setImageDataUrl] = useState<string>("")
  const [customUrl, setCustomUrl] = useState<string>("")

  // Load fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        await document.fonts.load("600 48px 'DM Sans'")
        await document.fonts.load("400 24px 'IBM Plex Sans'")
        await document.fonts.load("500 20px 'IBM Plex Sans'")
        generateShareImage()
      } catch (error) {
        console.log("Font loading failed, using fallback")
        generateShareImage()
      }
    }

    if (isOpen) {
      loadFonts()
    }
  }, [isOpen, selectedTheme, guideTitle, customMessage])

  const generateShareImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size for social media (1200x630 is optimal for most platforms)
    canvas.width = 1200
    canvas.height = 630

    // Create main gradient background with more sophisticated positioning
    const gradient = ctx.createRadialGradient(400, 200, 0, 800, 400, 1000)
    selectedTheme.gradient.forEach((color, index) => {
      const stop = index / (selectedTheme.gradient.length - 1)
      // Add subtle variation to color stops for more organic feel
      const adjustedStop = stop + (Math.sin(stop * Math.PI) * 0.1)
      gradient.addColorStop(Math.max(0, Math.min(1, adjustedStop)), color)
    })

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add sophisticated directional grain texture overlay
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4
        
        // Create directional grain that follows the gradient flow
        const distanceFromCenter = Math.sqrt((x - 600) ** 2 + (y - 315) ** 2)
        const angle = Math.atan2(y - 315, x - 600)
        
        // Subtle directional noise that follows the gradient direction
        const noise = Math.sin(x * 0.02 + angle) * Math.cos(y * 0.015 + distanceFromCenter * 0.001) * 8
        
        data[index] = Math.max(0, Math.min(255, data[index] + noise)) // Red
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + noise)) // Green
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + noise)) // Blue
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Add organic flowing blob shapes with sophisticated gradients
    ctx.globalAlpha = 0.25

    // Large organic blob top-left with complex gradient
    const blob1 = ctx.createRadialGradient(200, 150, 0, 200, 150, 350)
    blob1.addColorStop(0, selectedTheme.accentColor)
    blob1.addColorStop(0.6, selectedTheme.accentColor + "80")
    blob1.addColorStop(1, "transparent")
    ctx.fillStyle = blob1
    
    // Create organic blob using bezier curves
    ctx.beginPath()
    ctx.moveTo(50, 200)
    ctx.bezierCurveTo(80, 120, 150, 80, 250, 100)
    ctx.bezierCurveTo(320, 120, 350, 180, 320, 250)
    ctx.bezierCurveTo(280, 320, 200, 350, 120, 320)
    ctx.bezierCurveTo(60, 280, 50, 200, 50, 200)
    ctx.fill()

    // Medium organic blob bottom-right with flowing form
    const blob2 = ctx.createRadialGradient(1000, 480, 0, 1000, 480, 250)
    blob2.addColorStop(0, selectedTheme.textColor + "60")
    blob2.addColorStop(0.7, selectedTheme.textColor + "30")
    blob2.addColorStop(1, "transparent")
    ctx.fillStyle = blob2
    
    ctx.beginPath()
    ctx.moveTo(850, 550)
    ctx.bezierCurveTo(900, 500, 950, 450, 1050, 470)
    ctx.bezierCurveTo(1120, 490, 1150, 550, 1120, 600)
    ctx.bezierCurveTo(1080, 650, 1000, 670, 920, 640)
    ctx.bezierCurveTo(870, 620, 850, 550, 850, 550)
    ctx.fill()

    // Small organic accent blob center-right
    const blob3 = ctx.createRadialGradient(900, 200, 0, 900, 200, 150)
    blob3.addColorStop(0, selectedTheme.accentColor + "80")
    blob3.addColorStop(0.8, selectedTheme.accentColor + "40")
    blob3.addColorStop(1, "transparent")
    ctx.fillStyle = blob3
    
    ctx.beginPath()
    ctx.moveTo(800, 250)
    ctx.bezierCurveTo(820, 180, 870, 150, 950, 170)
    ctx.bezierCurveTo(1000, 190, 1020, 240, 1000, 280)
    ctx.bezierCurveTo(980, 320, 930, 340, 880, 320)
    ctx.bezierCurveTo(830, 300, 800, 250, 800, 250)
    ctx.fill()

    ctx.globalAlpha = 1

    // Add organic decorative elements with flowing forms
    ctx.strokeStyle = selectedTheme.accentColor
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.3

    // Organic flowing line top-left
    ctx.beginPath()
    ctx.moveTo(80, 60)
    ctx.bezierCurveTo(120, 40, 160, 50, 180, 80)
    ctx.bezierCurveTo(200, 110, 190, 140, 160, 150)
    ctx.stroke()

    // Organic curved accent top-right
    ctx.beginPath()
    ctx.moveTo(1050, 80)
    ctx.bezierCurveTo(1080, 60, 1120, 70, 1140, 100)
    ctx.bezierCurveTo(1160, 130, 1150, 160, 1120, 170)
    ctx.stroke()

    // Flowing organic shape bottom-right
    ctx.beginPath()
    ctx.moveTo(1100, 520)
    ctx.bezierCurveTo(1130, 500, 1160, 510, 1170, 540)
    ctx.bezierCurveTo(1180, 570, 1170, 600, 1140, 610)
    ctx.bezierCurveTo(1110, 620, 1080, 610, 1070, 580)
    ctx.stroke()

    // Subtle organic accent center-left
    ctx.beginPath()
    ctx.moveTo(120, 300)
    ctx.bezierCurveTo(140, 280, 160, 290, 170, 310)
    ctx.bezierCurveTo(180, 330, 170, 350, 150, 360)
    ctx.stroke()

    ctx.globalAlpha = 1

    // Add main content with enhanced typography
    ctx.fillStyle = selectedTheme.textColor
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Custom message (top section) - smaller and more elegant
    if (customMessage && customMessage.trim()) {
      ctx.font = "600 28px 'IBM Plex Sans', system-ui, sans-serif"
      ctx.globalAlpha = 0.9
      const messageMaxWidth = canvas.width - 160
      const messageWords = customMessage.split(" ")
      let messageLine = ""
      let messageY = 100
      const messageLineHeight = 28

      for (let n = 0; n < messageWords.length; n++) {
        const testLine = messageLine + messageWords[n] + " "
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width

        if (testWidth > messageMaxWidth && n > 0) {
          ctx.fillText(messageLine.trim(), canvas.width / 2, messageY)
          messageLine = messageWords[n] + " "
          messageY += messageLineHeight
        } else {
          messageLine = testLine
        }
      }
      ctx.fillText(messageLine.trim(), canvas.width / 2, messageY)
      ctx.globalAlpha = 1
    }

    // Guide title (main heading) - much larger and bolder
    ctx.font = "700 64px 'DM Sans', system-ui, sans-serif"
    ctx.fillStyle = selectedTheme.textColor

    // Add text shadow effect
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    const maxWidth = canvas.width - 120
    const words = guideTitle.split(" ")
    let line = ""
    let y = canvas.height / 2 - 40
    const lineHeight = 75

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " "
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), canvas.width / 2, y)
        line = words[n] + " "
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), canvas.width / 2, y)

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Enhanced completion badge with glow effect
    const badgeY = y + 100
    const badgeText = "✨ Guide Completed ✨"

    // Badge glow effect
    ctx.shadowColor = selectedTheme.accentColor
    ctx.shadowBlur = 20
    ctx.fillStyle = selectedTheme.accentColor
    ctx.globalAlpha = 0.3
    const badgeMetrics = ctx.measureText(badgeText)
    const badgeWidth = badgeMetrics.width + 60
    const badgeHeight = 60
    ctx.fillRect(canvas.width / 2 - badgeWidth / 2, badgeY - badgeHeight / 2, badgeWidth, badgeHeight)

    // Reset shadow and alpha
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

    // Badge border
    ctx.strokeStyle = selectedTheme.accentColor
    ctx.lineWidth = 2
    ctx.strokeRect(canvas.width / 2 - badgeWidth / 2, badgeY - badgeHeight / 2, badgeWidth, badgeHeight)

    // Badge text
    ctx.font = "600 24px 'IBM Plex Sans', system-ui, sans-serif"
    ctx.fillStyle = selectedTheme.textColor
    ctx.fillText(badgeText, canvas.width / 2, badgeY)

    // Enhanced branding section
    ctx.font = "600 18px 'IBM Plex Sans', system-ui, sans-serif"
    ctx.fillStyle = selectedTheme.textColor
    ctx.globalAlpha = 0.8
    ctx.fillText("Created with GuideBuilder", canvas.width / 2, canvas.height - 60)
    ctx.globalAlpha = 1

    // Enhanced logo with gradient
    const logoGradient = ctx.createLinearGradient(
      canvas.width / 2 - 30,
      canvas.height - 140,
      canvas.width / 2 + 30,
      canvas.height - 80,
    )
    logoGradient.addColorStop(0, selectedTheme.accentColor)
    logoGradient.addColorStop(1, selectedTheme.textColor)

    ctx.fillStyle = logoGradient
    ctx.beginPath()
    ctx.roundRect(canvas.width / 2 - 30, canvas.height - 140, 60, 60, 15)
    ctx.fill()

    // Logo icon with better styling
    ctx.fillStyle = selectedTheme.textColor
    ctx.font = "bold 28px 'DM Sans', system-ui, sans-serif"
    ctx.fillText("G", canvas.width / 2, canvas.height - 110)

    // Convert to data URL for preview
    const dataUrl = canvas.toDataURL("image/png", 0.9)
    setImageDataUrl(dataUrl)
  }

  const handleCopyContent = async () => {
    const content = `${customMessage}\n\n${guideUrl}`
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: "Content Copied",
        description: "The shareable content has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(customMessage)}&url=${encodeURIComponent(guideUrl)}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
  }

  const handleDiscordShare = async () => {
    const discordContent = `${customMessage}\n${guideUrl}`
    try {
      await navigator.clipboard.writeText(discordContent)
      toast({
        title: "Discord Content Copied",
        description: "Content formatted for Discord has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy Discord content.",
        variant: "destructive",
      })
    }
  }

  const downloadShareImage = () => {
    if (!imageDataUrl) return

    const link = document.createElement("a")
    link.download = `${guideTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_completed.png`
    link.href = imageDataUrl
    link.click()

    toast({
      title: "Image Downloaded",
      description: "Your share image has been downloaded.",
    })
  }

  const handleCopyUrl = async () => {
    const baseUrl = getBaseUrl()
    const fullUrl = customUrl ? `${baseUrl}/guide/${customUrl}` : `${baseUrl}/guide/${guideUrl.split("/").pop()}`

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide border-0 bg-gradient-to-br from-pink-50 via-purple-50 to-violet-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-violet-950/20 shadow-2xl">
          {/* Gradient border overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-violet-500/10 rounded-lg" />
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent font-bold">
              <Share2 className="h-5 w-5" />
              Share Your Progress
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 relative z-10">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Image Theme</Label>
              <div className="grid grid-cols-4 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedTheme.id === theme.id
                        ? "border-pink-500 ring-2 ring-pink-200 dark:ring-pink-800"
                        : "border-gray-300 hover:border-pink-300 dark:border-gray-600 dark:hover:border-pink-600"
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded mb-1"
                      style={{
                        background: `linear-gradient(135deg, ${theme.gradient.join(", ")})`,
                      }}
                    />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Image Preview</Label>
                <Button variant="outline" size="sm" onClick={generateShareImage} className="flex items-center gap-2 border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </Button>
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-w-full border rounded"
                  style={{ aspectRatio: "1200/630" }}
                />
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Custom Message</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add your personal message..."
                className="min-h-[80px] border-gray-300 dark:border-gray-600 focus:border-pink-500 dark:focus:border-pink-500"
              />
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleTwitterShare} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600">
                <Twitter className="h-4 w-4" />
                Share on Twitter
              </Button>

              <Button onClick={handleDiscordShare} variant="outline" className="flex items-center gap-2 border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                <MessageCircle className="h-4 w-4" />
                Copy for Discord
              </Button>

              <Button onClick={handleCopyContent} variant="outline" className="flex items-center gap-2 border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                <Copy className="h-4 w-4" />
                {isCopied ? "Copied!" : "Copy Content"}
              </Button>

              <Button onClick={downloadShareImage} variant="outline" className="flex items-center gap-2 border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                <Download className="h-4 w-4" />
                Download Image
              </Button>
            </div>

            {/* Shareable URL */}
            <div className="space-y-2">
              <Label htmlFor="shareableUrl" className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Guide URL
              </Label>
              <Input
                value={
                  customUrl
                    ? `${getBaseUrl()}/guide/${customUrl}`
                    : `${getBaseUrl()}/guide/${guideUrl.split("/").pop()}`
                }
                readOnly
                className="text-sm border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose} className="border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/20 text-pink-700 dark:text-pink-300">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

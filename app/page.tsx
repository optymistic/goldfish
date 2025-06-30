"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Toaster } from "@/components/ui/toaster"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Users, 
  X,
  LogOut,
  Calendar,
  Edit,
  Fish
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { apiClient } from "@/lib/api-client"

interface Guide {
  id: string
  title: string
  description: string
  type: string
  slides: any[] | number
  tags: string[]
  created_at: string
  status: "draft" | "published"
  views: number
}

function DashboardContent() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newGuide, setNewGuide] = useState({
    title: "",
    description: "",
    type: "",
    slides: 5,
    tags: [] as { text: string; color: string }[],
  })
  const [tagInput, setTagInput] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [deleteGuideId, setDeleteGuideId] = useState<string | null>(null)
  const [selectedGuides, setSelectedGuides] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Fetch guides from API
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getGuides()
        setGuides(response.guides || [])
      } catch (error) {
        console.error("Error fetching guides:", error)
        toast({
          title: "Error",
          description: "Failed to load guides. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGuides()
  }, [toast])

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === "all" || guide.type.toLowerCase() === filterType.toLowerCase()
    const matchesStatus = filterStatus === "all" || guide.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateGuide = async () => {
    if (!newGuide.title || !newGuide.type) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and type for your guide.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await apiClient.createGuide({
        title: newGuide.title,
        description: newGuide.description,
        type: newGuide.type,
        tags: newGuide.tags.map(tag => tag.text),
        slides: newGuide.slides,
      })

      if (response.success) {
        toast({
          title: "Guide Created",
          description: "Your guide has been created successfully!",
        })
        
        // Refresh guides list
        const guidesResponse = await apiClient.getGuides()
        setGuides(guidesResponse.guides || [])
        
        // Reset form
        setNewGuide({ title: "", description: "", type: "", slides: 5, tags: [] })
        setTagInput("")
        setIsCreateModalOpen(false)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create guide.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating guide:", error)
      toast({
        title: "Error",
        description: "Failed to create guide. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGuide = async () => {
    if (!deleteGuideId) return

    try {
      await apiClient.deleteGuide(deleteGuideId)
      
      setDeleteGuideId(null)
      
      // Refresh guides list
      const response = await apiClient.getGuides()
      setGuides(response.guides || [])

      toast({
        title: "Guide Deleted",
        description: "The guide has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting guide:", error)
      toast({
        title: "Error",
        description: "Failed to delete guide. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedGuides.size === 0) return

    try {
      // Delete all selected guides
      await Promise.all(
        Array.from(selectedGuides).map(guideId => apiClient.deleteGuide(guideId))
      )
      
      // Clear selection
      setSelectedGuides(new Set())
      setIsSelectMode(false)
      
      // Refresh guides list
      const response = await apiClient.getGuides()
      setGuides(response.guides || [])

      toast({
        title: "Guides Deleted",
        description: `Successfully deleted ${selectedGuides.size} guide${selectedGuides.size > 1 ? 's' : ''}.`,
      })
    } catch (error) {
      console.error("Error deleting guides:", error)
      toast({
        title: "Error",
        description: "Failed to delete some guides. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSelectAll = () => {
    if (selectedGuides.size === filteredGuides.length) {
      // Deselect all
      setSelectedGuides(new Set())
    } else {
      // Select all
      setSelectedGuides(new Set(filteredGuides.map(guide => guide.id)))
    }
  }

  const handleSelectGuide = (guideId: string) => {
    const newSelected = new Set(selectedGuides)
    if (newSelected.has(guideId)) {
      newSelected.delete(guideId)
    } else {
      newSelected.add(guideId)
    }
    setSelectedGuides(newSelected)
  }

  const handleCardClick = (guideId: string) => {
    router.push(`/editor/${guideId}`)
  }

  const getStatusColor = (status: string) => {
    return status === "published"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "tutorial":
        return "📚"
      case "walkthrough":
        return "🚶"
      case "course":
        return "🎓"
      default:
        return "📖"
    }
  }

  const getTagColor = (tag: string, index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    ]
    return colors[index % colors.length]
  }

  const getRandomTagColor = (tag: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700",
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700",
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-700",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700",
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-700",
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700",
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
    ]
    
    // Return a truly random color
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      
      // Prevent empty tags
      if (!newTag) return
      
      // Prevent duplicate tags
      if (newGuide.tags.some(t => t.text === newTag)) {
        toast({
          title: "Duplicate Tag",
          description: "This tag already exists.",
          variant: "destructive",
        })
        return
      }
      
      // Limit number of tags
      if (newGuide.tags.length >= 10) {
        toast({
          title: "Too Many Tags",
          description: "You can add up to 10 tags per guide.",
          variant: "destructive",
        })
        return
      }
      
      setNewGuide({ ...newGuide, tags: [...newGuide.tags, { text: newTag, color: getRandomTagColor(newTag) }] })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: { text: string; color: string }) => {
    setNewGuide({ ...newGuide, tags: newGuide.tags.filter(t => t.text !== tagToRemove.text) })
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      })
      // Redirect to login or refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-rings mx-auto"></div>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-pulse">
            Loading your guides...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-premium">
      <Toaster />
      
      <header className="glass-premium border-b border-border sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Fish className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 shrink-0" />
              <h1 className="text-lg sm:text-2xl font-premium-title bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent truncate">
                {isSelectMode ? 'Select Guides' : 'goldfish'}
              </h1>
              {isSelectMode && (
                <Badge variant="secondary" className="gradient-bg-subtle gradient-text border-pink-500/20 shrink-0">
                  Selection Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              {selectedGuides.size > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGuides(new Set())
                    setIsSelectMode(false)
                  }}
                  className="shrink-0"
                >
                  Cancel Selection
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsSelectMode(true)}
                  className="shrink-0"
                >
                  Select Guides
                </Button>
              )}
              <Button onClick={() => setIsCreateModalOpen(true)} className="btn-premium gradient-bg hover:gradient-shadow shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Guide</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-premium hover-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{guides.length}</div>
            </CardContent>
          </Card>
          <Card className="card-premium hover-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <div className="h-4 w-4 gradient-bg rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{guides.filter((g) => g.status === "published").length}</div>
            </CardContent>
          </Card>
          <Card className="card-premium hover-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Users className="h-4 w-4 gradient-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{guides.reduce((sum, g) => sum + g.views, 0)}</div>
            </CardContent>
          </Card>
          <Card className="card-premium hover-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <div className="h-4 w-4 bg-yellow-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{guides.filter((g) => g.status === "draft").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {isSelectMode && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedGuides.size === filteredGuides.length && filteredGuides.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <Label htmlFor="select-all" className="text-sm">
                Select All ({filteredGuides.length})
              </Label>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="p-2">
                <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="walkthrough">Walkthrough</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-2">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bulk Actions Bar */}
        {selectedGuides.size > 0 && (
          <div className="card-premium gradient-border mb-6 p-4 gradient-bg-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium gradient-text">
                  {selectedGuides.size} guide{selectedGuides.size > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedGuides(new Set())
                    setIsSelectMode(false)
                  }}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Selected ({selectedGuides.size})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <Card
              key={guide.id}
              className={`card-premium transition-all duration-300 cursor-pointer group hover:shadow-lg ${
                hoveredCard === guide.id || openDropdown === guide.id ? 'scale-[1.02]' : ''
              } ${selectedGuides.has(guide.id) ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                if (isSelectMode) {
                  handleSelectGuide(guide.id)
                } else {
                  handleCardClick(guide.id)
                }
              }}
              onMouseEnter={() => setHoveredCard(guide.id)}
              onMouseLeave={() => {
                if (openDropdown !== guide.id) {
                  setHoveredCard(null)
                }
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isSelectMode && (
                      <Checkbox
                        checked={selectedGuides.has(guide.id)}
                        onCheckedChange={() => handleSelectGuide(guide.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none gradient-text">{getTypeIcon(guide.type)}</span>
                      <Badge variant="secondary" className={`text-xs font-semibold tracking-wide uppercase ${getStatusColor(guide.status)}`}>
                        {guide.status}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu onOpenChange={(open) => setOpenDropdown(open ? guide.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => e.stopPropagation()} 
                        disabled={isSelectMode}
                        className={`transition-opacity ${
                          hoveredCard === guide.id || openDropdown === guide.id ? 'opacity-100' : 'opacity-0'
                        } ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/editor/${guide.id}`)
                        }}
                      >
                        Edit Guide
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/guide/${guide.id}?from=dashboard`)
                        }}
                      >
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteGuideId(guide.id)
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardTitle className={`text-lg font-premium-heading leading-tight mb-3 transition-colors tracking-tight ${
                  hoveredCard === guide.id || openDropdown === guide.id ? 'gradient-text' : ''
                }`}>
                  {guide.title}
                </CardTitle>
                
                <CardDescription className="text-sm leading-relaxed text-muted-foreground line-clamp-2 font-normal">
                  {guide.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold tracking-wide">{typeof guide.slides === 'number' ? guide.slides : guide.slides.length}</span>
                    <span className="font-normal">slides</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold tracking-wide">{guide.views}</span>
                    <span className="font-normal">views</span>
                  </div>
                </div>
                
                {guide.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {guide.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={tag} variant="outline" className={`text-xs px-2.5 py-1 font-medium tracking-wide ${getTagColor(tag, index)}`}>
                        {tag}
                      </Badge>
                    ))}
                    {guide.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground font-medium">
                        +{guide.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-2" />
                    <span className="font-medium tracking-wide">{formatDate(guide.created_at)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/editor/${guide.id}`)
                    }}
                    disabled={isSelectMode}
                    className={`hover:scale-105 transition-all duration-200 text-xs font-medium ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Edit className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <div className="card-premium max-w-md mx-auto p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No guides found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first guide"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="btn-premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Guide
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Guide Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="card-premium">
          <DialogHeader>
            <DialogTitle>Create New Guide</DialogTitle>
            <DialogDescription>
              Start building your guide by filling out the basic information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter guide title..."
                value={newGuide.title}
                onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this guide covers..."
                value={newGuide.description}
                onChange={(e) => setNewGuide({ ...newGuide, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newGuide.type} onValueChange={(value) => setNewGuide({ ...newGuide, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select guide type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tutorial">Tutorial</SelectItem>
                  <SelectItem value="Walkthrough">Walkthrough</SelectItem>
                  <SelectItem value="Course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="space-y-3">
                {/* Display existing tags */}
                {newGuide.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newGuide.tags.map((tag, index) => (
                      <div
                        key={tag.text}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm font-medium ${tag.color}`}
                      >
                        <span>{tag.text}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveTag(tag)
                          }}
                          className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Tag input */}
                <Input
                  id="tags"
                  placeholder="Type a tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Press Enter to add a tag. You can add up to 10 tags per guide. Tags help organize and categorize your guides.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGuide} className="btn-premium" disabled={!newGuide.title || !newGuide.type}>
              Create Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteGuideId} onOpenChange={(open) => !open && setDeleteGuideId(null)}>
        <DialogContent className="card-premium">
          <DialogHeader>
            <DialogTitle>Delete Guide</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this guide? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteGuideId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGuide}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="card-premium">
          <DialogHeader>
            <DialogTitle>Delete Multiple Guides</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedGuides.size} guide{selectedGuides.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleBulkDelete()
                setIsBulkDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedGuides.size} Guide{selectedGuides.size > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

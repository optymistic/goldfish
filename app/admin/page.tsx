"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Users, 
  FileText, 
  Upload, 
  Calendar, 
  Search, 
  Download,
  Eye,
  BarChart3,
  Home,
  Loader2,
  Fish,
  LogOut
} from "lucide-react"

interface Guide {
  id: string
  title: string
  description: string | null
  type: string
  tags: string[]
}

interface GuideStats {
  total_responses: number
  unique_users: number
  latest_response: string
  total_files: number
  today_responses: number
}

interface Session {
  user_identifier: string
  first_activity: string
  last_activity: string
  total_responses: number
  name: string | null
  responses: Array<{
    question: string
    answer: string
    created_at: string
    file_url?: string
    file_name?: string
  }>
}

export default function AdminPanel() {
  const router = useRouter()
  const [guides, setGuides] = useState<Guide[]>([])
  const [selectedGuide, setSelectedGuide] = useState<string>("")
  const [guideStats, setGuideStats] = useState<GuideStats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Load guides on component mount
  useEffect(() => {
    loadGuides()
  }, [])

  // Load stats when guide is selected
  useEffect(() => {
    if (selectedGuide) {
      loadGuideStats(selectedGuide)
      loadSessions(selectedGuide)
    }
  }, [selectedGuide])

  const loadGuides = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/guides')
      if (!response.ok) throw new Error('Failed to load guides')
      
      const data = await response.json()
      setGuides(data.guides || [])
      
      // Do NOT auto-select first guide
      // if (data.guides?.length > 0 && !selectedGuide) {
      //   setSelectedGuide(data.guides[0].id)
      // }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadGuideStats = async (guideId: string) => {
    try {
      setStatsLoading(true)
      const response = await fetch(`/api/admin?action=stats&guide_id=${guideId}`)
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setGuideStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadSessions = async (guideId: string) => {
    try {
      setSessionsLoading(true)
      const response = await fetch(`/api/admin?action=sessions&guide_id=${guideId}`)
      if (!response.ok) throw new Error('Failed to load sessions')
      
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSessionsLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true
    
    // Search by name (if available) or user identifier
    const searchLower = searchTerm.toLowerCase()
    const nameMatch = session.name?.toLowerCase().includes(searchLower)
    const idMatch = session.user_identifier.toLowerCase().includes(searchLower)
    
    return nameMatch || idMatch
  })

  // Group sessions by name for unified display
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    // Try to get the name answer (lowercased) from this session
    let nameAnswer = null;
    for (const response of session.responses) {
      if (
        response.question.toLowerCase().includes('name') ||
        response.question.toLowerCase().includes('what is your') ||
        response.question.toLowerCase().includes('who are you')
      ) {
        nameAnswer = response.answer?.toLowerCase();
        break;
      }
    }
    const key = nameAnswer || session.user_identifier;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(session);
    return groups;
  }, {} as Record<string, Session[]>);

  // Calculate combined stats for grouped sessions
  const getGroupStats = (sessions: Session[]) => {
    const totalResponses = sessions.reduce((sum, s) => sum + s.total_responses, 0)
    const firstActivity = sessions.reduce((earliest, s) => 
      new Date(s.first_activity) < new Date(earliest) ? s.first_activity : earliest, 
      sessions[0].first_activity
    )
    const lastActivity = sessions.reduce((latest, s) => 
      new Date(s.last_activity) > new Date(latest) ? s.last_activity : latest, 
      sessions[0].last_activity
    )
    return { totalResponses, firstActivity, lastActivity }
  }

  // Find the name question from responses
  const getNameQuestion = (sessions: Session[]) => {
    for (const session of sessions) {
      for (const response of session.responses) {
        if (response.question.toLowerCase().includes('name') || 
            response.question.toLowerCase().includes('what is your') ||
            response.question.toLowerCase().includes('who are you')) {
          return response.answer
        }
      }
    }
    return null
  }

  const exportResponses = async () => {
    if (!selectedGuide) return
    
    try {
      setExportLoading(true)
      const response = await fetch(`/api/admin?action=responses&guide_id=${selectedGuide}`)
      if (!response.ok) throw new Error('Failed to export responses')
      
      const data = await response.json()
      
      // Convert to CSV
      const csvContent = convertToCSV(data.responses)
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `responses-${selectedGuide}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExportLoading(false)
    }
  }

  const convertToCSV = (responses: any[]) => {
    const headers = ['User ID', 'Question', 'Answer', 'File URL', 'File Name', 'Created At']
    const rows = responses.map(r => [
      r.user_identifier,
      r.question,
      r.answer || '',
      r.file_url || '',
      r.file_name || '',
      new Date(r.created_at).toLocaleString()
    ])
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/setup')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-premium">
      <header className="glass-premium border-b border-border sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Fish className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 shrink-0" />
              <h1 className="text-lg sm:text-2xl font-premium-title bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent truncate"
                  style={{ fontFamily: "'DM Sans', serif" }}>
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="Home"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Home</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadGuides}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="Refresh"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <Alert variant="destructive" className="card-premium">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Guide Selection */}
          <Card className="lg:col-span-1 card-premium hover-gradient">
            <CardHeader>
              <CardTitle className="gradient-text">Select Guide</CardTitle>
              <CardDescription>Choose a guide to view responses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <Select value={selectedGuide} onValueChange={setSelectedGuide}>
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select a guide" />
                  </SelectTrigger>
                  <SelectContent>
                    {guides.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>
                        {guide.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Stats Overview */}
          {statsLoading ? (
            <>
              <Card className="card-premium hover-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium gradient-text">Total Responses</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>

              <Card className="card-premium hover-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium gradient-text">Unique Users</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>

              <Card className="card-premium hover-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium gradient-text">File Uploads</CardTitle>
                  <Upload className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            </>
          ) : guideStats ? (
            <>
              <Card className="card-premium hover-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium gradient-text">Total Responses</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{guideStats.total_responses}</div>
                  <p className="text-xs text-muted-foreground">
                    {guideStats.today_responses} today
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium hover-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium gradient-text">Unique Users</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{guideStats.unique_users}</div>
                  <p className="text-xs text-muted-foreground">
                    Active sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium hover-gradient">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium gradient-text">File Uploads</CardTitle>
                  <Upload className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{guideStats.total_files}</div>
                  <p className="text-xs text-muted-foreground">
                    Total files uploaded
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {selectedGuide && (
          <Tabs defaultValue="sessions" className="space-y-4">
            <TabsList className="card-premium flex gap-2 p-1 bg-background/80 backdrop-blur rounded-xl border border-border/60 justify-start w-fit">
              <TabsTrigger
                value="sessions"
                className="gradient-text px-4 py-2 rounded-lg font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:border-none data-[state=active]:gradient-ring data-[state=inactive]:text-muted-foreground data-[state=inactive]:bg-transparent"
              >
                User Sessions
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="gradient-text px-4 py-2 rounded-lg font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:border-none data-[state=active]:gradient-ring data-[state=inactive]:text-muted-foreground data-[state=inactive]:bg-transparent"
              >
                Export Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4">
              <Card className="card-premium">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="gradient-text">User Sessions</CardTitle>
                      <CardDescription>
                        All user sessions and their responses
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search by name or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 input-premium w-64"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={exportResponses} 
                        disabled={exportLoading}
                        className="btn-premium"
                      >
                        {exportLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="card-premium p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-24" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                          </div>
                          
                          <Skeleton className="h-4 w-64 mb-2" />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-4 w-40" />
                            </div>
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-4 w-40" />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Separator className="mb-2" />
                            <Skeleton className="h-4 w-40 mb-2" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedSessions).map(([name, sessions]) => {
                        const stats = getGroupStats(sessions)
                        const primarySession = sessions[0]
                        const hasMultipleSessions = sessions.length > 1
                        
                        return (
                          <div key={name} className="card-premium p-6 hover-gradient">
                            <div className="flex items-start justify-between">
                              {/* Left side - Primary info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold gradient-text truncate">
                                      {getNameQuestion(sessions) || primarySession.name || 'User Session'}
                                    </h3>
                                    {hasMultipleSessions && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {sessions.length} session{sessions.length > 1 ? 's' : ''} • ID: {primarySession.user_identifier}
                                      </p>
                                    )}
                                    {!hasMultipleSessions && !primarySession.name && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        ID: {primarySession.user_identifier}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="gradient-bg-subtle shrink-0">
                                    {stats.totalResponses} responses
                                  </Badge>
                                </div>
                                
                                {/* Activity timeline */}
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium gradient-text">First:</span>
                                    <span className="text-muted-foreground">{formatDate(stats.firstActivity)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium gradient-text">Last:</span>
                                    <span className="text-muted-foreground">{formatDate(stats.lastActivity)}</span>
                                  </div>
                                </div>

                                {/* All Responses */}
                                {sessions.some(s => s.responses.length > 0) && (
                                  <div className="mt-4">
                                    <div className="text-sm font-medium mb-3 gradient-text">Questions & Answers:</div>
                                    <div className="space-y-3">
                                      {sessions.flatMap(session => 
                                        session.responses.map((response, index) => (
                                          <div key={`${session.user_identifier}-${index}`} className="bg-muted/30 rounded-lg p-3">
                                            <div className="text-sm font-medium text-foreground mb-1">
                                              Q: {response.question}
                                            </div>
                                            <div className="text-sm text-muted-foreground mb-2">
                                              A: {response.answer || 'No answer provided'}
                                            </div>
                                            {response.file_url && (
                                              <div className="flex items-center gap-2 mt-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => window.open(response.file_url, '_blank')}
                                                  className="text-xs"
                                                >
                                                  <FileText className="w-3 h-3 mr-1" />
                                                  View File
                                                </Button>
                                                <span className="text-xs text-muted-foreground">
                                                  {response.file_name || 'File'}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right side - Actions and technical details */}
                              <div className="flex flex-col items-end gap-3 ml-6">
                                <div className="text-right text-xs text-muted-foreground space-y-1">
                                  {hasMultipleSessions && (
                                    <div className="bg-muted/50 px-2 py-1 rounded text-xs">
                                      {sessions.length} sessions
                                    </div>
                                  )}
                                  <div>Total responses: {stats.totalResponses}</div>
                                  <div>Latest: {formatDate(stats.lastActivity)}</div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {sessions.map((session, index) => (
                                    <Button
                                      key={session.user_identifier}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(`/admin/session/${selectedGuide}/${session.user_identifier}`, '_blank')}
                                      className="hover:gradient-bg-subtle text-xs"
                                      title={hasMultipleSessions ? `View Session ${index + 1}` : 'View Details'}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      {hasMultipleSessions ? `S${index + 1}` : 'View'}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {Object.keys(groupedSessions).length === 0 && (
                        <div className="text-center py-8">
                          <div className="card-premium max-w-md mx-auto p-8">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium gradient-text mb-2">No sessions found</h3>
                            <p className="text-muted-foreground">
                              {searchTerm ? 'No sessions found matching your search.' : 'No sessions found for this guide.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="gradient-text">Export Data</CardTitle>
                  <CardDescription>
                    Download response data in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={exportResponses} 
                      disabled={exportLoading} 
                      className="w-full btn-premium"
                    >
                      {exportLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export All Responses (CSV)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
} 
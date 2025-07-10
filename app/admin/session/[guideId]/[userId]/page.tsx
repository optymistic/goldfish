"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Upload, 
  Calendar,
  User,
  MessageSquare,
  Home,
  Loader2
} from "lucide-react"

interface UserResponse {
  slide_id: string
  slide_title: string
  responses: Array<{
    block_id: string
    question: string
    answer: string
    file_url: string
    file_name: string
    file_size: number
    created_at: string
    block_type: string
  }>
}

interface SessionData {
  user_responses: UserResponse[]
  user_identifier: string
  total_responses: number
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const guideId = params.guideId as string
  const userId = params.userId as string
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSessionData()
  }, [guideId, userId])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin?action=user_responses&guide_id=${guideId}&user_identifier=${userId}`)
      if (!response.ok) throw new Error('Failed to load session data')
      
      const data = await response.json()
      setSessionData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  const exportSessionData = () => {
    if (!sessionData) return

    const csvContent = convertToCSV(sessionData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${userId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: SessionData) => {
    const headers = ['Slide', 'Question', 'Answer', 'File URL', 'File Name', 'File Size', 'Created At']
    const rows = data.user_responses.flatMap(slide => 
      slide.responses.map(response => [
        slide.slide_title,
        response.question,
        response.answer || '',
        response.file_url || '',
        response.file_name || '',
        response.file_size ? formatFileSize(response.file_size) : '',
        formatDate(response.created_at)
      ])
    )
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Session Info Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responses Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>No session data found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/admin?guide=${guideId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <Home className="w-4 h-4 mr-2" />
            Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Session Details</h1>
            <p className="text-muted-foreground">User responses and interactions</p>
          </div>
        </div>
        <Button onClick={exportSessionData}>
          <Download className="w-4 h-4 mr-2" />
          Export Session
        </Button>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">User Identifier</div>
              <div className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all">
                {sessionData.user_identifier}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Responses</div>
              <div className="text-2xl font-bold">{sessionData.total_responses}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Slides Completed</div>
              <div className="text-2xl font-bold">{sessionData.user_responses.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses by Slide */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Responses by Slide
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {sessionData.user_responses.map((slide, slideIndex) => (
            <AccordionItem key={slide.slide_id} value={`slide-${slideIndex}`}>
              <AccordionTrigger className="hover:no-underline">
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{slide.slide_title}</CardTitle>
                        <CardDescription>
                          {slide.responses.length} response{slide.responses.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        Slide {slideIndex + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-4">
                  {slide.responses.map((response, responseIndex) => (
                    <Card key={response.block_id} className="ml-4">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {response.block_type === 'file-upload' ? (
                              <Upload className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            Question {responseIndex + 1}
                          </CardTitle>
                          <Badge variant="outline">
                            {response.block_type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Question */}
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-2">Question:</div>
                          <div className="bg-muted p-3 rounded-lg">
                            {response.question}
                          </div>
                        </div>

                        {/* Answer or File */}
                        {response.block_type === 'file-upload' ? (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Uploaded File:</div>
                            {response.file_url ? (
                              <div className="bg-muted p-3 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{response.file_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatFileSize(response.file_size)}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(response.file_url, response.file_name)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    View File
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No file uploaded</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Answer:</div>
                            <div className="bg-muted p-3 rounded-lg">
                              {response.answer || 'No answer provided'}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(response.created_at)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {sessionData.user_responses.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No responses found for this session.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
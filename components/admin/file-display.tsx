import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Download, File, Image, Video, FileText } from "lucide-react"

interface FileDisplayProps {
  fileUrl: string
  fileName: string
  fileSize: number
  showDownload?: boolean
}

export function FileDisplay({ fileUrl, fileName, fileSize, showDownload = true }: FileDisplayProps) {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="w-4 h-4" />
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return <Video className="w-4 h-4" />
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  const isImage = () => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon(fileName)}
            <div>
              <div className="font-medium text-sm">{fileName}</div>
              <div className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage() && (
              <Badge variant="outline" className="text-xs">
                Image
              </Badge>
            )}
            {showDownload && (
              <Button variant="outline" size="sm" onClick={downloadFile}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
        
        {isImage() && (
          <div className="mt-3">
            <img 
              src={fileUrl} 
              alt={fileName}
              className="max-w-full h-auto max-h-48 rounded-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
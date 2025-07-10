import { type NextRequest, NextResponse } from "next/server"
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/r2-client"

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        error: "No file provided" 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "File type not allowed. Please upload images, documents, or archives." 
      }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to R2
    try {
      const { url, filename } = await uploadFileToR2(
        buffer,
        file.name,
        file.type
      )

      return NextResponse.json({ 
        url,
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type
      })
    } catch (uploadError) {
      console.error("R2 Upload Error:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload file to storage",
        details: uploadError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Failed to upload file" 
    }, { status: 500 })
  }
}

// Handle DELETE request for file removal
export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()
    
    if (!filename) {
      return NextResponse.json({ 
        error: "No filename provided" 
      }, { status: 400 })
    }

    // Extract filename from URL if full URL is provided
    const actualFilename = filename.includes('/') 
      ? filename.split('/').pop() 
      : filename

    if (!actualFilename) {
      return NextResponse.json({ 
        error: "Invalid filename" 
      }, { status: 400 })
    }

    // Delete from R2
    try {
      await deleteFileFromR2(actualFilename)
      return NextResponse.json({ 
        success: true,
        message: "File deleted successfully"
      })
    } catch (deleteError) {
      console.error("R2 Delete Error:", deleteError)
      return NextResponse.json({ 
        error: "Failed to delete file from storage",
        details: deleteError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ 
      error: "Failed to delete file" 
    }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 
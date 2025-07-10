import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'guide-bolt'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL // <-- Use this for public file links

// Initialize S3 client for R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// Generate a unique filename
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop() || ''
  return `${timestamp}-${random}.${extension}`
}

// Upload file to R2
export async function uploadFileToR2(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; filename: string }> {
  const uniqueFilename = generateUniqueFilename(filename)
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: uniqueFilename,
    Body: file,
    ContentType: contentType,
  })

  await r2Client.send(command)

  // Use the public URL for browser access
  let publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${uniqueFilename}`
    : (() => {
        // fallback: try to construct from bucket and endpoint
        const accountId = R2_ENDPOINT.match(/([a-f0-9]{32})/)?.[1]
        return `https://${R2_BUCKET_NAME}.${accountId}.r2.dev/${uniqueFilename}`
      })()

  return {
    url: publicUrl,
    filename: uniqueFilename,
  }
}

// Delete file from R2
export async function deleteFileFromR2(filename: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filename,
  })

  await r2Client.send(command)
}

// Generate presigned URL for direct upload (optional, for client-side uploads)
export async function generatePresignedUrl(
  filename: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const uniqueFilename = generateUniqueFilename(filename)
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: uniqueFilename,
    ContentType: contentType,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
} 
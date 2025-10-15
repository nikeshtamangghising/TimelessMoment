import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createAdminHandler } from '@/lib/auth-middleware'

// Configure Cloudinary - supports both URL format and individual variables
if (process.env.CLOUDINARY_URL) {
  // Parse CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
  const url = new URL(process.env.CLOUDINARY_URL)
  cloudinary.config({
    cloud_name: url.hostname,
    api_key: url.username,
    api_secret: url.password,
  })
} else {
  // Fallback to individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// POST /api/upload - Production-grade image upload with Cloudinary
export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
      return NextResponse.json(
        { 
          error: 'Cloudinary not configured. Please add CLOUDINARY_URL or individual CLOUDINARY_* environment variables.' 
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []
    const uploadErrors: string[] = []

    for (const file of files) {
      if (!file || file.size === 0) {
        continue
      }

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          uploadErrors.push(`File ${file.name} is not a valid image`)
          continue
        }

        // Check file size (max 10MB for production)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          uploadErrors.push(`File ${file.name} is too large. Maximum size is 10MB`)
          continue
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate unique public ID
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const publicId = `ecommerce/products/product-${timestamp}-${randomSuffix}`

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              folder: 'ecommerce/products',
              resource_type: 'image',
              format: fileExtension,
              transformation: [
                { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
                { fetch_format: 'auto' }
              ],
              overwrite: false,
              unique_filename: true,
            },
            (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            }
          ).end(buffer)
        })

        if (uploadResult && typeof uploadResult === 'object' && 'secure_url' in uploadResult) {
          uploadedUrls.push(uploadResult.secure_url as string)
        } else {
          uploadErrors.push(`Failed to upload ${file.name}: Invalid response from Cloudinary`)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        uploadErrors.push(`Failed to upload ${file.name}: ${errorMessage}`)
      }
    }

    // Return results
    if (uploadedUrls.length === 0 && uploadErrors.length > 0) {
      return NextResponse.json(
        { error: 'All uploads failed', details: uploadErrors },
        { status: 400 }
      )
    }

    const response: any = {
      message: `Successfully uploaded ${uploadedUrls.length} of ${files.length} file(s)`,
      urls: uploadedUrls,
      success: true,
    }

    if (uploadErrors.length > 0) {
      response.warnings = uploadErrors
      response.partialSuccess = true
    }

    return NextResponse.json(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: 'Upload service error', 
        details: errorMessage,
        success: false 
      },
      { status: 500 }
    )
  }
})

// GET /api/upload - Not implemented
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
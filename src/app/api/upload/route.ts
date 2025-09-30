import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createAdminHandler } from '@/lib/auth-middleware'

// POST /api/upload - Upload image files
export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!file || file.size === 0) {
        continue
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `File ${file.name} is not a valid image` },
          { status: 400 }
        )
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split('.').pop()
      const fileName = `product-${timestamp}-${randomSuffix}.${fileExtension}`

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (error) {
        // Directory might already exist, ignore error
      }

      // Save file
      const filePath = join(uploadDir, fileName)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      await writeFile(filePath, buffer)

      // Add URL to response (relative to public directory)
      uploadedUrls.push(`/uploads/products/${fileName}`)
    }

    return NextResponse.json({
      message: `Successfully uploaded ${uploadedUrls.length} file(s)`,
      urls: uploadedUrls
    })

  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
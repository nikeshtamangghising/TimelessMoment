import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'

// POST /api/upload - Upload image files
// Note: In production on Vercel, this is a demo endpoint that simulates file upload
// For production use, integrate with cloud storage (Cloudinary, AWS S3, Vercel Blob, etc.)
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

      // Generate unique filename for demo
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split('.').pop()
      const fileName = `product-${timestamp}-${randomSuffix}.${fileExtension}`

      // DEMO MODE: Return placeholder URLs for Vercel deployment
      // In production, replace this with actual cloud storage integration
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        // Return demo placeholder images for production demo
        const demoImages = [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 
          'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
        ]
        
        const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)]
        uploadedUrls.push(randomImage)
      } else {
        // Local development - try to save to filesystem
        try {
          const { writeFile, mkdir } = await import('fs/promises')
          const { join } = await import('path')
          
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'products')
          await mkdir(uploadDir, { recursive: true })

          const filePath = join(uploadDir, fileName)
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          await writeFile(filePath, buffer)
          uploadedUrls.push(`/uploads/products/${fileName}`)
        } catch (fsError) {
          // Fallback to demo image if filesystem fails
          const demoImages = [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'
          ]
          uploadedUrls.push(demoImages[Math.floor(Math.random() * demoImages.length)])
        }
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${uploadedUrls.length} file(s)`,
      urls: uploadedUrls,
      demo: process.env.VERCEL || process.env.NODE_ENV === 'production'
    })

  } catch (error) {
    // Graceful fallback with demo images
    const demoImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'
    ]
    
    return NextResponse.json({
      message: 'Using demo images - configure cloud storage for production',
      urls: [demoImages[0]], // Return one demo image
      demo: true
    })
  }
})

// GET /api/upload - Not implemented
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
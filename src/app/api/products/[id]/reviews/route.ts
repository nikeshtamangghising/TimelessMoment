import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(2000),
  guestName: z.string().min(1).max(100).optional(),
  guestEmail: z.string().email().optional(),
})

// GET /api/products/[id]/reviews - Get all reviews for a product
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get approved reviews with user information
    const reviews = await prisma.review.findMany({
      where: {
        productId: id,
        isApproved: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate average rating and total count
    const ratingStats = await prisma.review.aggregate({
      where: {
        productId: id,
        isApproved: true
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        ratingStats: {
          average: ratingStats._avg.rating || 0,
          count: ratingStats._count.rating || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching product reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validationResult = createReviewSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { rating, title, content, guestName, guestEmail } = validationResult.data

    // Check if user is logged in or if guest information is provided
    if (!session?.user?.id && (!guestName || !guestEmail)) {
      return NextResponse.json(
        { error: 'Authentication required or guest information must be provided' },
        { status: 401 }
      )
    }

    // Check if user has already reviewed this product
    if (session?.user?.id) {
      const existingReview = await prisma.review.findFirst({
        where: {
          productId: id,
          userId: session.user.id
        }
      })

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        )
      }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: session?.user?.id || null,
        guestName: session?.user?.id ? null : guestName,
        guestEmail: session?.user?.id ? null : guestEmail,
        rating,
        title: title || null,
        content,
        isVerified: false, // Could be set to true if user has purchased the product
        isApproved: session?.user?.role === 'ADMIN' ? true : false, // Auto-approve admin reviews
        helpfulVotes: 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: review,
      message: session?.user?.role === 'ADMIN' 
        ? 'Review submitted successfully' 
        : 'Review submitted and is pending approval'
    })

  } catch (error) {
    console.error('Error creating product review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = createReviewSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { productId, rating, title, content, guestName, guestEmail } = validationResult.data
    
    // Check if user is authenticated
    const token = await getToken({ req: request })
    const isAuthenticated = !!token

    // Validate guest information if not authenticated
    if (!isAuthenticated && (!guestName || !guestEmail)) {
      return NextResponse.json(
        { error: 'Guest name and email are required for unauthenticated reviews' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this product
    if (isAuthenticated) {
      const existingReview = await prisma.review.findFirst({
        where: {
          productId,
          userId: token.sub
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
        productId,
        userId: isAuthenticated ? token.sub : null,
        rating,
        title,
        content,
        guestName: !isAuthenticated ? guestName : null,
        guestEmail: !isAuthenticated ? guestEmail : null,
        isApproved: true, // Auto-approve for now, can add moderation later
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    // Update product rating statistics
    await updateProductRatingStats(productId)

    return NextResponse.json({
      review,
      message: 'Review submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit
    const whereClause: any = {
      productId,
      isApproved: true
    }

    if (rating) {
      whereClause.rating = parseInt(rating)
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.review.count({ where: whereClause })
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating statistics
async function updateProductRatingStats(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      isApproved: true
    },
    select: {
      rating: true
    }
  })

  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: averageRating,
      ratingCount: totalReviews
    }
  })
}
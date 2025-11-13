import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { reviews, products, users } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
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
    const productResult = await db.select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.id, id))
      .limit(1)
    const product = productResult[0] || null

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get approved reviews with user information
    const reviewsResult = await db.query.reviews.findMany({
      where: and(
        eq(reviews.productId, id),
        eq(reviews.isApproved, true)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: desc(reviews.createdAt)
    })

    // Calculate average rating and total count
    const [avgResult, countResult] = await Promise.all([
      db.select({ avg: sql<number>`avg(${reviews.rating})` })
        .from(reviews)
        .where(and(eq(reviews.productId, id), eq(reviews.isApproved, true))),
      db.select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(and(eq(reviews.productId, id), eq(reviews.isApproved, true)))
    ])

    const ratingStats = {
      _avg: { rating: Number(avgResult[0]?.avg || 0) },
      _count: { rating: Number(countResult[0]?.count || 0) }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsResult,
        ratingStats: {
          average: ratingStats._avg.rating || 0,
          count: ratingStats._count.rating || 0
        }
      }
    })

  } catch (error) {
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
    const productResult = await db.select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.id, id))
      .limit(1)
    const product = productResult[0] || null

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
      const existingReviewResult = await db.select()
        .from(reviews)
        .where(and(
          eq(reviews.productId, id),
          eq(reviews.userId, session.user.id)
        ))
        .limit(1)
      const existingReview = existingReviewResult[0] || null

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        )
      }
    }

    // Create the review
    const [review] = await db.insert(reviews)
      .values({
        productId: id,
        userId: session?.user?.id || null,
        rating,
        title: title || null,
        comment: content,
        isVerifiedPurchase: false, // Could be set to true if user has purchased the product
        isApproved: session?.user?.role === 'ADMIN' ? true : false, // Auto-approve admin reviews
        helpfulCount: 0
      })
      .returning()

    // Get user info if authenticated
    let reviewWithUser: any = review
    if (session?.user?.id && review.userId) {
      const userResult = await db.query.users.findFirst({
        where: eq(users.id, review.userId),
        columns: {
          id: true,
          name: true,
          image: true
        }
      })
      reviewWithUser = { ...review, user: userResult || null }
    }

    return NextResponse.json({
      success: true,
      data: reviewWithUser,
      message: session?.user?.role === 'ADMIN' 
        ? 'Review submitted successfully' 
        : 'Review submitted and is pending approval'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

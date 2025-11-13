import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reviews, products, users } from '@/lib/db/schema'
import { eq, and, desc, sql, count } from 'drizzle-orm'
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
    const productResult = await db.select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isActive, true)))
      .limit(1)
    const product = productResult[0] || null

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this product
    if (isAuthenticated) {
      const existingReviewResult = await db.select()
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.userId, token.sub!)))
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
        productId,
        userId: isAuthenticated ? token.sub! : null,
        rating,
        title: title || null,
        comment: content || null,
        isApproved: true, // Auto-approve for now, can add moderation later
      })
      .returning()

    // Get user info if authenticated
    let reviewWithUser: any = review
    if (isAuthenticated && review.userId) {
      const userResult = await db.query.users.findFirst({
        where: eq(users.id, review.userId),
        columns: { name: true }
      })
      reviewWithUser = { ...review, user: userResult || null }
    }

    // Update product rating statistics
    await updateProductRatingStats(productId)

    return NextResponse.json({
      review: reviewWithUser,
      message: 'Review submitted successfully'
    }, { status: 201 })

  } catch (error) {
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

    const offset = (page - 1) * limit
    const conditions = [
      eq(reviews.productId, productId),
      eq(reviews.isApproved, true)
    ]

    if (rating) {
      conditions.push(eq(reviews.rating, parseInt(rating)))
    }

    const whereClause = and(...conditions)

    const [reviewsResult, totalCountResult] = await Promise.all([
      db.select()
        .from(reviews)
        .where(whereClause)
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(whereClause)
    ])

    // Get user info for each review
    const reviewsWithUsers = await Promise.all(
      reviewsResult.map(async (review) => {
        if (review.userId) {
          const userResult = await db.query.users.findFirst({
            where: eq(users.id, review.userId),
            columns: { name: true }
          })
          return { ...review, user: userResult || null }
        }
        return { ...review, user: null }
      })
    )

    const totalCount = Number(totalCountResult[0]?.count || 0)

    return NextResponse.json({
      reviews: reviewsWithUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating statistics
async function updateProductRatingStats(productId: string) {
  const reviewsResult = await db.select({ rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))

  const totalReviews = reviewsResult.length
  const averageRating = totalReviews > 0 
    ? reviewsResult.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0

  await db.update(products)
    .set({
      ratingAvg: averageRating.toString(),
      ratingCount: totalReviews,
      updatedAt: new Date()
    })
    .where(eq(products.id, productId))
}
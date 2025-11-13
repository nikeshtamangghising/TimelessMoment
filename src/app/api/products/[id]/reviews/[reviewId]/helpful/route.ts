import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{
    id: string
    reviewId: string
  }>
}

// POST /api/products/[id]/reviews/[reviewId]/helpful - Mark a review as helpful
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, reviewId } = await params
    
    if (!id || !reviewId) {
      return NextResponse.json(
        { error: 'Product ID and Review ID are required' },
        { status: 400 }
      )
    }

    // Check if review exists and belongs to the product
    const reviewResult = await db.select()
      .from(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.productId, id)))
      .limit(1)
    const review = reviewResult[0] || null

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Increment helpful votes
    const [updatedReview] = await db.update(reviews)
      .set({
        helpfulCount: sql`${reviews.helpfulCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning({
        id: reviews.id,
        helpfulCount: reviews.helpfulCount
      })

    return NextResponse.json({
      success: true,
      data: {
        reviewId: updatedReview.id,
        helpfulVotes: updatedReview.helpfulCount
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

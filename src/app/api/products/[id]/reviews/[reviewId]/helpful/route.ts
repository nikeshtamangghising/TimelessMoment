import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        productId: id
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Increment helpful votes
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulVotes: {
          increment: 1
        }
      },
      select: {
        id: true,
        helpfulVotes: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reviewId: updatedReview.id,
        helpfulVotes: updatedReview.helpfulVotes
      }
    })

  } catch (error) {
    console.error('Error updating review helpful votes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { recalculateAllProductMetrics } from '@/lib/product-metrics'
import RecommendationEngine from '@/lib/recommendation-engine'

// Admin-only endpoint to recalculate all product metrics and refresh popularity scores
export const POST = createAdminHandler(async (_request: NextRequest) => {
  try {
    await recalculateAllProductMetrics()
    await RecommendationEngine.updateAllProductScores()

    return NextResponse.json({
      success: true,
      message: 'Product metrics and popularity scores recalculated successfully.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error recalculating product metrics:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate product metrics' },
      { status: 500 }
    )
  }
})
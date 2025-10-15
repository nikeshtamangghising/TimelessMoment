import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { inventoryRepository } from '@/lib/inventory-repository'
import { paginationSchema } from '@/lib/validations'

// GET /api/inventory/history - Get inventory change history
export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const paginationResult = paginationSchema.safeParse({ page, limit })
    if (!paginationResult.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Parse filter parameters
    const filters = {
      productId: searchParams.get('productId') || undefined,
      type: searchParams.get('type') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    }

    const history = await inventoryRepository.getInventoryHistory(
      filters,
      paginationResult.data
    )

    return NextResponse.json(history)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
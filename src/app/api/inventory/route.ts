import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { inventoryRepository } from '@/lib/inventory-repository'
import { bulkInventoryUpdateSchema, inventoryAdjustmentSchema } from '@/lib/validations'

// GET /api/inventory - Get inventory summary and low stock alerts
export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const lowStockThreshold = parseInt(searchParams.get('threshold') || '10')
    
    const summary = await inventoryRepository.getInventorySummary(lowStockThreshold)
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching inventory summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PUT /api/inventory/bulk - Bulk update inventory levels
export const PUT = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    const validationResult = bulkInventoryUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const result = await inventoryRepository.bulkUpdateInventory(
      validationResult.data.updates,
      validationResult.data.reason || 'Bulk inventory adjustment'
    )

    return NextResponse.json({
      message: `Successfully updated ${result.updatedCount} products`,
      ...result
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/inventory/adjust - Make individual inventory adjustments
export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    const validationResult = inventoryAdjustmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const result = await inventoryRepository.adjustInventory(validationResult.data)

    return NextResponse.json({
      message: 'Inventory adjusted successfully',
      adjustment: result
    })
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
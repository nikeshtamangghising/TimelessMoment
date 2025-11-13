import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, inventoryAdjustments } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'
import { inventoryAdjustmentSchema } from '@/lib/validations'

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

    const { productId, quantity, type, reason } = validationResult.data

    // Get the current product
    const productResult = await db.select({
      id: products.id,
      name: products.name,
      inventory: products.inventory
    })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
    const product = productResult[0] || null

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate new inventory level
    const newInventory = product.inventory + quantity
    if (newInventory < 0) {
      return NextResponse.json(
        { error: 'Cannot reduce inventory below zero' },
        { status: 400 }
      )
    }

    // Update product inventory and create adjustment in transaction
    const [updatedProduct, adjustment] = await db.transaction(async (tx) => {
      const [updated] = await tx.update(products)
        .set({ 
          inventory: newInventory,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning({
          id: products.id,
          name: products.name,
          inventory: products.inventory
        })

      const [adj] = await tx.insert(inventoryAdjustments)
        .values({
          productId,
          quantity,
          changeType: type,
          reason: reason || null,
          userId: null // In a real app, this would be the user ID
        })
        .returning()

      return [updated, adj]
    })

    return NextResponse.json({
      message: 'Inventory adjusted successfully',
      adjustment: {
        id: adjustment.id,
        productId: adjustment.productId,
        quantity: adjustment.quantity,
        type: adjustment.changeType,
        reason: adjustment.reason,
        createdAt: adjustment.createdAt
      },
      product: updatedProduct
    })
  } catch (error) {
    
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
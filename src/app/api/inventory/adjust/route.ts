import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAdminHandler } from '@/lib/auth-middleware'
import { z } from 'zod'

const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int('Quantity must be an integer'),
  type: z.enum(['MANUAL_ADJUSTMENT', 'RESTOCK', 'OTHER']),
  reason: z.string().min(1, 'Reason is required'),
})

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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, inventory: true }
    })

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

    // Update product inventory
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { inventory: newInventory },
      select: { id: true, name: true, inventory: true }
    })

    // Create inventory adjustment record
    const adjustment = await prisma.inventoryAdjustment.create({
      data: {
        productId,
        quantity,
        type,
        reason,
        previousQuantity: product.inventory,
        newQuantity: newInventory,
        createdBy: 'admin' // In a real app, this would be the user ID
      }
    })

    return NextResponse.json({
      message: 'Inventory adjusted successfully',
      adjustment: {
        id: adjustment.id,
        productId: adjustment.productId,
        quantity: adjustment.quantity,
        type: adjustment.type,
        reason: adjustment.reason,
        previousQuantity: adjustment.previousQuantity,
        newQuantity: adjustment.newQuantity,
        createdAt: adjustment.createdAt
      },
      product: updatedProduct
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

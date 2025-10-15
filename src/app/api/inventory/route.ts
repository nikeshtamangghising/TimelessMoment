import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { inventoryRepository } from '@/lib/inventory-repository'
import { productRepository } from '@/lib/product-repository'
import { orderRepository } from '@/lib/order-repository'
import { bulkInventoryUpdateSchema, inventoryAdjustmentSchema } from '@/lib/validations'
import { prisma } from '@/lib/db'

// GET /api/inventory - Get inventory summary and low stock alerts
export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const lowStockThreshold = parseInt(searchParams.get('threshold') || '10')
    
    const summary = await inventoryRepository.getInventorySummary(lowStockThreshold)
    
    // Calculate total inventory worth
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 1000,
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })
    
    const productsWithPagination = {
      data: products,
      pagination: {
        page: 1,
        limit: 1000,
        total: products.length,
        totalPages: 1
      }
    }
    const totalInventoryWorth = products.reduce((total, product) => {
      return total + (product.price * product.inventory)
    }, 0)
    
    // Get real purchase history data
    const ordersResponse = await orderRepository.findAll(
      { page: 1, limit: 100 },
      { status: 'DELIVERED' }
    )
    
    // Transform orders into purchase history format
    const recentPurchases = ordersResponse.data
      .flatMap(order => {
        return order.items.map(item => ({
          id: `${order.id}-${item.id}`,
          productId: item.productId,
          quantity: item.quantity,
          totalValue: item.price * item.quantity,
          buyerName: order.user?.name || order.guestName || 'Anonymous',
          buyerEmail: order.user?.email || order.guestEmail || 'No email',
          createdAt: order.createdAt.toISOString(),
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.price
          }
        }))
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
    
    // Calculate additional inventory metrics
    const totalProductsValue = products.reduce((total, product) => {
      return total + (product.price * product.inventory)
    }, 0)
    
    const outOfStockCount = summary.outOfStockProducts.length
    const lowStockCount = summary.lowStockProducts.length
    
    // Calculate inventory turnover (simplified)
    const totalPurchasesValue = recentPurchases.reduce((total, purchase) => {
      return total + purchase.totalValue
    }, 0)
    
    const inventoryTurnover = totalProductsValue > 0 ? totalPurchasesValue / totalProductsValue : 0
    
    // Get category-wise inventory distribution
    const categoryDistribution = products.reduce((acc, product) => {
      const category = product.category?.name || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          value: 0,
          items: []
        }
      }
      acc[category].count += 1
      acc[category].value += product.price * product.inventory
      acc[category].items.push({
        id: product.id,
        name: product.name,
        inventory: product.inventory,
        price: product.price,
        value: product.price * product.inventory
      })
      return acc
    }, {} as Record<string, { count: number; value: number; items: any[] }>)
    
    // Get top selling products
    const productSales = recentPurchases.reduce((acc, purchase) => {
      if (!acc[purchase.productId]) {
        acc[purchase.productId] = {
          productId: purchase.productId,
          name: purchase.product.name,
          totalQuantity: 0,
          totalValue: 0,
          purchaseCount: 0
        }
      }
      acc[purchase.productId].totalQuantity += purchase.quantity
      acc[purchase.productId].totalValue += purchase.totalValue
      acc[purchase.productId].purchaseCount += 1
      return acc
    }, {} as Record<string, { productId: string; name: string; totalQuantity: number; totalValue: number; purchaseCount: number }>)
    
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)
    
    const enhancedSummary = {
      ...summary,
      totalInventoryWorth,
      recentPurchases,
      totalProductsValue,
      outOfStockCount,
      lowStockCount,
      inventoryTurnover,
      categoryDistribution,
      topSellingProducts
    }
    
    return NextResponse.json(enhancedSummary)
  } catch (error) {
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

    // Transform validated data to match repository interface
    const updates = validationResult.data.updates.map(update => ({
      productId: update.productId,
      quantity: update.quantity
    }))

    const result = await inventoryRepository.bulkUpdateInventory(
      updates,
      validationResult.data.reason || 'Bulk inventory adjustment'
    )

    return NextResponse.json({
      message: `Successfully updated ${result.updatedCount} products`,
      ...result
    })
  } catch (error) {
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

    // Transform validated data to match repository interface
    const adjustmentData = {
      productId: validationResult.data.productId,
      quantity: validationResult.data.quantity,
      type: validationResult.data.type,
      reason: validationResult.data.reason,
      createdBy: validationResult.data.createdBy
    }

    const result = await inventoryRepository.adjustInventory(adjustmentData)

    return NextResponse.json({
      message: 'Inventory adjusted successfully',
      adjustment: result
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
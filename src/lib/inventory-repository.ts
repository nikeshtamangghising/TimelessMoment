import { PrismaClient, InventoryChangeType } from '@prisma/client'
import { PaginationParams, PaginatedResponse } from '@/types'

const prisma = new PrismaClient()

export type InventoryUpdate = {
  productId: string
  quantity: number
}

export type InventoryAdjustment = {
  productId: string
  quantity: number
  type: InventoryChangeType
  reason: string
  createdBy?: string
}

export type InventoryHistoryFilters = {
  productId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
}

export type InventorySummary = {
  totalProducts: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  totalValue: number
  recentAdjustments: InventoryAdjustmentWithProduct[]
}

export type InventoryAdjustmentWithProduct = {
  id: string
  productId: string
  quantity: number
  type: InventoryChangeType
  reason: string
  createdBy?: string
  createdAt: Date
  product: {
    id: string
    name: string
    slug: string
  }
}

export type Product = {
  id: string
  name: string
  slug: string
  inventory: number
  lowStockThreshold: number
  price: number
  category: string
  isActive: boolean
}

class InventoryRepository {
  async getInventorySummary(lowStockThreshold: number = 10): Promise<InventorySummary> {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      recentAdjustments,
      totalValue
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      
      prisma.product.findMany({
        where: {
          isActive: true,
          inventory: {
            gt: 0,
            lte: lowStockThreshold
          }
        },
        orderBy: { inventory: 'asc' },
        take: 20
      }),
      
      prisma.product.findMany({
        where: {
          isActive: true,
          inventory: { lte: 0 }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      }),
      
      prisma.inventoryAdjustment.findMany({
        include: {
          product: {
            select: { id: true, name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      prisma.product.aggregate({
        where: { isActive: true },
        _sum: {
          inventory: true
        }
      }).then(result => result._sum.inventory || 0)
    ])

    return {
      totalProducts,
      lowStockProducts: lowStockProducts as any,
      outOfStockProducts: outOfStockProducts as any,
      totalValue,
      recentAdjustments: recentAdjustments as InventoryAdjustmentWithProduct[]
    }
  }

  async bulkUpdateInventory(
    updates: InventoryUpdate[], 
    reason: string,
    createdBy?: string
  ): Promise<{ updatedCount: number; errors: string[] }> {
    const errors: string[] = []
    let updatedCount = 0

    // Process updates in transaction
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        try {
          // Verify product exists
          const product = await tx.product.findUnique({
            where: { id: update.productId }
          })

          if (!product) {
            errors.push(`Product ${update.productId} not found`)
            continue
          }

          // Calculate change amount
          const changeAmount = update.quantity - product.inventory

          // Update product inventory
          await tx.product.update({
            where: { id: update.productId },
            data: { inventory: update.quantity }
          })

          // Record the adjustment
          if (changeAmount !== 0) {
            await tx.inventoryAdjustment.create({
              data: {
                productId: update.productId,
                quantity: changeAmount,
                type: 'MANUAL_ADJUSTMENT',
                reason,
                createdBy
              }
            })
          }

          updatedCount++
        } catch (error) {
          console.error(`Error updating product ${update.productId}:`, error)
          errors.push(`Failed to update product ${update.productId}`)
        }
      }
    })

    return { updatedCount, errors }
  }

  async adjustInventory(adjustment: InventoryAdjustment): Promise<InventoryAdjustmentWithProduct> {
    return await prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id: adjustment.productId }
      })

      if (!product) {
        throw new Error(`Product ${adjustment.productId} not found`)
      }

      // Calculate new inventory level
      const newInventory = Math.max(0, product.inventory + adjustment.quantity)

      // Update product inventory
      await tx.product.update({
        where: { id: adjustment.productId },
        data: { inventory: newInventory }
      })

      // Create adjustment record
      const adjustmentRecord = await tx.inventoryAdjustment.create({
        data: adjustment,
        include: {
          product: {
            select: { id: true, name: true, slug: true }
          }
        }
      })

      return adjustmentRecord as InventoryAdjustmentWithProduct
    })
  }

  async getInventoryHistory(
    filters: InventoryHistoryFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryAdjustmentWithProduct>> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (filters.productId) {
      where.productId = filters.productId
    }
    
    if (filters.type) {
      where.type = filters.type
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo)
      }
    }

    const [data, total] = await Promise.all([
      prisma.inventoryAdjustment.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.inventoryAdjustment.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: data as InventoryAdjustmentWithProduct[],
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { inventory: { lte: threshold || 0 } },
          {
            AND: [
              { inventory: { gt: 0 } },
              { inventory: { lte: prisma.product.fields.lowStockThreshold } }
            ]
          }
        ]
      },
      orderBy: { inventory: 'asc' }
    })

    return products as any
  }

  async recordOrderInventoryDeduction(
    orderItems: { productId: string; quantity: number }[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        // Update product inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity
            }
          }
        })

        // Record inventory adjustment
        await tx.inventoryAdjustment.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'ORDER_PLACED',
            reason: 'Inventory deducted for order'
          }
        })
      }
    })
  }

  async recordOrderInventoryReturn(
    orderItems: { productId: string; quantity: number }[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        // Update product inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              increment: item.quantity
            }
          }
        })

        // Record inventory adjustment
        await tx.inventoryAdjustment.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: 'ORDER_RETURNED',
            reason: 'Inventory returned from cancelled/refunded order'
          }
        })
      }
    })
  }
}

export const inventoryRepository = new InventoryRepository()
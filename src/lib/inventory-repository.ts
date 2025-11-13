import { db } from './db'
import { products, inventoryAdjustments } from './db/schema'
import { eq, and, or, gte, lte, sql, desc, asc } from 'drizzle-orm'
import { PaginationParams, PaginatedResponse } from '@/types'

export type InventoryChangeType = 
  | 'MANUAL_ADJUSTMENT'
  | 'RESTOCK'
  | 'DAMAGED'
  | 'ORDER_PLACED'
  | 'ORDER_RETURNED'
  | 'INITIAL'
  | 'OTHER'

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
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.isActive, true))
        .then(r => Number(r[0]?.count || 0)),
      
      db.select()
        .from(products)
        .where(and(
          eq(products.isActive, true),
          sql`${products.inventory} > 0`,
          sql`${products.inventory} <= ${lowStockThreshold}`
        ))
        .orderBy(asc(products.inventory))
        .limit(20),
      
      db.select()
        .from(products)
        .where(and(
          eq(products.isActive, true),
          lte(products.inventory, 0)
        ))
        .orderBy(desc(products.updatedAt))
        .limit(20),
      
      db.query.inventoryAdjustments.findMany({
        with: {
          product: {
            columns: { id: true, name: true, slug: true }
          }
        },
        orderBy: desc(inventoryAdjustments.createdAt),
        limit: 10
      }),
      
      db.select({ total: sql<number>`COALESCE(SUM(${products.inventory}), 0)` })
        .from(products)
        .where(eq(products.isActive, true))
        .then(r => Number(r[0]?.total || 0))
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

    // Process updates sequentially (Drizzle doesn't have nested transactions)
    for (const update of updates) {
      try {
        // Verify product exists
        const productResult = await db.select()
          .from(products)
          .where(eq(products.id, update.productId))
          .limit(1);
        
        const product = productResult[0];

        if (!product) {
          errors.push(`Product ${update.productId} not found`);
          continue;
        }

        // Calculate change amount
        const changeAmount = update.quantity - product.inventory;

        // Update product inventory
        await db.update(products)
          .set({ inventory: update.quantity })
          .where(eq(products.id, update.productId));

        // Record the adjustment
        if (changeAmount !== 0) {
          await db.insert(inventoryAdjustments)
            .values({
              productId: update.productId,
              quantity: changeAmount,
              changeType: 'MANUAL_ADJUSTMENT',
              reason,
              userId: createdBy || null,
            });
        }

        updatedCount++;
      } catch (error) {
        errors.push(`Failed to update product ${update.productId}`);
      }
    }

    return { updatedCount, errors }
  }

  async adjustInventory(adjustment: InventoryAdjustment): Promise<InventoryAdjustmentWithProduct> {
    // Get current product
    const productResult = await db.select()
      .from(products)
      .where(eq(products.id, adjustment.productId))
      .limit(1);
    
    const product = productResult[0];

    if (!product) {
      throw new Error(`Product ${adjustment.productId} not found`);
    }

    // Calculate new inventory level
    const newInventory = Math.max(0, product.inventory + adjustment.quantity);

    // Update product inventory
    await db.update(products)
      .set({ inventory: newInventory })
      .where(eq(products.id, adjustment.productId));

    // Create adjustment record
    const insertResult = await db.insert(inventoryAdjustments)
      .values({
        productId: adjustment.productId,
        quantity: adjustment.quantity,
        changeType: adjustment.type,
        reason: adjustment.reason,
        userId: adjustment.createdBy || null,
      })
      .returning();

    // Fetch with product data
    const adjustmentRecord = await db.query.inventoryAdjustments.findFirst({
      where: eq(inventoryAdjustments.id, insertResult[0].id),
      with: {
        product: {
          columns: { id: true, name: true, slug: true }
        }
      }
    });

    return adjustmentRecord as InventoryAdjustmentWithProduct;
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

    // Build Drizzle where clause
    const conditions: any[] = [];
    
    if (filters.productId) {
      conditions.push(eq(inventoryAdjustments.productId, filters.productId));
    }
    
    if (filters.type) {
      conditions.push(eq(inventoryAdjustments.changeType, filters.type));
    }
    
    if (filters.dateFrom) {
      conditions.push(gte(inventoryAdjustments.createdAt, new Date(filters.dateFrom)));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(inventoryAdjustments.createdAt, new Date(filters.dateTo)));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db.query.inventoryAdjustments.findMany({
        where: whereClause,
        with: {
          product: {
            columns: { id: true, name: true, slug: true }
          }
        },
        orderBy: desc(inventoryAdjustments.createdAt),
        offset,
        limit
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(inventoryAdjustments)
        .where(whereClause)
    ]);
    
    const total = Number(totalResult[0]?.count || 0);

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
    const productsResult = await db.select()
      .from(products)
      .where(and(
        eq(products.isActive, true),
        or(
          lte(products.inventory, threshold || 0),
          and(
            sql`${products.inventory} > 0`,
            sql`${products.inventory} <= ${products.lowStockThreshold}`
          )
        )
      ))
      .orderBy(asc(products.inventory));

    return productsResult as any;
  }

  async recordOrderInventoryDeduction(
    orderItems: { productId: string; quantity: number }[]
  ): Promise<void> {
    for (const item of orderItems) {
      // Update product inventory
      await db.update(products)
        .set({ inventory: sql`${products.inventory} - ${item.quantity}` })
        .where(eq(products.id, item.productId));

      // Record inventory adjustment
      await db.insert(inventoryAdjustments)
        .values({
          productId: item.productId,
          quantity: -item.quantity,
          changeType: 'ORDER_PLACED',
          reason: 'Inventory deducted for order',
        });
    }
  }

  async recordOrderInventoryReturn(
    orderItems: { productId: string; quantity: number }[]
  ): Promise<void> {
    for (const item of orderItems) {
      // Update product inventory
      await db.update(products)
        .set({ inventory: sql`${products.inventory} + ${item.quantity}` })
        .where(eq(products.id, item.productId));

      // Record inventory adjustment
      await db.insert(inventoryAdjustments)
        .values({
          productId: item.productId,
          quantity: item.quantity,
          changeType: 'ORDER_RETURNED',
          reason: 'Inventory returned from cancelled/refunded order',
        });
    }
  }
}

export const inventoryRepository = new InventoryRepository()
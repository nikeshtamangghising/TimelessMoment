import { db } from '@/lib/db'
import { userActivities, cartItems, userFavorites, orderItems, products } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// Recalculate product engagement metrics from source tables
// - viewCount: from user_activities (VIEW)
// - cartCount: from cart_items (sum of quantities per product)
// - favoriteCount: from user_favorites count per product
// - orderCount: from order_items count per product (number of orders that include the product)
// - purchaseCount: from order_items sum(quantity) per product
export async function recalculateAllProductMetrics(): Promise<void> {
  // 1) Aggregate views
  const views = await db.select({
    productId: userActivities.productId,
    count: sql<number>`count(*)`.as('count')
  })
  .from(userActivities)
  .where(eq(userActivities.activityType, 'VIEW'))
  .groupBy(userActivities.productId)

  // 2) Aggregate carts (sum quantities currently in carts)
  const carts = await db.select({
    productId: cartItems.productId,
    sum: sql<number>`sum(${cartItems.quantity})`.as('sum')
  })
  .from(cartItems)
  .groupBy(cartItems.productId)

  // 3) Aggregate favorites
  const favoritesResult = await db.select({
    productId: userFavorites.productId,
    count: sql<number>`count(*)`.as('count')
  })
  .from(userFavorites)
  .groupBy(userFavorites.productId)

  // 4) Aggregate orders (count of orders containing product)
  const orderCounts = await db.select({
    productId: orderItems.productId,
    count: sql<number>`count(*)`.as('count')
  })
  .from(orderItems)
  .groupBy(orderItems.productId)

  // 5) Aggregate purchases (sum of quantities ordered)
  const purchases = await db.select({
    productId: orderItems.productId,
    sum: sql<number>`sum(${orderItems.quantity})`.as('sum')
  })
  .from(orderItems)
  .groupBy(orderItems.productId)

  // Build maps for quick lookup
  const viewMap = Object.fromEntries(views.map(v => [v.productId, v.count]))
  const cartMap = Object.fromEntries(carts.map(c => [c.productId, c.sum || 0]))
  const favoriteMap = Object.fromEntries(favoritesResult.map(f => [f.productId, f.count]))
  const orderMap = Object.fromEntries(orderCounts.map(o => [o.productId, o.count]))
  const purchaseMap = Object.fromEntries(purchases.map(p => [p.productId, p.sum || 0]))

  // Get all product IDs to update
  const productsResult = await db.select({ id: products.id }).from(products)

  // Batch updates
  const updates = productsResult.map(p => {
    const id = p.id
    return db.update(products).set({
      viewCount: viewMap[id] || 0,
      cartCount: cartMap[id] || 0,
      favoriteCount: favoriteMap[id] || 0,
      orderCount: orderMap[id] || 0,
      purchaseCount: purchaseMap[id] || 0,
    }).where(eq(products.id, id))
  })

  // Execute updates in reasonable chunks to avoid overwhelming DB
  const chunkSize = 100
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize)
    // Execute each update individually since Drizzle doesn't have transaction support like Prisma
    for (const update of chunk) {
      await update
    }
  }
}
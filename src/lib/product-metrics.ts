import { prisma } from '@/lib/db'

// Recalculate product engagement metrics from source tables
// - viewCount: from user_activities (VIEW)
// - cartCount: from cart (sum of quantities per product)
// - favoriteCount: from favorites count per product
// - orderCount: from order_items count per product (number of orders that include the product)
// - purchaseCount: from order_items sum(quantity) per product
export async function recalculateAllProductMetrics(): Promise<void> {
  // 1) Aggregate views
  const views = await prisma.userActivity.groupBy({
    by: ['productId'],
    where: { activityType: 'VIEW' },
    _count: { id: true },
  })

  // 2) Aggregate carts (sum quantities currently in carts)
  const carts = await prisma.cart.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  })

  // 3) Aggregate favorites
  const favorites = await prisma.favorite.groupBy({
    by: ['productId'],
    _count: { id: true },
  })

  // 4) Aggregate orders (count of orders containing product)
  const orderCounts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _count: { id: true },
  })

  // 5) Aggregate purchases (sum of quantities ordered)
  const purchases = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  })

  // Build maps for quick lookup
  const viewMap = Object.fromEntries(views.map(v => [v.productId, v._count.id]))
  const cartMap = Object.fromEntries(carts.map(c => [c.productId, c._sum.quantity || 0]))
  const favoriteMap = Object.fromEntries(favorites.map(f => [f.productId, f._count.id]))
  const orderMap = Object.fromEntries(orderCounts.map(o => [o.productId, o._count.id]))
  const purchaseMap = Object.fromEntries(purchases.map(p => [p.productId, p._sum.quantity || 0]))

  // Get all product IDs to update
  const products = await prisma.product.findMany({ select: { id: true } })

  // Batch updates
  const updates = products.map(p => {
    const id = p.id
    return prisma.product.update({
      where: { id },
      data: {
        viewCount: viewMap[id] || 0,
        cartCount: cartMap[id] || 0,
        favoriteCount: favoriteMap[id] || 0,
        orderCount: orderMap[id] || 0,
        purchaseCount: purchaseMap[id] || 0,
      },
    })
  })

  // Execute updates in reasonable chunks to avoid overwhelming DB
  const chunkSize = 100
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize)
    await prisma.$transaction(chunk)
  }
}

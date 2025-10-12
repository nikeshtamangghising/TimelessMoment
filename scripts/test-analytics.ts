import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing Analytics Data...')

  // Test basic analytics queries
  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    topSellingProducts
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { total: true }
    }),
    
    prisma.order.count({
      where: { status: { not: 'CANCELLED' } }
    }),
    
    prisma.user.count({
      where: { role: 'CUSTOMER' }
    }),
    
    prisma.product.count({
      where: { isActive: true }
    }),
    
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })
  ])

  console.log('📊 Analytics Summary:')
  console.log(`💰 Total Revenue: ₹${totalRevenue._sum.total || 0}`)
  console.log(`📦 Total Orders: ${totalOrders}`)
  console.log(`👥 Total Customers: ${totalCustomers}`)
  console.log(`🛍️ Total Products: ${totalProducts}`)
  console.log(`🏆 Top Selling Products: ${topSellingProducts.length} products`)

  // Get product names for top selling products
  if (topSellingProducts.length > 0) {
    const productIds = topSellingProducts.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })

    console.log('\n🏆 Top Selling Products:')
    topSellingProducts.forEach((item, index) => {
      const product = products.find(p => p.id === item.productId)
      console.log(`${index + 1}. ${product?.name || 'Unknown'} - ${item._sum.quantity || 0} sold`)
    })
  }

  console.log('\n✅ Analytics data is ready!')
}

main()
  .catch((e) => {
    console.error('❌ Error testing analytics:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

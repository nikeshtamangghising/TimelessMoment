import { prisma } from './db'

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

export async function getDatabaseInfo() {
  try {
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()
    
    return {
      users: userCount,
      products: productCount,
      orders: orderCount,
    }
  } catch (error) {
    console.error('Error getting database info:', error)
    return null
  }
}
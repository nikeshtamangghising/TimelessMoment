import { prisma } from '../src/lib/db'

async function checkOrderData() {
  console.log('🔍 Checking current order data...')

  try {
    // Get all orders with their tracking and items
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        trackingLogs: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📊 Found ${orders.length} orders in database`)

    for (const order of orders) {
      console.log(`\n--- Order ${order.id} ---`)
      console.log(`Status: ${order.status}`)
      console.log(`Tracking Number: ${order.trackingNumber || 'NULL'}`)
      console.log(`Payment ID: ${order.stripePaymentIntentId || 'NULL'}`)
      console.log(`Shipping Address: ${order.shippingAddress ? JSON.stringify(order.shippingAddress) : 'NULL'}`)
      console.log(`Total: ${order.total}`)
      console.log(`Items: ${order.items.length}`)
      console.log(`Tracking Logs: ${order.trackingLogs.length}`)
      console.log(`Created: ${order.createdAt}`)
    }

    // Check for any orders without tracking numbers that should have them
    const shippedOrdersWithoutTracking = orders.filter(
      order => order.status === 'SHIPPED' && !order.trackingNumber
    )

    if (shippedOrdersWithoutTracking.length > 0) {
      console.log(`\n⚠️  Found ${shippedOrdersWithoutTracking.length} shipped orders without tracking numbers`)
      for (const order of shippedOrdersWithoutTracking) {
        console.log(`Order ${order.id} is SHIPPED but missing tracking number`)
      }
    } else {
      console.log('\n✅ All shipped orders have tracking numbers')
    }

    // Check for any orders without payment IDs that should have them
    const ordersWithoutPaymentId = orders.filter(order => !order.stripePaymentIntentId)
    if (ordersWithoutPaymentId.length > 0) {
      console.log(`\n⚠️  Found ${ordersWithoutPaymentId.length} orders without payment IDs`)
      for (const order of ordersWithoutPaymentId) {
        console.log(`Order ${order.id} missing payment ID`)
      }
    } else {
      console.log('\n✅ All orders have payment IDs')
    }

  } catch (error) {
    console.error('❌ Error checking order data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrderData()

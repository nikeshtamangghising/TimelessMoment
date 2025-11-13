import { db } from '../src/lib/db'
import { orders, orderItems, orderTracking, users, products } from '../src/lib/db/schema'
import { asc, desc, eq } from 'drizzle-orm'

async function checkOrderData() {
  console.log('🔍 Checking current order data...')

  try {
    // Get all orders with their tracking and items
    const ordersData = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    // Get related data
    const orderItemsData = await db.select().from(orderItems);
    const orderTrackingData = await db.select().from(orderTracking);
    const usersData = await db.select().from(users);
    const productsData = await db.select().from(products);
    
    // Combine the data
    const ordersWithRelations = ordersData.map(order => {
      return {
        ...order,
        items: orderItemsData.filter(item => item.orderId === order.id).map(item => ({
          ...item,
          product: productsData.find(p => p.id === item.productId) || null
        })),
        trackingLogs: orderTrackingData.filter(log => log.orderId === order.id),
        user: usersData.find(user => user.id === order.userId) || null
      };
    });

    console.log(`📊 Found ${ordersWithRelations.length} orders in database`)

    for (const order of ordersWithRelations) {
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
    const shippedOrdersWithoutTracking = ordersWithRelations.filter(
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
    const ordersWithoutPaymentId = ordersWithRelations.filter(order => !order.stripePaymentIntentId)
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
  }
}

checkOrderData()
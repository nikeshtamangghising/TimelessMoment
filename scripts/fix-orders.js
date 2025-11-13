import { db } from '../src/lib/db'
import { orders, users } from '../src/lib/db/schema'
import { eq, isNull, or } from 'drizzle-orm'

async function fixExistingOrders() {
  console.log('🔧 Fixing existing orders with missing fields...')

  try {
    // Get all orders that are missing payment IDs or shipping addresses
    const ordersToFix = await db.select().from(orders).where(
      or(
        isNull(orders.stripePaymentIntentId),
        isNull(orders.shippingAddress)
      )
    );

    // Get users data for reference
    const usersData = await db.select().from(users);
    
    // Add user data to orders
    const ordersWithUsers = ordersToFix.map(order => {
      return {
        ...order,
        user: usersData.find(user => user.id === order.userId) || null
      };
    });

    console.log(`📊 Found ${ordersWithUsers.length} orders that need fixing`)

    for (const order of ordersWithUsers) {
      console.log(`\n--- Fixing Order ${order.id} ---`)

      // Generate a fake payment ID based on order ID and creation date
      const fakePaymentId = `demo-payment-${order.id}-${Date.now()}`

      // Create a default shipping address for demo purposes
      const defaultShippingAddress = {
        fullName: order.user?.name || 'Demo Customer',
        email: order.user?.email || 'demo@example.com',
        phone: '+977-1234567890',
        address: 'Demo Address, Kathmandu',
        city: 'Kathmandu',
        postalCode: '44600',
      }

      try {
        await db.update(orders).set({
          stripePaymentIntentId: fakePaymentId,
          shippingAddress: defaultShippingAddress,
          updatedAt: new Date(),
        }).where(eq(orders.id, order.id));

        console.log(`✅ Fixed order ${order.id}`)
        console.log(`   - Payment ID: ${fakePaymentId}`)
        console.log(`   - Shipping Address: ${JSON.stringify(defaultShippingAddress)}`)

      } catch (error) {
        console.error(`❌ Failed to fix order ${order.id}:`, error)
      }
    }

    console.log('\n🎉 Finished fixing existing orders!')

  } catch (error) {
    console.error('❌ Error fixing orders:', error)
  }
}

fixExistingOrders()
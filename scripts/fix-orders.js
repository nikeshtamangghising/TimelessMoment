import { prisma } from '../src/lib/db'

async function fixExistingOrders() {
  console.log('🔧 Fixing existing orders with missing fields...')

  try {
    // Get all orders that are missing payment IDs or shipping addresses
    const ordersToFix = await prisma.order.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: null },
          {
            shippingAddress: {
              equals: null
            }
          }
        ]
      },
      include: {
        user: true,
      },
    })

    console.log(`📊 Found ${ordersToFix.length} orders that need fixing`)

    for (const order of ordersToFix) {
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
        await prisma.order.update({
          where: { id: order.id },
          data: {
            stripePaymentIntentId: fakePaymentId,
            shippingAddress: defaultShippingAddress,
            updatedAt: new Date(),
          },
        })

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
  } finally {
    await prisma.$disconnect()
  }
}

fixExistingOrders()

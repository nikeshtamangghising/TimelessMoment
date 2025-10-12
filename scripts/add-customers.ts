import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding sample customers...')

  // Create sample customer users
  const customers = [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMER' as const,
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMER' as const,
    },
    {
      email: 'mike.johnson@example.com',
      name: 'Mike Johnson',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMER' as const,
    },
    {
      email: 'sarah.wilson@example.com',
      name: 'Sarah Wilson',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMER' as const,
    },
    {
      email: 'david.brown@example.com',
      name: 'David Brown',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMER' as const,
    },
  ]

  for (const customerData of customers) {
    await prisma.user.upsert({
      where: { email: customerData.email },
      update: {},
      create: customerData,
    })
    console.log(`✅ Created customer: ${customerData.name}`)
  }

  // Create some sample orders for these customers
  const products = await prisma.product.findMany({ take: 3 })
  
  if (products.length > 0) {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 3
    })

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const product = products[i % products.length]
      
      // Create 1-3 orders per customer
      const orderCount = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < orderCount; j++) {
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            status: 'DELIVERED',
            total: product.price * (j + 1),
            isGuestOrder: false,
          },
        })

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: j + 1,
            price: product.price,
          },
        })
      }
      
      console.log(`✅ Created ${orderCount} orders for ${user.name}`)
    }
  }

  console.log('🎉 Sample customers and orders created successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error adding customers:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

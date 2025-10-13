import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Production database seeding script
 * This script initializes the production database with essential data only
 * No demo products or test data included
 */
async function main() {
  console.log('🚀 Starting production database seeding...')

  // Create default categories (essential for the e-commerce platform)
  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      image: '/images/categories/electronics.webp',
      isActive: true,
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: '/images/categories/clothing.webp',
      isActive: true,
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      image: '/images/categories/home-garden.webp',
      isActive: true,
    },
    {
      name: 'Books',
      slug: 'books',
      description: 'Books and educational materials',
      image: '/images/categories/books.webp',
      isActive: true,
    },
  ]

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    })
  }

  console.log('✅ Default categories created')

  // Create default brands (optional)
  const brands = [
    {
      name: 'Generic',
      slug: 'generic',
      description: 'Generic brand for unbranded products',
      isActive: true,
    },
  ]

  for (const brandData of brands) {
    await prisma.brand.upsert({
      where: { slug: brandData.slug },
      update: {},
      create: brandData,
    })
  }

  console.log('✅ Default brands created')

  // Create ADMIN user ONLY if ADMIN_EMAIL is provided in environment
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || 'System Administrator'

  if (adminEmail && adminPassword) {
    if (adminPassword.length < 8) {
      throw new Error('Admin password must be at least 8 characters long')
    }

    const hashedPassword = await bcryptjs.hash(adminPassword, 12)
    
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: adminName,
        role: 'ADMIN',
        password: hashedPassword,
      },
    })

    console.log(`✅ Admin user created: ${admin.email}`)
  } else {
    console.log('⚠️  No admin user created. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to create admin user.')
  }

  // Initialize default system settings
  const defaultSettings = [
    {
      key: 'site_name',
      value: 'E-commerce Platform',
      type: 'TEXT',
      isPublic: true,
      description: 'The name of the website',
    },
    {
      key: 'site_description',
      value: 'A modern e-commerce platform',
      type: 'TEXT',
      isPublic: true,
      description: 'Site description for SEO',
    },
    {
      key: 'default_currency',
      value: 'NPR',
      type: 'TEXT',
      isPublic: true,
      description: 'Default currency code',
    },
    {
      key: 'free_shipping_threshold',
      value: '5000',
      type: 'NUMBER',
      isPublic: true,
      description: 'Minimum order amount for free shipping',
    },
    {
      key: 'max_cart_items',
      value: '50',
      type: 'NUMBER',
      isPublic: false,
      description: 'Maximum items allowed in cart',
    },
    {
      key: 'enable_reviews',
      value: 'true',
      type: 'BOOLEAN',
      isPublic: true,
      description: 'Enable product reviews',
    },
    {
      key: 'enable_wishlists',
      value: 'true',
      type: 'BOOLEAN',
      isPublic: true,
      description: 'Enable user wishlists/favorites',
    },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Default settings initialized')

  // Create system status entries for monitoring
  await prisma.systemStatus.upsert({
    where: { service: 'DATABASE' },
    update: { status: 'HEALTHY', lastChecked: new Date() },
    create: {
      service: 'DATABASE',
      status: 'HEALTHY',
      lastChecked: new Date(),
      metadata: { version: 'PostgreSQL', initialized: true },
    },
  })

  await prisma.systemStatus.upsert({
    where: { service: 'EMAIL' },
    update: { status: 'PENDING', lastChecked: new Date() },
    create: {
      service: 'EMAIL',
      status: 'PENDING',
      lastChecked: new Date(),
      metadata: { provider: 'Resend', configured: !!process.env.RESEND_API_KEY },
    },
  })

  console.log('✅ System status initialized')

  console.log('🎉 Production database seeding completed successfully!')
  console.log('📝 Next steps:')
  console.log('   1. Add your products through the admin panel')
  console.log('   2. Configure payment gateways')
  console.log('   3. Set up email templates')
  console.log('   4. Test the complete user flow')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding production database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
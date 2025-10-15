import { PrismaClient } from '@prisma/client'
import { initializeDefaultSettings } from '../src/lib/site-settings'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create categories first
  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest gadgets and electronic devices',
      isActive: true,
    },
  })

  const clothingCategory = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel for all occasions',
      isActive: true,
    },
  })

  const homeCategory = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Everything for your home and garden',
      isActive: true,
    },
  })

  const booksCategory = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books',
      slug: 'books',
      description: 'Books for all ages and interests',
      isActive: true,
    },
  })

  console.log('✅ Categories created')

  // Create sample products with NPR pricing
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
      shortDescription: 'Premium wireless headphones with noise cancellation',
      price: 26599, // ~$200 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      inventory: 50,
      categoryId: electronicsCategory.id,
      isActive: true,
      isFeatured: true,
      isNewArrival: true,
      tags: ['electronics', 'audio', 'wireless', 'bluetooth'],
    },
    {
      name: 'Smart Fitness Watch',
      slug: 'smart-fitness-watch',
      description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and water resistance. Track your workouts and health metrics.',
      shortDescription: 'Advanced fitness tracking watch with GPS',
      price: 39899, // ~$300 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      inventory: 30,
      categoryId: electronicsCategory.id,
      isActive: true,
      isFeatured: true,
      isNewArrival: false,
      tags: ['electronics', 'fitness', 'smartwatch', 'health'],
    },
    {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      description: 'Comfortable and stylish cotton t-shirt made from 100% organic cotton. Available in multiple colors and sizes.',
      shortDescription: 'Comfortable organic cotton t-shirt',
      price: 3999, // ~$30 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
      inventory: 100,
      categoryId: clothingCategory.id,
      isActive: true,
      isFeatured: false,
      isNewArrival: true,
      tags: ['clothing', 'cotton', 'casual', 'organic'],
    },
    {
      name: 'Designer Jeans',
      slug: 'designer-jeans',
      description: 'Classic fit designer jeans with premium denim. Perfect for casual and semi-formal occasions.',
      shortDescription: 'Classic fit designer jeans',
      price: 11999, // ~$90 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
      inventory: 75,
      categoryId: clothingCategory.id,
      isActive: true,
      isFeatured: true,
      isNewArrival: false,
      tags: ['clothing', 'jeans', 'denim', 'casual'],
    },
    {
      name: 'Smart Home Speaker',
      slug: 'smart-home-speaker',
      description: 'Voice-controlled smart speaker with built-in AI assistant. Control your smart home devices and stream music.',
      shortDescription: 'Voice-controlled smart speaker with AI',
      price: 19999, // ~$150 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=500'],
      inventory: 40,
      categoryId: homeCategory.id,
      isActive: true,
      isFeatured: true,
      isNewArrival: true,
      tags: ['smart home', 'speaker', 'AI', 'voice control'],
    },
    {
      name: 'Indoor Plant Set',
      slug: 'indoor-plant-set',
      description: 'Beautiful collection of low-maintenance indoor plants perfect for beginners. Includes care instructions.',
      shortDescription: 'Low-maintenance indoor plant collection',
      price: 6699, // ~$50 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500'],
      inventory: 60,
      categoryId: homeCategory.id,
      isActive: true,
      isFeatured: false,
      isNewArrival: false,
      tags: ['plants', 'indoor', 'gardening', 'decor'],
    },
    {
      name: 'Programming Fundamentals Book',
      slug: 'programming-fundamentals-book',
      description: 'Comprehensive guide to programming fundamentals covering multiple languages and best practices.',
      shortDescription: 'Complete guide to programming fundamentals',
      price: 5329, // ~$40 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500'],
      inventory: 80,
      categoryId: booksCategory.id,
      isActive: true,
      isFeatured: false,
      isNewArrival: true,
      tags: ['programming', 'education', 'technology', 'coding'],
    },
    {
      name: 'Cookbook: Healthy Recipes',
      slug: 'cookbook-healthy-recipes',
      description: 'Collection of delicious and nutritious recipes for healthy living. Perfect for home cooks.',
      shortDescription: 'Delicious healthy recipes collection',
      price: 3329, // ~$25 USD
      currency: 'NPR',
      images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
      inventory: 90,
      categoryId: booksCategory.id,
      isActive: true,
      isFeatured: true,
      isNewArrival: false,
      tags: ['cooking', 'healthy', 'recipes', 'lifestyle'],
    },
  ]

  for (const productData of products) {
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    })
  }

  console.log('✅ Products created')

  // Create a sample admin user with password
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: hashedPassword,
    },
  })

  console.log('✅ Admin user created')

  // Initialize default settings
  await initializeDefaultSettings()
  console.log('✅ Default settings initialized')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

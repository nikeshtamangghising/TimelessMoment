import { db } from '../src/lib/db';
import { categories, products, users } from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting production database seeding...');

  try {
    // Create essential categories
    const essentialCategories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
      { name: 'Books', slug: 'books', description: 'Books and educational materials' },
    ];

    for (const categoryData of essentialCategories) {
      await db.insert(categories).values({
        ...categoryData,
        isActive: true,
      }).onConflictDoUpdate({
        target: categories.slug,
        set: categoryData,
      });
    }

    console.log('✅ Essential categories created');

    // Create a default admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    await db.insert(users).values({
      email: 'admin@yourstore.com',
      name: 'Store Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        name: 'Store Administrator',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });

    console.log('✅ Default admin user created');
    console.log('⚠️  IMPORTANT: Change the default admin password after first login!');
    
    console.log('🎉 Production database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    process.exit(1);
  }
}

main();
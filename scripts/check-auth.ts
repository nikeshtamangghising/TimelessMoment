import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔍 Checking authentication setup...');

  try {
    // Check if we can connect to the database
    const userCount = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful');

    // Check if admin user exists
    const adminUser = await db.select().from(users).where(eq(users.role, 'ADMIN')).limit(1);
    
    if (adminUser.length > 0) {
      console.log('✅ Admin user found:', adminUser[0].email);
    } else {
      console.log('⚠️  No admin user found. Run seed script to create one.');
    }

    // Check if regular users exist
    const regularUsers = await db.select().from(users).where(eq(users.role, 'CUSTOMER')).limit(5);
    
    if (regularUsers.length > 0) {
      console.log(`✅ Found ${regularUsers.length} regular users`);
      regularUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.name})`);
      });
    } else {
      console.log('⚠️  No regular users found. Run seed script to create some.');
    }

    console.log('🎉 Authentication check completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

main();
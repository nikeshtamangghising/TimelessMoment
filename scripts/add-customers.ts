import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';

const customers = [
  { name: 'John Doe', email: 'john@example.com', password: 'password123' },
  { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' },
  { name: 'Bob Johnson', email: 'bob@example.com', password: 'password123' },
];

async function main() {
  console.log('🌱 Adding customers...');

  for (const customer of customers) {
    const hashedPassword = await bcrypt.hash(customer.password, 12);
    
    await db.insert(users).values({
      name: customer.name,
      email: customer.email,
      password: hashedPassword,
      role: 'CUSTOMER',
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        name: customer.name,
        password: hashedPassword,
        role: 'CUSTOMER',
      }
    });
  }

  console.log('✅ Customers added successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error adding customers:', e);
    process.exit(1);
  });
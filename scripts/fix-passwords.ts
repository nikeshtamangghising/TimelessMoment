import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔧 Fixing user passwords...');

  try {
    // Get all users
    const allUsers = await db.select().from(users);
    
    console.log(`Found ${allUsers.length} users to process`);
    
    let fixedCount = 0;
    
    for (const user of allUsers) {
      // Check if password needs to be hashed (simple check for plain text)
      if (user.password && !user.password.startsWith('$2b$')) {
        console.log(`Hashing password for ${user.email}`);
        
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
          
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed passwords for ${fixedCount} users`);
    console.log('🎉 Password fixing completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    process.exit(1);
  }
}

main();
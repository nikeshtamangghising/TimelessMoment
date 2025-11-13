import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkColumns() {
  console.log('Checking actual column names in the database...');
  
  try {
    // Check user_interests table columns
    const userInterestsColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_interests'
      ORDER BY ordinal_position;
    `);
    
    console.log('user_interests table columns:');
    console.log(userInterestsColumns);
    
    // Check user_activities table columns
    const userActivitiesColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_activities'
      ORDER BY ordinal_position;
    `);
    
    console.log('user_activities table columns:');
    console.log(userActivitiesColumns);
    
  } catch (error) {
    console.error('Error checking columns:', error);
  }
}

checkColumns();
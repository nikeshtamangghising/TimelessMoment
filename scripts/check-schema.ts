import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  console.log('Checking database schema...');
  
  try {
    // Check if categories table exists and its columns
    const categoriesResult = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `);
    
    console.log('Categories table columns:');
    console.log(categoriesResult);
    
    // Check if other key tables exist
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:');
    console.log(tablesResult);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
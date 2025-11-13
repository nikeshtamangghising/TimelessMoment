import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';
import { sql } from 'drizzle-orm';

// Create a postgres client with Neon database
const client = postgres(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XZ7AaIPuJz9F@ep-steep-forest-a143un19-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', {
  ssl: 'require', // Enable SSL for Neon database
  connection: {
    channel_binding: 'require'
  }
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Production-ready connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await client.end();
});

// Export schema for convenience
export { schema };
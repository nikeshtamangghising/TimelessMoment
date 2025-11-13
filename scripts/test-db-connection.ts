import { checkDatabaseConnection } from '../src/lib/db';

async function testConnection() {
  console.log('Testing database connection...');
  
  const isConnected = await checkDatabaseConnection();
  
  if (isConnected) {
    console.log('✅ Database connection successful!');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed!');
    console.log('Please make sure PostgreSQL is running on localhost:5432');
    console.log('You can start it with: npm run db:start (if you have a local PostgreSQL installation)');
    process.exit(1);
  }
}

testConnection();
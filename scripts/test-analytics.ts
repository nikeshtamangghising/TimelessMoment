import { db } from '../src/lib/db';
import { products, users, orders, orderItems } from '../src/lib/db/schema';
import { eq, desc, count, sum, avg } from 'drizzle-orm';

async function main() {
  console.log('📊 Testing analytics queries...');

  try {
    // Test product analytics
    const productCount = await db.select({ count: count() }).from(products);
    console.log(`✅ Total products: ${productCount[0].count}`);

    // Test user analytics
    const userCount = await db.select({ count: count() }).from(users);
    console.log(`✅ Total users: ${userCount[0].count}`);

    // Test order analytics
    const orderCount = await db.select({ count: count() }).from(orders);
    console.log(`✅ Total orders: ${orderCount[0].count}`);

    // Test revenue analytics
    const totalRevenue = await db.select({ 
      total: sum(orders.total) 
    }).from(orders);
    
    console.log(`✅ Total revenue: ${totalRevenue[0].total || 0}`);

    // Test popular products
    const popularProducts = await db.select({
      name: products.name,
      orderCount: count(orderItems.id)
    })
    .from(products)
    .leftJoin(orderItems, eq(products.id, orderItems.productId))
    .groupBy(products.id, products.name)
    .orderBy(desc(count(orderItems.id)))
    .limit(5);

    console.log('📈 Top 5 popular products:');
    popularProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (${product.orderCount} orders)`);
    });

    // Test average order value
    const avgOrderValue = await db.select({ 
      avg: avg(orders.total) 
    }).from(orders);
    
    console.log(`💰 Average order value: ${avgOrderValue[0].avg || 0}`);

    console.log('🎉 Analytics test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
    process.exit(1);
  }
}

main();
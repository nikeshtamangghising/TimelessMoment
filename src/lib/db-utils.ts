import { db } from './db';
import { 
  CreateProductInput, 
  UpdateProductInput, 
  CreateOrderInput, 
  PaginationInput, 
  ProductFiltersInput 
} from './validations';
import type { 
  Product, 
  Order, 
  OrderWithItems, 
  PaginatedResponse 
} from '@/types';
import { 
  products, 
  orders, 
  orderItems, 
  users 
} from './db/schema';
import { 
  eq, 
  and, 
  gte, 
  lte, 
  like, 
  count, 
  desc,
  sql,
  or
} from 'drizzle-orm';

// Export db for use in other modules
export { db };

// Product operations
export async function createProduct(data: CreateProductInput): Promise<any> {
  const [result] = await db.insert(products).values(data).returning();
  return result;
}

export async function getProductById(id: string): Promise<any | null> {
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function getProductBySlug(slug: string): Promise<any | null> {
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getProducts(
  filters: ProductFiltersInput = {},
  pagination: PaginationInput = { page: 1, limit: 10 }
): Promise<PaginatedResponse<any>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  
  if (filters.category) {
    conditions.push(eq(products.categoryId, filters.category));
  }
  
  if (filters.search) {
    conditions.push(
      or(
        like(products.name, `%${filters.search}%`),
        like(products.description, `%${filters.search}%`)
      )
    );
  }
  
  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice.toString()));
  }
  
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice.toString()));
  }
  
  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }

  // Execute queries
  const [productsResult, countResult] = await Promise.all([
    db.select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() })
      .from(products)
      .where(and(...conditions))
  ]);

  const total = countResult[0].count;

  return {
    data: productsResult,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateProduct(id: string, data: UpdateProductInput): Promise<any> {
  const [result] = await db.update(products).set(data).where(eq(products.id, id)).returning();
  return result;
}

export async function deleteProduct(id: string): Promise<any> {
  const [result] = await db.delete(products).where(eq(products.id, id)).returning();
  return result;
}

// Order operations
export async function createOrder(data: CreateOrderInput): Promise<any> {
  // First create the order
  const [order] = await db.insert(orders).values({
    userId: data.userId,
    total: data.total,
    stripePaymentIntentId: data.stripePaymentIntentId,
    // Add other fields as needed
  }).returning();
  
  // Then create order items
  if (data.items && data.items.length > 0) {
    const orderItemsData = data.items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
    
    await db.insert(orderItems).values(orderItemsData);
  }
  
  // Fetch the complete order with items
  const result = await db.query.orders.findFirst({
    where: eq(orders.id, order.id),
    with: {
      items: {
        with: {
          product: true,
        },
      },
      user: true,
    },
  });
  
  return result;
}

export async function getOrderById(id: string): Promise<any | null> {
  const result = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: {
        with: {
          product: true,
        },
      },
      user: true,
    },
  });
  
  return result || null;
}

export async function getOrdersByUserId(
  userId: string,
  pagination: PaginationInput = { page: 1, limit: 10 }
): Promise<PaginatedResponse<any>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  // Execute queries
  const [ordersResult, countResult] = await Promise.all([
    db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: desc(orders.createdAt),
      limit,
      offset,
    }),
    db.select({ count: count() })
      .from(orders)
      .where(eq(orders.userId, userId))
  ]);

  const total = countResult[0].count;

  return {
    data: ordersResult,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAllOrders(
  pagination: PaginationInput = { page: 1, limit: 10 }
): Promise<PaginatedResponse<any>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  // Execute queries
  const [ordersResult, countResult] = await Promise.all([
    db.query.orders.findMany({
      with: {
        items: {
          with: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: desc(orders.createdAt),
      limit,
      offset,
    }),
    db.select({ count: count() }).from(orders)
  ]);

  const total = countResult[0].count;

  return {
    data: ordersResult,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateOrderStatus(id: string, status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'): Promise<any> {
  const [result] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
  return result;
}

// User operations
export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

// Inventory operations
export async function updateProductInventory(productId: string, quantity: number): Promise<any> {
  const [result] = await db.update(products)
    .set({ 
      inventory: sql`${products.inventory} - ${quantity}`
    })
    .where(eq(products.id, productId))
    .returning();
  return result;
}

export async function checkProductAvailability(productId: string, quantity: number): Promise<boolean> {
  const result = await db.select({ 
    inventory: products.inventory, 
    isActive: products.isActive 
  })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  const product = result[0];
  return product ? product.isActive && product.inventory >= quantity : false;
}
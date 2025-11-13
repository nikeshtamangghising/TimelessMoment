import { db } from './index';
import { users, products, orders, categories } from './schema';
import { eq, desc, and, gte, lte, like, count, sql, or } from 'drizzle-orm';

// User queries
export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

// Product queries
export async function getProductById(id: string) {
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function getProductBySlug(slug: string) {
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getProducts(filters: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    isActive,
    limit = 10,
    offset = 0
  } = filters;

  // Build conditions
  const conditions = [];
  
  if (category) {
    conditions.push(eq(products.categoryId, category));
  }
  
  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.description, `%${search}%`)
      )
    );
  }
  
  if (minPrice !== undefined) {
    conditions.push(gte(products.price, minPrice.toString()));
  }
  
  if (maxPrice !== undefined) {
    conditions.push(lte(products.price, maxPrice.toString()));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(products.isActive, isActive));
  }

  // Execute query
  const result = await db.select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getProductsCount(filters: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
} = {}) {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    isActive
  } = filters;

  // Build conditions
  const conditions = [];
  
  if (category) {
    conditions.push(eq(products.categoryId, category));
  }
  
  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.description, `%${search}%`)
      )
    );
  }
  
  if (minPrice !== undefined) {
    conditions.push(gte(products.price, minPrice.toString()));
  }
  
  if (maxPrice !== undefined) {
    conditions.push(lte(products.price, maxPrice.toString()));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(products.isActive, isActive));
  }

  // Execute count query
  const result = await db.select({ count: count() })
    .from(products)
    .where(and(...conditions));

  return result[0].count;
}

// Order queries
export async function getOrderById(id: string) {
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function getOrdersByUserId(userId: string) {
  const result = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return result;
}

// Category queries
export async function getCategories() {
  const result = await db.select().from(categories).orderBy(categories.sortOrder);
  return result;
}

export async function getCategoryById(id: string) {
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] || null;
}

export async function getCategoryBySlug(slug: string) {
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0] || null;
}
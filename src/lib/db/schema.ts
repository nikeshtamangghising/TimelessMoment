import { pgTable, text, integer, boolean, timestamp, decimal, json, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Enums
export const Role = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const EmailStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
} as const;

export const InventoryChangeType = {
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  RESTOCK: 'RESTOCK',
  DAMAGED: 'DAMAGED',
  ORDER_PLACED: 'ORDER_PLACED',
  ORDER_RETURNED: 'ORDER_RETURNED',
  INITIAL: 'INITIAL',
  OTHER: 'OTHER',
} as const;

export const SettingType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
} as const;

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;

export const ActivityType = {
  VIEW: 'VIEW',
  CART_ADD: 'CART_ADD',
  FAVORITE: 'FAVORITE',
  ORDER: 'ORDER',
} as const;

export const AddressType = {
  SHIPPING: 'SHIPPING',
  BILLING: 'BILLING',
} as const;

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password'),
  role: text('role').notNull().default(Role.CUSTOMER),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  resetToken: text('resetToken'),
  resetTokenExpiry: timestamp('resetTokenExpiry'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Accounts table
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refreshToken'),
  accessToken: text('accessToken'),
  expiresAt: integer('expiresAt'),
  tokenType: text('tokenType'),
  scope: text('scope'),
  idToken: text('idToken'),
  sessionState: text('sessionState'),
}, (table) => {
  return {
    providerAccountIdIdx: uniqueIndex('providerAccountIdIdx').on(table.provider, table.providerAccountId),
  };
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

// Verification tokens table
export const verificationTokens = pgTable('verificationtokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => {
  return {
    identifierTokenIdx: uniqueIndex('identifierTokenIdx').on(table.identifier, table.token),
  };
});

// Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: text('parentId').references(() => categories.id),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  image: text('image'),
  isActive: boolean('isActive').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Brands table
export const brands = pgTable('brands', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  website: text('website'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  shortDescription: text('shortDescription'),
  price: decimal('price').notNull(),
  purchasePrice: decimal('purchasePrice'),
  discountPrice: decimal('discountPrice'),
  currency: text('currency').notNull().default('NPR'),
  images: text('images').array(),
  inventory: integer('inventory').notNull(),
  lowStockThreshold: integer('lowStockThreshold').notNull().default(5),
  sku: text('sku').unique(),
  weight: decimal('weight'),
  dimensions: json('dimensions'),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  tags: text('tags').array().default([]),
  viewCount: integer('viewCount').notNull().default(0),
  orderCount: integer('orderCount').notNull().default(0),
  favoriteCount: integer('favoriteCount').notNull().default(0),
  cartCount: integer('cartCount').notNull().default(0),
  popularityScore: decimal('popularityScore').notNull().default('0'),
  lastScoreUpdate: timestamp('lastScoreUpdate').defaultNow(),
  purchaseCount: integer('purchaseCount').notNull().default(0),
  ratingAvg: decimal('ratingAvg').default('0'),
  ratingCount: integer('ratingCount').notNull().default(0),
  categoryId: text('categoryId').notNull().references(() => categories.id),
  brandId: text('brandId').references(() => brands.id),
  isActive: boolean('isActive').notNull().default(true),
  isFeatured: boolean('isFeatured').notNull().default(false),
  isNewArrival: boolean('isNewArrival').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').references(() => users.id),
  guestEmail: text('guestEmail'),
  guestName: text('guestName'),
  status: text('status').notNull().default(OrderStatus.PENDING),
  trackingNumber: text('trackingNumber').unique(),
  total: decimal('total').notNull(),
  stripePaymentIntentId: text('stripePaymentIntentId'),
  shippingAddress: json('shippingAddress'),
  isGuestOrder: boolean('isGuestOrder').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: text('orderId').notNull().references(() => orders.id),
  productId: text('productId').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: text('productId').notNull().references(() => products.id),
  userId: text('userId').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  isVerifiedPurchase: boolean('isVerifiedPurchase').notNull().default(false),
  isApproved: boolean('isApproved').notNull().default(false),
  helpfulCount: integer('helpfulCount').notNull().default(0),
  notHelpfulCount: integer('notHelpfulCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Blog posts table
export const blogPosts = pgTable('blog_posts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featuredImage: text('featuredImage'),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  tags: text('tags').array().default([]),
  isPublished: boolean('isPublished').notNull().default(false),
  authorId: text('authorId').notNull().references(() => users.id),
  categoryId: text('categoryId').references(() => categories.id),
  viewCount: integer('viewCount').notNull().default(0),
  likeCount: integer('likeCount').notNull().default(0),
  commentCount: integer('commentCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  publishedAt: timestamp('publishedAt'),
});

// Inventory adjustments table
export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: text('productId').notNull().references(() => products.id),
  changeType: text('changeType').notNull(), // Using text instead of enum for flexibility
  quantity: integer('quantity').notNull(),
  reason: text('reason'),
  referenceId: text('referenceId'),
  userId: text('userId').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  notes: text('notes'),
});

// Product attributes table
export const productAttributes = pgTable('product_attributes', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: text('productId').notNull().references(() => products.id),
  name: text('name').notNull(),
  value: text('value').notNull(),
  displayType: text('displayType'),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Site settings table
export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  type: text('type').notNull(), // STRING, NUMBER, BOOLEAN, JSON
  category: text('category'),
  description: text('description'),
  isPublic: boolean('isPublic').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Email logs table
export const emailLogs = pgTable('email_logs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  template: text('template'),
  messageId: text('messageId'),
  status: text('status').notNull().default(EmailStatus.PENDING),
  error: text('error'),
  sentAt: timestamp('sentAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// User activities table (for tracking user behavior for recommendations)
export const userActivities = pgTable('user_activities', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').references(() => users.id),
  sessionId: text('sessionId'),
  productId: text('productId').references(() => products.id),
  activityType: text('activityType').notNull(), // VIEW, CART_ADD, FAVORITE, ORDER
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// User interests table (aggregated interest per category for personalization)
export const userInterests = pgTable('user_interests', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('categoryId').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  interestScore: decimal('interestScore').notNull().default('0'),
  interactionCount: integer('interactionCount').notNull().default(0),
  lastInteraction: timestamp('lastInteraction').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserCategoryInterest: uniqueIndex('uniqueUserCategoryInterestIdx').on(table.userId, table.categoryId),
  };
});

// User favorites table
export const userFavorites = pgTable('user_favorites', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('productId').notNull().references(() => products.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserProductFavorite: uniqueIndex('uniqueUserProductFavoriteIdx').on(table.userId, table.productId),
  };
});

// Cart items table (for persistent cart)
export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('sessionId'),
  productId: text('productId').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Discounts table
export const discounts = pgTable('discounts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  discountType: text('discountType').notNull(), // PERCENTAGE, FIXED_AMOUNT
  discountValue: decimal('discountValue').notNull(),
  minimumOrderValue: decimal('minimumOrderValue'),
  maximumDiscountAmount: decimal('maximumDiscountAmount'),
  usageLimit: integer('usageLimit'),
  usedCount: integer('usedCount').notNull().default(0),
  validFrom: timestamp('validFrom').notNull(),
  validTo: timestamp('validTo').notNull(),
  isActive: boolean('isActive').notNull().default(true),
  applicableProductIds: text('applicableProductIds').array().default([]),
  applicableCategoryIds: text('applicableCategoryIds').array().default([]),
  userId: text('userId').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Discount usage table
export const discountUsage = pgTable('discount_usage', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  discountId: text('discountId').notNull().references(() => discounts.id),
  userId: text('userId').references(() => users.id),
  orderId: text('orderId').references(() => orders.id),
  usedAt: timestamp('usedAt').notNull().defaultNow(),
});

// Addresses table
export const addresses = pgTable('addresses', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default(AddressType.SHIPPING), // SHIPPING, BILLING
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  company: text('company'),
  addressLine1: text('addressLine1').notNull(),
  addressLine2: text('addressLine2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postalCode').notNull(),
  country: text('country').notNull(),
  phone: text('phone'),
  isDefault: boolean('isDefault').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Product relations table (for related products)
export const productRelationsTable = pgTable('product_relations', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: text('productId').notNull().references(() => products.id),
  relatedProductId: text('relatedProductId').notNull().references(() => products.id),
  relationType: text('relationType').notNull().default('RELATED'),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => {
  return {
    uniqueProductRelation: uniqueIndex('uniqueProductRelationIdx').on(table.productId, table.relatedProductId),
  };
});

// Product relations
export const productRelationsRelations = relations(products, ({ many }) => ({
  relatedProducts: many(productRelationsTable, {
    relationName: 'relatedProducts'
  }),
  attributes: many(productAttributes),
  inventoryAdjustments: many(inventoryAdjustments),
  reviews: many(reviews),
}));

export const productRelationsTableRelations = relations(productRelationsTable, ({ one }) => ({
  product: one(products, {
    fields: [productRelationsTable.productId],
    references: [products.id],
    relationName: 'relatedProducts'
  }),
  relatedProduct: one(products, {
    fields: [productRelationsTable.relatedProductId],
    references: [products.id],
    relationName: 'relatedProduct'
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  orders: many(orders),
  reviews: many(reviews),
  favorites: many(userFavorites),
  interests: many(userInterests),
  cartItems: many(cartItems),
  inventoryAdjustments: many(inventoryAdjustments),
  addresses: many(addresses),
  blogPosts: many(blogPosts),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id]
  }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  }),
}));

export const categoryRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  childCategories: many(categories, {
    relationName: 'childCategories'
  }),
  parentCategory: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'childCategories'
  }),
  blogPosts: many(blogPosts),
  interests: many(userInterests),
}));

export const brandRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id]
  }),
  orderItems: many(orderItems),
  reviews: many(reviews),
  relatedProducts: many(productRelationsTable, {
    relationName: 'relatedProducts'
  }),
  attributes: many(productAttributes),
  inventoryAdjustments: many(inventoryAdjustments),
  favorites: many(userFavorites),
  cartItems: many(cartItems),
  activityRecords: many(userActivities),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  items: many(orderItems),
  discountUsage: many(discountUsage),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id]
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  }),
}));

export const blogPostRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [blogPosts.categoryId],
    references: [categories.id]
  }),
}));

export const inventoryAdjustmentRelations = relations(inventoryAdjustments, ({ one }) => ({
  product: one(products, {
    fields: [inventoryAdjustments.productId],
    references: [products.id]
  }),
  user: one(users, {
    fields: [inventoryAdjustments.userId],
    references: [users.id]
  }),
}));

export const productAttributeRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, {
    fields: [productAttributes.productId],
    references: [products.id]
  }),
}));

export const userActivityRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [userActivities.productId],
    references: [products.id]
  }),
}));

export const userFavoriteRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [userFavorites.productId],
    references: [products.id]
  }),
}));

export const userInterestRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [userInterests.categoryId],
    references: [categories.id]
  }),
}));

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  }),
}));

export const discountRelations = relations(discounts, ({ many }) => ({
  usageRecords: many(discountUsage),
}));

export const discountUsageRelations = relations(discountUsage, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountUsage.discountId],
    references: [discounts.id]
  }),
  user: one(users, {
    fields: [discountUsage.userId],
    references: [users.id]
  }),
  order: one(orders, {
    fields: [discountUsage.orderId],
    references: [orders.id]
  }),
}));

export const addressRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id]
  }),
}));

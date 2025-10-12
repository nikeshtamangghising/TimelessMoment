import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['CUSTOMER', 'ADMIN']).default('CUSTOMER'),
})

export const registerUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateUserSchema = createUserSchema.partial()

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Product description is required'),
  shortDescription: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  purchasePrice: z.number().positive('Purchase price must be positive').optional().nullable(),
  discountPrice: z.number().positive('Discount price must be positive').optional().nullable(),
  currency: z.string().min(3, 'Currency code is required').max(3).default('NPR'),
  images: z.array(
    z.string()
      .min(1, 'Image path cannot be empty')
      .refine(
        (val) => val.startsWith('http') || val.startsWith('/'), 
        'Image must be a valid URL or uploaded file path'
      )
  ).min(1, 'At least one product image is required'),
  inventory: z.number().int().min(0, 'Inventory cannot be negative'),
  lowStockThreshold: z.number().int().min(0, 'Low stock threshold cannot be negative').default(5),
  categoryId: z.string().cuid('Invalid category ID'),
  brandId: z.string().cuid('Invalid brand ID').optional().nullable(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  sku: z.string().optional().nullable(),
  weight: z.number().positive('Weight must be positive').optional().nullable(),
  dimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional().nullable(),
  metaTitle: z.string().max(60, 'Meta title must be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
})

export const updateProductSchema = createProductSchema.partial()

// Order validation schemas
export const createOrderItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
})

export const createOrderSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  items: z.array(createOrderItemSchema).min(1, 'Order must have at least one item'),
  total: z.number().positive('Total must be positive'),
  stripePaymentIntentId: z.string().optional(),
  shippingAddress: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }).optional(),
})

export const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
})

export const updateShippingAddressSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
})

// Query validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sort: z.enum(['newest', 'price-low', 'price-high', 'rating', 'popular']).optional(),
  lowStock: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
})

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
})

// Inventory validation schemas
export const inventoryUpdateSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
})

export const bulkInventoryUpdateSchema = z.object({
  updates: z.array(inventoryUpdateSchema).min(1, 'At least one update is required'),
  reason: z.string().min(1, 'Reason is required').max(255, 'Reason is too long'),
})

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().refine(val => val !== 0, 'Quantity adjustment cannot be zero'),
  type: z.enum(['MANUAL_ADJUSTMENT', 'RESTOCK', 'DAMAGED', 'ORDER_PLACED', 'ORDER_RETURNED', 'INITIAL', 'OTHER']),
  reason: z.string().min(1, 'Reason is required').max(255, 'Reason is too long'),
  createdBy: z.string().optional(),
})

export const inventoryHistoryFiltersSchema = z.object({
  productId: z.string().cuid().optional(),
  type: z.enum(['MANUAL_ADJUSTMENT', 'RESTOCK', 'DAMAGED', 'ORDER_PLACED', 'ORDER_RETURNED', 'INITIAL', 'OTHER']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type UpdateShippingAddressInput = z.infer<typeof updateShippingAddressSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>
export type BulkInventoryUpdateInput = z.infer<typeof bulkInventoryUpdateSchema>
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
export type InventoryHistoryFiltersInput = z.infer<typeof inventoryHistoryFiltersSchema>
export type CreateAddressInput = z.infer<typeof createAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
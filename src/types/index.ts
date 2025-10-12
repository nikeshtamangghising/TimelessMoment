import { User, Product, Order, OrderItem, Role, OrderStatus, InventoryChangeType, Category, Brand, Address, AddressType } from '@prisma/client'

// Re-export Prisma types
export type { User, Product, Order, OrderItem, Role, OrderStatus, InventoryChangeType, Category, Brand, Address, AddressType }

// Extended types with relations
export type UserWithOrders = User & {
  orders: Order[]
}

export type ProductWithCategory = Product & {
  category: Category
  brand?: Brand | null
}

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product & {
      category?: Category
    }
  })[]
  user?: User | null
}

export type OrderItemWithProduct = OrderItem & {
  product: Product
}

// API Response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// Cart types
export type CartItem = {
  productId: string
  quantity: number
  product: Product
}

export type Cart = {
  items: CartItem[]
  total: number
}

// Form types
export type CreateProductData = {
  name: string
  description: string
  price: number
  images: string[]
  inventory: number
  lowStockThreshold: number
  category: string
  slug: string
}

export type UpdateProductData = Partial<CreateProductData>

export type CreateOrderData = {
  userId: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  total: number
}

export type CreateGuestOrderData = {
  guestEmail: string
  guestName: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  total: number
  shippingAddress: {
    fullName: string
    email: string
    phone?: string
    address: string
    city: string
    postalCode: string
  }
}

// Filter and pagination types
export type ProductFilters = {
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  isActive?: boolean
}

export type PaginationParams = {
  page?: number
  limit?: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Inventory types
export type InventoryUpdate = {
  productId: string
  quantity: number
}

export type InventoryAdjustment = {
  id: string
  productId: string
  quantity: number
  type: InventoryChangeType
  reason: string
  createdBy?: string
  createdAt: Date
}

export type InventoryAdjustmentWithProduct = InventoryAdjustment & {
  product: {
    id: string
    name: string
    slug: string
  }
}

export type InventorySummary = {
  totalProducts: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  totalValue: number
  recentAdjustments: InventoryAdjustmentWithProduct[]
}
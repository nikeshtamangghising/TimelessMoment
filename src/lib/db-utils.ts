import { prisma } from './db'
import { 
  CreateProductInput, 
  UpdateProductInput, 
  CreateOrderInput, 
  PaginationInput, 
  ProductFiltersInput 
} from './validations'
import type { 
  Product, 
  Order, 
  OrderWithItems, 
  PaginatedResponse 
} from '@/types'

// Export prisma for use in other modules
export { prisma }

// Product operations
export async function createProduct(data: CreateProductInput): Promise<Product> {
  return prisma.product.create({
    data: data as any,
  })
}

export async function getProductById(id: string): Promise<Product | null> {
  return prisma.product.findUnique({
    where: { id },
  })
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findUnique({
    where: { slug },
  })
}

export async function getProducts(
  filters: ProductFiltersInput = {},
  pagination: PaginationInput = { page: 1, limit: 10 }
): Promise<PaginatedResponse<Product>> {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const where = {
    ...(filters.category && { categoryId: filters.category }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(filters.minPrice && { price: { gte: filters.minPrice } }),
    ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ])

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  return prisma.product.update({
    where: { id },
    data: data as any,
  })
}

export async function deleteProduct(id: string): Promise<Product> {
  return prisma.product.delete({
    where: { id },
  })
}

// Order operations
export async function createOrder(data: CreateOrderInput): Promise<OrderWithItems> {
  return prisma.order.create({
    data: {
      userId: data.userId,
      total: data.total,
      stripePaymentIntentId: data.stripePaymentIntentId,
      items: {
        create: data.items as any,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  }) as any
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  }) as any
}

export async function getOrdersByUserId(
  userId: string,
  pagination: PaginationInput = { page: 1, limit: 10 }
): Promise<PaginatedResponse<OrderWithItems>> {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    }) as any,
    prisma.order.count({ where: { userId } }),
  ])

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getAllOrders(
  pagination: PaginationInput = { page: 1, limit: 10 }
): Promise<PaginatedResponse<OrderWithItems>> {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    }) as any,
    prisma.order.count(),
  ])

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateOrderStatus(id: string, status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status },
  })
}

// User operations
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

// Inventory operations
export async function updateProductInventory(productId: string, quantity: number): Promise<Product> {
  return prisma.product.update({
    where: { id: productId },
    data: {
      inventory: {
        decrement: quantity,
      },
    },
  })
}

export async function checkProductAvailability(productId: string, quantity: number): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { inventory: true, isActive: true },
  })

  return product ? product.isActive && product.inventory >= quantity : false
}
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { User, Product, Order, OrderItem } from '@/types'

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
  })
}

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
})

export const createMockAdmin = (overrides: Partial<User> = {}): User => ({
  ...createMockUser(),
  role: 'ADMIN',
  email: 'admin@example.com',
  name: 'Admin User',
  ...overrides,
})

export const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product for testing purposes',
  price: 99.99,
  category: 'Electronics',
  imageUrl: '/images/test-product.jpg',
  stock: 10,
  isActive: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
})

export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  status: 'PENDING',
  total: 199.98,
  stripePaymentIntentId: 'pi_test_123',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
})

export const createMockOrderItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'item-1',
  orderId: 'order-1',
  productId: '1',
  quantity: 2,
  price: 99.99,
  ...overrides,
})

// API response helpers
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  headers: new Headers(),
})

export const createMockErrorResponse = (message: string, status = 500) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue({ error: message }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ error: message })),
  headers: new Headers(),
})

// Database mock helpers
export const mockPrismaTransaction = (results: any[]) => {
  const { prisma } = require('@/lib/db-utils')
  prisma.$transaction.mockResolvedValue(results)
}

export const mockPrismaUser = {
  create: (result: User) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.user.create.mockResolvedValue(result)
  },
  findUnique: (result: User | null) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.user.findUnique.mockResolvedValue(result)
  },
  findMany: (result: User[]) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.user.findMany.mockResolvedValue(result)
  },
  update: (result: User) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.user.update.mockResolvedValue(result)
  },
}

export const mockPrismaProduct = {
  create: (result: Product) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.product.create.mockResolvedValue(result)
  },
  findUnique: (result: Product | null) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.product.findUnique.mockResolvedValue(result)
  },
  findMany: (result: Product[]) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.product.findMany.mockResolvedValue(result)
  },
  update: (result: Product) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.product.update.mockResolvedValue(result)
  },
  count: (result: number) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.product.count.mockResolvedValue(result)
  },
}

export const mockPrismaOrder = {
  create: (result: Order) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.order.create.mockResolvedValue(result)
  },
  findUnique: (result: Order | null) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.order.findUnique.mockResolvedValue(result)
  },
  findMany: (result: Order[]) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.order.findMany.mockResolvedValue(result)
  },
  update: (result: Order) => {
    const { prisma } = require('@/lib/db-utils')
    prisma.order.update.mockResolvedValue(result)
  },
}

// Authentication helpers
export const mockSession = (user: Partial<User> = {}) => {
  const { getServerSession } = require('next-auth')
  getServerSession.mockResolvedValue({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
      ...user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
}

export const mockAdminSession = () => {
  mockSession({
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  })
}

export const mockNoSession = () => {
  const { getServerSession } = require('next-auth')
  getServerSession.mockResolvedValue(null)
}

// Stripe helpers
export const mockStripe = {
  paymentIntents: {
    create: (result: any) => {
      const Stripe = require('stripe')
      const mockStripe = new Stripe()
      mockStripe.paymentIntents.create.mockResolvedValue(result)
    },
    retrieve: (result: any) => {
      const Stripe = require('stripe')
      const mockStripe = new Stripe()
      mockStripe.paymentIntents.retrieve.mockResolvedValue(result)
    },
  },
  webhooks: {
    constructEvent: (result: any) => {
      const Stripe = require('stripe')
      const mockStripe = new Stripe()
      mockStripe.webhooks.constructEvent.mockReturnValue(result)
    },
  },
}

// Email helpers
export const mockResend = {
  send: (result: any) => {
    const { Resend } = require('resend')
    const mockResend = new Resend()
    mockResend.emails.send.mockResolvedValue(result)
  },
}

// Fetch helpers
export const mockFetch = (response: any) => {
  global.fetch = jest.fn().mockResolvedValue(response)
}

export const mockFetchError = (error: Error) => {
  global.fetch = jest.fn().mockRejectedValue(error)
}

// Local storage helpers
export const mockLocalStorage = {
  getItem: (key: string, value: string | null) => {
    window.localStorage.getItem = jest.fn().mockReturnValue(value)
  },
  setItem: () => {
    window.localStorage.setItem = jest.fn()
  },
  removeItem: () => {
    window.localStorage.removeItem = jest.fn()
  },
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Custom matchers
export const expectToBeCalledWithPartial = (mockFn: jest.Mock, expectedPartial: any) => {
  expect(mockFn).toHaveBeenCalledWith(
    expect.objectContaining(expectedPartial)
  )
}

// Test data generators
export const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => createMockProduct({
    id: i + 1,
    name: `Product ${i + 1}`,
    slug: `product-${i + 1}`,
    price: (i + 1) * 10,
  }))
}

export const generateOrders = (count: number): Order[] => {
  return Array.from({ length: count }, (_, i) => createMockOrder({
    id: `order-${i + 1}`,
    total: (i + 1) * 50,
  }))
}

export const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => createMockUser({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
  }))
}

// Error simulation helpers
export const simulateNetworkError = () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
}

export const simulateDatabaseError = () => {
  const { prisma } = require('@/lib/db-utils')
  Object.keys(prisma).forEach(key => {
    if (typeof prisma[key] === 'object' && prisma[key] !== null) {
      Object.keys(prisma[key]).forEach(method => {
        if (typeof prisma[key][method] === 'function') {
          prisma[key][method].mockRejectedValue(new Error('Database error'))
        }
      })
    }
  })
}

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Component testing helpers
export const getByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`)
}

export const getAllByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelectorAll(`[data-testid="${testId}"]`)
}

// Form testing helpers
export const fillForm = (container: HTMLElement, values: Record<string, string>) => {
  Object.entries(values).forEach(([name, value]) => {
    const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      input.value = value
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
}

// Export all helpers
export * from '@testing-library/react'
export * from '@testing-library/user-event'
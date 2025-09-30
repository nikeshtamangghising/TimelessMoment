import {
  generateOrderConfirmationEmail,
  generateOrderStatusUpdateEmail,
  generatePasswordResetEmail,
  generateWelcomeEmail,
  generateLowStockAlertEmail,
} from '@/lib/email-templates'
import { Order, Product, User } from '@/types'

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SITE_URL: 'https://example.com'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Email Templates', () => {
  const mockUser: User = {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'CUSTOMER',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  const mockOrder: Order = {
    id: 'ORDER-123',
    userId: '1',
    status: 'CONFIRMED',
    total: 149.98,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  }

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    description: 'A great test product',
    price: 74.99,
    category: 'Electronics',
    imageUrl: '/test-product.jpg',
    stock: 10,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  describe('generateOrderConfirmationEmail', () => {
    it('should generate order confirmation email', () => {
      const data = {
        order: mockOrder,
        user: mockUser,
        orderItems: [
          {
            product: mockProduct,
            quantity: 2,
            price: 74.99,
          },
        ],
      }

      const email = generateOrderConfirmationEmail(data)

      expect(email.subject).toBe('Order Confirmation - #ORDER-123')
      expect(email.html).toContain('Order Confirmation')
      expect(email.html).toContain('John Doe')
      expect(email.html).toContain('#ORDER-123')
      expect(email.html).toContain('Test Product')
      expect(email.html).toContain('$149.98')
      expect(email.html).toContain('https://example.com/orders/ORDER-123')
      
      expect(email.text).toContain('Order Confirmation')
      expect(email.text).toContain('John Doe')
      expect(email.text).toContain('#ORDER-123')
      expect(email.text).toContain('$149.98')
    })

    it('should handle user without name', () => {
      const userWithoutName = { ...mockUser, name: null }
      const data = {
        order: mockOrder,
        user: userWithoutName,
        orderItems: [
          {
            product: mockProduct,
            quantity: 1,
            price: 74.99,
          },
        ],
      }

      const email = generateOrderConfirmationEmail(data)

      expect(email.html).toContain('user@example.com')
      expect(email.text).toContain('user@example.com')
    })
  })

  describe('generateOrderStatusUpdateEmail', () => {
    it('should generate order status update email', () => {
      const data = {
        order: mockOrder,
        user: mockUser,
        previousStatus: 'PENDING',
        newStatus: 'SHIPPED',
      }

      const email = generateOrderStatusUpdateEmail(data)

      expect(email.subject).toBe('Order Update - #ORDER-123 SHIPPED')
      expect(email.html).toContain('Order Status Update')
      expect(email.html).toContain('Your order has been shipped')
      expect(email.html).toContain('Previous Status: PENDING')
      expect(email.html).toContain('New Status: SHIPPED')
      expect(email.html).toContain('on its way')
      
      expect(email.text).toContain('Your order has been shipped')
      expect(email.text).toContain('Previous Status: PENDING')
    })

    it('should handle delivered status', () => {
      const data = {
        order: mockOrder,
        user: mockUser,
        previousStatus: 'SHIPPED',
        newStatus: 'DELIVERED',
      }

      const email = generateOrderStatusUpdateEmail(data)

      expect(email.html).toContain('Order Delivered!')
      expect(email.html).toContain('happy with your purchase')
    })

    it('should handle cancelled status', () => {
      const data = {
        order: mockOrder,
        user: mockUser,
        previousStatus: 'PENDING',
        newStatus: 'CANCELLED',
      }

      const email = generateOrderStatusUpdateEmail(data)

      expect(email.html).toContain('Your order has been cancelled')
    })
  })

  describe('generatePasswordResetEmail', () => {
    it('should generate password reset email', () => {
      const data = {
        user: mockUser,
        resetToken: 'reset-token-123',
        resetUrl: 'https://example.com/auth/reset-password?token=reset-token-123',
      }

      const email = generatePasswordResetEmail(data)

      expect(email.subject).toBe('Password Reset Request')
      expect(email.html).toContain('Password Reset Request')
      expect(email.html).toContain('John Doe')
      expect(email.html).toContain('https://example.com/auth/reset-password?token=reset-token-123')
      expect(email.html).toContain('expire in 1 hour')
      
      expect(email.text).toContain('Password Reset Request')
      expect(email.text).toContain('https://example.com/auth/reset-password?token=reset-token-123')
    })
  })

  describe('generateWelcomeEmail', () => {
    it('should generate welcome email', () => {
      const data = { user: mockUser }

      const email = generateWelcomeEmail(data)

      expect(email.subject).toBe('Welcome to E-Commerce Platform!')
      expect(email.html).toContain('Welcome to E-Commerce Platform!')
      expect(email.html).toContain('John Doe')
      expect(email.html).toContain('Browse our extensive product catalog')
      expect(email.html).toContain('https://example.com/products')
      
      expect(email.text).toContain('Welcome to E-Commerce Platform!')
      expect(email.text).toContain('John Doe')
    })
  })

  describe('generateLowStockAlertEmail', () => {
    it('should generate low stock alert email', () => {
      const email = generateLowStockAlertEmail(mockProduct, 3)

      expect(email.subject).toBe('Low Stock Alert - Test Product')
      expect(email.html).toContain('Low Stock Alert')
      expect(email.html).toContain('Test Product')
      expect(email.html).toContain('Current Stock: 3 units')
      expect(email.html).toContain('Electronics')
      expect(email.html).toContain('$74.99')
      expect(email.html).toContain('https://example.com/admin/products/1')
      
      expect(email.text).toContain('Low Stock Alert')
      expect(email.text).toContain('Current Stock: 3 units')
    })
  })
})
import { EmailService } from '@/lib/email-service'
import * as emailModule from '@/lib/email'
import * as emailTemplates from '@/lib/email-templates'

// Mock the email module
jest.mock('@/lib/email')
jest.mock('@/lib/email-templates')

const mockSendEmailWithRetry = emailModule.sendEmailWithRetry as jest.MockedFunction<typeof emailModule.sendEmailWithRetry>
const mockEmailQueue = {
  add: jest.fn(),
} as any

// Mock the email queue
Object.defineProperty(emailModule, 'emailQueue', {
  value: mockEmailQueue,
})

const mockGenerateOrderConfirmationEmail = emailTemplates.generateOrderConfirmationEmail as jest.MockedFunction<typeof emailTemplates.generateOrderConfirmationEmail>
const mockGenerateOrderStatusUpdateEmail = emailTemplates.generateOrderStatusUpdateEmail as jest.MockedFunction<typeof emailTemplates.generateOrderStatusUpdateEmail>
const mockGeneratePasswordResetEmail = emailTemplates.generatePasswordResetEmail as jest.MockedFunction<typeof emailTemplates.generatePasswordResetEmail>
const mockGenerateWelcomeEmail = emailTemplates.generateWelcomeEmail as jest.MockedFunction<typeof emailTemplates.generateWelcomeEmail>

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockUser = {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'CUSTOMER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOrder = {
    id: 'ORDER-123',
    userId: '1',
    status: 'CONFIRMED',
    total: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    price: 49.99,
    category: 'Electronics',
    imageUrl: '/test.jpg',
    stock: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email', async () => {
      const mockEmailContent = {
        subject: 'Order Confirmation - #ORDER-123',
        html: '<h1>Order Confirmation</h1>',
        text: 'Order Confirmation',
      }

      mockGenerateOrderConfirmationEmail.mockReturnValue(mockEmailContent)
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const data = {
        order: mockOrder,
        user: mockUser,
        orderItems: [{ product: mockProduct, quantity: 2, price: 49.99 }],
      }

      const result = await EmailService.sendOrderConfirmation(data)

      expect(mockGenerateOrderConfirmationEmail).toHaveBeenCalledWith(data)
      expect(mockSendEmailWithRetry).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Order Confirmation - #ORDER-123',
        html: '<h1>Order Confirmation</h1>',
        text: 'Order Confirmation',
      })
      expect(result.success).toBe(true)
    })

    it('should use queue when requested', async () => {
      const mockEmailContent = {
        subject: 'Order Confirmation - #ORDER-123',
        html: '<h1>Order Confirmation</h1>',
        text: 'Order Confirmation',
      }

      mockGenerateOrderConfirmationEmail.mockReturnValue(mockEmailContent)
      mockEmailQueue.add.mockReturnValue('queue-id-123')

      const data = {
        order: mockOrder,
        user: mockUser,
        orderItems: [{ product: mockProduct, quantity: 2, price: 49.99 }],
      }

      const result = await EmailService.sendOrderConfirmation(data, true)

      expect(mockEmailQueue.add).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Order Confirmation - #ORDER-123',
        html: '<h1>Order Confirmation</h1>',
        text: 'Order Confirmation',
      }, 'high')
      expect(result).toBe('queue-id-123')
    })
  })

  describe('sendOrderStatusUpdate', () => {
    it('should send order status update email', async () => {
      const mockEmailContent = {
        subject: 'Order Update - #ORDER-123 SHIPPED',
        html: '<h1>Order Status Update</h1>',
        text: 'Order Status Update',
      }

      mockGenerateOrderStatusUpdateEmail.mockReturnValue(mockEmailContent)
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const data = {
        order: mockOrder,
        user: mockUser,
        previousStatus: 'PENDING',
        newStatus: 'SHIPPED',
      }

      const result = await EmailService.sendOrderStatusUpdate(data)

      expect(mockGenerateOrderStatusUpdateEmail).toHaveBeenCalledWith(data)
      expect(mockSendEmailWithRetry).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Order Update - #ORDER-123 SHIPPED',
        html: '<h1>Order Status Update</h1>',
        text: 'Order Status Update',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      const mockEmailContent = {
        subject: 'Password Reset Request',
        html: '<h1>Password Reset</h1>',
        text: 'Password Reset',
      }

      mockGeneratePasswordResetEmail.mockReturnValue(mockEmailContent)
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const data = {
        user: mockUser,
        resetToken: 'reset-token-123',
        resetUrl: 'https://example.com/reset?token=reset-token-123',
      }

      const result = await EmailService.sendPasswordReset(data)

      expect(mockGeneratePasswordResetEmail).toHaveBeenCalledWith(data)
      expect(mockSendEmailWithRetry).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Password Reset Request',
        html: '<h1>Password Reset</h1>',
        text: 'Password Reset',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const mockEmailContent = {
        subject: 'Welcome to E-Commerce Platform!',
        html: '<h1>Welcome</h1>',
        text: 'Welcome',
      }

      mockGenerateWelcomeEmail.mockReturnValue(mockEmailContent)
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const data = { user: mockUser }

      const result = await EmailService.sendWelcomeEmail(data)

      expect(mockGenerateWelcomeEmail).toHaveBeenCalledWith(data)
      expect(mockSendEmailWithRetry).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Welcome to E-Commerce Platform!',
        html: '<h1>Welcome</h1>',
        text: 'Welcome',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('sendTestEmail', () => {
    it('should send test email', async () => {
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const result = await EmailService.sendTestEmail('test@example.com')

      expect(mockSendEmailWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email - E-Commerce Platform',
        })
      )
      expect(result.success).toBe(true)
    })
  })

  describe('sendLowStockAlert', () => {
    it('should send low stock alert to admin emails', async () => {
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const adminEmails = ['admin1@example.com', 'admin2@example.com']
      const result = await EmailService.sendLowStockAlert(mockProduct, 2, adminEmails)

      expect(mockSendEmailWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          to: adminEmails,
          subject: expect.stringContaining('Low Stock Alert'),
        })
      )
      expect(result.success).toBe(true)
    })
  })

  describe('sendBulkNotification', () => {
    it('should send bulk notification', async () => {
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const recipients = ['user1@example.com', 'user2@example.com']
      const result = await EmailService.sendBulkNotification(
        recipients,
        'Bulk Notification',
        '<h1>Notification</h1>',
        'Notification',
        false
      )

      expect(mockSendEmailWithRetry).toHaveBeenCalledWith({
        to: recipients,
        subject: 'Bulk Notification',
        html: '<h1>Notification</h1>',
        text: 'Notification',
      })
      expect(result.success).toBe(true)
    })

    it('should use queue by default', async () => {
      mockEmailQueue.add.mockReturnValue('queue-id-123')

      const recipients = ['user1@example.com']
      const result = await EmailService.sendBulkNotification(
        recipients,
        'Bulk Notification',
        '<h1>Notification</h1>'
      )

      expect(mockEmailQueue.add).toHaveBeenCalledWith({
        to: recipients,
        subject: 'Bulk Notification',
        html: '<h1>Notification</h1>',
        text: undefined,
      }, 'low')
      expect(result).toBe('queue-id-123')
    })
  })

  describe('sendEmailVerification', () => {
    it('should send email verification', async () => {
      mockSendEmailWithRetry.mockResolvedValue({ success: true, messageId: 'email-123' })

      const result = await EmailService.sendEmailVerification(
        'user@example.com',
        'verification-token-123'
      )

      expect(mockSendEmailWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify Your Email Address',
          html: expect.stringContaining('verification-token-123'),
        })
      )
      expect(result.success).toBe(true)
    })
  })
})
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route'
import { POST as resetPassword } from '@/app/api/auth/reset-password/route'
import { POST as register } from '@/app/api/auth/register/route'
import { POST as sendLowStockAlert } from '@/app/api/admin/alerts/low-stock/route'
import { EmailService } from '@/lib/email-service'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/email-service')
jest.mock('@/lib/db')
jest.mock('next-auth')
jest.mock('bcryptjs')

const mockEmailService = EmailService as jest.Mocked<typeof EmailService>
const mockDb = db as jest.Mocked<typeof db>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('Email Integration API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      }

      // Mock Drizzle queries
      mockDb.select().from().where().mockResolvedValue([mockUser] as any)
      mockDb.update().set().where().mockResolvedValue([mockUser] as any)
      mockEmailService.sendPasswordReset.mockResolvedValue({ success: true, messageId: 'email-123' })

      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })

      const response = await forgotPassword(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('password reset link')
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          resetToken: expect.any(String),
          resetUrl: expect.stringContaining('reset-password?token='),
        }),
        true
      )
    })

    it('should return success even for non-existent user', async () => {
      mockDb.select().from().where().mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      })

      const response = await forgotPassword(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('password reset link')
      expect(mockEmailService.sendPasswordReset).not.toHaveBeenCalled()
    })

    it('should handle email sending failure', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      }

      mockDb.select().from().where().mockResolvedValue([mockUser] as any)
      mockDb.update().set().where().mockResolvedValue([mockUser] as any)
      mockEmailService.sendPasswordReset.mockRejectedValue(new Error('Email service error'))

      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })

      const response = await forgotPassword(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to send password reset email')
    })
  })

  describe('/api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        resetToken: 'valid-token',
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      }

      mockDb.select().from().where().mockResolvedValue([mockUser] as any)
      mockDb.update().set().where().mockResolvedValue([mockUser] as any)

      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newpassword123'
        }),
      })

      const response = await resetPassword(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('Password reset successful')
    })

    it('should reject invalid or expired token', async () => {
      mockDb.select().from().where().mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-token',
          password: 'newpassword123'
        }),
      })

      const response = await resetPassword(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid or expired reset token')
    })
  })

  describe('/api/auth/register', () => {
    it('should send welcome email after successful registration', async () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER',
        createdAt: new Date(),
      }

      mockDb.select().from().where().mockResolvedValue([]) // User doesn't exist
      mockDb.insert().values().mockResolvedValue([mockUser] as any)
      mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true, messageId: 'email-123' })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123'
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('User created successfully')
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        { user: mockUser },
        true
      )
    })

    it('should not fail registration if welcome email fails', async () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER',
        createdAt: new Date(),
      }

      mockDb.select().from().where().mockResolvedValue([])
      mockDb.insert().values().mockResolvedValue([mockUser] as any)
      mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service error'))

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123'
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('User created successfully')
    })
  })

  describe('/api/admin/alerts/low-stock', () => {
    it('should send low stock alerts to admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
      } as any)

      const mockProducts = [
        { id: 1, name: 'Low Stock Product', stock: 2, category: 'Electronics', price: 99.99 },
      ]

      const mockAdmins = [
        { email: 'admin1@example.com' },
        { email: 'admin2@example.com' },
      ]

      // Mock product repository
      const mockProductRepository = {
        findMany: jest.fn().mockResolvedValue({
          data: mockProducts,
          pagination: { total: 1 }
        })
      }
      jest.doMock('@/lib/product-repository', () => ({
        productRepository: mockProductRepository
      }))

      mockDb.select().from().mockResolvedValue(mockAdmins as any)
      mockEmailService.sendLowStockAlert.mockResolvedValue({ success: true, messageId: 'email-123' })

      const request = new Request('http://localhost:3000/api/admin/alerts/low-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: 5 }),
      })

      const response = await sendLowStockAlert(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('Low stock alerts processed')
      expect(data.productsFound).toBe(1)
      expect(data.adminEmails).toBe(2)
    })

    it('should require admin authentication', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'user@example.com', role: 'CUSTOMER' },
      } as any)

      const request = new Request('http://localhost:3000/api/admin/alerts/low-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: 5 }),
      })

      const response = await sendLowStockAlert(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized. Admin access required.')
    })
  })
})
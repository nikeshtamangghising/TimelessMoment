import { EmailTracker, sendTrackedEmail } from '@/lib/email-tracking'
import { prisma } from '@/lib/db-utils'

// Mock Prisma
jest.mock('@/lib/db-utils', () => ({
  prisma: {
    emailLog: {
      create: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock email module
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendEmail = require('@/lib/email').sendEmail as jest.MockedFunction<any>

describe('EmailTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logEmail', () => {
    it('should log email for single recipient', async () => {
      const mockLog = {
        id: 'log-123',
        to: 'user@example.com',
        subject: 'Test Email',
        template: 'welcome',
        status: 'PENDING',
        createdAt: new Date(),
      }

      mockPrisma.emailLog.create.mockResolvedValue(mockLog as any)

      const logId = await EmailTracker.logEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        template: 'welcome',
        status: 'PENDING'
      })

      expect(logId).toBe('log-123')
      expect(mockPrisma.emailLog.create).toHaveBeenCalledWith({
        data: {
          to: 'user@example.com',
          subject: 'Test Email',
          template: 'welcome',
          messageId: undefined,
          status: 'PENDING',
          error: undefined,
          sentAt: null,
        }
      })
    })

    it('should log email for multiple recipients', async () => {
      const mockLogs = [
        { id: 'log-1', to: 'user1@example.com' },
        { id: 'log-2', to: 'user2@example.com' },
      ]

      mockPrisma.emailLog.create
        .mockResolvedValueOnce(mockLogs[0] as any)
        .mockResolvedValueOnce(mockLogs[1] as any)

      const logId = await EmailTracker.logEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        status: 'PENDING'
      })

      expect(logId).toBe('log-1')
      expect(mockPrisma.emailLog.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('updateEmailStatus', () => {
    it('should update email status', async () => {
      mockPrisma.emailLog.updateMany.mockResolvedValue({ count: 1 })

      await EmailTracker.updateEmailStatus('message-123', 'SENT')

      expect(mockPrisma.emailLog.updateMany).toHaveBeenCalledWith({
        where: { messageId: 'message-123' },
        data: {
          status: 'SENT',
          error: undefined,
          sentAt: expect.any(Date),
        }
      })
    })

    it('should update email status with error', async () => {
      mockPrisma.emailLog.updateMany.mockResolvedValue({ count: 1 })

      await EmailTracker.updateEmailStatus('message-123', 'FAILED', 'Network error')

      expect(mockPrisma.emailLog.updateMany).toHaveBeenCalledWith({
        where: { messageId: 'message-123' },
        data: {
          status: 'FAILED',
          error: 'Network error',
          sentAt: undefined,
        }
      })
    })
  })

  describe('getEmailStats', () => {
    it('should return email statistics', async () => {
      const mockStats = [
        { status: 'SENT', _count: { status: 100 } },
        { status: 'FAILED', _count: { status: 10 } },
        { status: 'PENDING', _count: { status: 5 } },
      ]

      mockPrisma.emailLog.groupBy.mockResolvedValue(mockStats as any)

      const stats = await EmailTracker.getEmailStats(30)

      expect(stats).toEqual({
        total: 115,
        sent: 100,
        failed: 10,
        bounced: 0,
        pending: 5,
        successRate: 86.96
      })

      expect(mockPrisma.emailLog.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {
          createdAt: { gte: expect.any(Date) }
        },
        _count: {
          status: true
        }
      })
    })

    it('should handle empty statistics', async () => {
      mockPrisma.emailLog.groupBy.mockResolvedValue([])

      const stats = await EmailTracker.getEmailStats(30)

      expect(stats).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        bounced: 0,
        pending: 0,
        successRate: 0
      })
    })
  })

  describe('getRecentEmails', () => {
    it('should return recent emails', async () => {
      const mockEmails = [
        { id: '1', to: 'user1@example.com', subject: 'Email 1' },
        { id: '2', to: 'user2@example.com', subject: 'Email 2' },
      ]

      mockPrisma.emailLog.findMany.mockResolvedValue(mockEmails as any)

      const emails = await EmailTracker.getRecentEmails(50)

      expect(emails).toEqual(mockEmails)
      expect(mockPrisma.emailLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })
  })

  describe('getEmailsByTemplate', () => {
    it('should return emails by template', async () => {
      const mockEmails = [
        { id: '1', template: 'welcome', subject: 'Welcome!' },
      ]

      mockPrisma.emailLog.findMany.mockResolvedValue(mockEmails as any)

      const emails = await EmailTracker.getEmailsByTemplate('welcome', 30)

      expect(emails).toEqual(mockEmails)
      expect(mockPrisma.emailLog.findMany).toHaveBeenCalledWith({
        where: {
          template: 'welcome',
          createdAt: { gte: expect.any(Date) }
        },
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('cleanupOldLogs', () => {
    it('should cleanup old email logs', async () => {
      mockPrisma.emailLog.deleteMany.mockResolvedValue({ count: 50 })

      const deletedCount = await EmailTracker.cleanupOldLogs(90)

      expect(deletedCount).toBe(50)
      expect(mockPrisma.emailLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) }
        }
      })
    })
  })

  describe('handleDeliveryStatus', () => {
    it('should handle delivered status', async () => {
      mockPrisma.emailLog.updateMany.mockResolvedValue({ count: 1 })

      await EmailTracker.handleDeliveryStatus({
        messageId: 'message-123',
        status: 'delivered',
        timestamp: new Date()
      })

      expect(mockPrisma.emailLog.updateMany).toHaveBeenCalledWith({
        where: { messageId: 'message-123' },
        data: {
          status: 'SENT',
          error: undefined,
          sentAt: expect.any(Date),
        }
      })
    })

    it('should handle bounced status', async () => {
      mockPrisma.emailLog.updateMany.mockResolvedValue({ count: 1 })

      await EmailTracker.handleDeliveryStatus({
        messageId: 'message-123',
        status: 'bounced',
        timestamp: new Date(),
        reason: 'Invalid email address'
      })

      expect(mockPrisma.emailLog.updateMany).toHaveBeenCalledWith({
        where: { messageId: 'message-123' },
        data: {
          status: 'BOUNCED',
          error: 'Invalid email address',
          sentAt: expect.any(Date),
        }
      })
    })
  })
})

describe('sendTrackedEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send and track email successfully', async () => {
    const mockLog = { id: 'log-123' }
    mockPrisma.emailLog.create.mockResolvedValue(mockLog as any)
    mockPrisma.emailLog.updateMany.mockResolvedValue({ count: 1 })
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'message-123' })

    const result = await sendTrackedEmail({
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Test</p>',
      template: 'test'
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('message-123')
    expect(result.logId).toBe('log-123')
    expect(mockSendEmail).toHaveBeenCalled()
    expect(mockPrisma.emailLog.updateMany).toHaveBeenCalledWith({
      where: { messageId: 'message-123' },
      data: {
        status: 'SENT',
        error: undefined,
        sentAt: expect.any(Date),
      }
    })
  })

  it('should handle email sending failure', async () => {
    const mockLog = { id: 'log-123' }
    mockPrisma.emailLog.create.mockResolvedValue(mockLog as any)
    mockSendEmail.mockResolvedValue({ success: false, error: 'Network error' })

    const result = await sendTrackedEmail({
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Test</p>'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    expect(mockPrisma.emailLog.create).toHaveBeenCalledTimes(2) // Initial log + failure log
  })
})
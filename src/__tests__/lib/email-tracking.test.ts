import { EmailTracker, sendTrackedEmail } from '@/lib/email-tracking'
import { db } from '@/lib/db'
import { emailLogs } from '@/lib/db/schema'

// Mock Drizzle
jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  },
}))

// Mock email module
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
}))

const mockDb = db as jest.Mocked<typeof db>
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

      mockDb.insert(emailLogs).values().execute.mockResolvedValue([mockLog] as any)

      const logId = await EmailTracker.logEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        template: 'welcome',
        status: 'PENDING'
      })

      expect(logId).toBe('log-123')
      expect(mockDb.insert).toHaveBeenCalledWith(emailLogs)
    })

    it('should log email for multiple recipients', async () => {
      const mockLogs = [
        { id: 'log-1', to: 'user1@example.com' },
        { id: 'log-2', to: 'user2@example.com' },
      ]

      mockDb.insert(emailLogs).values().execute
        .mockResolvedValueOnce([mockLogs[0]] as any)
        .mockResolvedValueOnce([mockLogs[1]] as any)

      const logId = await EmailTracker.logEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        status: 'PENDING'
      })

      expect(logId).toBe('log-1')
      expect(mockDb.insert).toHaveBeenCalledTimes(2)
    })
  })

  describe('updateEmailStatus', () => {
    it('should update email status', async () => {
      mockDb.update(emailLogs).set().where().execute.mockResolvedValue({ count: 1 } as any)

      await EmailTracker.updateEmailStatus('message-123', 'SENT')

      expect(mockDb.update).toHaveBeenCalledWith(emailLogs)
    })

    it('should update email status with error', async () => {
      mockDb.update(emailLogs).set().where().execute.mockResolvedValue({ count: 1 } as any)

      await EmailTracker.updateEmailStatus('message-123', 'FAILED', 'Network error')

      expect(mockDb.update).toHaveBeenCalledWith(emailLogs)
    })
  })

  describe('getEmailStats', () => {
    it('should return email statistics', async () => {
      const mockStats = [
        { status: 'SENT', _count: { status: 100 } },
        { status: 'FAILED', _count: { status: 10 } },
        { status: 'PENDING', _count: { status: 5 } },
      ]

      mockDb.select().from(emailLogs).groupBy().execute.mockResolvedValue(mockStats as any)

      const stats = await EmailTracker.getEmailStats(30)

      expect(stats).toEqual({
        total: 115,
        sent: 100,
        failed: 10,
        bounced: 0,
        pending: 5,
        successRate: 86.96
      })

      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should handle empty statistics', async () => {
      mockDb.select().from(emailLogs).groupBy().execute.mockResolvedValue([])

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

      mockDb.select().from(emailLogs).orderBy().take().execute.mockResolvedValue(mockEmails as any)

      const emails = await EmailTracker.getRecentEmails(50)

      expect(emails).toEqual(mockEmails)
      expect(mockDb.select).toHaveBeenCalled()
    })
  })

  describe('getEmailsByTemplate', () => {
    it('should return emails by template', async () => {
      const mockEmails = [
        { id: '1', template: 'welcome', subject: 'Welcome!' },
      ]

      mockDb.select().from(emailLogs).where().orderBy().execute.mockResolvedValue(mockEmails as any)

      const emails = await EmailTracker.getEmailsByTemplate('welcome', 30)

      expect(emails).toEqual(mockEmails)
      expect(mockDb.select).toHaveBeenCalled()
    })
  })

  describe('cleanupOldLogs', () => {
    it('should cleanup old email logs', async () => {
      mockDb.delete(emailLogs).where().execute.mockResolvedValue({ count: 50 } as any)

      const deletedCount = await EmailTracker.cleanupOldLogs(90)

      expect(deletedCount).toBe(50)
      expect(mockDb.delete).toHaveBeenCalledWith(emailLogs)
    })
  })

  describe('handleDeliveryStatus', () => {
    it('should handle delivered status', async () => {
      mockDb.update(emailLogs).set().where().execute.mockResolvedValue({ count: 1 } as any)

      await EmailTracker.handleDeliveryStatus({
        messageId: 'message-123',
        status: 'delivered',
        timestamp: new Date()
      })

      expect(mockDb.update).toHaveBeenCalledWith(emailLogs)
    })

    it('should handle bounced status', async () => {
      mockDb.update(emailLogs).set().where().execute.mockResolvedValue({ count: 1 } as any)

      await EmailTracker.handleDeliveryStatus({
        messageId: 'message-123',
        status: 'bounced',
        timestamp: new Date(),
        reason: 'Invalid email address'
      })

      expect(mockDb.update).toHaveBeenCalledWith(emailLogs)
    })
  })
})

describe('sendTrackedEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send and track email successfully', async () => {
    const mockLog = { id: 'log-123' }
    mockDb.insert(emailLogs).values().execute.mockResolvedValue([mockLog] as any)
    mockDb.update(emailLogs).set().where().execute.mockResolvedValue({ count: 1 } as any)
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
    expect(mockDb.update).toHaveBeenCalledWith(emailLogs)
  })

  it('should handle email sending failure', async () => {
    const mockLog = { id: 'log-123' }
    mockDb.insert(emailLogs).values().execute.mockResolvedValue([mockLog] as any)
    mockSendEmail.mockResolvedValue({ success: false, error: 'Network error' })

    const result = await sendTrackedEmail({
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Test</p>'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    expect(mockDb.insert).toHaveBeenCalledTimes(2) // Initial log + failure log
  })
})
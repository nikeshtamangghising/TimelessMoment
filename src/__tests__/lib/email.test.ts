import {
  sendEmail,
  sendBulkEmails,
  validateEmail,
  wrapEmailTemplate,
  sendEmailWithRetry,
  emailQueue,
} from '@/lib/email'

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}))

const mockResendSend = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    RESEND_API_KEY: 'test-api-key',
    FROM_EMAIL: 'test@example.com',
    FROM_NAME: 'Test Platform',
    NEXT_PUBLIC_SITE_URL: 'https://example.com'
  }
  jest.clearAllMocks()
})

afterEach(() => {
  process.env = originalEnv
})

describe('Email Service', () => {
  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-123')
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'Test Platform <test@example.com>',
        to: ['user@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
        reply_to: undefined,
        attachments: undefined,
      })
    })

    it('should handle multiple recipients', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const result = await sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com'],
        })
      )
    })

    it('should handle email sending errors', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      })

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })

    it('should handle missing API key', async () => {
      process.env.RESEND_API_KEY = ''

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service not configured')
    })

    it('should handle network errors', async () => {
      mockResendSend.mockRejectedValue(new Error('Network error'))

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('sendBulkEmails', () => {
    it('should send multiple emails', async () => {
      mockResendSend
        .mockResolvedValueOnce({ data: { id: 'email-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'email-2' }, error: null })

      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Email 1',
          html: '<p>Content 1</p>',
        },
        {
          to: 'user2@example.com',
          subject: 'Email 2',
          html: '<p>Content 2</p>',
        },
      ]

      const results = await sendBulkEmails(emails)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledTimes(2)
    })

    it('should handle mixed success and failure', async () => {
      mockResendSend
        .mockResolvedValueOnce({ data: { id: 'email-1' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Failed' } })

      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Email 1',
          html: '<p>Content 1</p>',
        },
        {
          to: 'user2@example.com',
          subject: 'Email 2',
          html: '<p>Content 2</p>',
        },
      ]

      const results = await sendBulkEmails(emails)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe('Failed')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('user123@test-domain.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@domain')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('wrapEmailTemplate', () => {
    it('should wrap content in HTML template', () => {
      const content = '<h1>Test Content</h1><p>Test paragraph</p>'
      const wrapped = wrapEmailTemplate(content, 'Test Title')

      expect(wrapped).toContain('<!DOCTYPE html>')
      expect(wrapped).toContain('<title>Test Title</title>')
      expect(wrapped).toContain(content)
      expect(wrapped).toContain('E-Commerce Platform')
      expect(wrapped).toContain(new Date().getFullYear().toString())
    })

    it('should use default title when not provided', () => {
      const content = '<p>Test</p>'
      const wrapped = wrapEmailTemplate(content)

      expect(wrapped).toContain('<title>E-Commerce Platform</title>')
    })
  })

  describe('sendEmailWithRetry', () => {
    it('should succeed on first attempt', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const result = await sendEmailWithRetry({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      }, 3, 100)

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      mockResendSend
        .mockResolvedValueOnce({ data: null, error: { message: 'Temporary error' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'Temporary error' } })
        .mockResolvedValueOnce({ data: { id: 'email-123' }, error: null })

      const result = await sendEmailWithRetry({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      }, 3, 10)

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'Persistent error' },
      })

      const result = await sendEmailWithRetry({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      }, 2, 10)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed after 2 attempts')
      expect(mockResendSend).toHaveBeenCalledTimes(2)
    })
  })

  describe('EmailQueue', () => {
    it('should add emails to queue', () => {
      const emailId = emailQueue.add({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      })

      expect(emailId).toMatch(/^email_\d+_[a-z0-9]+$/)
    })

    it('should prioritize high priority emails', () => {
      emailQueue.add({
        to: 'user1@example.com',
        subject: 'Low Priority',
        html: '<p>Low</p>',
      }, 'low')

      emailQueue.add({
        to: 'user2@example.com',
        subject: 'High Priority',
        html: '<p>High</p>',
      }, 'high')

      const status = emailQueue.getQueueStatus()
      expect(status.pending).toBeGreaterThan(0)
    })
  })
})
import { prisma } from '@/lib/db-utils'

export interface EmailLog {
  id: string
  to: string
  subject: string
  template?: string
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED'
  messageId?: string
  error?: string
  sentAt?: Date
  createdAt: Date
}

export interface EmailDeliveryStatus {
  messageId: string
  status: 'delivered' | 'bounced' | 'complained'
  timestamp: Date
  reason?: string
}

export class EmailTracker {
  // Log email attempt
  static async logEmail(data: {
    to: string | string[]
    subject: string
    template?: string
    messageId?: string
    status: 'PENDING' | 'SENT' | 'FAILED'
    error?: string
  }): Promise<string> {
    try {
      const recipients = Array.isArray(data.to) ? data.to : [data.to]
      
      // Log each recipient separately
      const logs = await Promise.all(
        recipients.map(recipient =>
          prisma.emailLog.create({
            data: {
              to: recipient,
              subject: data.subject,
              template: data.template,
              messageId: data.messageId,
              status: data.status,
              error: data.error,
              sentAt: data.status === 'SENT' ? new Date() : null,
            }
          })
        )
      )

      return logs[0].id
    } catch (error) {
      console.error('Failed to log email:', error)
      throw error
    }
  }

  // Update email status
  static async updateEmailStatus(
    messageId: string,
    status: 'SENT' | 'FAILED' | 'BOUNCED',
    error?: string
  ): Promise<void> {
    try {
      await prisma.emailLog.updateMany({
        where: { messageId },
        data: {
          status,
          error,
          sentAt: status === 'SENT' ? new Date() : undefined,
        }
      })
    } catch (error) {
      console.error('Failed to update email status:', error)
      throw error
    }
  }

  // Get email statistics
  static async getEmailStats(days: number = 30): Promise<{
    total: number
    sent: number
    failed: number
    bounced: number
    pending: number
    successRate: number
  }> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const stats = await prisma.emailLog.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: since }
        },
        _count: {
          status: true
        }
      })

      const statMap = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status
        return acc
      }, {} as Record<string, number>)

      const total = Object.values(statMap).reduce((sum, count) => sum + count, 0)
      const sent = statMap.SENT || 0
      const failed = statMap.FAILED || 0
      const bounced = statMap.BOUNCED || 0
      const pending = statMap.PENDING || 0

      const successRate = total > 0 ? (sent / total) * 100 : 0

      return {
        total,
        sent,
        failed,
        bounced,
        pending,
        successRate: Math.round(successRate * 100) / 100
      }
    } catch (error) {
      console.error('Failed to get email stats:', error)
      throw error
    }
  }

  // Get recent email logs
  static async getRecentEmails(limit: number = 50): Promise<EmailLog[]> {
    try {
      const logs = await prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return logs as EmailLog[]
    } catch (error) {
      console.error('Failed to get recent emails:', error)
      throw error
    }
  }

  // Get emails by template
  static async getEmailsByTemplate(template: string, days: number = 30): Promise<EmailLog[]> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const logs = await prisma.emailLog.findMany({
        where: {
          template,
          createdAt: { gte: since }
        },
        orderBy: { createdAt: 'desc' }
      })

      return logs as EmailLog[]
    } catch (error) {
      console.error('Failed to get emails by template:', error)
      throw error
    }
  }

  // Clean up old email logs
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

      const result = await prisma.emailLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      return result.count
    } catch (error) {
      console.error('Failed to cleanup old email logs:', error)
      throw error
    }
  }

  // Handle webhook delivery status updates
  static async handleDeliveryStatus(data: EmailDeliveryStatus): Promise<void> {
    try {
      let status: 'SENT' | 'FAILED' | 'BOUNCED'
      
      switch (data.status) {
        case 'delivered':
          status = 'SENT'
          break
        case 'bounced':
        case 'complained':
          status = 'BOUNCED'
          break
        default:
          status = 'FAILED'
      }

      await this.updateEmailStatus(data.messageId, status, data.reason)
    } catch (error) {
      console.error('Failed to handle delivery status:', error)
      throw error
    }
  }

  // Get failed emails for retry
  static async getFailedEmails(hours: number = 24): Promise<EmailLog[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)

      const logs = await prisma.emailLog.findMany({
        where: {
          status: 'FAILED',
          createdAt: { gte: since }
        },
        orderBy: { createdAt: 'desc' }
      })

      return logs as EmailLog[]
    } catch (error) {
      console.error('Failed to get failed emails:', error)
      throw error
    }
  }
}

// Enhanced email service with tracking
export async function sendTrackedEmail(options: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
}): Promise<{ success: boolean; messageId?: string; logId?: string; error?: string }> {
  try {
    // Import here to avoid circular dependency
    const { sendEmail } = await import('./email')

    // Log email attempt
    const logId = await EmailTracker.logEmail({
      to: options.to,
      subject: options.subject,
      template: options.template,
      status: 'PENDING'
    })

    // Send email
    const result = await sendEmail(options)

    // Update log with result
    if (result.success && result.messageId) {
      await EmailTracker.updateEmailStatus(result.messageId, 'SENT')
    } else {
      await EmailTracker.logEmail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        status: 'FAILED',
        error: result.error
      })
    }

    return {
      success: result.success,
      messageId: result.messageId,
      logId,
      error: result.error
    }
  } catch (error) {
    console.error('Tracked email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Email analytics for cron job
export async function getEmailAnalytics(days: number = 30) {
  return EmailTracker.getEmailStats(days)
}

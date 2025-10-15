import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ecommerce-platform.com'
const DEFAULT_FROM_NAME = process.env.FROM_NAME || 'E-Commerce Platform'

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    const emailPayload: any = {
      from: options.from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    }

    if (options.html) emailPayload.html = options.html
    if (options.text) emailPayload.text = options.text
    if (options.replyTo) emailPayload.replyTo = options.replyTo
    if (options.attachments) emailPayload.attachments = options.attachments

    const { data, error } = await resend.emails.send(emailPayload)

    if (error) {
      console.error('Email sending error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }

    return {
      success: true,
      messageId: data?.id
    }
  } catch (error) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    }
  }
}

export async function sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  )

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Failed to send email'
      }
    }
  })
}

// Email validation utility
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Email template utilities
export function wrapEmailTemplate(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'E-Commerce Platform'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 8px;
        }
        .content {
            margin-bottom: 32px;
        }
        .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 16px 0;
        }
        .button:hover {
            background-color: #4338ca;
        }
        .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #4f46e5;
            text-decoration: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background-color: #f9fafb;
            font-weight: 600;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .mt-4 {
            margin-top: 16px;
        }
        .mb-4 {
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">E-Commerce Platform</div>
            <div>Your trusted online shopping destination</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>
                © ${new Date().getFullYear()} E-Commerce Platform. All rights reserved.
            </p>
            <p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}">Visit our website</a> |
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}/contact">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Error handling and retry logic
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<EmailResult> {
  let lastError: string = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options)
    
    if (result.success) {
      return result
    }

    lastError = result.error || 'Unknown error'
    
    if (attempt < maxRetries) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
  }
}

// Email queue for handling high volume
export interface QueuedEmail extends EmailOptions {
  id: string
  attempts: number
  scheduledAt: Date
  priority: 'low' | 'normal' | 'high'
}

class EmailQueue {
  private queue: QueuedEmail[] = []
  private processing = false

  add(email: EmailOptions, priority: 'low' | 'normal' | 'high' = 'normal'): string {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.queue.push({
      ...email,
      id,
      attempts: 0,
      scheduledAt: new Date(),
      priority
    })

    // Sort by priority (high -> normal -> low)
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    this.processQueue()
    return id
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const email = this.queue.shift()!
      
      try {
        const result = await sendEmail(email)
        
        if (!result.success && email.attempts < 3) {
          // Retry failed emails
          email.attempts++
          email.scheduledAt = new Date(Date.now() + 5000 * email.attempts) // Exponential backoff
          this.queue.push(email)
        }
      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error)
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.processing = false
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing
    }
  }
}

export const emailQueue = new EmailQueue()
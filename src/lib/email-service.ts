import { sendEmail, sendEmailWithRetry, emailQueue } from './email'
import {
  generateOrderConfirmationEmail,
  generateOrderStatusUpdateEmail,
  generatePasswordResetEmail,
  generateWelcomeEmail,
  generateLowStockAlertEmail,
  generatePaymentFailureEmail,
  OrderConfirmationData,
  OrderStatusUpdateData,
  PasswordResetData,
  WelcomeEmailData,
  PaymentFailureData,
} from './email-templates'
import { Product } from '@/types'

export class EmailService {
  // Order-related emails
  static async sendOrderConfirmation(data: OrderConfirmationData, useQueue = false) {
    const emailContent = generateOrderConfirmationEmail(data)
    
    const emailOptions = {
      to: data.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'high')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  static async sendOrderStatusUpdate(data: OrderStatusUpdateData, useQueue = false) {
    const emailContent = generateOrderStatusUpdateEmail(data)
    
    const emailOptions = {
      to: data.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'normal')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  // Authentication-related emails
  static async sendPasswordReset(data: PasswordResetData, useQueue = false) {
    const emailContent = generatePasswordResetEmail(data)
    
    const emailOptions = {
      to: data.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'high')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  static async sendWelcomeEmail(data: WelcomeEmailData, useQueue = false) {
    const emailContent = generateWelcomeEmail(data)
    
    const emailOptions = {
      to: data.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'low')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  static async sendPaymentFailureNotification(data: PaymentFailureData, useQueue = false) {
    const emailContent = generatePaymentFailureEmail(data)
    
    const emailOptions = {
      to: data.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'high')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  // Admin notification emails
  static async sendLowStockAlert(product: Product, currentStock: number, adminEmails: string[], useQueue = false) {
    const emailContent = generateLowStockAlertEmail(product, currentStock)
    
    const emailOptions = {
      to: adminEmails,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'normal')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  // Bulk email utilities
  static async sendBulkNotification(
    recipients: string[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    useQueue = true
  ) {
    const emailOptions = {
      to: recipients,
      subject,
      html: htmlContent,
      text: textContent,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'low')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  // Email verification
  static async sendEmailVerification(userEmail: string, verificationToken: string, useQueue = false) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${verificationToken}`
    
    const htmlContent = `
      <h1>Verify Your Email Address</h1>
      <p>Please click the link below to verify your email address:</p>
      <div class="mt-4 mb-4">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `

    const textContent = `
Verify Your Email Address

Please visit the following link to verify your email address:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
E-Commerce Platform Team
    `

    const emailOptions = {
      to: userEmail,
      subject: 'Verify Your Email Address',
      html: htmlContent,
      text: textContent,
    }

    if (useQueue) {
      const messageId = emailQueue.add(emailOptions, 'high')
      return {
        success: true,
        messageId
      }
    }

    return await sendEmailWithRetry(emailOptions)
  }

  // Newsletter and marketing emails
  static async sendNewsletter(
    recipients: string[],
    subject: string,
    content: string,
    unsubscribeUrl?: string
  ) {
    const htmlContent = `
      ${content}
      ${unsubscribeUrl ? `
        <div class="footer" style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p><a href="${unsubscribeUrl}">Unsubscribe from newsletters</a></p>
        </div>
      ` : ''}
    `

    const messageId = emailQueue.add({
      to: recipients,
      subject,
      html: htmlContent,
    }, 'low')

    return {
      success: true,
      messageId
    }
  }

  // Get email queue status
  static getQueueStatus() {
    return emailQueue.getQueueStatus()
  }

  // Test email functionality
  static async sendTestEmail(recipientEmail: string) {
    const testContent = `
      <h1>Test Email</h1>
      <p>This is a test email to verify that the email service is working correctly.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <div class="mt-4">
        <p><strong>Email Service Status:</strong> ✅ Working</p>
      </div>
    `

    return await sendEmail({
      to: recipientEmail,
      subject: 'Test Email - E-Commerce Platform',
      html: testContent,
      text: `Test Email\n\nThis is a test email to verify that the email service is working correctly.\n\nSent at: ${new Date().toISOString()}\n\nEmail Service Status: Working`,
    })
  }
}

// Export singleton instance
export const emailService = EmailService
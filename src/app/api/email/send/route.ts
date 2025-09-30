import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, validateEmail } from '@/lib/email'
import { OrderConfirmationData, OrderStatusUpdateData, PasswordResetData, WelcomeEmailData } from '@/lib/email-templates'
import { z } from 'zod'

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().optional(),
  text: z.string().optional(),
  template: z.enum(['order-confirmation', 'order-status-update', 'password-reset', 'welcome', 'low-stock-alert']).optional(),
  templateData: z.record(z.any()).optional(),
}).refine(data => data.html || data.text || data.template, {
  message: 'Either html, text, or template must be provided'
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (only admins can send arbitrary emails)
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = sendEmailSchema.parse(body)

    // If template is specified, generate content from template
    let emailContent: {
      subject?: string
      html?: string
      text?: string
    } = {
      html: validatedData.html,
      text: validatedData.text
    }

    if (validatedData.template && validatedData.templateData) {
      // Import templates dynamically to avoid circular dependencies
      const templates = await import('@/lib/email-templates')
      
      switch (validatedData.template) {
        case 'order-confirmation':
          emailContent = templates.generateOrderConfirmationEmail(validatedData.templateData as OrderConfirmationData)
          break
        case 'order-status-update':
          emailContent = templates.generateOrderStatusUpdateEmail(validatedData.templateData as OrderStatusUpdateData)
          break
        case 'password-reset':
          emailContent = templates.generatePasswordResetEmail(validatedData.templateData as PasswordResetData)
          break
        case 'welcome':
          emailContent = templates.generateWelcomeEmail(validatedData.templateData as WelcomeEmailData)
          break
        case 'low-stock-alert':
          emailContent = templates.generateLowStockAlertEmail(
            validatedData.templateData.product,
            validatedData.templateData.currentStock
          )
          break
        default:
          return NextResponse.json(
            { error: 'Invalid template specified' },
            { status: 400 }
          )
      }
    }

    const result = await sendEmail({
      to: validatedData.to,
      subject: emailContent.subject || validatedData.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    if (result.success) {
      return NextResponse.json({
        message: 'Email sent successfully',
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return email service status and configuration info
    const isConfigured = !!process.env.RESEND_API_KEY
    
    return NextResponse.json({
      configured: isConfigured,
      provider: 'Resend',
      templates: [
        'order-confirmation',
        'order-status-update',
        'password-reset',
        'welcome',
        'low-stock-alert'
      ],
      fromEmail: process.env.FROM_EMAIL || 'noreply@ecommerce-platform.com',
      fromName: process.env.FROM_NAME || 'E-Commerce Platform',
    })
  } catch (error) {
    console.error('Email status error:', error)
    return NextResponse.json(
      { error: 'Failed to get email service status' },
      { status: 500 }
    )
  }
}
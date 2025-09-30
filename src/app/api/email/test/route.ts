import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emailService } from '@/lib/email-service'
import { z } from 'zod'

const testEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['basic', 'welcome', 'order-confirmation']).default('basic'),
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, type } = testEmailSchema.parse(body)

    let result

    switch (type) {
      case 'basic':
        result = await emailService.sendTestEmail(email)
        break
        
      case 'welcome':
        result = await emailService.sendWelcomeEmail({
          user: {
            email,
            name: 'Test User',
          }
        })
        break
        
      case 'order-confirmation':
        return NextResponse.json(
          { error: 'Order confirmation test disabled. Use real orders instead.' },
          { status: 400 }
        )
        
      default:
        return NextResponse.json(
          { error: 'Invalid test email type' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({
        message: `Test email sent successfully to ${email}`,
        type,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test email API error:', error)
    
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
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Return email service status and queue info
    const queueStatus = emailService.getQueueStatus()
    const isConfigured = !!process.env.RESEND_API_KEY

    return NextResponse.json({
      emailService: {
        configured: isConfigured,
        provider: 'Resend',
        fromEmail: process.env.FROM_EMAIL || 'noreply@ecommerce-platform.com',
        fromName: process.env.FROM_NAME || 'E-Commerce Platform',
      },
      queue: queueStatus,
      testTypes: ['basic', 'welcome', 'order-confirmation'],
    })
  } catch (error) {
    console.error('Email test status error:', error)
    return NextResponse.json(
      { error: 'Failed to get email test status' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db-utils'
import { EmailService } from '@/lib/email-service'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration attacks
    const successResponse = NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

    if (!user) {
      return successResponse
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      }
    })

    // Send password reset email
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`
      
      await EmailService.sendPasswordReset({
        user,
        resetToken,
        resetUrl
      }, true) // Use queue

      console.log(`Password reset email sent to ${user.email}`)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      
      // Clean up the reset token if email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        }
      })

      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      )
    }

    return successResponse

  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
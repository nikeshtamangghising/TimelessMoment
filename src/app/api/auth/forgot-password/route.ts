import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const user = userResult[0] || null

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
    await db.update(users)
      .set({
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Send password reset email
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`
      
      await EmailService.sendPasswordReset({
        user,
        resetToken,
        resetUrl
      }, true) // Use queue

    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      
      // Clean up the reset token if email failed
      await db.update(users)
        .set({
          resetToken: null,
          resetTokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

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
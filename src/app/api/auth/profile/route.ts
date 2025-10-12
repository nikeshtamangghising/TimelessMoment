import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
})

export const PUT = createAuthHandler(async (request: NextRequest) => {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parse = updateProfileSchema.safeParse(body)

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parse.error.issues },
        { status: 400 }
      )
    }

    const { name, email } = parse.data

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})

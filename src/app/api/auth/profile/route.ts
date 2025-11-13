import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'

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
    const existingUserResult = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, session.user.id)))
      .limit(1)

    if (existingUserResult.length > 0) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 400 }
      )
    }

    // Update user profile
    const [updatedUser] = await db.update(users)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})

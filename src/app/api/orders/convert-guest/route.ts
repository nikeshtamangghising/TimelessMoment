import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const convertGuestOrderSchema = z.object({
  guestEmail: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parse = convertGuestOrderSchema.safeParse(body)
    
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parse.error.issues },
        { status: 400 }
      )
    }

    const { guestEmail, name, password } = parse.data

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: guestEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Check if there are guest orders for this email
    const guestOrders = await prisma.order.findMany({
      where: {
        guestEmail,
        isGuestOrder: true
      }
    })

    if (guestOrders.length === 0) {
      return NextResponse.json(
        { error: 'No guest orders found for this email address' },
        { status: 404 }
      )
    }

    // Create new user account
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const newUser = await prisma.user.create({
      data: {
        email: guestEmail,
        name,
        password: hashedPassword,
        role: 'CUSTOMER'
      }
    })

    // Convert guest orders to user orders
    await prisma.order.updateMany({
      where: {
        guestEmail,
        isGuestOrder: true
      },
      data: {
        userId: newUser.id,
        isGuestOrder: false,
        guestEmail: null,
        guestName: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully and guest orders have been linked to your account',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert guest orders' },
      { status: 500 }
    )
  }
}

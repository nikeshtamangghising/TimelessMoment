import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { addressRepository } from '@/lib/address-repository'

const createAddressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING']).default('SHIPPING'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().default('Nepal'),
  isDefault: z.boolean().default(false),
})

export const GET = createAuthHandler(async (request: NextRequest) => {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await addressRepository.findByUserId(session.user.id)

    return NextResponse.json({ addresses })

  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
})

export const POST = createAuthHandler(async (request: NextRequest) => {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parse = createAddressSchema.safeParse(body)

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parse.error.issues },
        { status: 400 }
      )
    }

    const addressData = parse.data

    // If this is set as default, remove default from other addresses
    if (addressData.isDefault) {
      await addressRepository.clearDefaultAddresses(session.user.id, addressData.type)
    }

    const address = await addressRepository.create({
      ...addressData,
      userId: session.user.id,
    })

    return NextResponse.json({ address }, { status: 201 })

  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    )
  }
})

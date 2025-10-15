import { NextRequest, NextResponse } from 'next/server'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { addressRepository } from '@/lib/address-repository'
import { updateAddressSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const GET = createAuthHandler<RouteParams>(async (
  request: NextRequest,
  context?: RouteParams
) => {
  if (!context) {
    return NextResponse.json(
      { error: 'Invalid route parameters' },
      { status: 400 }
    )
  }

  const { params } = context
  try {
    const resolvedParams = await params
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const address = await addressRepository.findById(resolvedParams.id)

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // Check if user owns this address
    if (address.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ address })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    )
  }
})

export const PUT = createAuthHandler<RouteParams>(async (
  request: NextRequest,
  context?: RouteParams
) => {
  if (!context) {
    return NextResponse.json(
      { error: 'Invalid route parameters' },
      { status: 400 }
    )
  }

  const { params } = context
  try {
    const resolvedParams = await params
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parse = updateAddressSchema.safeParse(body)

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parse.error.issues },
        { status: 400 }
      )
    }

    // Check if address exists and user owns it
    const existingAddress = await addressRepository.findById(resolvedParams.id)
    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const updatedAddress = await addressRepository.update(resolvedParams.id, parse.data)

    return NextResponse.json({ address: updatedAddress })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
})

export const DELETE = createAuthHandler<RouteParams>(async (
  request: NextRequest,
  context?: RouteParams
) => {
  if (!context) {
    return NextResponse.json(
      { error: 'Invalid route parameters' },
      { status: 400 }
    )
  }

  const { params } = context
  try {
    const resolvedParams = await params
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if address exists and user owns it
    const existingAddress = await addressRepository.findById(resolvedParams.id)
    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await addressRepository.delete(resolvedParams.id)

    return NextResponse.json({ message: 'Address deleted successfully' })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
})

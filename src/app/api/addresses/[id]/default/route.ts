import { NextRequest, NextResponse } from 'next/server'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { addressRepository } from '@/lib/address-repository'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const POST = createAuthHandler<RouteParams>(async (
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

    const updatedAddress = await addressRepository.setDefaultAddress(resolvedParams.id)

    return NextResponse.json({ address: updatedAddress })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set default address' },
      { status: 500 }
    )
  }
})

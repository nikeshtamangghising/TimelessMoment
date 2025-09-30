import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function withAuth<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>,
  context?: T
) {
  const token = await getToken({ req: request })

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return handler(request, context)
}

export async function withAdminAuth<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>,
  context?: T
) {
  const token = await getToken({ req: request })

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (token.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  return handler(request, context)
}

export function createAuthHandler<T = any>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T) => {
    return withAuth(request, handler, context)
  }
}

export function createAdminHandler<T = any>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T) => {
    return withAdminAuth(request, handler, context)
  }
}

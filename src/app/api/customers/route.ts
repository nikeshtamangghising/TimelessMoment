import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      role: 'CUSTOMER'
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add status filter
    if (status === 'active') {
      where.orders = {
        some: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }
    } else if (status === 'inactive') {
      where.orders = {
        none: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }
    }

    // Get customers with their order statistics
    const customers = await prisma.user.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    // Transform the data to match the expected format
    const transformedCustomers = customers.map(customer => {
      const totalOrders = customer._count.orders
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const lastOrder = customer.orders.length > 0 
        ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        joinedAt: customer.createdAt.toISOString(),
        totalOrders,
        totalSpent,
        isActive: totalOrders > 0 && lastOrder && 
          new Date(lastOrder.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastOrderDate: lastOrder?.createdAt.toISOString(),
        role: customer.role,
        emailVerified: customer.emailVerified?.toISOString()
      }
    })

    return NextResponse.json({
      data: transformedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
})

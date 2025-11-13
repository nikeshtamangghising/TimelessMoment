import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailService } from '@/lib/email-service'
import { db } from '@/lib/db-utils'
import { products, users } from '@/lib/db/schema'
import { eq, and, lte, asc, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { threshold = 5 } = body // Default threshold of 5 items

    // Get products with low stock
    const productsResult = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        lte(products.inventory, threshold)
      ),
      with: {
        category: {
          columns: {
            name: true
          }
        }
      },
      limit: 100,
      orderBy: asc(products.inventory)
    })
    
    const lowStockProducts = {
      data: productsResult
    }

    if (lowStockProducts.data.length === 0) {
      return NextResponse.json({
        message: 'No low stock products found',
        threshold,
        count: 0
      })
    }

    // Get all admin users
    const adminUsers = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.role, 'ADMIN'))

    const adminEmails = adminUsers.map(admin => admin.email)

    if (adminEmails.length === 0) {
      return NextResponse.json(
        { error: 'No admin users found to send alerts to' },
        { status: 400 }
      )
    }

    // Send low stock alerts for each product
    const emailResults = await Promise.allSettled(
      lowStockProducts.data.map(product =>
        EmailService.sendLowStockAlert(product, product.inventory, adminEmails, true)
      )
    )

    const successCount = emailResults.filter(result => result.status === 'fulfilled').length
    const failureCount = emailResults.length - successCount

    return NextResponse.json({
      message: `Low stock alerts processed`,
      threshold,
      productsFound: lowStockProducts.data.length,
      emailsSent: successCount,
      emailsFailed: failureCount,
      adminEmails: adminEmails.length,
      products: lowStockProducts.data.map(p => ({
        id: p.id,
        name: p.name,
        inventory: p.inventory
      }))
    })

  } catch (error) {
    console.error('Low stock alert error:', error)
    return NextResponse.json(
      { error: 'Failed to send low stock alerts' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const threshold = 5

    // Get products with low stock
    const productsResult = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        lte(products.inventory, threshold)
      ),
      with: {
        category: {
          columns: {
            name: true
          }
        }
      },
      limit: 100,
      orderBy: asc(products.inventory)
    })
    
    const lowStockProducts = {
      data: productsResult
    }

    // Get admin count
    const adminCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'ADMIN'))
    const adminCount = Number(adminCountResult[0]?.count || 0)

    return NextResponse.json({
      threshold,
      lowStockCount: lowStockProducts.data.length,
      adminCount,
      products: lowStockProducts.data.map(p => ({
        id: p.id,
        name: p.name,
        inventory: p.inventory,
        category: p.category,
        price: p.price
      }))
    })

  } catch (error) {
    console.error('Low stock check error:', error)
    return NextResponse.json(
      { error: 'Failed to check low stock products' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateInvoicePDF } from '@/lib/invoice-generator'

// Import Prisma client - adjust path as needed
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Fetch order with all necessary relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        shippingAddress: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this order
    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = order.userId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate invoice (text format for now - install PDFKit for PDF)
    const invoiceBuffer = await generateInvoicePDF(order)

    // Set response headers for text download (change to PDF when PDFKit is installed)
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="invoice-${order.id.slice(-8).toUpperCase()}.txt"`)
    headers.set('Content-Length', invoiceBuffer.length.toString())

    return new NextResponse(invoiceBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateInvoicePDF } from '@/lib/invoice-generator'

// Import Prisma client - adjust path as needed
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id

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
        }
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

    // Generate PDF invoice
    console.log('Generating PDF invoice for order:', orderId)
    const invoiceBuffer = await generateInvoicePDF(order)
    console.log('Invoice buffer generated, size:', invoiceBuffer.length)
    
    if (!invoiceBuffer || invoiceBuffer.length === 0) {
      console.error('Invoice buffer is empty or null')
      throw new Error('Failed to generate invoice content - empty buffer')
    }

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="invoice-${order.id.slice(-8).toUpperCase()}.pdf"`)
    headers.set('Content-Length', invoiceBuffer.length.toString())
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(invoiceBuffer as BodyInit, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Invoice generation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to generate invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { orderProcessingService } from '@/lib/order-processing-service'

export async function GET() {
  try {
    // Process pending orders (move to PROCESSING)
    const pendingResult = await orderProcessingService.processPendingOrders()

    // Ship orders that have been processing (move to SHIPPED)
    const shippingResult = await orderProcessingService.shipProcessingOrders()

    // Get current status
    const status = await orderProcessingService.getOrdersNeedingProcessing()

    return NextResponse.json({
      success: true,
      message: 'Order processing completed',
      results: {
        pendingProcessed: pendingResult,
        shippingProcessed: shippingResult,
        currentStatus: status,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error in order processing cron:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Order processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

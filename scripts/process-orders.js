#!/usr/bin/env node

/**
 * Order Processing Cron Job
 * Run this script to process orders automatically
 * Usage: npm run cron:orders
 */

import { orderProcessingService } from '../src/lib/order-processing-service'

async function runOrderProcessing() {
  console.log('🚀 Starting order processing...')

  try {
    // Process pending orders
    console.log('📦 Processing pending orders...')
    const pendingResult = await orderProcessingService.processPendingOrders()
    console.log(`✅ Processed ${pendingResult.processedCount}/${pendingResult.total} pending orders`)

    // Ship processing orders
    console.log('🚚 Shipping processing orders...')
    const shippingResult = await orderProcessingService.shipProcessingOrders()
    console.log(`✅ Shipped ${shippingResult.shippedCount}/${shippingResult.total} processing orders`)

    // Get current status
    const status = await orderProcessingService.getOrdersNeedingProcessing()
    console.log('📊 Current order status:', status)

    console.log('🎉 Order processing completed successfully!')

  } catch (error) {
    console.error('❌ Error during order processing:', error)
    process.exit(1)
  }
}

// Run the processing
runOrderProcessing()

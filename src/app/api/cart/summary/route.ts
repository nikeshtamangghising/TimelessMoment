import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCartSummaryWithSettings } from '@/lib/cart-utils'
import { productRepository } from '@/lib/product-repository'

// Validation schema for cart summary request
const cartSummarySchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    product: z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      discountPrice: z.number().optional(),
      images: z.array(z.string()),
      slug: z.string(),
    }).optional(),
  })).min(1, 'Cart must have at least one item'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('Cart summary API called')
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const validationResult = cartSummarySchema.safeParse(body)
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { items } = validationResult.data

    // Validate and enrich cart items with current product data
    const cartItems = []
    for (const item of items) {
      let product = item.product
      
      // If product data is not provided, fetch from database
      if (!product) {
        const dbProduct = await productRepository.findById(item.productId)
        
        if (!dbProduct) {
          return NextResponse.json(
            { error: `Product ${item.productId} not found` },
            { status: 404 }
          )
        }

        if (!dbProduct.isActive) {
          return NextResponse.json(
            { error: `Product ${dbProduct.name} is no longer available` },
            { status: 400 }
          )
        }

        product = {
          id: dbProduct.id,
          name: dbProduct.name,
          price: dbProduct.price,
          discountPrice: dbProduct.discountPrice,
          images: dbProduct.images,
          slug: dbProduct.slug,
        }
      }

      cartItems.push({
        productId: item.productId,
        quantity: item.quantity,
        product,
      })
    }

    console.log('Processing cart items:', cartItems.length)
    
    // Calculate summary using database settings
    const summary = await getCartSummaryWithSettings(cartItems)
    console.log('Calculated summary:', summary)

    return NextResponse.json({
      success: true,
      summary: {
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        tax: summary.tax,
        total: summary.total,
        itemsCount: summary.itemsCount,
        freeShippingThreshold: summary.freeShippingThreshold,
        freeShippingRemaining: summary.freeShippingRemaining,
        taxRate: summary.taxRate,
        shippingRate: summary.shippingRate,
      },
    })

  } catch (error) {
    console.error('Error calculating cart summary:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
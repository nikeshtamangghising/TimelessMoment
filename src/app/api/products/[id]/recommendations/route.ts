import { NextRequest, NextResponse } from 'next/server'
import { productRepository } from '@/lib/product-repository'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get the current product to find its category
    const currentProduct = await productRepository.findById(id)
    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get recommended products from the same category
    const recommendations = await productRepository.getRelatedProducts(
      id,
      currentProduct.categoryId,
      5 // Limit to 5 recommendations
    )

    return NextResponse.json({
      success: true,
      data: recommendations
    })

  } catch (error) {
    console.error('Error fetching product recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

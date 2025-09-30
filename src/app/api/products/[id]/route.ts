import { NextRequest, NextResponse } from 'next/server'
import { productRepository } from '@/lib/product-repository'
import { updateProductSchema } from '@/lib/validations'
import { createAdminHandler } from '@/lib/auth-middleware'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const product = await productRepository.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PUT = createAdminHandler<RouteParams>(async (
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
    const body = await request.json()
    
    const validationResult = updateProductSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await productRepository.findById(params.id)
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if slug is being updated and if it conflicts
    if (validationResult.data.slug && validationResult.data.slug !== existingProduct.slug) {
      const slugConflict = await productRepository.findBySlug(validationResult.data.slug)
      if (slugConflict && slugConflict.id !== params.id) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const updatedProduct = await productRepository.update(params.id, validationResult.data)

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = createAdminHandler<RouteParams>(async (
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
    // Check if product exists
    const existingProduct = await productRepository.findById(params.id)
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Instead of hard delete, we'll soft delete by setting isActive to false
    // This preserves order history
    const updatedProduct = await productRepository.update(params.id, { isActive: false })

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
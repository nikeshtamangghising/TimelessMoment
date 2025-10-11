import { NextRequest, NextResponse } from 'next/server'
import { productRepository } from '@/lib/product-repository'
import { updateProductSchema } from '@/lib/validations'
import { createAdminHandler } from '@/lib/auth-middleware'

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
    console.log('Fetching product with ID:', id)
    
    // Validate the ID format
    if (!id) {
      console.log('Invalid product ID provided')
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }
    
    const product = await productRepository.findById(id)
    console.log('Product lookup result:', product ? 'Found' : 'Not found')

    if (!product) {
      console.log('Product not found for ID:', id)
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
  
  const { params: paramsPromise } = context
  try {
    const [body, params] = await Promise.all([
      request.json(),
      paramsPromise
    ])
    
    console.log('Update request for product ID:', params.id)
    console.log('Update data:', body)
    
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
    
    console.log('Existing product found:', existingProduct.id, existingProduct.name)

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

    // Check if SKU is being updated and if it conflicts
    if (validationResult.data.sku && validationResult.data.sku !== existingProduct.sku) {
      const skuConflict = await productRepository.findBySku(validationResult.data.sku)
      if (skuConflict && skuConflict.id !== params.id) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    const updatedProduct = await productRepository.update(params.id, validationResult.data)
    console.log('Product updated successfully:', updatedProduct.id, updatedProduct.name)

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof Error) {
      // Handle Prisma unique constraint violations
      if (error.message.includes('Unique constraint failed on the fields: (`sku`)')) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists. Please use a different SKU.' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Unique constraint failed on the fields: (`slug`)')) {
        return NextResponse.json(
          { error: 'A product with this slug already exists. Please use a different slug.' },
          { status: 400 }
        )
      }
      
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
  
  const { params: paramsPromise } = context
  try {
    const params = await paramsPromise
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
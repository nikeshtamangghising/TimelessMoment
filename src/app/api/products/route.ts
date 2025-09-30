import { NextRequest, NextResponse } from 'next/server'
import { productRepository } from '@/lib/product-repository'
import { createProductSchema, paginationSchema, productFiltersSchema } from '@/lib/validations'
import { createAdminHandler } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const paginationResult = paginationSchema.safeParse({ page, limit })
    if (!paginationResult.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Parse filter parameters
    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    }

    const filtersResult = productFiltersSchema.safeParse(filters)
    if (!filtersResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400 }
      )
    }

    const result = await productRepository.findMany(
      filtersResult.data,
      paginationResult.data
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    const validationResult = createProductSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingProduct = await productRepository.findBySlug(validationResult.data.slug)
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      )
    }

    const product = await productRepository.create(validationResult.data)

    return NextResponse.json(
      { 
        message: 'Product created successfully',
        product 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating product:', error)
    
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
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

    // Parse filter parameters (ignore _t cache-busting parameter)
    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      sort: searchParams.get('sort') || undefined,
    }
    
    console.log('API: Received filters:', filters)

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

    // Normalize and backfill optional/derived fields to avoid nulls
    const input = validationResult.data as any

    // Slug fallback from name
    if (!input.slug && input.name) {
      input.slug = input.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || `product-${Date.now()}`
    }

    // Currency default
    if (!input.currency) {
      input.currency = 'NPR'
    }

    // Arrays default
    input.images = Array.isArray(input.images) ? input.images : []
    input.tags = Array.isArray(input.tags) ? input.tags : (input.tags ? [String(input.tags)] : [])

    // Short description fallback
    if (!input.shortDescription && input.description) {
      input.shortDescription = String(input.description).slice(0, 180)
    }

    // Meta fallbacks
    if (!input.metaTitle && input.name) {
      input.metaTitle = input.name
    }
    if (!input.metaDescription && (input.shortDescription || input.description)) {
      input.metaDescription = (input.shortDescription || input.description).slice(0, 160)
    }

    // SKU fallback (simple)
    if (!input.sku && input.name) {
      input.sku = input.name.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 10) + '-' + Date.now().toString().slice(-4)
    }

    // Ensure discountPrice < price
    if (input.discountPrice !== undefined && input.discountPrice !== null) {
      const dp = Number(input.discountPrice)
      const p = Number(input.price)
      if (!isNaN(dp) && !isNaN(p) && dp >= p) {
        // If discount is not less than price, drop the discount
        input.discountPrice = null
      }
    }

    // Dimensions shape: allow null or object with numeric fields
    if (input.dimensions && typeof input.dimensions === 'object') {
      const d = input.dimensions
      const clean = {
        length: d.length ? Number(d.length) : undefined,
        width: d.width ? Number(d.width) : undefined,
        height: d.height ? Number(d.height) : undefined,
      }
      if (!clean.length && !clean.width && !clean.height) {
        input.dimensions = null
      } else {
        input.dimensions = clean
      }
    }

    // Check if slug already exists (after normalization)
    const existingProduct = await productRepository.findBySlug(input.slug)
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      )
    }

    const product = await productRepository.create(input)

    // After creation, upsert Material and Color attributes if provided on raw body
    try {
      const raw = body as any
      const attrs: { name: string; value: string }[] = []
      if (typeof raw.material === 'string' && raw.material.trim()) {
        attrs.push({ name: 'Material', value: raw.material.trim() })
      }
      if (typeof raw.color === 'string' && raw.color.trim()) {
        attrs.push({ name: 'Color', value: raw.color.trim() })
      }
      if (attrs.length > 0) {
        await prisma.productAttribute.deleteMany({
          where: { productId: product.id, name: { in: attrs.map(a => a.name) } }
        })
        for (const attr of attrs) {
          await prisma.productAttribute.create({ data: { productId: product.id, name: attr.name, value: attr.value } })
        }
      }
    } catch (e) {
      console.warn('Attribute upsert skipped:', e)
    }

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

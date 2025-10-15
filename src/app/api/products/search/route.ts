import { NextRequest, NextResponse } from 'next/server'
import { productRepository } from '@/lib/product-repository'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limitParam = searchParams.get('limit')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        products: [],
        message: 'Query must be at least 2 characters long'
      })
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10
    const validLimit = Math.min(Math.max(limit, 1), 20) // Between 1-20

    // Search products using the repository
    const searchResults = await productRepository.searchProducts(query.trim(), 20)

    // Format results for autocomplete
    const products = searchResults.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      category: (product as any).category,
      images: product.images || []
    }))

    return NextResponse.json({
      products,
      total: searchResults.length,
      query: query.trim()
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        products: []
      },
      { status: 500 }
    )
  }
}

// Optional: Support POST for more complex search queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filters = {}, limit = 10 } = body
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        products: [],
        message: 'Query must be at least 2 characters long'
      })
    }

    const validLimit = Math.min(Math.max(limit, 1), 20)

    const searchResults = await productRepository.searchProducts(query.trim(), validLimit)

    const products = searchResults.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      category: (product as any).category,
      images: product.images || []
    }))

    return NextResponse.json({
      products,
      total: searchResults.length,
      query: query.trim(),
      filters
    })

  } catch (error) {
    console.error('Search API POST error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        products: []
      },
      { status: 500 }
    )
  }
}
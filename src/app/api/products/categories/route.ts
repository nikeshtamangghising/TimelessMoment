import { NextRequest, NextResponse } from 'next/server'
import { productRepository } from '@/lib/product-repository'

export async function GET(request: NextRequest) {
  try {
    const categories = await productRepository.getCategories()

    return NextResponse.json({
      categories
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
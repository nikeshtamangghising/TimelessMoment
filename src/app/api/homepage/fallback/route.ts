import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Fallback data for when the main API fails
  const fallbackData = {
    featured: [],
    popular: [],
    newArrivals: [],
    categories: [
      'Electronics',
      'Clothing',
      'Books',
      'Home & Garden',
      'Sports',
      'Beauty',
      'Toys',
      'Automotive'
    ]
  }

  return NextResponse.json(fallbackData, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  })
}
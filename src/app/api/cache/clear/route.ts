import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS, clearMemoryCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    // Clear memory cache
    clearMemoryCache()
    
    // Revalidate Next.js cache tags
    revalidateTag(CACHE_TAGS.PRODUCTS)
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidateTag(CACHE_TAGS.PRODUCT)
    
    // Revalidate specific paths
    revalidatePath('/products')
    revalidatePath('/categories')
    revalidatePath('/')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use POST method to clear cache' 
  }, { status: 405 })
}

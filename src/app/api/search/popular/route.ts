import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { eq, gt, desc } from 'drizzle-orm'

export async function GET() {
  try {
    // Get popular search terms from actual product data
    // This could be enhanced with actual search analytics in the future
    const popularProducts = await db.query.products.findMany({
      columns: {
        name: true,
      },
      with: {
        category: {
          columns: {
            name: true
          }
        }
      },
      where: (products, { eq, gt, and }) => and(
        eq(products.isActive, true),
        gt(products.inventory, 0)
      ),
      orderBy: [
        desc(products.popularityScore),
        desc(products.viewCount)
      ],
      limit: 20
    })

    // Extract search terms from product names and categories
    const searchTerms = new Set<string>()
    
    popularProducts.forEach(product => {
      // Add category names
      if (product.category?.name) {
        searchTerms.add(product.category.name)
      }
      
      // Extract meaningful words from product names
      const words = product.name
        .toLowerCase()
        .split(/[\s\-_,]+/)
        .filter(word => 
          word.length > 2 && 
          !['the', 'and', 'for', 'with', 'pro', 'new', 'best'].includes(word)
        )
      
      words.forEach(word => {
        if (word.length > 3) {
          // Capitalize first letter
          searchTerms.add(word.charAt(0).toUpperCase() + word.slice(1))
        }
      })
    })

    // Convert to array and get top searches
    const searches = Array.from(searchTerms).slice(0, 12)
    
    // Add some common fallback searches if we don't have enough
    const fallbackSearches = [
      'Laptop', 'Phone', 'Headphones', 'Watch', 'Camera', 
      'Tablet', 'Speaker', 'Mouse', 'Keyboard', 'Monitor'
    ]
    
    const finalSearches = [...searches]
    fallbackSearches.forEach(term => {
      if (finalSearches.length < 10 && !finalSearches.includes(term)) {
        finalSearches.push(term)
      }
    })

    return NextResponse.json({
      success: true,
      searches: finalSearches.slice(0, 10)
    })

  } catch (error) {
    console.error('Error fetching popular searches:', error)
    
    // Return fallback popular searches
    return NextResponse.json({
      success: true,
      searches: [
        'Laptop', 'Phone', 'Headphones', 'Watch', 'Camera',
        'Tablet', 'Speaker', 'Mouse', 'Keyboard', 'Monitor'
      ]
    })
  }
}
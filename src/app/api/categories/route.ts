import { NextRequest, NextResponse } from 'next/server'
import { categoryRepository } from '@/lib/category-repository'
import { createAdminHandler } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const search = searchParams.get('search')

    let categories

    switch (type) {
      case 'navigation':
        categories = await categoryRepository.getNavigationCategories()
        break
      case 'hierarchy':
        categories = await categoryRepository.getRootCategoriesWithChildren()
        break
      case 'flat':
        categories = await categoryRepository.getAllFlat()
        break
      case 'search':
        if (!search) {
          return NextResponse.json(
            { error: 'Search query is required' },
            { status: 400 }
          )
        }
        categories = await categoryRepository.search(search)
        break
      default:
        categories = await categoryRepository.getAllFlat()
    }

    return NextResponse.json({
      categories,
      count: categories.length
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, slug, description, parentId, metaTitle, metaDescription } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Auto-generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if name or slug already exists
    const existingCategoryResult = await db.select()
      .from(categories)
      .where(
        or(
          eq(categories.name, name),
          eq(categories.slug, finalSlug)
        )
      )
      .limit(1)

    if (existingCategoryResult.length > 0) {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 400 }
      )
    }

    // If parentId is provided, check if parent exists
    if (parentId) {
      const parentCategoryResult = await db.select()
        .from(categories)
        .where(eq(categories.id, parentId))
        .limit(1)

      if (parentCategoryResult.length === 0) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const [category] = await db.insert(categories)
      .values({
        name,
        slug: finalSlug,
        description: description || null,
        parentId: parentId || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        image: null
      })
      .returning()

    return NextResponse.json(
      { 
        message: 'Category created successfully',
        category 
      },
      { status: 201 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

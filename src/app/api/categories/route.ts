import { NextRequest, NextResponse } from 'next/server'
import { categoryRepository } from '@/lib/category-repository'
import { createAdminHandler } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, slug, description, parentId, metaTitle, metaDescription, image } = body

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
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: finalSlug }
        ]
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 400 }
      )
    }

    // If parentId is provided, check if parent exists
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        parentId: parentId || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        image: image || null
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        metaTitle: true,
        metaDescription: true,
        image: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        message: 'Category created successfully',
        category 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

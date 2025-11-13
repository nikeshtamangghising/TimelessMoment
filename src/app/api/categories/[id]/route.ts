import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schema'
import { eq, and, or, ne, asc, sql, count } from 'drizzle-orm'
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
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        parentCategory: {
          columns: {
            id: true,
            name: true
          }
        },
        childCategories: {
          columns: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          },
          orderBy: asc(categories.sortOrder)
        }
      }
    })

    if (category) {
      // Get product count and children count
      const [productCount, childrenCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.categoryId, id)),
        db.select({ count: sql<number>`count(*)` })
          .from(categories)
          .where(eq(categories.parentId, id))
      ])

      // Add counts to category object
      const categoryWithCounts = {
        ...category,
        _count: {
          products: Number(productCount[0]?.count || 0),
          children: Number(childrenCount[0]?.count || 0)
        }
      }
      return NextResponse.json(categoryWithCounts)
    }

    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )

  } catch (error) {
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
    
    const { name, slug, description, parentId, metaTitle, metaDescription, isActive, sortOrder } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategoryResult = await db.select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1)
    const existingCategory = existingCategoryResult[0] || null

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name or slug conflicts with other categories
    const conflictingCategoryResult = await db.select()
      .from(categories)
      .where(
        and(
          ne(categories.id, params.id),
          or(
            eq(categories.name, name),
            eq(categories.slug, slug)
          )
        )
      )
      .limit(1)
    const conflictingCategory = conflictingCategoryResult[0] || null

    if (conflictingCategory) {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 400 }
      )
    }

    // If parentId is provided, check if parent exists and prevent circular reference
    if (parentId) {
      if (parentId === params.id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      const parentCategoryResult = await db.select()
        .from(categories)
        .where(eq(categories.id, parentId))
        .limit(1)
      const parentCategory = parentCategoryResult[0] || null

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }

      // Check for circular reference (if parent's parent chain includes this category)
      let currentParentId = parentCategory.parentId
      while (currentParentId) {
        if (currentParentId === params.id) {
          return NextResponse.json(
            { error: 'This would create a circular reference' },
            { status: 400 }
          )
        }
        
        const parentOfParentResult = await db.select({ parentId: categories.parentId })
          .from(categories)
          .where(eq(categories.id, currentParentId))
          .limit(1)
        const parentOfParent = parentOfParentResult[0]
        
        currentParentId = parentOfParent?.parentId || null
      }
    }

    const [updatedCategory] = await db.update(categories)
      .set({
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        image: null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? existingCategory.sortOrder,
        updatedAt: new Date()
      })
      .where(eq(categories.id, params.id))
      .returning()

    // Get related data
    const categoryWithRelations = await db.query.categories.findFirst({
      where: eq(categories.id, params.id),
      with: {
        parentCategory: {
          columns: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get counts
    const [productCount, childrenCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, params.id)),
      db.select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(eq(categories.parentId, params.id))
    ])

    const categoryWithCounts = {
      ...updatedCategory,
      parent: categoryWithRelations?.parentCategory || null,
      _count: {
        products: Number(productCount[0]?.count || 0),
        children: Number(childrenCount[0]?.count || 0)
      }
    }

    return NextResponse.json({
      message: 'Category updated successfully',
      category: categoryWithCounts
    })

  } catch (error) {
    
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

    // Check if category exists and has products or children
    const categoryResult = await db.select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1)
    const categoryToDelete = categoryResult[0] || null

    if (!categoryToDelete) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get counts
    const [productCount, childrenCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, params.id)),
      db.select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(eq(categories.parentId, params.id))
    ])

    const productCountNum = Number(productCount[0]?.count || 0)
    const childrenCountNum = Number(childrenCount[0]?.count || 0)

    if (productCountNum > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated products. Move products to another category first.' },
        { status: 400 }
      )
    }

    if (childrenCountNum > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with child categories. Delete or move child categories first.' },
        { status: 400 }
      )
    }

    // Safe to delete
    const [deletedCategory] = await db.delete(categories)
      .where(eq(categories.id, params.id))
      .returning()

    return NextResponse.json({
      message: 'Category deleted successfully',
      category: deletedCategory
    })

  } catch (error) {
    
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
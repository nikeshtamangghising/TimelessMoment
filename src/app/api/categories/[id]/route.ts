import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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
    const category = await prisma.category.findUnique({
      where: { id },
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
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)

  } catch (error) {
    console.error('Error fetching category:', error)
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
    
    const { name, slug, description, parentId, metaTitle, metaDescription, image, isActive, sortOrder } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name or slug conflicts with other categories
    const conflictingCategory = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: params.id } },
          {
            OR: [
              { name: name },
              { slug: slug }
            ]
          }
        ]
      }
    })

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

      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      })

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
        
        const parentOfParent = await prisma.category.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        })
        
        currentParentId = parentOfParent?.parentId || null
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        image: image || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? existingCategory.sortOrder
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

    return NextResponse.json({
      message: 'Category updated successfully',
      category: updatedCategory
    })

  } catch (error) {
    console.error('Error updating category:', error)
    
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
    const categoryWithRelations = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!categoryWithRelations) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (categoryWithRelations._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated products. Move products to another category first.' },
        { status: 400 }
      )
    }

    if (categoryWithRelations._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with child categories. Delete or move child categories first.' },
        { status: 400 }
      )
    }

    // Safe to delete
    const deletedCategory = await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Category deleted successfully',
      category: deletedCategory
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    
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
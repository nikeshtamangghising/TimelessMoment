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
    const brand = await prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(brand)

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
    
    const { name, slug, description, logo, website, isActive } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id: params.id }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Check if name or slug conflicts with other brands
    const conflictingBrand = await prisma.brand.findFirst({
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

    if (conflictingBrand) {
      return NextResponse.json(
        { error: 'A brand with this name or slug already exists' },
        { status: 400 }
      )
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description: description || null,
        logo: logo || null,
        website: website || null,
        isActive: isActive ?? true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Brand updated successfully',
      brand: updatedBrand
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

    // Check if brand exists and has products
    const brandWithProducts = await prisma.brand.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!brandWithProducts) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    if (brandWithProducts._count.products > 0) {
      // If brand has products, just deactivate it instead of deleting
      const updatedBrand = await prisma.brand.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      return NextResponse.json({
        message: 'Brand deactivated successfully (has associated products)',
        brand: updatedBrand
      })
    } else {
      // If no products, safe to delete
      const deletedBrand = await prisma.brand.delete({
        where: { id: params.id }
      })

      return NextResponse.json({
        message: 'Brand deleted successfully',
        brand: deletedBrand
      })
    }

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
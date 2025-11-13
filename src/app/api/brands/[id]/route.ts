import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brands, products } from '@/lib/db/schema'
import { eq, and, or, ne, sql } from 'drizzle-orm'
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
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, id)
    })

    if (brand) {
      // Get product count
      const [productCount] = await db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.brandId, id))

      const brandWithCount = {
        ...brand,
        _count: {
          products: Number(productCount?.count || 0)
        }
      }
      return NextResponse.json(brandWithCount)
    }

    return NextResponse.json(
      { error: 'Brand not found' },
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
    
    const { name, slug, description, logo, website, isActive } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if brand exists
    const existingBrandResult = await db.select()
      .from(brands)
      .where(eq(brands.id, params.id))
      .limit(1)
    const existingBrand = existingBrandResult[0] || null

    if (!existingBrand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Check if name or slug conflicts with other brands
    const conflictingBrandResult = await db.select()
      .from(brands)
      .where(
        and(
          ne(brands.id, params.id),
          or(
            eq(brands.name, name),
            eq(brands.slug, slug)
          )
        )
      )
      .limit(1)
    const conflictingBrand = conflictingBrandResult[0] || null

    if (conflictingBrand) {
      return NextResponse.json(
        { error: 'A brand with this name or slug already exists' },
        { status: 400 }
      )
    }

    const [updatedBrand] = await db.update(brands)
      .set({
        name,
        slug,
        description: description || null,
        logo: logo || null,
        website: website || null,
        isActive: isActive ?? true,
        updatedAt: new Date()
      })
      .where(eq(brands.id, params.id))
      .returning()

    // Get product count
    const [productCount] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.brandId, params.id))

    const brandWithCount = {
      ...updatedBrand,
      _count: {
        products: Number(productCount?.count || 0)
      }
    }

    return NextResponse.json({
      message: 'Brand updated successfully',
      brand: brandWithCount
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
    const brandResult = await db.select()
      .from(brands)
      .where(eq(brands.id, params.id))
      .limit(1)
    const brandToDelete = brandResult[0] || null

    if (!brandToDelete) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Get product count
    const [productCount] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.brandId, params.id))
    const productCountNum = Number(productCount?.count || 0)

    if (productCountNum > 0) {
      // If brand has products, just deactivate it instead of deleting
      const [updatedBrand] = await db.update(brands)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(brands.id, params.id))
        .returning()

      return NextResponse.json({
        message: 'Brand deactivated successfully (has associated products)',
        brand: updatedBrand
      })
    } else {
      // If no products, safe to delete
      const [deletedBrand] = await db.delete(brands)
        .where(eq(brands.id, params.id))
        .returning()

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
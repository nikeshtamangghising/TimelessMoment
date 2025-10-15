import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAdminHandler } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const search = searchParams.get('search')
    
    const where = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    const brands = await prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
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
      brands,
      total: brands.length
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, slug, description, logo, website } = body

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
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: finalSlug }
        ]
      }
    })

    if (existingBrand) {
      return NextResponse.json(
        { error: 'A brand with this name or slug already exists' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        logo: logo || null,
        website: website || null
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

    return NextResponse.json(
      { 
        message: 'Brand created successfully',
        brand 
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

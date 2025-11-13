import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brands } from '@/lib/db/schema'
import { eq, or, like, asc, and } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const search = searchParams.get('search')
    
    const conditions = []
    if (!includeInactive) {
      conditions.push(eq(brands.isActive, true))
    }
    if (search) {
      conditions.push(
        or(
          like(brands.name, `%${search}%`),
          like(brands.description, `%${search}%`)
        )
      )
    }

    const brandsResult = await db.select()
      .from(brands)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(brands.name))

    return NextResponse.json({
      brands: brandsResult,
      total: brandsResult.length
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
    const existingBrandResult = await db.select()
      .from(brands)
      .where(
        or(
          eq(brands.name, name),
          eq(brands.slug, finalSlug)
        )
      )
      .limit(1)

    if (existingBrandResult.length > 0) {
      return NextResponse.json(
        { error: 'A brand with this name or slug already exists' },
        { status: 400 }
      )
    }

    const [brand] = await db.insert(brands)
      .values({
        name,
        slug: finalSlug,
        description: description || null,
        logo: logo || null,
        website: website || null
      })
      .returning()

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

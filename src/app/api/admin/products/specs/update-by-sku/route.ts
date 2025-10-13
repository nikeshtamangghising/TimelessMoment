import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

// Admin-only endpoint to update product specifications by SKU
export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const {
      sku,
      category,
      brand,
      weight,
      dimensions,
      material,
      color,
      inStock,
      stockQuantity,
      lowStockThreshold,
    } = body || {}

    if (!sku || typeof sku !== 'string') {
      return NextResponse.json({ error: 'sku is required' }, { status: 400 })
    }

    // Find product by SKU
    const product = await prisma.product.findUnique({ where: { sku }})
    if (!product) {
      return NextResponse.json({ error: `Product with SKU ${sku} not found` }, { status: 404 })
    }

    // Resolve category
    let categoryId: string | undefined
    if (category && typeof category === 'string') {
      const existingCategory = await prisma.category.findFirst({ where: { name: category } })
      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        // Create the category to ensure specification can be saved
        const newCat = await prisma.category.create({ data: { name: category, slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-') } })
        categoryId = newCat.id
      }
    }

    // Resolve brand
    let brandId: string | undefined
    if (brand && typeof brand === 'string') {
      const existingBrand = await prisma.brand.findFirst({ where: { name: brand } })
      if (existingBrand) {
        brandId = existingBrand.id
      } else {
        const newBrand = await prisma.brand.create({ data: { name: brand, slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') } })
        brandId = newBrand.id
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (categoryId) updateData.categoryId = categoryId
    if (brandId) updateData.brandId = brandId
    if (typeof weight === 'number') updateData.weight = weight
    if (dimensions && typeof dimensions === 'object') {
      const clean = {
        length: dimensions.length ? Number(dimensions.length) : undefined,
        width: dimensions.width ? Number(dimensions.width) : undefined,
        height: dimensions.height ? Number(dimensions.height) : undefined,
      }
      updateData.dimensions = (clean.length || clean.width || clean.height) ? clean : null
    }
    if (typeof lowStockThreshold === 'number') updateData.lowStockThreshold = lowStockThreshold
    if (typeof stockQuantity === 'number') updateData.inventory = stockQuantity
    if (typeof inStock === 'boolean') updateData.isActive = inStock

    const updated = await prisma.$transaction(async (tx) => {
      // Update product core fields
      const p = await tx.product.update({ where: { id: product.id }, data: updateData })

      // Upsert attributes for Material and Color
      const attributesToSet: { name: string; value: string }[] = []
      if (typeof material === 'string') {
        attributesToSet.push({ name: 'Material', value: material })
      }
      if (typeof color === 'string') {
        attributesToSet.push({ name: 'Color', value: color })
      }

      if (attributesToSet.length > 0) {
        // Remove existing attrs with same names
        await tx.productAttribute.deleteMany({
          where: {
            productId: product.id,
            name: { in: attributesToSet.map(a => a.name) },
          },
        })
        // Insert new
        for (const attr of attributesToSet) {
          await tx.productAttribute.create({
            data: {
              productId: product.id,
              name: attr.name,
              value: attr.value,
            },
          })
        }
      }

      return p
    })

    return NextResponse.json({
      success: true,
      message: 'Product specifications updated',
      productId: updated.id,
      sku,
    })
  } catch (error) {
    console.error('Error updating product specifications by SKU:', error)
    return NextResponse.json({ error: 'Failed to update product specifications' }, { status: 500 })
  }
})

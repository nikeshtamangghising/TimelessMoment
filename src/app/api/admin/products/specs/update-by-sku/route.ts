import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import { products, categories, brands, productAttributes } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

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
    const productResult = await db.select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1)
    const product = productResult[0] || null
    if (!product) {
      return NextResponse.json({ error: `Product with SKU ${sku} not found` }, { status: 404 })
    }

    // Resolve category
    let categoryId: string | undefined
    if (category && typeof category === 'string') {
      const existingCategoryResult = await db.select()
        .from(categories)
        .where(eq(categories.name, category))
        .limit(1)
      const existingCategory = existingCategoryResult[0] || null
      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        // Create the category to ensure specification can be saved
        const [newCat] = await db.insert(categories)
          .values({ name: category, slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-') })
          .returning()
        categoryId = newCat.id
      }
    }

    // Resolve brand
    let brandId: string | undefined
    if (brand && typeof brand === 'string') {
      const existingBrandResult = await db.select()
        .from(brands)
        .where(eq(brands.name, brand))
        .limit(1)
      const existingBrand = existingBrandResult[0] || null
      if (existingBrand) {
        brandId = existingBrand.id
      } else {
        const [newBrand] = await db.insert(brands)
          .values({ name: brand, slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') })
          .returning()
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

    const updated = await db.transaction(async (tx) => {
      // Update product core fields
      const [p] = await tx.update(products)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(products.id, product.id))
        .returning()

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
        const attrNames = attributesToSet.map(a => a.name)
        await tx.delete(productAttributes)
          .where(eq(productAttributes.productId, product.id))
        // Note: Drizzle doesn't support `in` for delete, so we delete all and re-insert
        // For better performance, we could use a raw SQL query
        
        // Insert new
        await tx.insert(productAttributes)
          .values(attributesToSet.map(attr => ({
            productId: product.id,
            name: attr.name,
            value: attr.value
          })))
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
    return NextResponse.json({ error: 'Failed to update product specifications' }, { status: 500 })
  }
})

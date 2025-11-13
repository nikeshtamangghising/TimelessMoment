import { db } from './db'
import { categories, products } from './db/schema'
import { eq, and, or, sql, desc, asc, isNull, ilike } from 'drizzle-orm'

export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryWithChildren[];
  parent?: any;
  _count?: {
    products: number;
    children: number;
  };
}

class CategoryRepository {
  // Get all root categories (no parent) with their children
  async getRootCategoriesWithChildren(): Promise<CategoryWithChildren[]> {
    try {
      const rootCategories = await db.query.categories.findMany({
        where: and(
          isNull(categories.parentId),
          eq(categories.isActive, true)
        ),
        with: {
          childCategories: {
            where: eq(categories.isActive, true),
            with: {
              childCategories: {
                where: eq(categories.isActive, true),
                orderBy: asc(categories.sortOrder)
              }
            },
            orderBy: asc(categories.sortOrder)
          }
        },
        orderBy: asc(categories.sortOrder)
      })
      
      // Get counts for each category and its children recursively
      return Promise.all(rootCategories.map(async (cat) => {
        const [productCount, childrenCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.categoryId, cat.id)),
          db.select({ count: sql<number>`count(*)` })
            .from(categories)
            .where(eq(categories.parentId, cat.id))
        ])
        
        // Process children with their counts
        const childrenWithCounts = await Promise.all((cat.childCategories || []).map(async (child) => {
          const [childProductCount, childChildrenCount] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
              .from(products)
              .where(eq(products.categoryId, child.id)),
            db.select({ count: sql<number>`count(*)` })
              .from(categories)
              .where(eq(categories.parentId, child.id))
          ])
          
          return {
            ...child,
            _count: {
              products: Number(childProductCount[0]?.count || 0),
              children: Number(childChildrenCount[0]?.count || 0)
            }
          }
        }))
        
        return {
          ...cat,
          children: childrenWithCounts,
          childCategories: childrenWithCounts,
          _count: {
            products: Number(productCount[0]?.count || 0),
            children: Number(childrenCount[0]?.count || 0)
          }
        } as CategoryWithChildren
      }))
    } catch (error) {
      console.error('Error in getRootCategoriesWithChildren:', error)
      throw error
    }
  }

  // Get category by slug with full hierarchy info
  async findBySlug(slug: string): Promise<CategoryWithChildren | null> {
    try {
      const category = await db.query.categories.findFirst({
        where: and(
          eq(categories.slug, slug),
          eq(categories.isActive, true)
        ),
        with: {
          parentCategory: true,
          childCategories: {
            where: eq(categories.isActive, true),
            orderBy: asc(categories.sortOrder)
          }
        }
      })
      
      if (!category) return null
      
      // Get counts
      const [productCount, childrenCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.categoryId, category.id)),
        db.select({ count: sql<number>`count(*)` })
          .from(categories)
          .where(eq(categories.parentId, category.id))
      ])
      
      // Process children with counts
      const childrenWithCounts = await Promise.all((category.childCategories || []).map(async (child) => {
        const [childProductCount, childChildrenCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.categoryId, child.id)),
          db.select({ count: sql<number>`count(*)` })
            .from(categories)
            .where(eq(categories.parentId, child.id))
        ])
        
        return {
          ...child,
          _count: {
            products: Number(childProductCount[0]?.count || 0),
            children: Number(childChildrenCount[0]?.count || 0)
          }
        }
      }))
      
      return {
        ...category,
        children: childrenWithCounts,
        childCategories: childrenWithCounts,
        _count: {
          products: Number(productCount[0]?.count || 0),
          children: Number(childrenCount[0]?.count || 0)
        }
      } as CategoryWithChildren
    } catch (error) {
      console.error('Error in findBySlug:', error)
      throw error
    }
  }

  // Get category hierarchy path (breadcrumb)
  async getCategoryPath(categoryId: string): Promise<any[]> {
    const path: any[] = []
    let currentCategoryResult = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: { parentCategory: true }
    })
    let currentCategory = currentCategoryResult || null

    while (currentCategory) {
      path.unshift(currentCategory)
      if (currentCategory.parentId) {
        const parentResult = await db.query.categories.findFirst({
          where: eq(categories.id, currentCategory.parentId),
          with: { parentCategory: true }
        })
        currentCategory = parentResult || null
      } else {
        currentCategory = null
      }
    }

    return path
  }

  // Get all categories as flat list (for admin/management)
  async getAllFlat() {
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      with: {
        parentCategory: true
      },
      orderBy: asc(categories.sortOrder)
    })
    
    // Get counts and sort by parent sortOrder
    const categoriesWithCounts = await Promise.all(allCategories.map(async (cat) => {
      const [productCount, childrenCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.categoryId, cat.id)),
        db.select({ count: sql<number>`count(*)` })
          .from(categories)
          .where(eq(categories.parentId, cat.id))
      ])
      
      return {
        ...cat,
        _count: {
          products: Number(productCount[0]?.count || 0),
          children: Number(childrenCount[0]?.count || 0)
        }
      }
    }))
    
    // Sort by parent sortOrder, then by own sortOrder
    return categoriesWithCounts.sort((a, b) => {
      if (a.parent?.sortOrder !== b.parent?.sortOrder) {
        return (a.parent?.sortOrder || 0) - (b.parent?.sortOrder || 0)
      }
      return a.sortOrder - b.sortOrder
    })
  }

  // Create new category with SEO-friendly slug
  async create(data: {
    name: string
    description?: string
    parentId?: string
    metaTitle?: string
    metaDescription?: string
    image?: string
  }) {
    const slug = this.generateSlug(data.name)
    
    // Ensure slug is unique
    const existingCategoryResult = await db.select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)
    const existingCategory = existingCategoryResult[0] || null
    if (existingCategory) {
      throw new Error(`Category with slug "${slug}" already exists`)
    }

    // Get next sort order for this parent level
    const siblingCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(data.parentId ? eq(categories.parentId, data.parentId) : isNull(categories.parentId))
    const siblingCount = Number(siblingCountResult[0]?.count || 0)

    const [newCategory] = await db.insert(categories)
      .values({
        ...data,
        slug,
        sortOrder: siblingCount,
        metaTitle: data.metaTitle || data.name,
        metaDescription: data.metaDescription || data.description || `Shop ${data.name.toLowerCase()} products`,
        isActive: true
      })
      .returning()
    
    return newCategory
  }

  // Update category
  async update(id: string, data: Partial<{
    name: string
    description: string
    parentId: string
    metaTitle: string
    metaDescription: string
    image: string
    isActive: boolean
    sortOrder: number
  }>) {
    const updateData: any = { ...data, updatedAt: new Date() }
    
    // If name is being updated, update slug too
    if (data.name) {
      updateData.slug = this.generateSlug(data.name)
      
      // Check for slug conflicts
      const existingCategoryResult = await db.select()
        .from(categories)
        .where(eq(categories.slug, updateData.slug))
        .limit(1)
      const existingCategory = existingCategoryResult[0] || null
      if (existingCategory && existingCategory.id !== id) {
        throw new Error(`Category with slug "${updateData.slug}" already exists`)
      }
    }

    const [updated] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()
    
    return updated
  }

  // Delete category (soft delete by setting isActive to false)
  async delete(id: string) {
    // Check if category has children or products
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        childCategories: {
          where: eq(categories.isActive, true)
        }
      }
    })

    if (!category) throw new Error('Category not found')

    if (category.childCategories && category.childCategories.length > 0) {
      throw new Error('Cannot delete category with active subcategories')
    }

    const productCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id))
    const productCount = Number(productCountResult[0]?.count || 0)

    if (productCount > 0) {
      throw new Error('Cannot delete category with products. Move products first.')
    }

    const [updated] = await db.update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()
    
    return updated
  }

  // Generate SEO-friendly slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  // Get categories for navigation menu
  async getNavigationCategories(): Promise<CategoryWithChildren[]> {
    return db.query.categories.findMany({
      where: and(
        isNull(categories.parentId),
        eq(categories.isActive, true)
      ),
      with: {
        childCategories: {
          where: eq(categories.isActive, true),
          orderBy: asc(categories.sortOrder),
          limit: 8 // Limit subcategories for navigation
        }
      },
      orderBy: asc(categories.sortOrder),
      limit: 10 // Limit main categories for navigation
    }) as Promise<CategoryWithChildren[]>
  }

  // Search categories
  async search(query: string) {
    const results = await db.query.categories.findMany({
      where: and(
        eq(categories.isActive, true),
        or(
          ilike(categories.name, `%${query}%`),
          ilike(categories.description, `%${query}%`)
        )
      ),
      with: {
        parentCategory: true
      },
      orderBy: asc(categories.name)
    })
    
    // Get counts for each category
    return Promise.all(results.map(async (cat) => {
      const [productCount, childrenCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.categoryId, cat.id)),
        db.select({ count: sql<number>`count(*)` })
          .from(categories)
          .where(eq(categories.parentId, cat.id))
      ])
      
      return {
        ...cat,
        _count: {
          products: Number(productCount[0]?.count || 0),
          children: Number(childrenCount[0]?.count || 0)
        }
      }
    }))
  }
}

export const categoryRepository = new CategoryRepository()
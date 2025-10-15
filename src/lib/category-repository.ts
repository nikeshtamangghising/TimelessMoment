import { prisma } from './db'
import { Category } from '@prisma/client'

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  parent?: Category
  _count?: {
    products: number
    children: number
  }
}

class CategoryRepository {
  // Get all root categories (no parent) with their children
  async getRootCategoriesWithChildren(): Promise<CategoryWithChildren[]> {
    return prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            },
            _count: {
              select: { products: true, children: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { products: true, children: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
  }

  // Get category by slug with full hierarchy info
  async findBySlug(slug: string): Promise<CategoryWithChildren | null> {
    return prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { products: true, children: true } }
          }
        },
        _count: {
          select: { products: true, children: true }
        }
      }
    })
  }

  // Get category hierarchy path (breadcrumb)
  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = []
    let currentCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true }
    })

    while (currentCategory) {
      path.unshift(currentCategory)
      if (currentCategory.parentId) {
        currentCategory = await prisma.category.findUnique({
          where: { id: currentCategory.parentId },
          include: { parent: true }
        })
      } else {
        currentCategory = null
      }
    }

    return path
  }

  // Get all categories as flat list (for admin/management)
  async getAllFlat() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        _count: { select: { products: true, children: true } }
      },
      orderBy: [
        { parent: { sortOrder: 'asc' } },
        { sortOrder: 'asc' }
      ]
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
    const existingCategory = await prisma.category.findUnique({ where: { slug } })
    if (existingCategory) {
      throw new Error(`Category with slug "${slug}" already exists`)
    }

    // Get next sort order for this parent level
    const siblingCount = await prisma.category.count({
      where: { parentId: data.parentId || null }
    })

    return prisma.category.create({
      data: {
        ...data,
        slug,
        sortOrder: siblingCount,
        metaTitle: data.metaTitle || data.name,
        metaDescription: data.metaDescription || data.description || `Shop ${data.name.toLowerCase()} products`
      }
    })
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
    const updateData: any = { ...data }
    
    // If name is being updated, update slug too
    if (data.name) {
      updateData.slug = this.generateSlug(data.name)
      
      // Check for slug conflicts
      const existingCategory = await prisma.category.findUnique({ 
        where: { slug: updateData.slug } 
      })
      if (existingCategory && existingCategory.id !== id) {
        throw new Error(`Category with slug "${updateData.slug}" already exists`)
      }
    }

    return prisma.category.update({
      where: { id },
      data: updateData
    })
  }

  // Delete category (soft delete by setting isActive to false)
  async delete(id: string) {
    // Check if category has children or products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { where: { isActive: true } },
        _count: { select: { products: true } }
      }
    })

    if (!category) throw new Error('Category not found')

    if (category.children.length > 0) {
      throw new Error('Cannot delete category with active subcategories')
    }

    if (category._count.products > 0) {
      throw new Error('Cannot delete category with products. Move products first.')
    }

    return prisma.category.update({
      where: { id },
      data: { isActive: false }
    })
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
    return prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 8 // Limit subcategories for navigation
        }
      },
      orderBy: { sortOrder: 'asc' },
      take: 10 // Limit main categories for navigation
    })
  }

  // Search categories
  async search(query: string) {
    return prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        parent: true,
        _count: { select: { products: true, children: true } }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })
  }
}

export const categoryRepository = new CategoryRepository()
import {
  generateSitemap,
  generateRobotsTxt,
  generateProductSitemap,
  generateCategorySitemap,
  validateSitemapEntry,
  splitSitemap,
} from '@/lib/sitemap'
import { productRepository } from '@/lib/product-repository'
import { Product } from '@/types'

// Mock the product repository
jest.mock('@/lib/product-repository')
const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SITE_URL: 'https://example.com'
  }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

describe('Sitemap Generation', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test description',
      price: 99.99,
      category: 'Electronics',
      imageUrl: '/test1.jpg',
      stock: 10,
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-15'),
    },
    {
      id: 2,
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test description 2',
      price: 149.99,
      category: 'Clothing',
      imageUrl: '/test2.jpg',
      stock: 5,
      isActive: true,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-16'),
    },
  ]

  describe('generateSitemap', () => {
    it('should generate sitemap with static and dynamic pages', async () => {
      mockProductRepository.findMany.mockResolvedValue({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10000,
          total: 2,
          totalPages: 1,
        },
      })
      mockProductRepository.getCategories.mockResolvedValue(['Electronics', 'Clothing'])

      const sitemap = await generateSitemap()

      // Check static pages
      expect(sitemap).toContainEqual(
        expect.objectContaining({
          url: 'https://example.com',
          priority: 1.0,
          changeFrequency: 'daily',
        })
      )
      expect(sitemap).toContainEqual(
        expect.objectContaining({
          url: 'https://example.com/products',
          priority: 0.9,
          changeFrequency: 'hourly',
        })
      )

      // Check product pages
      expect(sitemap).toContainEqual(
        expect.objectContaining({
          url: 'https://example.com/products/test-product-1',
          lastModified: mockProducts[0].updatedAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      )

      // Check category pages
      expect(sitemap).toContainEqual(
        expect.objectContaining({
          url: 'https://example.com/products?category=Electronics',
          changeFrequency: 'daily',
          priority: 0.6,
        })
      )

      expect(sitemap.length).toBeGreaterThan(10) // Static + products + categories
    })

    it('should handle repository errors gracefully', async () => {
      mockProductRepository.findMany.mockRejectedValue(new Error('Database error'))
      mockProductRepository.getCategories.mockRejectedValue(new Error('Database error'))

      const sitemap = await generateSitemap()

      // Should still include static pages
      expect(sitemap.length).toBeGreaterThan(5)
      expect(sitemap).toContainEqual(
        expect.objectContaining({
          url: 'https://example.com',
        })
      )
    })
  })

  describe('generateProductSitemap', () => {
    it('should generate product-only sitemap', async () => {
      mockProductRepository.findMany.mockResolvedValue({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10000,
          total: 2,
          totalPages: 1,
        },
      })

      const sitemap = await generateProductSitemap()

      expect(sitemap).toHaveLength(2)
      expect(sitemap[0]).toEqual({
        url: 'https://example.com/products/test-product-1',
        lastModified: mockProducts[0].updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })

    it('should handle empty product list', async () => {
      mockProductRepository.findMany.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 10000,
          total: 0,
          totalPages: 0,
        },
      })

      const sitemap = await generateProductSitemap()

      expect(sitemap).toHaveLength(0)
    })
  })

  describe('generateCategorySitemap', () => {
    it('should generate category-only sitemap', async () => {
      mockProductRepository.getCategories.mockResolvedValue(['Electronics', 'Clothing', 'Books'])

      const sitemap = await generateCategorySitemap()

      expect(sitemap).toHaveLength(3)
      expect(sitemap[0]).toEqual({
        url: 'https://example.com/products?category=Electronics',
        lastModified: expect.any(Date),
        changeFrequency: 'daily',
        priority: 0.7,
      })
    })
  })

  describe('generateRobotsTxt', () => {
    it('should generate proper robots.txt content', () => {
      const robotsContent = generateRobotsTxt()

      expect(robotsContent).toContain('User-agent: *')
      expect(robotsContent).toContain('Allow: /')
      expect(robotsContent).toContain('Disallow: /admin/')
      expect(robotsContent).toContain('Disallow: /api/')
      expect(robotsContent).toContain('Allow: /products/')
      expect(robotsContent).toContain('Sitemap: https://example.com/sitemap.xml')
      expect(robotsContent).toContain('Crawl-delay: 1')
    })
  })

  describe('validateSitemapEntry', () => {
    it('should validate correct sitemap entries', () => {
      const validEntry = {
        url: 'https://example.com/test',
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }

      expect(validateSitemapEntry(validEntry)).toBe(true)
    })

    it('should reject invalid URLs', () => {
      const invalidEntry = {
        url: 'not-a-valid-url',
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }

      expect(validateSitemapEntry(invalidEntry)).toBe(false)
    })

    it('should reject invalid priority values', () => {
      const invalidEntry = {
        url: 'https://example.com/test',
        priority: 1.5, // Invalid: > 1
      }

      expect(validateSitemapEntry(invalidEntry)).toBe(false)
    })

    it('should reject invalid change frequency', () => {
      const invalidEntry = {
        url: 'https://example.com/test',
        changeFrequency: 'invalid' as any,
      }

      expect(validateSitemapEntry(invalidEntry)).toBe(false)
    })
  })

  describe('splitSitemap', () => {
    it('should split large sitemaps into chunks', () => {
      const entries = Array.from({ length: 150000 }, (_, i) => ({
        url: `https://example.com/page-${i}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))

      const chunks = splitSitemap(entries, 50000)

      expect(chunks).toHaveLength(3)
      expect(chunks[0]).toHaveLength(50000)
      expect(chunks[1]).toHaveLength(50000)
      expect(chunks[2]).toHaveLength(50000)
    })

    it('should handle small sitemaps without splitting', () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/page-${i}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))

      const chunks = splitSitemap(entries, 50000)

      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toHaveLength(100)
    })
  })
})
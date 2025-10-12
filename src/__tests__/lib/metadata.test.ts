import { 
  generateMetadata, 
  generateProductMetadata, 
  generateCategoryMetadata, 
  generateHomeMetadata,
  generateSearchMetadata 
} from '@/lib/metadata'
import { Product } from '@/types'

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
})

describe('Metadata Generation', () => {
  describe('generateMetadata', () => {
    it('should generate basic metadata', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        description: 'Test description',
        keywords: ['test', 'page'],
        url: '/test',
      })

      expect(metadata.title).toBe('Test Page | E-Commerce Platform')
      expect(metadata.description).toBe('Test description')
      expect(metadata.keywords).toBe('test, page')
      expect(metadata.openGraph?.title).toBe('Test Page | E-Commerce Platform')
      expect(metadata.openGraph?.url).toBe('https://example.com/test')
      expect(metadata.twitter?.title).toBe('Test Page | E-Commerce Platform')
      expect(metadata.alternates?.canonical).toBe('https://example.com/test')
    })

    it('should generate product-specific metadata', () => {
      const metadata = generateMetadata({
        title: 'Test Product',
        description: 'Test product description',
        type: 'product',
        price: 99.99,
        currency: 'NPR',
        availability: 'in_stock',
      })

      expect(metadata.openGraph?.type).toBe('product')
      expect(metadata.other?.['product:price:amount']).toBe('99.99')
      expect(metadata.other?.['product:price:currency']).toBe('NPR')
      expect(metadata.other?.['product:availability']).toBe('in_stock')
    })

    it('should handle missing optional parameters', () => {
      const metadata = generateMetadata({
        title: 'Simple Page',
        description: 'Simple description',
      })

      expect(metadata.title).toBe('Simple Page | E-Commerce Platform')
      expect(metadata.keywords).toBe('')
      expect(metadata.openGraph?.type).toBe('website')
    })
  })

  describe('generateProductMetadata', () => {
    const mockProduct: Product = {
      id: 1,
      name: 'Test Product',
      slug: 'test-product',
      description: 'A great test product for testing',
      price: 29.99,
      category: 'Electronics',
      imageUrl: '/images/test-product.jpg',
      stock: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should generate product metadata', () => {
      const metadata = generateProductMetadata(mockProduct)

      expect(metadata.title).toBe('Test Product | E-Commerce Platform')
      expect(metadata.description).toBe('A great test product for testing')
      expect(metadata.keywords).toContain('Test Product')
      expect(metadata.keywords).toContain('Electronics')
      expect(metadata.keywords).toContain('buy online')
      expect(metadata.openGraph?.type).toBe('product')
      expect(metadata.openGraph?.url).toBe('https://example.com/products/test-product')
      expect(metadata.other?.['product:price:amount']).toBe('29.99')
      expect(metadata.other?.['product:availability']).toBe('in_stock')
    })

    it('should handle out of stock products', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      const metadata = generateProductMetadata(outOfStockProduct)

      expect(metadata.other?.['product:availability']).toBe('out_of_stock')
    })

    it('should handle products without description', () => {
      const productWithoutDescription = { ...mockProduct, description: null }
      const metadata = generateProductMetadata(productWithoutDescription)

      expect(metadata.description).toBe('Buy Test Product online. High quality products at great prices.')
    })
  })

  describe('generateCategoryMetadata', () => {
    it('should generate category metadata', () => {
      const metadata = generateCategoryMetadata('Electronics', 25)

      expect(metadata.title).toBe('Electronics Products | E-Commerce Platform')
      expect(metadata.description).toBe('Shop our collection of electronics products. 25 items available with fast shipping.')
      expect(metadata.keywords).toContain('Electronics')
      expect(metadata.keywords).toContain('products')
      expect(metadata.openGraph?.url).toBe('https://example.com/categories/electronics')
    })
  })

  describe('generateHomeMetadata', () => {
    it('should generate home page metadata', () => {
      const metadata = generateHomeMetadata()

      expect(metadata.title).toBe('Home | E-Commerce Platform')
      expect(metadata.description).toContain('Discover amazing products')
      expect(metadata.keywords).toContain('e-commerce')
      expect(metadata.keywords).toContain('online shopping')
      expect(metadata.openGraph?.url).toBe('https://example.com/')
    })
  })

  describe('generateSearchMetadata', () => {
    it('should generate search results metadata', () => {
      const metadata = generateSearchMetadata('laptop', 15)

      expect(metadata.title).toBe('Search Results for "laptop" | E-Commerce Platform')
      expect(metadata.description).toBe('Found 15 products matching "laptop". Shop now with fast shipping and secure checkout.')
      expect(metadata.keywords).toContain('laptop')
      expect(metadata.keywords).toContain('search')
      expect(metadata.openGraph?.url).toBe('https://example.com/search?q=laptop')
    })
  })
})